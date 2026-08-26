from django.urls import path
from .views import (
    SolverTriggerView,
    CohortRoutineView,
    FacultyRoutineView,
    RoomRoutineView,
    ManualOverrideView,
    MetadataView
)

urlpatterns = [
    path('meta/', MetadataView.as_view(), name='schedule-meta'),
    path('solver/generate/', SolverTriggerView.as_view(), name='solver-generate'),
    path('cohort/<int:cohort_id>/', CohortRoutineView.as_view(), name='cohort-routine'),
    path('faculty/<int:faculty_id>/', FacultyRoutineView.as_view(), name='faculty-routine'),
    path('room/<int:room_id>/', RoomRoutineView.as_view(), name='room-routine'),
    path('override/', ManualOverrideView.as_view(), name='manual-override'),
]

