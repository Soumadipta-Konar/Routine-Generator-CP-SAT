# Product Requirement Document (PRD)

## Project: Automatic Optimized Class Routine Generation System (Smart Education)

---

## 1. Executive Summary & Project Background

### 1.1 Purpose
The purpose of this document is to define the product requirements, system specifications, and core constraints for the development of the **Automatic Optimized Class Routine Generation System**. This web-based application is designed for educational institutions to automate, optimize, and dynamically manage timetables, faculty assignments, classroom allocations, and exam schedules.

### 1.2 Background & Problem Statement
Academic scheduling, formally known as the **University Course Timetabling Problem (UCTP)**, is an NP-hard combinatorial optimization problem. Traditional scheduling approaches suffer from several flaws:
*   **Manual Overhead:** Administrators spend weeks resolving conflicts, coordinating with departments, and drafting routines in Excel.
*   **Inflexibility:** When a faculty member takes leave, suffers an emergency, or a slot needs rescheduling, resolving the resulting conflicts manually triggers a domino effect of scheduling clashes.
*   **Lack of Pedagogical Awareness:** Manual scheduling rarely considers cognitive fatigue. For example, scheduling two intense "heavy" classes (e.g., Advanced Mathematics and Physics Lab) back-to-back degrades student learning outcomes.
*   **Conflict Density:** Administrative teams frequently miss double-booking issues for rooms or faculty members, leading to day-of clashes and lost instruction hours.

### 1.3 Proposed Solution
The proposed system automates this process using a Constraint Programming solver (**Google OR-Tools CP-SAT**). It takes institutional data (faculty, rooms, subjects) and rules (clashes, breaks, fatigue spacing) to output a conflict-free schedule in minutes. It also features a localized rescheduling engine to handle substitutions when teachers are on leave, an exam timetabling mode, and REST endpoints for Digital Notice Boards to broadcast real-time updates.

---

## 2. Product Objectives & Success Metrics

### 2.1 Product Vision
To build a highly reliable, cloud-first scheduling platform that makes educational institution schedules clash-free, pedagogically optimized, and dynamically resilient to day-to-day administrative changes.

### 2.2 Success Metrics (KPIs)
*   **Schedule Generation Time:** Complete a full optimization run for a medium-sized college (up to 1,000 students, 80 faculty, 30 rooms) in **under 3 minutes**.
*   **Zero Hard Conflicts:** Achieve 100% compliance with hard constraints (no room, teacher, or cohort double-bookings).
*   **Manual Adjustment Validation:** Manual drag-and-drop modifications are validated in **under 500 milliseconds** to ensure they do not introduce hard conflicts.
*   **Administrative Efficiency:** Reduce the administrative time spent drafting a semester timetable by **at least 90%** (from weeks to minutes).
*   **Substitute Turnaround Time:** Calculate and suggest substitution or swap options in **under 2 seconds** when a teacher requests leave.

---

## 3. User Personas & Roles

### 3.1 Platform Administrator (Registrar / Academic Coordinator)
*   **Profile:** Responsible for institutional scheduling, room management, curriculum load balancing, and resolving daily conflicts.
*   **Needs:** Easy bulk data entry, quick generation of a master schedule, manual override capability, conflict warning system, and instant PDF/Excel exports.
*   **Frustrations:** Reviewing countless Excel sheets, handling faculty complaints about slots, and managing last-minute class cancellations.

### 3.2 Faculty Member (Professor / Lecturer)
*   **Profile:** Instructors teaching multiple courses across different cohorts.
*   **Needs:** Visibility of their weekly teaching matrix, slot preferences (e.g., no early morning or late evening classes), clear exam invigilation schedules, and an easy channel to request leave or reschedule classes.
*   **Frustrations:** Having three consecutive hours of lectures, split shifts (e.g., teaching period 1 and period 8 on the same day with a 6-hour gap), and manual coordination of substitute teachers.

### 3.3 Student
*   **Profile:** End-user attending scheduled classes.
*   **Needs:** Real-time visibility of their section's routine, instant notifications about room or teacher changes, and balanced daily schedules.
*   **Frustrations:** Having multiple heavy math/science courses scheduled back-to-back, and arriving for a class only to find it was canceled.

