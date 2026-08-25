import unittest
import sys
import os

# Add current workspace directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from solver.engine import ScheduleSolver

class TestLabContiguity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.solver = ScheduleSolver()
        cls.success, cls.entries, cls.warnings = cls.solver.generate()

    def test_lab_contiguity_and_breaks(self):
        self.assertTrue(self.success, "Solver failed to find a feasible solution.")
        
        # Get all break slots
        break_slots = {s["slot_number"] for s in self.solver.slots if s["is_break"]}
        
        # Group entries by workload/block on a given day
        # In our solver, each block maps to a workload mapping
        # Group by (subject_id, cohort_id, day_of_week) or (subject_id, elective_subject_id, day_of_week)
        day_workloads = {}
        for entry in self.entries:
            sub = self.solver.subject_map.get(entry["subject_id"])
            if not sub or sub["subject_type"] != "Lab":
                continue
                
            key = (entry["subject_id"], entry["cohort_id"], entry["elective_subject_id"], entry["day_of_week"])
            if key not in day_workloads:
                day_workloads[key] = []
            day_workloads[key].append(entry)

        # Verify contiguity and breaks for each scheduled day-workload of labs
        for key, entries in day_workloads.items():
            # Get slot numbers of these periods
            # Map period_slot_id back to slot_number
            slot_ids = [e["period_slot_id"] for e in entries]
            slots = [s for s in self.solver.slots if s["id"] in slot_ids]
            slot_numbers = sorted([s["slot_number"] for s in slots])

            # Check that there is at least one period
            self.assertGreater(len(slot_numbers), 0)

            # Check contiguity: slot numbers must be consecutive
            for i in range(len(slot_numbers) - 1):
                diff = slot_numbers[i+1] - slot_numbers[i]
                self.assertEqual(diff, 1, f"Lab workload {key[0]} is not contiguous on day {key[3]}: slot numbers are {slot_numbers}")

            # Check room consistency: all periods of this lab block must be in the same room
            rooms = {e["room_id"] for e in entries}
            self.assertEqual(len(rooms), 1, f"Lab workload {key[0]} is split across multiple rooms on day {key[3]}: {rooms}")

            # Check that no slot number is a break slot
            for num in slot_numbers:
                self.assertNotIn(num, break_slots, f"Lab workload {key[0]} overlaps with a break slot ({num}) on day {key[3]}")

if __name__ == "__main__":
    unittest.main()
