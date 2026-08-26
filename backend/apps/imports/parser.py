import os
import re
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load database configuration from .env file
load_dotenv()

REQUIRED_SHEETS = ["Cohorts", "Faculty", "Rooms", "Subjects", "Curriculum_Workload"]

REQUIRED_COLUMNS = {
    "Cohorts": ["Cohort_ID", "Name", "Semester", "Size", "Department"],
    "Faculty": ["Faculty_ID", "Name", "Contact_Number", "Email", "Department", "Max_Weekly_Hours"],
    "Rooms": ["Room_ID", "Name", "Capacity", "Room_Type"],
    "Subjects": ["Subject_ID", "Code", "Name", "Subject_Type", "Is_Heavy_Cognitive", "Periods_Per_Week", "Department", "Required_Capabilities"],
    "Curriculum_Workload": ["Mapping_ID", "Cohort_ID", "Subject_ID", "Faculty_ID", "Weekly_Periods", "Smart_Class_Requirement"]
}

def validate_syntactic(xls):
    """
    Check if all required sheets and column headers are present.
    """
    errors = []
    
    # 1. Check sheet existence
    for sheet in REQUIRED_SHEETS:
        if sheet not in xls.sheet_names:
            errors.append({
                "sheet": "Workbook",
                "row": None,
                "column": None,
                "value": None,
                "error_type": "Missing_Sheet",
                "description": f"Workbook is missing the required sheet: '{sheet}'."
            })
            
    if errors:
        return False, errors

    # 2. Check column headers and empty sheets
    for sheet in REQUIRED_SHEETS:
        df = pd.read_excel(xls, sheet)
        present_cols = [str(c).strip() for c in df.columns]
        for req_col in REQUIRED_COLUMNS[sheet]:
            if req_col not in present_cols:
                errors.append({
                    "sheet": sheet,
                    "row": None,
                    "column": req_col,
                    "value": None,
                    "error_type": "Missing_Column",
                    "description": f"Sheet '{sheet}' is missing the required column header: '{req_col}'."
                })
        if len(df) == 0:
            errors.append({
                "sheet": sheet,
                "row": None,
                "column": None,
                "value": None,
                "error_type": "Empty_Sheet",
                "description": f"Sheet '{sheet}' has headers but 0 data rows. Please fill in your data before uploading."
            })
                
    return len(errors) == 0, errors



def validate_semantic_and_feasibility(xls):
    """
    Check referential integrity, data formatting, and load limits.
    """
    errors = []
    
    # Load all sheets as dataframes
    cohorts_df = pd.read_excel(xls, "Cohorts")
    faculty_df = pd.read_excel(xls, "Faculty")
    rooms_df = pd.read_excel(xls, "Rooms")
    subjects_df = pd.read_excel(xls, "Subjects")
    workload_df = pd.read_excel(xls, "Curriculum_Workload")

    # Clean dataframes
    for df in [cohorts_df, faculty_df, rooms_df, subjects_df, workload_df]:
        for col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.strip()

    # Registries of Unique IDs for referential checks
    cohort_ids = set(cohorts_df["Cohort_ID"].dropna().unique())
    faculty_ids = set(faculty_df["Faculty_ID"].dropna().unique())
    room_ids = set(rooms_df["Room_ID"].dropna().unique())
    subject_ids = set(subjects_df["Subject_ID"].dropna().unique())

    # --- 1. Data Type & Format Validations ---
    # Phone number regex validation (Basic check for digits and symbols)
    phone_pattern = re.compile(r"^\+?[\d\s\-]{10,15}$")
    email_pattern = re.compile(r"^[\w\.\-]+@[\w\.\-]+\.\w+$")
    
    for idx, row in faculty_df.iterrows():
        row_num = idx + 2 # Excel starts at 1, headers are row 1
        contact = str(row.get("Contact_Number", ""))
        email = str(row.get("Email", ""))
        
        if contact and not phone_pattern.match(contact):
            errors.append({
                "sheet": "Faculty", "row": row_num, "column": "Contact_Number", "value": contact,
                "error_type": "Format_Violation",
                "description": f"Faculty contact number '{contact}' has an invalid format. Must be 10-15 digits."
            })
        if email and not email_pattern.match(email):
            errors.append({
                "sheet": "Faculty", "row": row_num, "column": "Email", "value": email,
                "error_type": "Format_Violation",
                "description": f"Faculty email '{email}' has an invalid format."
            })

    # --- 2. Referential Integrity Check on Workload Sheet ---
    for idx, row in workload_df.iterrows():
        row_num = idx + 2
        c_id = row.get("Cohort_ID")
        f_id = row.get("Faculty_ID")
        s_id = row.get("Subject_ID")
        smart_req = row.get("Smart_Class_Requirement")
        
        if c_id not in cohort_ids:
            errors.append({
                "sheet": "Curriculum_Workload", "row": row_num, "column": "Cohort_ID", "value": c_id,
                "error_type": "Referential_Integrity_Failure",
                "description": f"Cohort_ID '{c_id}' does not exist in the 'Cohorts' sheet registry."
            })
        if f_id not in faculty_ids:
            errors.append({
                "sheet": "Curriculum_Workload", "row": row_num, "column": "Faculty_ID", "value": f_id,
                "error_type": "Referential_Integrity_Failure",
                "description": f"Faculty_ID '{f_id}' does not exist in the 'Faculty' sheet registry."
            })
        if s_id not in subject_ids:
            errors.append({
                "sheet": "Curriculum_Workload", "row": row_num, "column": "Subject_ID", "value": s_id,
                "error_type": "Referential_Integrity_Failure",
                "description": f"Subject_ID '{s_id}' does not exist in the 'Subjects' sheet registry."
            })
        if smart_req not in ["MUST_HAVE", "PREFERRED", "NOT_REQUIRED"]:
            errors.append({
                "sheet": "Curriculum_Workload", "row": row_num, "column": "Smart_Class_Requirement", "value": smart_req,
                "error_type": "Enum_Violation",
                "description": f"Smart_Class_Requirement '{smart_req}' is invalid. Allowed: MUST_HAVE, PREFERRED, NOT_REQUIRED."
            })

    # --- 3. Capacity & Resource Feasibility Checks ---
    max_room_capacity = rooms_df["Capacity"].max() if not rooms_df.empty else 0
    for idx, row in cohorts_df.iterrows():
        row_num = idx + 2
        size = row.get("Size", 0)
        name = row.get("Name", "")
        if size > max_room_capacity:
            errors.append({
                "sheet": "Cohorts", "row": row_num, "column": "Size", "value": int(size),
                "error_type": "Capacity_Feasibility_Failure",
                "description": f"Cohort '{name}' size ({int(size)}) exceeds the maximum capacity of any classroom in the 'Rooms' registry ({max_room_capacity})."
            })

    # --- 4. Subject Allocation Feasibility (Weekly Period Limits) ---
    # Max periods in a 5-day week with 8 slots is 40
    MAX_WEEKLY_PERIODS = 40
    cohort_workload = workload_df.groupby("Cohort_ID")["Weekly_Periods"].sum()
    for c_id, total_periods in cohort_workload.items():
        if total_periods > MAX_WEEKLY_PERIODS:
            errors.append({
                "sheet": "Curriculum_Workload", "row": None, "column": "Weekly_Periods", "value": int(total_periods),
                "error_type": "Feasibility_Violation",
                "description": f"Cohort '{c_id}' is scheduled for {total_periods} periods, which exceeds the absolute weekly limit of {MAX_WEEKLY_PERIODS} periods."
            })

    return len(errors) == 0, errors