### 3.4 Digital Notice Board (IoT Client API)
*   **Profile:** Dedicated screen controllers positioned outside classrooms and in main halls.
*   **Needs:** Lightweight API endpoint that returns the current and next scheduled class in JSON format.
*   **Frustrations:** Complex authentication systems and high payload sizes that break basic smart-screen controllers.

---

## 4. Epic & Functional Requirement Specifications

```
Prioritization Key:
- M: Must Have (Essential MVP feature)
- S: Should Have (Highly desired for pilot release)
- C: Could Have (Nice-to-have extension)
- W: Won't Have (Deferred to later phases)
```

### Epic 1: Institutional Data Setup & Metadata Management
*Goal: Provide administrative tools to register the school's assets, people, and academic structures.*

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-1.1** | Department & Cohort CRUD | Create, read, update, and delete departments, semesters, and student cohorts (sections). Includes tracking cohort sizes. | **M** |
| **FR-1.2** | Room & Lab Registry | Register classrooms and laboratories with names, capacities, and capability tags (e.g., `Projector`, `Computers`, `Chemistry Lab Equip`). | **M** |
| **FR-1.3** | Faculty Load Registry | Register faculty with profile details, department, maximum weekly/daily teaching hour limits, contact numbers (phone), and general slot preferences. | **M** |
| **FR-1.4** | Subject Registry | Register subjects, codes, weekly period demands, and metadata tags: `is_heavy_cognitive` (boolean) and `subject_type` (Lecture vs. Practical/Lab). | **M** |
| **FR-1.5** | Data Import Wizards | Provide templates and file upload features (CSV/Excel) to bulk-import data for rooms, faculty, cohorts, and subjects. | **S** |

### Epic 2: Optimization Engine & Timetable Generator
*Goal: Apply mathematical constraint solving to construct a weekly master schedule.*

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-2.1** | Hard Constraint Solver | The optimization engine must guarantee zero hard clashes (no overlapping slots for teachers, cohorts, or rooms, and respects capacity limits). | **M** |
| **FR-2.2** | Cognitive Load Balancer | Soft constraint to prevent student cohorts from attending back-to-back classes with the `is_heavy_cognitive` tag. | **M** |
| **FR-2.3** | Faculty Consecutive Limit | Soft constraint to limit faculty to a maximum of 2 consecutive hours of teaching, avoiding 3 or more consecutive slots. | **M** |
| **FR-2.4** | Asynchronous Job Queue | Schedule generation tasks run in the background (using Celery/Redis). The UI displays a progress bar and completion notifications. | **M** |
| **FR-2.5** | Multi-Period Lab Blocks | Ability to schedule practical lab sessions as consecutive blocks (e.g., a 2-period or 3-period block) that cannot be split across breaks or different days. | **S** |
| **FR-2.6** | Explainability Engine | A tool that generates natural-language reasons for how slots were scheduled, helping administrators understand why specific preferences were overridden. | **S** |

### Epic 3: Interactive Dashboard & Manual Modification
*Goal: Give administrators a visual interface to review the schedule and make manual adjustments.*

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-3.1** | Interactive Grid View | Multi-view schedule grid that displays routines by student cohort, faculty member, or room. | **M** |
| **FR-3.2** | Drag-and-Drop Editor | Allow administrators to drag and drop classes to different slots. | **M** |
| **FR-3.3** | Real-Time Clash Check | Manual edits trigger a localized backend check to verify they do not violate any hard constraints. Conflicts are highlighted in red. | **M** |
| **FR-3.4** | Export Options | PDF and Excel export features for master, faculty-specific, and cohort-specific schedules. | **M** |

