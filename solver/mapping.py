import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """
    Establish a connection to the PostgreSQL database.
    Supports either DATABASE_URL or individual DB_* variables.
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        if "sslmode=" not in db_url:
            db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"
        return psycopg2.connect(db_url)
    
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    dbname = os.getenv("DB_NAME", "routine_generator")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "Somu1@POSTGRESQL")
    try:
        return psycopg2.connect(
            host=host, port=port, database=dbname, user=user, password=password
        )
    except Exception as conn_err:
        raise ConnectionError(
            f"Could not connect to PostgreSQL database. DATABASE_URL environment variable is not set, and connection to '{host}:{port}' failed: {conn_err}"
        )
=======
        return psycopg2.connect(db_url, sslmode='require')
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "routine_generator"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "Somu1@POSTGRESQL")
    )
>>>>>>> 148c296 (Fix: Add automatic DB schema initialization for Render and SSL mode for solver)

def fetch_scheduling_data():
    """
    Fetch all relevant tables from the database and map them to dictionaries.
    """
    conn = get_db_connection()
    try:
        # Use RealDictCursor to easily access columns by name
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # 1. Fetch period slots
            cursor.execute("SELECT id, slot_number, name, start_time, end_time, is_break FROM period_slot ORDER BY slot_number;")
            slots = [dict(row) for row in cursor.fetchall()]

            # 2. Fetch rooms and join with lab_details if applicable
            cursor.execute("""
                SELECT r.id, r.name, r.capacity, r.room_type, 
                       l.workstation_count, l.lab_category, l.software_installed, l.specialized_equipment
                FROM room r
                LEFT JOIN lab_details l ON r.id = l.room_id;
            """)
            rooms = [dict(row) for row in cursor.fetchall()]

            # 3. Fetch faculty
            cursor.execute("SELECT id, name, max_weekly_hours, availability_preferences, department_id FROM faculty;")
            faculty = [dict(row) for row in cursor.fetchall()]

            # 4. Fetch subjects
            cursor.execute("SELECT id, code, name, periods_per_week, is_heavy_cognitive, subject_type, department_id FROM subject;")
            subjects = [dict(row) for row in cursor.fetchall()]

            # 5. Fetch cohorts
            cursor.execute("SELECT id, name, semester, size, department_id FROM cohort;")
            cohorts = [dict(row) for row in cursor.fetchall()]

            # 6. Fetch students
            cursor.execute("SELECT id, student_roll, name, cohort_id FROM student;")
            students = [dict(row) for row in cursor.fetchall()]

            # 7. Fetch elective registrations
            cursor.execute("SELECT id, student_id, subject_id FROM elective_registration;")
            elective_regs = [dict(row) for row in cursor.fetchall()]

            # 8. Fetch curriculum workload
            cursor.execute("""
                SELECT id, cohort_id, elective_subject_id, subject_id, faculty_id, weekly_periods, smart_class_requirement 
                FROM curriculum_workload;
            """)
            workloads = [dict(row) for row in cursor.fetchall()]

        return {
            "slots": slots,
            "rooms": rooms,
            "faculty": faculty,
            "subjects": subjects,
            "cohorts": cohorts,
            "students": students,
            "elective_regs": elective_regs,
            "workloads": workloads
        }
    finally:
        conn.close()

def save_schedule_entries(entries):
    """
    Save the list of generated schedule entries to the database inside a transaction.
    Clears any existing regular schedules before inserting new ones.
    """
    conn = get_db_connection()
    try:
        conn.autocommit = False
        with conn.cursor() as cursor:
            # Clear existing regular weekly schedules
            cursor.execute("""
                DELETE FROM schedule_entry 
                WHERE entry_type = 'Regular' AND schedule_date IS NULL;
            """)

            # Insert new schedules
            insert_query = """
                INSERT INTO schedule_entry (
                    cohort_id, elective_subject_id, faculty_id, subject_id, 
                    room_id, period_slot_id, day_of_week, entry_type, 
                    schedule_date, smart_class_requirement, is_active
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'Regular', NULL, %s, TRUE);
            """

            for entry in entries:
                cursor.execute(insert_query, (
                    entry.get("cohort_id"),
                    entry.get("elective_subject_id"),
                    entry.get("faculty_id"),
                    entry.get("subject_id"),
                    entry.get("room_id"),
                    entry.get("period_slot_id"),
                    entry.get("day_of_week"),
                    entry.get("smart_class_requirement", "NOT_REQUIRED")
                ))

            conn.commit()
            print(f"[SUCCESS] Saved {len(entries)} schedule entries to database.")
            return True
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to save schedule entries: {e}")
        raise e
    finally:
        conn.close()
