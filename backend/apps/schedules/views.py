import time
import psycopg2
from psycopg2.extras import RealDictCursor
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from solver.mapping import fetch_scheduling_data, save_schedule_entries, get_db_connection
from solver.engine import ScheduleSolver
from .serializers import (
    ScheduleEntrySerializer,
    ManualOverrideSerializer,
    SolverTriggerResponseSerializer
)


class SolverTriggerView(APIView):
    """
    POST /api/v1/schedules/solver/generate/
    Fetches PostgreSQL data, runs CP-SAT solver, saves output back to DB.
    """
    def post(self, request):
        start_time = time.time()
        try:
            data = fetch_scheduling_data()
            solver = ScheduleSolver(data)
            solver.build_model()
            solver_status = solver.solve(time_limit_seconds=120.0)
            
            saved_count = 0
            if solver_status in ["OPTIMAL", "FEASIBLE"]:
                saved_count = save_schedule_entries(solver)
            
            duration = round(time.time() - start_time, 2)
            
            return Response({
                "status": solver_status,
                "objective_value": float(solver.solver.ObjectiveValue()),
                "total_entries_created": saved_count,
                "solve_duration_seconds": duration,
                "message": f"Routine generation finished with status '{solver_status}' in {duration}s."
            }, status=status.HTTP_200_OK if solver_status in ["OPTIMAL", "FEASIBLE"] else status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CohortRoutineView(APIView):
    """
    GET /api/v1/schedules/cohort/<cohort_id>/
    Returns weekly schedule matrix for a specific cohort.
    """
    def get(self, request, cohort_id):
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                se.id, se.day_of_week, se.period_slot_id, se.room_id, se.subject_id, se.faculty_id,
                se.cohort_id, se.elective_subject_id,
                sub.code as subject_code, sub.name as subject_name,
                fac.name as faculty_name,
                r.name as room_name
            FROM schedule_entry se
            JOIN subject sub ON se.subject_id = sub.id
            JOIN faculty fac ON se.faculty_id = fac.id
            JOIN room r ON se.room_id = r.id
            WHERE se.is_active = TRUE 
              AND (se.cohort_id = %s OR se.elective_subject_id IN (
                  SELECT subject_id FROM elective_registration WHERE student_id IN (
                      SELECT id FROM student WHERE cohort_id = %s
                  )
              ))
            ORDER BY se.day_of_week, se.period_slot_id;
        """
        cur.execute(query, (cohort_id, cohort_id))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        # Build 2D Matrix (Days 1..5, Slots 1..9)
        matrix = {day: {slot: None for slot in range(1, 10)} for day in range(1, 6)}
        for row in rows:
            day = row['day_of_week']
            slot = row['period_slot_id']
            if day in matrix and slot in matrix[day]:
                matrix[day][slot] = dict(row)

        return Response({
            "cohort_id": cohort_id,
            "weekly_grid": matrix
        }, status=status.HTTP_200_OK)

class FacultyRoutineView(APIView):
    """
    GET /api/v1/schedules/faculty/<faculty_id>/
    Returns weekly schedule matrix for a specific faculty member.
    """
    def get(self, request, faculty_id):
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                se.id, se.day_of_week, se.period_slot_id, se.room_id, se.subject_id, se.faculty_id,
                se.cohort_id,
                sub.code as subject_code, sub.name as subject_name,
                c.name as cohort_name,
                r.name as room_name
            FROM schedule_entry se
            JOIN subject sub ON se.subject_id = sub.id
            LEFT JOIN cohort c ON se.cohort_id = c.id
            JOIN room r ON se.room_id = r.id
            WHERE se.is_active = TRUE AND se.faculty_id = %s
            ORDER BY se.day_of_week, se.period_slot_id;
        """
        cur.execute(query, (faculty_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        matrix = {day: {slot: None for slot in range(1, 10)} for day in range(1, 6)}
        for row in rows:
            day = row['day_of_week']
            slot = row['period_slot_id']
            if day in matrix and slot in matrix[day]:
                matrix[day][slot] = dict(row)

        return Response({
            "faculty_id": faculty_id,
            "weekly_grid": matrix
        }, status=status.HTTP_200_OK)

class RoomRoutineView(APIView):
    """
    GET /api/v1/schedules/room/<room_id>/
    Returns room utilization matrix.
    """
    def get(self, request, room_id):
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                se.id, se.day_of_week, se.period_slot_id, se.room_id, se.subject_id, se.faculty_id,
                sub.code as subject_code, sub.name as subject_name,
                fac.name as faculty_name,
                c.name as cohort_name
            FROM schedule_entry se
            JOIN subject sub ON se.subject_id = sub.id
            JOIN faculty fac ON se.faculty_id = fac.id
            LEFT JOIN cohort c ON se.cohort_id = c.id
            WHERE se.is_active = TRUE AND se.room_id = %s
            ORDER BY se.day_of_week, se.period_slot_id;
        """
        cur.execute(query, (room_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        matrix = {day: {slot: None for slot in range(1, 10)} for day in range(1, 6)}
        for row in rows:
            day = row['day_of_week']
            slot = row['period_slot_id']
            if day in matrix and slot in matrix[day]:
                matrix[day][slot] = dict(row)

        return Response({
            "room_id": room_id,
            "weekly_grid": matrix
        }, status=status.HTTP_200_OK)

class ManualOverrideView(APIView):
    """
    POST /api/v1/schedules/override/
    Performs real-time conflict checking before updating a schedule entry.
    """
    def post(self, request):
        serializer = ManualOverrideSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        entry_id = data['schedule_entry_id']
        target_day = data['target_day']
        target_slot = data['target_period_slot_id']
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch current entry details
        cur.execute("SELECT * FROM schedule_entry WHERE id = %s;", (entry_id,))
        entry = cur.fetchone()
        if not entry:
            cur.close()
            conn.close()
            return Response({"error": f"Schedule entry #{entry_id} not found."}, status=status.HTTP_404_NOT_FOUND)
        
        target_room_id = data.get('target_room_id') or entry['room_id']
        faculty_id = entry['faculty_id']
        cohort_id = entry['cohort_id']
        
        # 2. Check Room Clash
        cur.execute("""
            SELECT id FROM schedule_entry 
            WHERE is_active = TRUE AND room_id = %s AND day_of_week = %s AND period_slot_id = %s AND id != %s;
        """, (target_room_id, target_day, target_slot, entry_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            return Response({
                "error": "ROOM_CLASH",
                "message": f"Room #{target_room_id} is already occupied on Day {target_day}, Period {target_slot}."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 3. Check Faculty Clash
        cur.execute("""
            SELECT id FROM schedule_entry 
            WHERE is_active = TRUE AND faculty_id = %s AND day_of_week = %s AND period_slot_id = %s AND id != %s;
        """, (faculty_id, target_day, target_slot, entry_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            return Response({
                "error": "FACULTY_CLASH",
                "message": f"Faculty #{faculty_id} is already teaching another class on Day {target_day}, Period {target_slot}."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 4. Check Cohort Clash (if applicable)
        if cohort_id:
            cur.execute("""
                SELECT id FROM schedule_entry 
                WHERE is_active = TRUE AND cohort_id = %s AND day_of_week = %s AND period_slot_id = %s AND id != %s;
            """, (cohort_id, target_day, target_slot, entry_id))
            if cur.fetchone():
                cur.close()
                conn.close()
                return Response({
                    "error": "COHORT_CLASH",
                    "message": f"Cohort #{cohort_id} already has a scheduled class on Day {target_day}, Period {target_slot}."
                }, status=status.HTTP_400_BAD_REQUEST)
                
        # 5. Apply update safely
        cur.execute("""
            UPDATE schedule_entry 
            SET day_of_week = %s, period_slot_id = %s, room_id = %s
            WHERE id = %s;
        """, (target_day, target_slot, target_room_id, entry_id))
        conn.commit()
        cur.close()
        conn.close()
        
        return Response({
            "success": True,
            "message": f"Schedule entry #{entry_id} successfully moved to Day {target_day}, Period {target_slot}."
        }, status=status.HTTP_200_OK)