### Epic 4: Dynamic Rescheduling & substitution Engine
*Goal: Handle day-to-day administrative updates (leaves, cancellations) without rebuilding the master schedule.*

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-4.1** | Faculty Leave Logger | Admin interface to mark a faculty member as "Absent/On Leave" for a specific date and set of periods. | **M** |
| **FR-4.2** | Substitution Finder | The system identifies alternative faculty who teach the same or similar subjects and are free during the absent teacher's periods. | **M** |
| **FR-4.3** | Dynamic Swap Suggestion | If no substitute is free, the engine suggests class swaps. For example, swap a Monday period with a Thursday period of another teacher. | **M** |
| **FR-4.4** | Extra Class Booking | A workflow for faculty to request extra classes. The system scans the cohort's schedule, the teacher's availability, and room capacity to suggest slots. | **S** |

### Epic 5: Exam Mode Scheduling
*Goal: Generate schedules, seating arrangements, and duties for exam weeks.*

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-5.1** | Exam Schedule Builder | Generate a matrix of exam dates, sessions, and subjects. | **S** |
| **FR-5.2** | Sparse Seating Allocator | Allocate students to rooms using an adjustable capacity multiplier (e.g., 50% classroom capacity for exam seating distance). | **S** |
| **FR-5.3** | Invigilator Scheduler | Assign faculty to invigilator duties based on their availability, while preventing back-to-back duties. | **S** |
| **FR-5.4** | Student Exam Gap rule | Soft constraint ensuring that no student cohort has more than one exam per day, with preferred gap days between heavy subjects. | **S** |

### Epic 6: API Notice Boards & Notification System
*Goal: Push updates to digital notice boards and keep users informed.*

| ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :---: |
| **FR-6.1** | Notice Board API | REST endpoint returning the current day's schedule for a specific room. Designed for smart notice boards. | **S** |
| **FR-6.2** | Real-Time Push Notices | Email, SMS, or push notifications sent to students and faculty when a class is rescheduled, canceled, or assigned a substitute. | **S** |

---

## 5. Institutional Class Slots & Time Structure

To establish a uniform baseline for scheduling, the platform operates on a standardized, weekly master structure. 

### 5.1 Weekly Boundary & Days
*   **Active Days:** Monday to Friday (5-day standard academic week).
*   **Weekend Safeguard:** Saturday and Sunday are strictly designated as institutional breaks. No standard class schedules, extra classes, or exam sessions can be scheduled on these days to ensure student and faculty rest.

### 5.2 Dynamic Period Slots & Recess Configuration
The system does not hardcode time slots or recess periods. Instead, the Super Admin dynamically configures the slot registry through the administration control panel. The system supports:
1.  **Customizable Period Count:** Setting the number of active academic slots per day (e.g., 6, 8, or 10 periods).
2.  **Flexible Break Definition:** Flagging any slot as a **Recess / Tiffin / Midday Break**. The solver will automatically detect these slots and ensure no standard classes are scheduled during them, and that practical labs are not split across them.
3.  **Variable Slot Times:** Setting custom start and end times for each slot.

#### Sample Configuration (Admin Default Template):
Below is an example of an 8-period setup with a tiffin break dynamically configured after Period 4:

| Slot ID | Slot Name | Start Time | End Time | Slot Type |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Period 1 | 09:00 AM | 09:50 AM | Academic |
| **2** | Period 2 | 09:50 AM | 10:40 AM | Academic |
| **3** | Period 3 | 10:40 AM | 11:30 AM | Academic |
| **4** | Period 4 | 11:30 AM | 12:20 PM | Academic |
| **5** | Recess / Tiffin | 12:20 PM | 01:10 PM | **Break (Recess)** |
| **6** | Period 5 | 01:10 PM | 02:00 PM | Academic |
| **7** | Period 6 | 02:00 PM | 02:50 PM | Academic |
| **8** | Period 7 | 02:50 PM | 03:40 PM | Academic |
| **9** | Period 8 | 03:40 PM | 04:30 PM | Academic |


---

## 6. Detailed Constraint Logic & Edge Cases

### 6.1 Hard Constraints
1.  **No Double-Booking (Faculty, Cohort, Room):** 
    For any time slot, the allocation matrix must not assign a faculty member, a cohort, or a room to more than one active class.
2.  **Room Capacities (Strict Matching):**
    For any scheduled class, the student group size must fit within the assigned room capacity:
    $$\text{CohortSize}(C) \le \text{RoomCapacity}(R)$$
