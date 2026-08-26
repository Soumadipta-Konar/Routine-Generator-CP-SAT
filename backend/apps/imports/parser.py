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



def normalize_smart_req(val):
    s = str(val).strip().upper() if pd.notna(val) else ""
    if s in ["TRUE", "1", "YES", "Y", "MUST_HAVE", "MUST"]:
        return "MUST_HAVE"
    elif s in ["PREFERRED", "PREF"]:
        return "PREFERRED"
    return "NOT_REQUIRED"

def normalize_bool(val):
    if isinstance(val, bool):
        return val
    s = str(val).strip().upper() if pd.notna(val) else ""
    return s in ["TRUE", "1", "YES", "Y"]

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

    # Registries of Unique IDs (as clean integers)
    cohort_ids = set(pd.to_numeric(cohorts_df["Cohort_ID"], errors='coerce').dropna().astype(int))
    faculty_ids = set(pd.to_numeric(faculty_df["Faculty_ID"], errors='coerce').dropna().astype(int))
    room_ids = set(pd.to_numeric(rooms_df["Room_ID"], errors='coerce').dropna().astype(int))
    subject_ids = set(pd.to_numeric(subjects_df["Subject_ID"], errors='coerce').dropna().astype(int))

    # --- 1. Data Type & Format Validations ---
    phone_pattern = re.compile(r"^\+?[\d\s\-]{8,18}$")
    email_pattern = re.compile(r"^[\w\.\-]+@[\w\.\-]+\.\w+$")
    
    for idx, row in faculty_df.iterrows():
        row_num = idx + 2
        contact = str(row.get("Contact_Number", "")).strip()
        email = str(row.get("Email", "")).strip()
        
        if contact and not phone_pattern.match(contact):
            errors.append({
                "sheet": "Faculty", "row": row_num, "column": "Contact_Number", "value": contact,
                "error_type": "Format_Violation",
                "description": f"Faculty contact number '{contact}' has an invalid format."
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
        
        # Cohort_ID is optional for NEP open electives
        if pd.notna(c_id) and str(c_id).strip() not in ["", "nan", "None"]:
            try:
                c_int = int(float(c_id))
                if c_int not in cohort_ids:
                    errors.append({
                        "sheet": "Curriculum_Workload", "row": row_num, "column": "Cohort_ID", "value": c_id,
                        "error_type": "Referential_Integrity_Failure",
                        "description": f"Cohort_ID '{c_id}' does not exist in the 'Cohorts' sheet registry."
                    })
            except (ValueError, TypeError):
                errors.append({
                    "sheet": "Curriculum_Workload", "row": row_num, "column": "Cohort_ID", "value": c_id,
                    "error_type": "Type_Violation",
                    "description": f"Cohort_ID '{c_id}' must be an integer."
                })

        if pd.notna(f_id):
            try:
                f_int = int(float(f_id))
                if f_int not in faculty_ids:
                    errors.append({
                        "sheet": "Curriculum_Workload", "row": row_num, "column": "Faculty_ID", "value": f_id,
                        "error_type": "Referential_Integrity_Failure",
                        "description": f"Faculty_ID '{f_id}' does not exist in the 'Faculty' sheet registry."
                    })
            except (ValueError, TypeError):
                errors.append({
                    "sheet": "Curriculum_Workload", "row": row_num, "column": "Faculty_ID", "value": f_id,
                    "error_type": "Type_Violation",
                    "description": f"Faculty_ID '{f_id}' must be an integer."
                })

        if pd.notna(s_id):
            try:
                s_int = int(float(s_id))
                if s_int not in subject_ids:
                    errors.append({
                        "sheet": "Curriculum_Workload", "row": row_num, "column": "Subject_ID", "value": s_id,
                        "error_type": "Referential_Integrity_Failure",
                        "description": f"Subject_ID '{s_id}' does not exist in the 'Subjects' sheet registry."
                    })
            except (ValueError, TypeError):
                errors.append({
                    "sheet": "Curriculum_Workload", "row": row_num, "column": "Subject_ID", "value": s_id,
                    "error_type": "Type_Violation",
                    "description": f"Subject_ID '{s_id}' must be an integer."
                })

    # --- 3. Capacity & Resource Feasibility Checks ---
    max_room_capacity = pd.to_numeric(rooms_df["Capacity"], errors='coerce').max() if not rooms_df.empty else 0
    for idx, row in cohorts_df.iterrows():
        row_num = idx + 2
        size = pd.to_numeric(row.get("Size"), errors='coerce') or 0
        name = row.get("Name", "")
        if size > max_room_capacity:
            errors.append({
                "sheet": "Cohorts", "row": row_num, "column": "Size", "value": int(size),
                "error_type": "Capacity_Feasibility_Failure",
                "description": f"Cohort '{name}' size ({int(size)}) exceeds max room capacity ({max_room_capacity})."
            })

    return len(errors) == 0, errors


def db_insert_sandbox(xls):
    """
    Connect to PostgreSQL and insert data within an atomic transaction.
    """
    conn = None
    try:
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            conn = psycopg2.connect(db_url, sslmode='require')
        else:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=os.getenv("DB_PORT", "5432"),
                database=os.getenv("DB_NAME", "routine_generator"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "Somu1@POSTGRESQL")
            )
        cursor = conn.cursor()
        
        # Read sheets
        cohorts = pd.read_excel(xls, "Cohorts").to_dict(orient="records")
        faculty = pd.read_excel(xls, "Faculty").to_dict(orient="records")
        rooms = pd.read_excel(xls, "Rooms").to_dict(orient="records")
        subjects = pd.read_excel(xls, "Subjects").to_dict(orient="records")
        workload = pd.read_excel(xls, "Curriculum_Workload").to_dict(orient="records")

        # 0. Atomic Reset of existing records with sequence restart to keep IDs consistent
        cursor.execute("TRUNCATE TABLE schedule_entry, elective_registration, curriculum_workload, student, lab_details, room, subject, faculty, cohort, department RESTART IDENTITY CASCADE;")

        # 1. Load Departments dynamically
        depts = set()
        for sheet_rows in [cohorts, faculty, subjects]:
            for row in sheet_rows:
                dept = row.get("Department")
                if dept and pd.notna(dept):
                    depts.add(str(dept).strip())
        
        dept_mapping = {}
        for dept in depts:
            cursor.execute("INSERT INTO department (name) VALUES (%s) RETURNING id;", (dept,))
            dept_mapping[dept] = cursor.fetchone()[0]

        # Fallback default department if none specified
        if not dept_mapping:
            cursor.execute("INSERT INTO department (name) VALUES ('General') RETURNING id;")
            dept_mapping['General'] = cursor.fetchone()[0]
        default_dept_id = list(dept_mapping.values())[0]

        # 2. Insert Cohorts with exact Excel Cohort_ID
        cohort_mapping = {}
        for row in cohorts:
            dept_id = dept_mapping.get(str(row.get("Department", "")).strip(), default_dept_id)
            c_id = int(row["Cohort_ID"])
            cursor.execute(
                "INSERT INTO cohort (id, name, semester, size, department_id) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, semester=EXCLUDED.semester, size=EXCLUDED.size, department_id=EXCLUDED.department_id RETURNING id;",
                (c_id, str(row["Name"]), int(row["Semester"]), int(row["Size"]), dept_id)
            )
            cohort_mapping[c_id] = cursor.fetchone()[0]

        # 3. Insert Faculty with exact Excel Faculty_ID
        faculty_mapping = {}
        for row in faculty:
            dept_id = dept_mapping.get(str(row.get("Department", "")).strip(), default_dept_id)
            f_id = int(row["Faculty_ID"])
            cursor.execute(
                "INSERT INTO faculty (id, name, contact_number, max_weekly_hours, availability_preferences, department_id) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, contact_number=EXCLUDED.contact_number, max_weekly_hours=EXCLUDED.max_weekly_hours, department_id=EXCLUDED.department_id RETURNING id;",
                (f_id, str(row["Name"]), str(row["Contact_Number"]), int(row["Max_Weekly_Hours"]), '{}', dept_id)
            )
            faculty_mapping[f_id] = cursor.fetchone()[0]

        # 4. Insert Subjects with exact Excel Subject_ID
        subject_mapping = {}
        for row in subjects:
            dept_id = dept_mapping.get(str(row.get("Department", "")).strip(), default_dept_id)
            is_heavy = normalize_bool(row.get("Is_Heavy_Cognitive"))
            subj_type = "Lab" if "LAB" in str(row.get("Subject_Type", "")).upper() else "Lecture"
            s_id = int(row["Subject_ID"])
            cursor.execute(
                "INSERT INTO subject (id, code, name, periods_per_week, is_heavy_cognitive, subject_type, department_id) VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, periods_per_week=EXCLUDED.periods_per_week, is_heavy_cognitive=EXCLUDED.is_heavy_cognitive, subject_type=EXCLUDED.subject_type, department_id=EXCLUDED.department_id RETURNING id;",
                (s_id, str(row["Code"]), str(row["Name"]), int(row["Periods_Per_Week"]), is_heavy, subj_type, dept_id)
            )
            subject_mapping[s_id] = cursor.fetchone()[0]

        # 5. Insert Rooms with exact Excel Room_ID
        for row in rooms:
            room_type = "Lecture_Hall" if "LECTURE" in str(row.get("Room_Type", "")).upper() else "Lab"
            r_id = int(row["Room_ID"])
            cursor.execute(
                "INSERT INTO room (id, name, capacity, room_type) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, capacity=EXCLUDED.capacity, room_type=EXCLUDED.room_type RETURNING id;",
                (r_id, str(row["Name"]), int(row["Capacity"]), room_type)
            )
            room_id = cursor.fetchone()[0]
            
            if room_type == "Lab":
                cursor.execute(
                    "INSERT INTO lab_details (room_id, workstation_count, lab_category, software_installed, specialized_equipment) VALUES (%s, %s, %s, %s, %s);",
                    (room_id, int(row["Capacity"]), "General Lab", '[]', '[]')
                )

        # 6. Insert Curriculum Workload Entries
        for row in workload:
            raw_c_id = row.get("Cohort_ID")
            raw_s_id = row.get("Subject_ID")
            raw_f_id = row.get("Faculty_ID")
            
            c_db_id = cohort_mapping.get(int(raw_c_id)) if pd.notna(raw_c_id) and str(raw_c_id).strip() not in ["", "nan", "None"] else None
            s_db_id = subject_mapping.get(int(raw_s_id))
            f_db_id = faculty_mapping.get(int(raw_f_id)) if pd.notna(raw_f_id) else None
            smart_req = normalize_smart_req(row.get("Smart_Class_Requirement"))
            weekly_periods = int(row.get("Weekly_Periods", 4))

            if c_db_id is not None:
                # Cohort-specific course
                cursor.execute(
                    "INSERT INTO curriculum_workload (cohort_id, elective_subject_id, subject_id, faculty_id, weekly_periods, smart_class_requirement) VALUES (%s, NULL, %s, %s, %s, %s);",
                    (c_db_id, s_db_id, f_db_id, weekly_periods, smart_req)
                )
            else:
                # NEP Open Elective
                cursor.execute(
                    "INSERT INTO curriculum_workload (cohort_id, elective_subject_id, subject_id, faculty_id, weekly_periods, smart_class_requirement) VALUES (NULL, %s, %s, %s, %s, %s);",
                    (s_db_id, s_db_id, f_db_id, weekly_periods, smart_req)
                )

        # 7. Insert Period Slots if empty
        cursor.execute("SELECT COUNT(*) FROM period_slot;")
        if cursor.fetchone()[0] == 0:
            default_slots = [
                (1, "Period 1", "09:00:00", "09:55:00", False),
                (2, "Period 2", "09:55:00", "10:50:00", False),
                (3, "Period 3", "10:50:00", "11:45:00", False),
                (4, "Period 4", "11:45:00", "12:40:00", False),
                (5, "Recess Break", "12:40:00", "13:50:00", True),
                (6, "Period 5", "13:50:00", "14:45:00", False),
                (7, "Period 6", "14:45:00", "15:40:00", False),
                (8, "Period 7", "15:40:00", "16:35:00", False),
                (9, "Period 8", "16:35:00", "17:30:00", False)
            ]
            execute_values(cursor, "INSERT INTO period_slot (slot_number, name, start_time, end_time, is_break) VALUES %s", default_slots)

        # Commit Transaction
        conn.commit()
        print("[SUCCESS] Master workbook successfully parsed and database synchronized.")
        return True, []
        
    except Exception as e:
        if conn:
            conn.rollback()
            print(f"[ROLLBACK] Ingestion rolled back due to: {e}")
        return False, [{"sheet": "Database", "row": None, "column": None, "value": None, "error_type": "Transaction_Aborted", "description": str(e)}]


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
