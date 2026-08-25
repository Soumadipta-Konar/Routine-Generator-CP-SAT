import unittest
import sys
import os

# Add current workspace directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from solver.engine import ScheduleSolver

class TestClashAvoidance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize solver and generate schedule
        cls.solver = ScheduleSolver()
        cls.success, cls.entries, cls.warnings = cls.solver.generate()

    def test_solve_success(self):
        self.assertTrue(self.success, "Solver failed to find a feasible solution.")
        self.assertIsNotNone(self.entries, "Entries should not be None.")
        self.assertGreater(len(self.entries), 0, "No schedule entries generated.")

    def test_room_clashes(self):
        # Group entries by (room_id, day, period)
        allocations = {}
        for entry in self.entries:
            key = (entry["room_id"], entry["day_of_week"], entry["period_slot_id"])
            if key not in allocations:
                allocations[key] = []
            allocations[key].append(entry)
            
        for key, entries in allocations.items():
            self.assertEqual(len(entries), 1, f"Room clash detected for room {key[0]} at day {key[1]}, slot {key[2]}: {entries}")

    def test_faculty_clashes(self):
        # Group entries by (faculty_id, day, period)
        allocations = {}
        for entry in self.entries:
            if entry["faculty_id"] is None:
                continue
            key = (entry["faculty_id"], entry["day_of_week"], entry["period_slot_id"])
            if key not in allocations:
                allocations[key] = []
            allocations[key].append(entry)
            
        for key, entries in allocations.items():
            self.assertEqual(len(entries), 1, f"Faculty clash detected for faculty {key[0]} at day {key[1]}, slot {key[2]}: {entries}")

    def test_cohort_clashes(self):
        # Group entries by (cohort_id, day, period) for core cohort-wide classes
        allocations = {}
        for entry in self.entries:
            if entry["cohort_id"] is None:
                continue
            key = (entry["cohort_id"], entry["day_of_week"], entry["period_slot_id"])
            if key not in allocations:
                allocations[key] = []
            allocations[key].append(entry)
            
        for key, entries in allocations.items():
            self.assertEqual(len(entries), 1, f"Cohort clash detected for cohort {key[0]} at day {key[1]}, slot {key[2]}: {entries}")

    def test_student_clashes(self):
        # For each student, check that they are not assigned to multiple subjects in the same slot
        students = self.solver.students
        elective_regs = self.solver.elective_regs
        
        for st in students:
            st_id = st["id"]
            st_cohort = st["cohort_id"]
            st_electives = [reg["subject_id"] for reg in elective_regs if reg["student_id"] == st_id]
            
            # Find all classes this student attends in this schedule
            student_slots = {}
            for entry in self.entries:
                is_cohort_class = (entry["cohort_id"] == st_cohort)
                is_elective_class = (entry["elective_subject_id"] is not None and entry["elective_subject_id"] in st_electives)
                
                if is_cohort_class or is_elective_class:
                    slot_key = (entry["day_of_week"], entry["period_slot_id"])
                    if slot_key not in student_slots:
                        student_slots[slot_key] = []
                    student_slots[slot_key].append(entry)
                    
            for slot, entries in student_slots.items():
                self.assertEqual(len(entries), 1, f"Student {st['name']} ({st_id}) has overlapping classes at day {slot[0]}, slot {slot[1]}: {entries}")

if __name__ == "__main__":
    unittest.main()
