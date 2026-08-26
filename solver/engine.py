import sys
import os
from ortools.sat.python import cp_model

# Add current workspace directory to sys.path to allow execution from any folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from solver.mapping import fetch_scheduling_data, save_schedule_entries

class ScheduleSolver:
    def __init__(self, data=None):
        """
        Initialize the scheduler. If data is provided, use it; otherwise, fetch from DB.
        """
        self.data = data if data is not None else fetch_scheduling_data()
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Pre-process raw data
        self.slots = self.data["slots"]
        self.rooms = self.data["rooms"]
        self.faculty = self.data["faculty"]
        self.subjects = self.data["subjects"]
        self.cohorts = self.data["cohorts"]
        self.students = self.data["students"]
        self.elective_regs = self.data["elective_regs"]
        self.workloads = self.data["workloads"]

        # Maps for quick lookup
        self.subject_map = {s["id"]: s for s in self.subjects}
        self.room_map = {r["id"]: r for r in self.rooms}
        self.cohort_map = {c["id"]: c for c in self.cohorts}
        self.faculty_map = {f["id"]: f for f in self.faculty}

        # Setup academic slots (excluding break slots)
        self.academic_slots = []
        for day in range(1, 6): # 1 (Mon) to 5 (Fri)
            for slot in self.slots:
                if not slot["is_break"]:
                    self.academic_slots.append({
                        "day": day,
                        "slot_id": slot["id"],
                        "slot_number": slot["slot_number"]
                    })
        
        # Group academic slots by day for consecutive check
        self.academic_slots_by_day = {}
        for day in range(1, 6):
            self.academic_slots_by_day[day] = sorted(
                [s for s in self.academic_slots if s["day"] == day],
                key=lambda x: x["slot_number"]
            )

    def _get_group_size(self, w):
        """
        Determine the size of the student group attending a curriculum workload.
        For cohort classes, it is the cohort size.
        For elective classes, it is the count of registered students.
        """
        if w.get("cohort_id") is not None:
            c = self.cohort_map.get(w["cohort_id"])
            return c["size"] if c else 0
        elif w.get("elective_subject_id") is not None:
            sub_id = w["elective_subject_id"]
            return sum(1 for reg in self.elective_regs if reg["subject_id"] == sub_id)
        return 0

    def _get_student_list(self, w):
        """
        Get the list of student IDs attending a curriculum workload.
        """
        if w.get("cohort_id") is not None:
            return [s["id"] for s in self.students if s["cohort_id"] == w["cohort_id"]]
        elif w.get("elective_subject_id") is not None:
            sub_id = w["elective_subject_id"]
            return [reg["student_id"] for reg in self.elective_regs if reg["subject_id"] == sub_id]
        return []

    def _get_valid_contiguous_slot_groups(self, k):
        """
        Find all contiguous academic slot groups of size k on the same day.
        Returns list of lists of slot dicts.
        """
        groups = []
        for day in range(1, 6):
            slots_in_day = self.academic_slots_by_day[day]
            # Find consecutive subsequences
            for i in range(len(slots_in_day) - k + 1):
                candidate = slots_in_day[i:i+k]
                # Verify that slot numbers are strictly consecutive (no break in between)
                consecutive = True
                for j in range(k - 1):
                    if candidate[j+1]["slot_number"] != candidate[j]["slot_number"] + 1:
                        consecutive = False
                        break
                if consecutive:
                    groups.append(candidate)
        return groups

    def build_model(self):
        """
        Build variables and constraints for the UCTP problem.
        """
        # Split workloads into blocks
        # For Lecture subjects: split weekly_periods into blocks of size 1
        # For Lab subjects: split into blocks of size 2, 3, or 1 depending on periods
        self.blocks = []
        block_counter = 0
        
        for w in self.workloads:
            sub = self.subject_map.get(w["subject_id"])
            if not sub:
                continue
            
            is_lab = sub["subject_type"] == "Lab"
            periods = w["weekly_periods"]
            
            # Determine block sizes
            block_sizes = []
            if is_lab:
                periods_left = periods
                while periods_left > 0:
                    if periods_left >= 4:
                        block_sizes.append(2)
                        periods_left -= 2
                    elif periods_left == 3:
                        block_sizes.append(3)
                        periods_left -= 3
                    elif periods_left == 2:
                        block_sizes.append(2)
                        periods_left -= 2
                    else:
                        block_sizes.append(1)
                        periods_left -= 1
            else:
                # Lectures are always individual 1-period blocks
                block_sizes = [1] * periods
            
            for size in block_sizes:
                self.blocks.append({
                    "block_id": block_counter,
                    "workload": w,
                    "subject": sub,
                    "size": size,
                    "group_size": self._get_group_size(w),
                    "students": self._get_student_list(w)
                })
                block_counter += 1

        # Decision Variables: y[b, cg_idx, r_idx]
        # b: block index
        # cg_idx: contiguous slot group index for block size
        # r_idx: room index
        self.y = {}
        
        # Pre-generate valid contiguous slot groups by size
        self.slot_groups_by_size = {}
        for size in set(b["size"] for b in self.blocks):
            self.slot_groups_by_size[size] = self._get_valid_contiguous_slot_groups(size)

        # Build variables and filter domains
        for b in self.blocks:
            b_id = b["block_id"]
            sub = b["subject"]
            req_type = "Lab" if sub["subject_type"] == "Lab" else "Lecture_Hall"
            group_size = b["group_size"]
            
            # Filter rooms by type and capacity
            allowed_rooms = []
            for r in self.rooms:
                if r["room_type"] == req_type and r["capacity"] >= group_size:
                    allowed_rooms.append(r)
            b["allowed_rooms"] = allowed_rooms

            # Faculty availability preferences parsing
            fac_id = b["workload"]["faculty_id"]
            fac = self.faculty_map.get(fac_id)
            unavail_slots = set()
            unpref_slots = set()
            if fac and isinstance(fac.get("availability_preferences"), dict):
                prefs = fac["availability_preferences"]
                for slot in prefs.get("unavailable", []):
                    unavail_slots.add((slot[0], slot[1])) # (day, slot_number)
                for slot in prefs.get("preferred_not", []):
                    unpref_slots.add((slot[0], slot[1])) # (day, slot_number)

            valid_groups = []
            for cg in self.slot_groups_by_size[b["size"]]:
                # Check if group contains any unavailable slot for faculty
                overlap_unavail = False
                for s in cg:
                    if (s["day"], s["slot_number"]) in unavail_slots:
                        overlap_unavail = True
                        break
                if not overlap_unavail:
                    valid_groups.append(cg)
            
            b["valid_groups"] = valid_groups

            # Define variables
            for cg_idx, cg in enumerate(valid_groups):
                # Calculate unpreferred slot count in this slot group
                unpref_count = sum(1 for s in cg if (s["day"], s["slot_number"]) in unpref_slots)
                
                for r in allowed_rooms:
                    r_id = r["id"]
                    self.y[(b_id, cg_idx, r_id)] = self.model.NewBoolVar(f"y_b{b_id}_g{cg_idx}_r{r_id}")


        # --- Hard Constraints ---

        # 1. Schedule Exactly Once: Every block must be scheduled in exactly one group and one room
        for b in self.blocks:
            b_id = b["block_id"]
            vars_list = []
            for cg_idx in range(len(b["valid_groups"])):
                for r in b["allowed_rooms"]:
                    vars_list.append(self.y[(b_id, cg_idx, r["id"])])
            if vars_list:
                self.model.Add(sum(vars_list) == 1)
            else:
                # No valid slots or rooms, schedule is infeasible
                print(f"[WARNING] Block {b_id} (Subject {b['subject']['code']}) has no allowed rooms or valid slots.")
                # We can still add a dummy solver check, but this will fail.

        # Helper: slot occupancy for block b at (day, slot_id) regardless of room
        self.X_slot = {}
        for b in self.blocks:
            b_id = b["block_id"]
            for s in self.academic_slots:
                day = s["day"]
                s_id = s["slot_id"]
                slot_vars = []
                for cg_idx, cg in enumerate(b["valid_groups"]):
                    if any(x["day"] == day and x["slot_id"] == s_id for x in cg):
                        for r in b["allowed_rooms"]:
                            slot_vars.append(self.y[(b_id, cg_idx, r["id"])])
                if slot_vars:
                    self.X_slot[(b_id, day, s_id)] = self.model.NewBoolVar(f"X_slot_b{b_id}_d{day}_s{s_id}")
                    self.model.Add(self.X_slot[(b_id, day, s_id)] == sum(slot_vars))
                else:
                    self.X_slot[(b_id, day, s_id)] = 0

        # 2. Room Clash Prevention: At most one block in each room at each slot
        for r in self.rooms:
            r_id = r["id"]
            for s in self.academic_slots:
                day = s["day"]
                s_id = s["slot_id"]
                room_vars = []
                for b in self.blocks:
                    b_id = b["block_id"]
                    for cg_idx, cg in enumerate(b["valid_groups"]):
                        if any(x["day"] == day and x["slot_id"] == s_id for x in cg):
                            if (b_id, cg_idx, r_id) in self.y:
                                room_vars.append(self.y[(b_id, cg_idx, r_id)])
                if room_vars:
                    self.model.Add(sum(room_vars) <= 1)


        # 3. Faculty Clash Prevention: At most one class for each faculty member at each slot
        for f in self.faculty:
            f_id = f["id"]
            for s in self.academic_slots:
                day = s["day"]
                s_id = s["slot_id"]
                fac_vars = []
                for b in self.blocks:
                    if b["workload"]["faculty_id"] == f_id:
                        expr = self.X_slot[(b["block_id"], day, s_id)]
                        if isinstance(expr, cp_model.LinearExpr) or expr != 0:
                            fac_vars.append(expr)
                if fac_vars:
                    self.model.Add(sum(fac_vars) <= 1)

        # 4. Cohort Clash Prevention: At most one core class for each cohort at each slot
        for c in self.cohorts:
            c_id = c["id"]
            for s in self.academic_slots:
                day = s["day"]
                s_id = s["slot_id"]
                cohort_vars = []
                for b in self.blocks:
                    if b["workload"].get("cohort_id") == c_id:
                        expr = self.X_slot[(b["block_id"], day, s_id)]
                        if isinstance(expr, cp_model.LinearExpr) or expr != 0:
                            cohort_vars.append(expr)
                if cohort_vars:
                    self.model.Add(sum(cohort_vars) <= 1)

        # 5. NEP Elective Clashing (Student-Level clash prevention)
        unique_student_schedules = {}
        for st in self.students:
            st_cohort = st["cohort_id"]
            st_electives = tuple(sorted(reg["subject_id"] for reg in self.elective_regs if reg["student_id"] == st["id"]))
            key = (st_cohort, st_electives)
            if key not in unique_student_schedules:
                unique_student_schedules[key] = []
            unique_student_schedules[key].append(st["id"])

        for (st_cohort, st_electives), st_ids in unique_student_schedules.items():
            student_blocks = []
            for b in self.blocks:
                w = b["workload"]
                if w.get("cohort_id") == st_cohort:
                    student_blocks.append(b)
                elif w.get("elective_subject_id") is not None and w["elective_subject_id"] in st_electives:
                    student_blocks.append(b)

            for s in self.academic_slots:
                day = s["day"]
                s_id = s["slot_id"]
                student_vars = []
                for b in student_blocks:
                    expr = self.X_slot[(b["block_id"], day, s_id)]
                    if isinstance(expr, cp_model.LinearExpr) or expr != 0:
                        student_vars.append(expr)
                if student_vars:
                    self.model.Add(sum(student_vars) <= 1)


        # --- Soft Constraints & Penalties ---
        self.penalties = []

        # A. Smart Classroom Fallbacks
        def is_smart_room(room):
            name = room["name"].lower()
            return "301" in name or "smart" in name or "lab" in name

        for b in self.blocks:
            b_id = b["block_id"]
            req = b["workload"].get("smart_class_requirement", "NOT_REQUIRED")
            
            for cg_idx in range(len(b["valid_groups"])):
                for r in b["allowed_rooms"]:
                    r_id = r["id"]
                    var = self.y[(b_id, cg_idx, r_id)]
                    smart = is_smart_room(r)
                    
                    if req == "MUST_HAVE" and not smart:
                        self.penalties.append(var * 100000)
                    elif req == "PREFERRED" and not smart:
                        self.penalties.append(var * 50)
                    elif req == "NOT_REQUIRED" and smart:
                        self.penalties.append(var * 10)

        # B. Spacing Out Heavy Subjects
        for c in self.cohorts:
            c_id = c["id"]
            for day in range(1, 6):
                slots_in_day = self.academic_slots_by_day[day]
                for i in range(len(slots_in_day) - 1):
                    s1 = slots_in_day[i]
                    s2 = slots_in_day[i+1]
                    
                    heavy_vars_s1 = []
                    heavy_vars_s2 = []
                    for b in self.blocks:
                        if b["workload"].get("cohort_id") == c_id and b["subject"]["is_heavy_cognitive"]:
                            if (b["block_id"], day, s1["slot_id"]) in self.X_slot:
                                heavy_vars_s1.append(self.X_slot[(b["block_id"], day, s1["slot_id"])])
                            if (b["block_id"], day, s2["slot_id"]) in self.X_slot:
                                heavy_vars_s2.append(self.X_slot[(b["block_id"], day, s2["slot_id"])])

                    if heavy_vars_s1 and heavy_vars_s2:
                        y1 = self.model.NewBoolVar(f"heavy_c{c_id}_d{day}_s{s1['slot_number']}")
                        y2 = self.model.NewBoolVar(f"heavy_c{c_id}_d{day}_s{s2['slot_number']}")
                        self.model.Add(y1 == sum(heavy_vars_s1))
                        self.model.Add(y2 == sum(heavy_vars_s2))
                        
                        clash_var = self.model.NewBoolVar(f"heavy_clash_c{c_id}_d{day}_{s1['slot_number']}_{s2['slot_number']}")
                        self.model.Add(clash_var >= y1 + y2 - 1)
                        self.penalties.append(clash_var * 100)

        # C. Faculty Consecutive Hours Limit
        for f in self.faculty:
            f_id = f["id"]
            for day in range(1, 6):
                slots_in_day = self.academic_slots_by_day[day]
                for i in range(len(slots_in_day) - 2):
                    s1 = slots_in_day[i]
                    s2 = slots_in_day[i+1]
                    s3 = slots_in_day[i+2]
                    
                    f_vars_s1 = []
                    f_vars_s2 = []
                    f_vars_s3 = []
                    for b in self.blocks:
                        if b["workload"]["faculty_id"] == f_id:
                            f_vars_s1.append(self.X_slot[(b["block_id"], day, s1["slot_id"])])
                            f_vars_s2.append(self.X_slot[(b["block_id"], day, s2["slot_id"])])
                            f_vars_s3.append(self.X_slot[(b["block_id"], day, s3["slot_id"])])

                    if f_vars_s1 and f_vars_s2 and f_vars_s3:
                        z1 = self.model.NewBoolVar(f"fac_{f_id}_d{day}_s{s1['slot_number']}")
                        z2 = self.model.NewBoolVar(f"fac_{f_id}_d{day}_s{s2['slot_number']}")
                        z3 = self.model.NewBoolVar(f"fac_{f_id}_d{day}_s{s3['slot_number']}")
                        self.model.Add(z1 == sum(f_vars_s1))
                        self.model.Add(z2 == sum(f_vars_s2))
                        self.model.Add(z3 == sum(f_vars_s3))
                        
                        consec_var = self.model.NewBoolVar(f"consec_fac_{f_id}_d{day}_{s1['slot_number']}")
                        self.model.Add(consec_var >= z1 + z2 + z3 - 2)
                        self.penalties.append(consec_var * 80)

        # D. Faculty Slot Preferences
        for b in self.blocks:
            b_id = b["block_id"]
            fac_id = b["workload"]["faculty_id"]
            fac = self.faculty_map.get(fac_id)
            if fac and isinstance(fac.get("availability_preferences"), dict):
                unpref_slots = fac["availability_preferences"].get("preferred_not", [])
                unpref_set = set((slot[0], slot[1]) for slot in unpref_slots)
                
                for cg_idx, cg in enumerate(b["valid_groups"]):
                    unpref_count = sum(1 for s in cg if (s["day"], s["slot_number"]) in unpref_set)
                    if unpref_count > 0:
                        for r in b["allowed_rooms"]:
                            var = self.y[(b_id, cg_idx, r["id"])]
                            self.penalties.append(var * unpref_count * 30)

        # E. Cohort Gaps
        for c in self.cohorts:
            c_id = c["id"]
            for day in range(1, 6):
                slots_in_day = self.academic_slots_by_day[day]
                n_slots = len(slots_in_day)
                if n_slots <= 2:
                    continue
                
                W = {}
                for idx, s in enumerate(slots_in_day):
                    day = s["day"]
                    cohort_slot_vars = []
                    for b in self.blocks:
                        if b["workload"].get("cohort_id") == c_id:
                            cohort_slot_vars.append(self.X_slot[(b["block_id"], day, s["slot_id"])])
                    
                    W[idx] = self.model.NewBoolVar(f"W_{c_id}_d{day}_p{idx}")
                    self.model.Add(W[idx] == sum(cohort_slot_vars))


                # Gaps checking (from index 1 to n_slots - 2)
                for g in range(1, n_slots - 1):
                    has_before = self.model.NewBoolVar(f"before_{c_id}_d{day}_p{g}")
                    has_after = self.model.NewBoolVar(f"after_{c_id}_d{day}_p{g}")
                    is_gap = self.model.NewBoolVar(f"gap_{c_id}_d{day}_p{g}")
                    
                    # class before g
                    self.model.AddMaxEquality(has_before, [W[i] for i in range(g)])
                    # class after g
                    self.model.AddMaxEquality(has_after, [W[i] for i in range(g + 1, n_slots)])
                    
                    # is_gap if has_before AND has_after AND not W[g]
                    self.model.Add(is_gap >= has_before + has_after + (1 - W[g]) - 2)
                    self.penalties.append(is_gap * 25)

        # Minimize all penalties
        if self.penalties:
            self.model.Minimize(sum(self.penalties))

    def solve(self):
        """
        Run the CP-SAT solver and return the output status.
        """
        self.solver.parameters.max_time_in_seconds = 180.0
        status = self.solver.Solve(self.model)
        self.status = status
        return status

    def get_results(self):
        """
        Parse solver output and build schedule entries list to save to the database.
        Returns entries and warnings.
        """
        entries = []
        warnings = []
        
        # Check if we solved successfully
        status = self.solver.StatusName(self.status)
        if status not in ["OPTIMAL", "FEASIBLE"]:
            print(f"[ERROR] Solver failed with status: {status}")
            return None, ["Solver failed to find a feasible solution."]

        # Check for fallback warning diagnostics (MUST_HAVE smart class in non-smart room)
        def is_smart_room(room):
            name = room["name"].lower()
            return "301" in name or "smart" in name or "lab" in name

        for b in self.blocks:
            b_id = b["block_id"]
            req = b["workload"].get("smart_class_requirement", "NOT_REQUIRED")
            
            for cg_idx, cg in enumerate(b["valid_groups"]):
                for r in b["allowed_rooms"]:
                    r_id = r["id"]
                    if (b_id, cg_idx, r_id) in self.y and self.solver.Value(self.y[(b_id, cg_idx, r_id)]) == 1:
                        # Found assigned slot group and room!
                        # Add individual period entries
                        for k, s in enumerate(cg):
                            entries.append({
                                "cohort_id": b["workload"].get("cohort_id"),
                                "elective_subject_id": b["workload"].get("elective_subject_id"),
                                "faculty_id": b["workload"].get("faculty_id"),
                                "subject_id": b["workload"]["subject_id"],
                                "room_id": r_id,
                                "period_slot_id": s["slot_id"],
                                "day_of_week": s["day"],
                                "smart_class_requirement": req
                            })
                        
                        # Generate warning if MUST_HAVE was placed in non-smart
                        if req == "MUST_HAVE" and not is_smart_room(r):
                            fac_name = self.faculty_map.get(b["workload"]["faculty_id"], {}).get("name", "Unknown")
                            sub_name = b["subject"]["name"]
                            c_name = self.cohort_map.get(b["workload"].get("cohort_id"), {}).get("name", "Elective class")
                            warnings.append({
                                "type": "Smart_Class_Fallback",
                                "message": f"Class '{sub_name}' for '{c_name}' (Faculty: {fac_name}) requiring smart classroom was placed in standard room '{r['name']}' due to smart classroom shortage."
                            })

        return entries, warnings

    def generate(self):
        """
        Main runner: loads DB data, builds model, solves it, and writes results to DB.
        """
        print("Building CP-SAT schedule model...")
        self.build_model()
        
        print("Solving timetable constraints...")
        status = self.solve()
        print(f"Solver completed. Status: {self.solver.StatusName(status)} | Objective value: {self.solver.ObjectiveValue()}")
        
        entries, warnings = self.get_results()
        if entries is not None:
            # Commit to DB
            save_schedule_entries(entries)
            if warnings:
                print(f"[WARNINGS DETECTED] Completed with {len(warnings)} warnings:")
                for w in warnings:
                    print(f" - {w['message']}")
            else:
                print("Generated clash-free template routine successfully.")
            return True, entries, warnings
        else:
            print("[FAIL] Scheduling run failed.")

            return False, [], ["Solver failed to find a feasible solution."]


