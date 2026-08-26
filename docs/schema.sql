-- ===========================================================================
-- Database Schema for Automatic Optimized Class Routine Generation System
-- Target Database: PostgreSQL
-- ===========================================================================

-- Drop all tables to reset database when rebuilding
DROP TABLE IF EXISTS schedule_entry, elective_registration, period_slot, curriculum_workload, student, lab_details, room, subject, faculty, cohort, department CASCADE;

-- 1. Departments Table
CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Student Cohorts (Sections) Table
CREATE TABLE cohort (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'CSE_SEM3_SecA'
    semester INT NOT NULL CHECK (semester >= 1),
    size INT NOT NULL CHECK (size > 0),
    department_id INT NOT NULL REFERENCES department(id) ON DELETE CASCADE
);

-- 3. Students Table (Required for student-level elective clashing)
CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    student_roll VARCHAR(30) NOT NULL UNIQUE, -- Unique registration/roll number
    name VARCHAR(100) NOT NULL,
    cohort_id INT NOT NULL REFERENCES cohort(id) ON DELETE CASCADE
);

-- 4. Faculty Members Table
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(15) UNIQUE NOT NULL, -- Direct phone line for notifications
    max_weekly_hours INT NOT NULL DEFAULT 18 CHECK (max_weekly_hours > 0),
    availability_preferences JSONB DEFAULT '{}'::jsonb, -- Store busy/free times
    department_id INT NOT NULL REFERENCES department(id) ON DELETE CASCADE
);

-- 5. Subjects Table
CREATE TABLE subject (
    id SERIAL PRIMARY KEY,
    code VARCHAR(15) NOT NULL UNIQUE, -- Course code e.g., 'CS301'
    name VARCHAR(100) NOT NULL,
    periods_per_week INT NOT NULL DEFAULT 4 CHECK (periods_per_week > 0),
    is_heavy_cognitive BOOLEAN NOT NULL DEFAULT FALSE,
    subject_type VARCHAR(10) NOT NULL CHECK (subject_type IN ('Lecture', 'Lab')),
    department_id INT NOT NULL REFERENCES department(id) ON DELETE CASCADE
);

-- 6. Rooms Table (Physical Classrooms / Auditoriums)
CREATE TABLE room (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'LH_302'
    capacity INT NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(15) NOT NULL CHECK (room_type IN ('Lecture_Hall', 'Lab'))
);

-- 7. Lab Details Table (One-to-One Extension of Room for Laboratories)
CREATE TABLE lab_details (
    room_id INT PRIMARY KEY REFERENCES room(id) ON DELETE CASCADE,
    workstation_count INT NOT NULL DEFAULT 0 CHECK (workstation_count >= 0),
    lab_category VARCHAR(30) NOT NULL, -- e.g., 'Computer', 'Chemistry', 'Physics'
    software_installed JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g., ["MATLAB", "R-Studio"]
    specialized_equipment JSONB NOT NULL DEFAULT '[]'::jsonb -- e.g., ["Centrifuge"]
);

-- 8. Elective/Optional Registrations Table (NEP Support)
CREATE TABLE elective_registration (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    UNIQUE(student_id, subject_id)
);

-- 9. Period Slots Configuration Table (Super Admin Configured)
CREATE TABLE period_slot (
    id SERIAL PRIMARY KEY,
    slot_number INT NOT NULL UNIQUE CHECK (slot_number > 0), -- Order of periods
    name VARCHAR(30) NOT NULL, -- e.g., 'Period 1', 'Lunch Break'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN NOT NULL DEFAULT FALSE, -- Set TRUE dynamically for tiffin/lunch
    CHECK (start_time < end_time)
);

-- 10. Curriculum Workload Table (Intended Target Workload to Solve)
CREATE TABLE curriculum_workload (
    id SERIAL PRIMARY KEY,
    cohort_id INT REFERENCES cohort(id) ON DELETE CASCADE, -- NULL if elective/optional class
    elective_subject_id INT REFERENCES subject(id) ON DELETE CASCADE, -- NULL if cohort-wide core class
    subject_id INT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    faculty_id INT REFERENCES faculty(id) ON DELETE SET NULL,
    weekly_periods INT NOT NULL CHECK (weekly_periods > 0),
    smart_class_requirement VARCHAR(15) NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (smart_class_requirement IN ('MUST_HAVE', 'PREFERRED', 'NOT_REQUIRED')),
    -- Prevent workload from mapping both cohort AND elective subject simultaneously
    CHECK (
        (cohort_id IS NOT NULL AND elective_subject_id IS NULL) OR
        (cohort_id IS NULL AND elective_subject_id IS NOT NULL)
    )
);

-- 11. Schedule Allocation Table (The Core Routine)
CREATE TABLE schedule_entry (
    id SERIAL PRIMARY KEY,
    cohort_id INT REFERENCES cohort(id) ON DELETE CASCADE, -- NULL if this is an elective-specific session
    elective_subject_id INT REFERENCES subject(id) ON DELETE CASCADE, -- NULL if this is a general cohort session
    faculty_id INT REFERENCES faculty(id) ON DELETE SET NULL,
    subject_id INT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    room_id INT REFERENCES room(id) ON DELETE SET NULL,
    period_slot_id INT NOT NULL REFERENCES period_slot(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1 (Mon) to 5 (Fri)
    entry_type VARCHAR(15) NOT NULL DEFAULT 'Regular' CHECK (entry_type IN ('Regular', 'Substitute', 'Extra', 'Exam')),
    schedule_date DATE DEFAULT NULL, -- NULL for template schedules; contains DATE for overrides/leaves
    smart_class_requirement VARCHAR(15) NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (smart_class_requirement IN ('MUST_HAVE', 'PREFERRED', 'NOT_REQUIRED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Prevent scheduling entries from referencing both cohort AND elective subject simultaneously
    CHECK (
        (cohort_id IS NOT NULL AND elective_subject_id IS NULL) OR
        (cohort_id IS NULL AND elective_subject_id IS NOT NULL)
    )
);

-- ===========================================================================
-- Indexes for Optimization
-- ===========================================================================

-- Fast lookup for regular weekly schedules
CREATE INDEX idx_schedule_active_slots 
ON schedule_entry (day_of_week, period_slot_id, is_active) 
WHERE is_active = TRUE;

-- Fast index for dynamic leave query overrides
CREATE INDEX idx_schedule_overrides 
ON schedule_entry (schedule_date, faculty_id) 
WHERE schedule_date IS NOT NULL;
