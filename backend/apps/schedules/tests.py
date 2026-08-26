import json
import psycopg2
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from solver.mapping import get_db_connection, save_schedule_entries
from backend.apps.imports.parser import run_ingestion_pipeline
import os

class ScheduleAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Seed test database if needed
        excel_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'master_schedule_inputs.xlsx')
        if os.path.exists(excel_path):
            try:
                run_ingestion_pipeline(excel_path)
            except Exception:
                pass

    def test_metadata_endpoint(self):
        response = self.client.get('/api/v1/schedules/meta/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('cohorts', response.data)
        self.assertIn('faculty', response.data)
        self.assertIn('rooms', response.data)
        self.assertIn('subjects', response.data)

    def test_cohort_routine_endpoint(self):
        response = self.client.get('/api/v1/schedules/cohort/1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('weekly_grid', response.data)
        self.assertEqual(response.data['cohort_id'], 1)

    def test_faculty_routine_endpoint(self):
        response = self.client.get('/api/v1/schedules/faculty/1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('weekly_grid', response.data)
        self.assertEqual(response.data['faculty_id'], 1)

    def test_room_routine_endpoint(self):
        response = self.client.get('/api/v1/schedules/room/1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('weekly_grid', response.data)
        self.assertEqual(response.data['room_id'], 1)

    def test_manual_override_conflict_detection(self):
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM cohort LIMIT 2;")
        cohorts = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT id FROM faculty LIMIT 2;")
        faculties = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT id FROM room LIMIT 1;")
        room_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM subject LIMIT 2;")
        subjects = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT id FROM period_slot WHERE NOT is_break ORDER BY slot_number LIMIT 2;")
        slots = [r[0] for r in cur.fetchall()]

        cur.execute("DELETE FROM schedule_entry WHERE id IN (99991, 99992);")
        cur.execute("""
            INSERT INTO schedule_entry (id, day_of_week, period_slot_id, room_id, subject_id, faculty_id, cohort_id, is_active)
            VALUES (99991, 1, %s, %s, %s, %s, %s, TRUE),
                   (99992, 1, %s, %s, %s, %s, %s, TRUE);
        """, (slots[0], room_id, subjects[0], faculties[0], cohorts[0],
              slots[1], room_id, subjects[1], faculties[1], cohorts[1] if len(cohorts) > 1 else cohorts[0]))
        conn.commit()
        
        # Try moving entry 99991 to Day 1, Period 2 (where entry 99992 is in Room 1) -> Should trigger ROOM_CLASH
        payload = {
            "schedule_entry_id": 99991,
            "target_day": 1,
            "target_period_slot_id": slots[1],
            "target_room_id": room_id
        }
        response = self.client.post('/api/v1/schedules/override/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        
        # Clear target slot (Day 5, Period slot[1]) to ensure it is completely free for valid move
        cur.execute("DELETE FROM schedule_entry WHERE day_of_week = 5 AND period_slot_id = %s;", (slots[1],))
        conn.commit()
        
        # Move entry 99991 to an unoccupied slot -> Should succeed
        valid_payload = {
            "schedule_entry_id": 99991,
            "target_day": 5,
            "target_period_slot_id": slots[1],
            "target_room_id": room_id
        }

        valid_response = self.client.post('/api/v1/schedules/override/', valid_payload, format='json')
        self.assertEqual(valid_response.status_code, status.HTTP_200_OK)

        self.assertTrue(valid_response.data.get('success'))

        # Cleanup
        cur.execute("DELETE FROM schedule_entry WHERE id IN (99991, 99992);")
        conn.commit()
        cur.close()
        conn.close()