def db_insert_sandbox(xls):
    """
    Connect to PostgreSQL and insert data within an atomic transaction.
    """
    conn = None
    try:
        # Connect using environment parameters
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            database=os.getenv("DB_NAME", "routine_generator"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "")
        )
        cursor = conn.cursor()
        
        # Read sheets
        cohorts = pd.read_excel(xls, "Cohorts").to_dict(orient="records")
        faculty = pd.read_excel(xls, "Faculty").to_dict(orient="records")
        rooms = pd.read_excel(xls, "Rooms").to_dict(orient="records")
        subjects = pd.read_excel(xls, "Subjects").to_dict(orient="records")
        workload = pd.read_excel(xls, "Curriculum_Workload").to_dict(orient="records")

        # 1. Load Departments dynamically from Faculty, Cohorts, and Subjects
        depts = set()
        for df in [cohorts, faculty, subjects]:
            for row in df:
                dept = row.get("Department")
                if dept:
                    depts.add(str(dept).strip())
        
        # Insert Departments & retrieve IDs
        dept_mapping = {}
        for dept in depts:
            cursor.execute("INSERT INTO department (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id;", (dept,))
            dept_mapping[dept] = cursor.fetchone()[0]

        # 2. Insert Cohorts
        cohort_mapping = {}
        for row in cohorts:
            cursor.execute(
                "INSERT INTO cohort (name, semester, size, department_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                (row["Name"], int(row["Semester"]), int(row["Size"]), dept_mapping[row["Department"]])
            )
            cohort_mapping[row["Cohort_ID"]] = cursor.fetchone()[0]

        # 3. Insert Faculty
        faculty_mapping = {}
        for row in faculty:
            cursor.execute(
                "INSERT INTO faculty (name, contact_number, max_weekly_hours, availability_preferences, department_id) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                (row["Name"], str(row["Contact_Number"]), int(row["Max_Weekly_Hours"]), '{}', dept_mapping[row["Department"]])
            )
            faculty_mapping[row["Faculty_ID"]] = cursor.fetchone()[0]

        # 4. Insert Subjects
        subject_mapping = {}
        for row in subjects:
            cursor.execute(
                "INSERT INTO subject (code, name, periods_per_week, is_heavy_cognitive, subject_type, department_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;",
                (row["Code"], row["Name"], int(row["Periods_Per_Week"]), bool(row["Is_Heavy_Cognitive"] == "Y" or row["Is_Heavy_Cognitive"] == True), row["Subject_Type"], dept_mapping[row["Department"]])
            )
            subject_mapping[row["Subject_ID"]] = cursor.fetchone()[0]

        # 5. Insert Rooms and Lab Details
        for row in rooms:
            cursor.execute(
                "INSERT INTO room (name, capacity, room_type) VALUES (%s, %s, %s) RETURNING id;",
                (row["Name"], int(row["Capacity"]), "Lecture_Hall" if row["Room_Type"] == "Lecture" else "Lab")
            )
            room_id = cursor.fetchone()[0]
            
            # If room type is Lab, insert default lab details
            if row["Room_Type"] == "Lab":
                cursor.execute(
                    "INSERT INTO lab_details (room_id, workstation_count, lab_category, software_installed, specialized_equipment) VALUES (%s, %s, %s, %s, %s);",
                    (room_id, int(row["Capacity"]), "General Lab", '[]', '[]')
                )

        # 6. Insert Curriculum Workload Entries
        for row in workload:
            c_id = cohort_mapping.get(row["Cohort_ID"])
            s_id = subject_mapping.get(row["Subject_ID"])
            f_id = faculty_mapping.get(row["Faculty_ID"])
            cursor.execute(
                "INSERT INTO curriculum_workload (cohort_id, elective_subject_id, subject_id, faculty_id, weekly_periods, smart_class_requirement) VALUES (%s, %s, %s, %s, %s, %s);",
                (c_id, None, s_id, f_id, int(row["Weekly_Periods"]), row["Smart_Class_Requirement"])
            )

        # 7. Insert Period Slots (Pre-create standard slots if not existing)
        cursor.execute("SELECT COUNT(*) FROM period_slot;")
        if cursor.fetchone()[0] == 0:
            default_slots = [
                (1, "Period 1", "09:00:00", "09:50:00", False),
                (2, "Period 2", "09:50:00", "10:40:00", False),
                (3, "Period 3", "10:40:00", "11:30:00", False),
                (4, "Period 4", "11:30:00", "12:20:00", False),
                (5, "Recess Break", "12:20:00", "13:10:00", True),
                (6, "Period 5", "13:10:00", "14:00:00", False),
                (7, "Period 6", "14:00:00", "14:50:00", False),
                (8, "Period 7", "14:50:00", "15:40:00", False),
                (9, "Period 8", "15:40:00", "16:30:00", False)
            ]
            execute_values(cursor, "INSERT INTO period_slot (slot_number, name, start_time, end_time, is_break) VALUES %s", default_slots)

        # Commit Transaction
        conn.commit()
        print("[SUCCESS] Data sandbox created. Database transactions committed successfully.")
        return True, []
        
    except Exception as e:
        if conn:
            conn.rollback()
            print(f"[ROLLBACK] Database transaction rolled back due to error: {e}")
        return False, [{"sheet": "Database", "row": None, "column": None, "value": None, "error_type": "Transaction_Aborted", "description": str(e)}]
    finally:
        if conn:
            cursor.close()
            conn.close()


