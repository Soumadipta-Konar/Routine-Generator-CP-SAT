# Technical Implementation Steps
## Automatic Optimized Class Routine Generation System

This document outlines the step-by-step technical implementation roadmap for the development team. It covers database migrations, solver engine construction, parser pipelines, API services, and frontend integration.

---

## Phase 1: Database Setup & Migrations
Set up PostgreSQL and execute the schema initialization.

1.  **Initialize PostgreSQL Database:**
    *   Create the database: `CREATE DATABASE routine_generator;`
    *   Setup database users and permissions.
2.  **Run Schema Migrations:**
    *   Write and apply SQL migrations for core tables in this exact order to maintain referential integrity:
        1.  `institution`, `department`
        2.  `cohort` (student sections), `student` (individual profiles)
        3.  `faculty` (include `contact_number` and remove raw email fields where direct phone is preferred for SMS notifications)
        4.  `subject` (with `is_heavy_cognitive` flag)
        5.  `room` (capacities and room types) and `lab_details` (extends room for workstation metrics and equipment JSON lists)
        6.  `elective_registration` (NEP student course registrations)
        7.  `period_slot` (configured by Super Admin to dynamically set periods and recess breaks)
        8.  `schedule_entry` (representing class routines, with `smart_class_requirement` check constraint)
3.  **Create Composite Indices:**
    *   Index for routine lookups: 
        ```sql
        CREATE INDEX idx_schedule_active_slots 
        ON schedule_entry (day_of_week, period_slot_id) 
        WHERE is_active = TRUE;
        ```
    *   Index for dynamic leaf rescheduling:
        ```sql
        CREATE INDEX idx_schedule_overrides 
        ON schedule_entry (schedule_date, faculty_id) 
        WHERE schedule_date IS NOT NULL;
        ```

---

## Phase 2: Ingestion & Validation Pipeline (Excel Parser)
Create the Python import pipeline to parse the master workbook.

1.  **Install Required Ingestion Libraries:**
    *   Run: `pip install pandas openpyxl`
2.  **Develop Ingestion Script (`backend/services/importer.py`):**
    *   Implement sheet parser using `pandas.read_excel()` to load the five sheets: `Cohorts`, `Faculty`, `Rooms`, `Subjects`, and `Curriculum_Workload`.
3.  **Implement Ingestion Validators:**
    *   **Step 1: Syntactic Check:** Match column lists against the schema. Check emails via regex and verify that phone numbers match target country phone patterns.
    *   **Step 2: Referential Check:** Verify that all foreign keys inside `Curriculum_Workload` map back to rows in the `Faculty`, `Cohorts`, and `Subjects` sheets.
    *   **Step 3: Feasibility Check:** Sum up cohort periods to verify they do not exceed 40 periods (8 periods × 5 days). Verify that each cohort has at least one room of suitable capacity.
4.  **Wrap in Database Transaction Sandbox:**
    *   Use `transaction.atomic()` (Django) to write data. Wrap in `try/except` and call `transaction.set_rollback(True)` if any validation check fails, returning a structured JSON error response mapping errors by row/column.

---

## Phase 3: Optimization Solver Engine (Google OR-Tools)
Formulate the UCTP problem as a CSP and implement the optimizer in Python.

1.  **Install OR-Tools Library:**
    *   Run: `pip install ortools`
2.  **Define Solver Environment (`solver/engine.py`):**
    *   Initialize: `model = cp_model.CpModel()`
3.  **Define Decision Variables:**
    *   For each class session $l$, slot $sl$, and room $r$, create a boolean variable: `x[l, sl, r] = model.NewBoolVar(f"x_{l}_{sl}_{r}")`
4.  **Formulate Hard Constraints:**
    *   **Schedule Exactly Once:** Ensure every lecture $l$ is placed:
        ```python
        for l in lectures:
            model.Add(sum(x[l, sl, r] for sl in slots for r in rooms) == 1)
        ```
    *   **No Clashes:** Ensure single allocations for faculty, cohorts, and rooms.
    *   **NEP Electives Constraint:** For subjects $sub_1, sub_2$ sharing registered students, prohibit concurrent scheduling:
        ```python
        for sl in slots:
            model.Add(sum(x[l1, sl, r] for r in rooms) + sum(x[l2, sl, r] for r in rooms) <= 1)
        ```
    *   **Practical Lab Contiguity:** Map lab sessions using `model.NewIntervalVar` and dynamically check the active break slots (queried from the `period_slot` table) to prevent labs from starting at slots that would cause them to overlap with break periods.
    *   **Exam Seating Protection:** For exams, constrain seat assignments in the room grid so that students writing the same subject exam are not placed in adjacent indices.