3.  **Lab/Practical Integrity (Consecutiveness & Lab Rooms):**
    *   Practical labs must be scheduled in rooms marked as `Room_Type = Lab` and contain matching equipment capabilities.
    *   Labs must be scheduled as consecutive multi-period blocks (e.g., 2 or 3 hours) and **cannot** be split by the Midday Break slot.
4.  **NEP-Compliant Course/Elective Clashes (Student-Level Conflict):**
    Under the National Education Policy (NEP), students in a single cohort can register for different elective/optional subjects.
    *   If any individual student is registered for both Subject $S_1$ and Subject $S_2$, then $S_1$ and $S_2$ **cannot** be scheduled in the same slot, even if they belong to the same semester/cohort. The clash checks must operate at the *student-enrollment* level, not just the *cohort* level.
5.  **Smart Classroom "Must Need" Fallback (Infeasibility Prevention):**
    To prevent solver failure in cases of resource scarcity, the "Must Need" smart classroom constraint is mathematically formulated as a soft constraint with an extremely high penalty weight ($100,000$ points) rather than an absolute hard constraint. This allows the system to fallback to a regular classroom if no smart rooms are available, instead of throwing an "Infeasible" error.
6.  **Exam Seating - Same Subject Anti-Contiguity:**
    During examinations, students writing the exam for the **same subject** must **not** sit in consecutive adjacent seats. They must alternate with students writing other subjects, or be separated by empty buffer seats.

### 6.2 Soft Constraints & Penalty Weights
The optimization score is calculated by subtracting weighted penalties from a base score:

| Constraint Category | Violation Description | Target Penalty Weight |
| :--- | :--- | :---: |
| **Smart Room "Must Need" Fallback** | Class with "Must Need" smart room is allocated a regular room. (Triggers *Low Resources Warning*). | **Critical (100,000 pts)** |
| **Heavy-Subject Spacing** | Student cohort has two `is_heavy_cognitive` subjects back-to-back. | **High (100 pts)** |
| **Faculty Burnout** | Faculty member assigned to 3 or more consecutive hours. | **High (80 pts)** |
| **Smart Room "Good If" Prefer** | Class with "Good If" smart room is allocated a regular room. | **Medium (50 pts)** |
| **Faculty Preferences** | Faculty assigned to a slot they flagged as "Preferred Not to Teach". | **Medium (30 pts)** |
| **Schedule Gaps** | Cohort has a schedule gap (e.g., Class in Period 1 and Period 4, with empty Periods 2 & 3). | **Medium (25 pts)** |
| **Smart Room "Don't Need" Waste** | Class with "Don't Need" smart room is allocated a smart room (prevents wasting smart rooms). | **Low (10 pts)** |

*(Note: Room travel time has been excluded from the current optimization parameters due to map boundary complexity).*

### 6.3 Edge Cases & Error Handling

