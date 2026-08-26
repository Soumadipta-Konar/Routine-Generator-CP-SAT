# Architectural Trade-offs in the Routine Generator Journey

Building the AI Routine Generator required navigating several critical engineering and architectural trade-offs. This document outlines the key decisions made during development, the challenges they introduced, and why we chose the paths we did.

---

## 1. Mathematical Optimality vs. Cloud Infrastructure Limits

**The Challenge:** The Google OR-Tools CP-SAT solver is incredibly powerful, but solving the University Course Timetabling Problem (UCTP) to strict mathematical optimality can take hours depending on constraints.

**The Trade-off:** 
We sacrificed absolute mathematical optimality for UX responsiveness and cloud compatibility. 
* **Worker Limiting:** By default, CP-SAT attempts to use 8+ search workers. On Render's free tier, this immediately exhausted the container's CPU limits and crashed the backend. We explicitly capped `num_search_workers` to match the container's available cores.
* **Timeout Thresholds:** We enforced a hard 60-second execution limit (`time_limit_seconds=60.0`). If the engine cannot prove absolute optimality in 60 seconds, it falls back to returning the best `FEASIBLE` solution found. 
* **Gunicorn Thresholds:** To prevent the WSGI server from killing the solver mid-thought, we had to introduce a custom `gunicorn.conf.py` increasing the HTTP timeout from 30 seconds to 180 seconds.

*Result:* The system reliably generates 0-clash schedules in ~60 seconds on cloud instances, favoring practical usability over theoretical perfection.

---

## 2. Raw SQL Schema vs. Django ORM

**The Challenge:** Django provides a robust ORM (Object-Relational Mapping) system with automated migrations, which is standard for web applications.

**The Trade-off:**
We completely bypassed Django ORM for the core scheduling database, opting for raw SQL (`docs/schema.sql`) and `psycopg2` dictionary cursors.
* **Why we did it:** The timetabling domain requires complex composite keys, strict `CHECK` constraints, cascading deletes, and highly optimized multi-join queries that are cumbersome (and slow) to model in Django ORM.
* **What we faced:** Bypassing ORM broke standard CI/CD pipelines. When deployed to Render, the database was empty because `python manage.py migrate` didn't execute our custom schema. We had to engineer a custom `init_db.py` script to run during the build process.
* **The silent bug:** Because `docs/` was in `.gitignore`, the schema file never made it to the cloud, causing silent deployment failures that we had to aggressively debug via remote health-check injections.

*Result:* We achieved a highly performant, academically strict database schema, but at the cost of manual database lifecycle management.

---

## 3. Server-Side Data Ingestion vs. Client-Side Validation

**The Challenge:** The user uploads a massive Master Excel workbook containing thousands of relational data points (Cohorts, Faculty, Workloads). 

**The Trade-off:**
We chose to handle 100% of the Excel parsing and validation on the backend using Python `pandas`, rather than parsing the file in the React frontend using JavaScript libraries like `SheetJS`.
* **Why we did it:** Relational validation requires deep checks (e.g., "Does the subject code in the workload sheet exist in the subjects sheet?"). Doing this on the backend allowed us to create an atomic `db_insert_sandbox`. If any row fails, the entire database transaction rolls back instantly.
* **What we faced:** This increases the memory overhead on the Python server during file upload. We also had to build an intricate error-mapping system to catch Pandas/Database errors and format them nicely for the React UI to consume and display.

*Result:* Unbreakable database integrity. Bad data is physically impossible to save to the database.

---

## 4. CP-SAT Constraints: Tensor Size vs. Pre-computation

**The Challenge:** The core problem uses a 3D boolean tensor mapping `Block` × `Slot` × `Room`. For a university, this matrix can easily exceed a million boolean variables, crashing the solver before it begins.

**The Trade-off:**
Instead of letting the CP engine filter impossible assignments during execution, we shifted the complexity into a pre-computation phase in Python.
* **Pre-filtering:** We dynamically pre-compute `valid_groups` (stripping out slots where faculty are marked unavailable) and `allowed_rooms` (matching room type and capacity to cohort size).
* **What we faced:** This made the `engine.py` setup code much more complex and verbose, requiring heavy loops and dictionary lookups before the solver even spins up.

*Result:* The solver's search space is reduced by over 90% before execution, allowing it to solve highly constrained timetables in seconds rather than hours.