def run_ingestion_pipeline(file_path):
    """
    Main pipeline entry point.
    """
    if not os.path.exists(file_path):
        print(f"Error: Target workbook path '{file_path}' does not exist.")
        return False, [{"sheet": "File", "row": None, "column": None, "value": None, "error_type": "File_Not_Found", "description": f"File not found: {file_path}"}]
        
    print(f"Processing Excel Ingestion: {file_path}")
    
    # Open excel workbook with context manager to release file handle immediately
    try:
        with pd.ExcelFile(file_path) as xls:
            # 1. Syntactic Validation
            print("Running Syntactic Checks...")
            success, errors = validate_syntactic(xls)
            if not success:
                print("[FAIL] Syntactic checks failed.")
                return False, errors
                
            # 2. Semantic & Feasibility Validation
            print("Running Semantic & Load Feasibility Checks...")
            success, errors = validate_semantic_and_feasibility(xls)
            if not success:
                print("[FAIL] Semantic and feasibility checks failed.")
                return False, errors

            # 3. Database transaction write sandbox
            print("Writing records to PostgreSQL...")
            success, errors = db_insert_sandbox(xls)
            return success, errors
    except Exception as e:
        print(f"Failed to open/process Excel file: {e}")
        return False, [{"sheet": "File", "row": None, "column": None, "value": None, "error_type": "Read_Error", "description": f"Failed to read workbook: {str(e)}"}]



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parser.py <path_to_master_workbook.xlsx>")
        sys.exit(1)
        
    target_file = sys.argv[1]
    success, errors = run_ingestion_pipeline(target_file)
    
    if success:
        print("\nAll Ingestion checks passed. Database synchronized successfully.")
        sys.exit(0)
    else:
        print("\nIngestion failed. Error log:")
        for err in errors:
            print(f"[{err['error_type']}] Sheet: {err['sheet']} | Row: {err['row']} | Col: {err['column']} | Details: {err['description']}")
        sys.exit(1)
