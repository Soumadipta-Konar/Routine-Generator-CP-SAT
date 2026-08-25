import unittest
import sys
import os

# Add current workspace directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from solver.engine import solve_exam_seating

class TestExamSeating(unittest.TestCase):
    def test_exam_seating_anti_contiguity(self):
        # Mock students by subject
        students_by_subject = {
            "SUB_MATH": ["Student1", "Student2", "Student3", "Student4"],
            "SUB_PHYS": ["Student5", "Student6", "Student7"],
            "SUB_CHEM": ["Student8", "Student9"]
        }
        
        rows = 4
        cols = 4
        
        # Solve seating arrangement
        grid = solve_exam_seating(students_by_subject, rows, cols)
        
        self.assertIsNotNone(grid, "Seating solver failed to find a layout.")
        
        # Build student-to-subject map for quick lookup
        student_sub = {}
        for sub, students in students_by_subject.items():
            for s in students:
                student_sub[s] = sub

        # Print grid for visual check
        print("\nGenerated Seating Grid:")
        for r in range(rows):
            row_vals = []
            for c in range(cols):
                val = grid[r][c]
                sub = student_sub.get(val, "Empty") if val else "Empty"
                row_vals.append(f"{val} ({sub})")
            print(" | ".join(row_vals))

        # Assert no horizontal neighbors share the same subject
        for r in range(rows):
            for c in range(cols - 1):
                s1 = grid[r][c]
                s2 = grid[r][c+1]
                if s1 and s2:
                    self.assertNotEqual(student_sub[s1], student_sub[s2], 
                                        f"Horizontal neighbors {s1} and {s2} share same subject at row {r}, cols {c}-{c+1}")

        # Assert no vertical neighbors share the same subject
        for r in range(rows - 1):
            for c in range(cols):
                s1 = grid[r][c]
                s2 = grid[r+1][c]
                if s1 and s2:
                    self.assertNotEqual(student_sub[s1], student_sub[s2], 
                                        f"Vertical neighbors {s1} and {s2} share same subject at rows {r}-{r+1}, col {c}")

if __name__ == "__main__":
    unittest.main()
