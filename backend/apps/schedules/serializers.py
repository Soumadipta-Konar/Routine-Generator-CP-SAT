from rest_framework import serializers

class ScheduleEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    day_of_week = serializers.IntegerField()
    period_slot_id = serializers.IntegerField()
    room_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    faculty_id = serializers.IntegerField()
    cohort_id = serializers.IntegerField(allow_null=True, required=False)
    elective_subject_id = serializers.IntegerField(allow_null=True, required=False)
    is_active = serializers.BooleanField(default=True)
    smart_class_requirement = serializers.CharField(required=False, allow_null=True)

    # Extra visual display fields
    subject_code = serializers.CharField(required=False, read_only=True)
    subject_name = serializers.CharField(required=False, read_only=True)
    faculty_name = serializers.CharField(required=False, read_only=True)
    room_name = serializers.CharField(required=False, read_only=True)
    cohort_name = serializers.CharField(required=False, read_only=True)

class ManualOverrideSerializer(serializers.Serializer):
    schedule_entry_id = serializers.IntegerField(required=True)
    target_day = serializers.IntegerField(min_value=1, max_value=5, required=True)
    target_period_slot_id = serializers.IntegerField(min_value=1, max_value=9, required=True)
    target_room_id = serializers.IntegerField(required=False, allow_null=True)

class SolverTriggerResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    objective_value = serializers.FloatField()
    total_entries_created = serializers.IntegerField()
    solve_duration_seconds = serializers.FloatField()
    message = serializers.CharField()