5.  **Formulate Soft Constraints & Objective Function:**
    *   Add penalties for: back-to-back heavy subjects, teacher consecutive hours (3 consecutive hours), and smart classroom fallbacks:
        *   `MUST_HAVE` Smart room fallback penalty: $100,000$ points.
        *   `PREFERRED` Smart room fallback penalty: $50$ points.
        *   `NOT_REQUIRED` Smart room assignment penalty (waste prevention): $10$ points.
    *   Set objective: `model.Minimize(total_penalty)`
6.  **Run Solver & Capture Warnings:**
    *   Execute solver: `solver = cp_model.CpSolver()`
    *   Check for fallback violations ($V_{l}^{must} == 1$). If detected, flag the schedule status as `COMPLETED_WITH_WARNINGS` and extract the low resource warning diagnostics.

---

## Phase 4: Backend API & Async Tasks (Celery & Redis)
Set up the service layer to run the solver asynchronously.

1.  **Setup Message Broker (Redis):**
    *   Run Redis locally or in Docker: `docker run -d -p 6379:6379 redis`
2.  **Setup Celery Task Worker (`backend/tasks.py`):**
    *   Define async task:
        ```python
        @shared_task
        def run_schedule_optimization(schedule_run_id):
            # Load DB inputs -> Run OR-Tools Solver -> Commit draft results to DB
        ```
3.  **Implement API Endpoints:**
    *   `POST /api/v1/imports/master-workbook` (Upload sheet and run validation).
    *   `POST /api/v1/schedules/generate` (Enqueue Celery job).
    *   `GET /api/v1/schedules/status/<task_id>` (Poll Celery execution status).
    *   `POST /api/v1/schedules/override` (Drag-and-drop manual adjustment check).
    *   `POST /api/v1/leaves/request` (Log leave and trigger substitution engine).
4.  **Implement WebSocket Real-Time Events:**
    *   Setup Django Channels / Socket.IO.
    *   Broadcast events on the section group channel when a substitute is assigned:
        ```python
        # Payload sent to section clients
        {"type": "schedule.update", "section": "CSE_SEM3_A", "period": 3, "status": "Substitute", "faculty": "Prof. Y"}
        ```

---

## Phase 5: Frontend Dashboard & Visualization (React)
Build the user interface.

1.  **Setup React Core & Tailwind CSS:**
    *   Initialize boilerplate and install CSS grid layouts.
2.  **Build Admin Dashboard Components:**
    *   **File Uploader:** Displays sheet errors in red using row and column indicators.
    *   **Master Visualizer Grid:** Filterable view showing slots by room, teacher, or cohort.
    *   **Drag-and-Drop Handler:** Integrates drag events with API calls to validate edits. Shows red markers for conflicts.
3.  **Build Student Dashboard Components:**
    *   **Personalized Calendar:** Connects to `GET /api/v1/students/me/personalized-schedule` to merge standard section classes with their NEP electives.
    *   **WebSocket listener:** Listens for real-time schedule updates and displays a toast alert for changes.
    *   **PWA Integration:** Service Worker implementation to cache the calendar locally in IndexedDB for offline access.
4.  **Build Notice Board Display Interface:**
    *   A clean, full-screen read-only dashboard designed for IoT screens that polls `/api/v1/rooms/<room_id>/today` every 60 seconds.

---

## Phase 6: Testing & Quality Assurance
Run tests to verify the schedule output.

1.  **Write Solver Unit Tests:**
    *   Create mock datasets containing overlapping teachers and verify that OR-Tools outputs zero clashes.
    *   Test capacity limit triggers: Confirm that student counts higher than room capacities result in correct room assignments.
    *   Verify lab block integrity: Check that lab blocks are not scheduled across midday break slots.
    *   Verify exam seating: Validate that students sitting side-by-side do not share the same exam subject.
2.  **Write API & Ingestion Tests:**
    *   Run test files with missing sheets or mismatched foreign keys to verify rollback and JSON error reports.
3.  **Perform Load Testing:**
    *   Simulate a campus with 120 teachers, 40 rooms, and 1200 students to ensure solver execution remains under the 3-minute limit.