#### Edge Case A: Infeasible Constraints (Solver Fails to Converge)
*   *Scenario:* The admin enters too many hard constraints (e.g., too many teachers unavailable, not enough classrooms). The solver determines that a conflict-free schedule is mathematically impossible.
*   *Requirement:* The system must catch this error, identify the conflicting constraints (using OR-Tools' *conflict analysis*), and display an advisory report to the admin (e.g., *"Cannot schedule: Cohort A needs 30 hours of instruction, but available rooms only support 24 hours"*).

#### Edge Case B: Last-Minute Leave with No Free Substitutes
*   *Scenario:* A teacher goes on leave, but all other qualified teachers are already teaching, and the cohort has no empty slots left in the week.
*   *Requirement:* The system must flag this slot in red on the Admin Dashboard as an **"Unresolved Class Cancellation"**. It should suggest booking an asynchronous study period or scheduling a substitute when possible. **Weekend scheduling is strictly prohibited.**

#### Edge Case C: Low Resources Warning (Smart Classroom Shortage)
*   *Scenario:* The solver is forced to allocate a regular room to a course requiring a smart classroom because all smart rooms are occupied.
*   *Requirement:* The system must detect that a "Must Need" smart room penalty was incurred. It must trigger a **"Low Resources Warning"** dashboard alert listing:
    1. The impacted class (Section, Subject, Professor).
    2. The standard classroom that was allocated as a fallback.
    3. An explanation showing which smart rooms were occupied at that time and by which classes, enabling the admin to make informed swaps.

---

## 7. UX & Interface Requirements

### 7.1 Visual Scheduling Grid
*   The master schedule grid must display a timeline view.
*   Color-code slots by subject type (e.g., Blue for lectures, Purple for labs, Orange for exams, Grey for breaks).
*   Provide a "Clash View" toggle that highlights any slot containing manually introduced conflicts.

### 7.2 Manual Adjustment Safety Net
*   When an administrator starts dragging a class block, all valid slots on the grid must light up in green, while invalid slots (clashing rooms/teachers) must turn red.
*   If a class block is dropped into a clashing slot, the system must display a confirmation dialog showing the conflicts, requiring a explicit override confirmation or reverting the block.

---

## 8. Development Phasing & Roadmap

The implementation plan is structured into four distinct phases, sequenced to address foundation dependencies first.

### Phase 1: MVP Core Setup (Duration: 3 Weeks)
*   **Database Schema & CRUD Interfaces:** Setup PostgreSQL relations, indices, and constraints.
*   **Data Ingestion Pipeline:** Implement Excel/CSV validation checks and parsing modules.

### Phase 2: Solver Optimization Engine (Duration: 4 Weeks)
*   **Google OR-Tools CP-SAT Integration:** Model variables, rooms, cohorts, and slots.
*   **Hard & Soft Constraints Implementation:** Code logic for clashes, heavy-subject spacing, and consecutive teacher limits.

### Phase 3: Administrative Dashboard & Overrides (Duration: 3 Weeks)
*   **Interactive Grid UI:** Build views to filter schedules by classroom, teacher, or student section.
*   **Drag-and-Drop Editor:** Integrate frontend manual block movement with background validation checks.

### Phase 4: Dynamic Operations & Integrations (Duration: 4 Weeks)
*   **Substitution & Rescheduling Module:** Implement leave requests and automated swap/substitute suggest logic.
*   **Exam Mode Scheduling:** Integrate Sparse room allocations and invigilator schedules.
*   **Notice Board REST API & Notification Services:** Setup WebSocket channels and smart display polling feeds.

---

## 9. Data Import & Excel/CSV Specifications

To streamline system configuration, the application provides an administrative ingestion pipeline. The system accepts either **individual Excel/CSV files** (for modular updates) or a **Single Master Excel Workbook (`master_schedule_inputs.xlsx`)** containing five dedicated sheets.

### 9.1 Master Excel Workbook Structuring
The master workbook must contain the following sheets, mapped exactly to the database schema:

#### A. Sheet: `Cohorts` (Student Sections)
Defines student groups that move and attend classes together.
*   **Column Headers:**
    *   `Cohort_ID` (Required, unique alphanumeric): e.g., `CSE_SEM3_A`.
    *   `Name` (Required, string): Descriptive name, e.g., `B.Tech CSE Semester 3 Section A`.
    *   `Semester` (Required, integer): e.g., `3`.
    *   `Size` (Required, integer): Number of enrolled students (used to check room capacity).
    *   `Department` (Required, string): e.g., `Computer Science`.

#### B. Sheet: `Faculty`
Defines available teachers and their core availability bounds.
*   **Column Headers:**
    *   `Faculty_ID` (Required, unique alphanumeric): e.g., `FAC_DR_SEN`.
    *   `Name` (Required, string): e.g., `Dr. Amit Sen`.
    *   `Contact_Number` (Required, string): Mobile or phone number for urgent notifications and coordination.
    *   `Email` (Required, unique string): Valid email address.
    *   `Department` (Required, string): e.g., `Computer Science`.
    *   `Max_Weekly_Hours` (Optional, integer, default 18): Maximum teaching load per week.
    *   `Unavailable_Slots` (Optional, string): Comma-separated list of slots the teacher cannot work, formatted as `Day:Period` (e.g., `Monday:1, Monday:2, Friday:8`).

#### C. Sheet: `Rooms`
Defines physical classrooms and labs.
*   **Column Headers:**
    *   `Room_ID` (Required, unique alphanumeric): e.g., `LH_302`.
    *   `Name` (Required, string): e.g., `Lecture Hall 302`.
    *   `Capacity` (Required, integer): Maximum student seating.
    *   `Room_Type` (Required, enum: `Lecture` or `Lab`): Determines what sessions can be held here.
    *   `Capabilities` (Optional, string): Comma-separated list of capabilities, e.g., `Projector, Computers, SmartBoard`.

#### D. Sheet: `Subjects`
Defines the curriculum registry.
*   **Column Headers:**
    *   `Subject_ID` (Required, unique alphanumeric): e.g., `SUB_CS301`.
    *   `Code` (Required, string): Course code, e.g., `CS-301`.
    *   `Name` (Required, string): Course name, e.g., `Data Structures and Algorithms`.
    *   `Subject_Type` (Required, enum: `Lecture` or `Lab`): Maps to Room Type.
    *   `Is_Heavy_Cognitive` (Required, boolean `TRUE` or `FALSE` / `Y` or `N`): Flag to trigger the heavy subject separation constraint.
    *   `Periods_Per_Week` (Required, integer): Baseline weekly periods for the course.
    *   `Department` (Required, string): e.g., `Computer Science`.
    *   `Required_Capabilities` (Optional, string): Comma-separated equipment tags required in the assigned room (e.g., `Computers`).

#### E. Sheet: `Curriculum_Workload`
Maps which teacher instructs which cohort for which subject, specifies the weekly class count, and contains the professor-subject specific smart classroom preferences.
*   **Column Headers:**
    *   `Mapping_ID` (Required, unique integer/string): e.g., `MAP_101`.
    *   `Cohort_ID` (Required, string matches `Cohort_ID` in `Cohorts` sheet).
    *   `Subject_ID` (Required, string matches `Subject_ID` in `Subjects` sheet).
    *   `Faculty_ID` (Required, string matches `Faculty_ID` in `Faculty` sheet).
    *   `Weekly_Periods` (Required, integer): The number of periods this class must meet per week.
    *   `Smart_Class_Requirement` (Required, enum: `MUST_HAVE`, `PREFERRED`, `NOT_REQUIRED`): The professor-subject specific preference for smart classroom capabilities.

### 9.2 Ingestion Validation Rules
To prevent broken solver runs, the ingestion pipeline runs three validation checks before committing data:
1.  **Syntactic Check:** Verifies all column headers match exactly, checks for invalid characters, and runs regex validations on emails/phone numbers.
2.  **Semantic Referential Check:** Checks that all `Cohort_ID`, `Subject_ID`, and `Faculty_ID` values inside `Curriculum_Workload` exist in their respective sheets.
3.  **Feasibility Check:** 
    *   Sum of all `Weekly_Periods` for any individual cohort must not exceed the total available teaching slots in a week.
    *   Sum of all `Weekly_Periods` assigned to any faculty must not exceed their `Max_Weekly_Hours`.
    *   A cohort of size $S$ must have at least one room of type `Room_Type` with capacity $C \ge S$.

---

## 10. Appendix & Glossary

*   **UCTP (University Course Timetabling Problem):** The academic problem of scheduling courses, students, and lecturers into slots without conflicts.
*   **CP-SAT (Constraint Programming - Satisfiability):** Google OR-Tools' modern mathematical solver that uses constraint satisfaction methods to optimize integer programs.
*   **Cohort (Section):** A group of students taking the same curriculum who attend classes together (e.g., Computer Science Section A, 3rd Semester).
*   **NEP (National Education Policy):** Refers to academic systems with individualized student elective selections, creating multi-directional student-level clashing constraints.
*   **Heavy Subject:** A course requiring high cognitive load (e.g., Mathematics, Coding, Theory of Computation), flagged for spacing constraints.
*   **Invigilator:** A faculty member assigned to supervise an examination session.
*   **Digital Notice Board:** IoT display units running a client app that queries the room API to display class schedules outside classrooms.
