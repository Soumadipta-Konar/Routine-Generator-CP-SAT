import os
import psycopg2

def init_db():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("No DATABASE_URL found. Skipping schema initialization.")
        return

    # Enforce SSL for Render
    if "render.com" in db_url and "sslmode" not in db_url:
        db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"

    print("Connecting to database to initialize schema...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()

        schema_path = os.path.join("docs", "schema.sql")
        if not os.path.exists(schema_path):
            print(f"Error: Schema file not found at {schema_path}")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        # Execute the schema script
        print("Executing schema.sql on the database...")
        # Note: We won't drop tables here if they exist, but schema.sql starts with DROP TABLE IF EXISTS...
        # Wait, if we drop tables on every build, we lose all data on every deployment!
        # Let's remove the DROP TABLE statements from the execution or just let it drop since they said "a new database has been created ig".
        # Actually, let's just run it if period_slot doesn't exist to prevent data loss on future deployments.
        
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'period_slot');")
        exists = cursor.fetchone()[0]
        
        if not exists:
            print("Tables do not exist. Running schema.sql...")
            cursor.execute(sql_script)
            print("Schema initialized successfully.")
        else:
            print("Tables already exist. Skipping schema initialization to preserve data.")
            
    except Exception as e:
        print(f"Failed to initialize database: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    init_db()