def solve_exam_seating(students_by_subject, rows, cols):
    """
    CP-SAT Solver to arrange student exam seating on a grid of size rows x cols.
    Prevents students taking the same exam from sitting next to each other (anti-contiguity).
    """
    # Flatten students list with their subjects
    all_students = []
    subjects_list = list(students_by_subject.keys())
    
    for sub, st_ids in students_by_subject.items():
        for st_id in st_ids:
            all_students.append({
                "student_id": st_id,
                "subject": sub,
                "subject_idx": subjects_list.index(sub)
            })
            
    num_students = len(all_students)
    num_seats = rows * cols
    
    if num_students > num_seats:
        raise ValueError(f"Not enough seats in room! Students: {num_students}, Seats: {num_seats}")

    model = cp_model.CpModel()
    
    # Variables: assigned[r, c, s] = 1 if student s is placed in seat (r, c)
    assigned = {}
    for r in range(rows):
        for c in range(cols):
            for s in range(num_students):
                assigned[(r, c, s)] = model.NewBoolVar(f"assigned_{r}_{c}_{s}")

    # Constraints:
    # 1. Each student is assigned to at most one seat
    for s in range(num_students):
        model.Add(sum(assigned[(r, c, s)] for r in range(rows) for c in range(cols)) == 1)

    # 2. Each seat hosts at most one student
    for r in range(rows):
        for c in range(cols):
            model.Add(sum(assigned[(r, c, s)] for s in range(num_students)) <= 1)

    # 3. Anti-Contiguity: Adjacent seats cannot host the same subject
    # Horizontal neighbors
    for r in range(rows):
        for c in range(cols - 1):
            for sub_idx, sub in enumerate(subjects_list):
                # Students taking this subject
                sub_students = [s_idx for s_idx, s in enumerate(all_students) if s["subject_idx"] == sub_idx]
                if sub_students:
                    # Sum of students of this subject in both seats must be <= 1
                    model.Add(sum(assigned[(r, c, s_idx)] for s_idx in sub_students) + 
                              sum(assigned[(r, c + 1, s_idx)] for s_idx in sub_students) <= 1)
                              
    # Vertical neighbors
    for r in range(rows - 1):
        for c in range(cols):
            for sub_idx, sub in enumerate(subjects_list):
                sub_students = [s_idx for s_idx, s in enumerate(all_students) if s["subject_idx"] == sub_idx]
                if sub_students:
                    model.Add(sum(assigned[(r, c, s_idx)] for s_idx in sub_students) + 
                              sum(assigned[(r + 1, c, s_idx)] for s_idx in sub_students) <= 1)

    # Objective: Maximize assignments (or arbitrary since we require all to be seated)
    # Since we require sum == 1 for all students, all students will be seated.
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.Solve(model)
    
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        # Construct grid
        seating_grid = [[None for _ in range(cols)] for _ in range(rows)]
        for r in range(rows):
            for c in range(cols):
                for s in range(num_students):
                    if solver.Value(assigned[(r, c, s)]) == 1:
                        seating_grid[r][c] = all_students[s]["student_id"]
                        break
        return seating_grid
    else:
        print("[ERROR] Failed to find feasible seating arrangement.")
        return None


if __name__ == "__main__":
    solver = ScheduleSolver()
    success, entries, warnings = solver.generate()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
