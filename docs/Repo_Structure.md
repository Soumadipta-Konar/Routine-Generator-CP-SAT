# Repository Folder Structure
## Automatic Optimized Class Routine Generation System

This document outlines the directory structure of the repository. Use this to guide workspace file creation and module imports.

```
routine-generator/
│
├── README.md                           # Project description, setup instructions, and execution guide
├── docker-compose.yml                  # Docker Compose configuration (Postgres, Redis, Backend, Frontend)
│
├── backend/                            # Django / FastAPI Service Application
│   ├── manage.py                       # Django project entry point
│   ├── requirements.txt                # Python backend dependencies
│   │
│   ├── config/                         # API Server Configurations
│   │   ├── __init__.py
│   │   ├── settings.py                 # DB settings, Celery setup, and channel parameters
│   │   ├── urls.py                     # API routing table configuration
│   │   ├── asgi.py                     # WebSocket ASGI interface configuration (Django Channels)
│   │   └── wsgi.py
│   │
│   ├── apps/                           # Core Service Apps
│   │   ├── core/                       # Core assets and profiles
│   │   │   ├── __init__.py
│   │   │   ├── models.py               # SQL schemas for Institution, Department, Cohort, Student, PeriodSlot
│   │   │   ├── views.py                # CRUD API viewsets (including Slot settings)
│   │   │   └── serializers.py
│   │   │
│   │   ├── schedules/                  # Timetable records and manual overrides
│   │   │   ├── __init__.py
│   │   │   ├── models.py               # ScheduleEntry, ExamSchedule models
│   │   │   ├── views.py                # Override checker views
│   │   │   ├── tasks.py                # Celery async tasks interfacing with the solver
│   │   │   └── serializers.py
│   │   │
│   │   └── imports/                    # Bulk Ingestion Services
│   │       ├── __init__.py
│   │       ├── views.py                # Excel upload API endpoints
│   │       └── parser.py               # Syntactic, Semantic, and Feasibility workbook parsers
│   │
│   └── services/                       # Custom utilities
│       ├── __init__.py
│       └── notifier.py                 # SMS Alert service utilizing Faculty mobile numbers
│
├── solver/                             # OR-Tools Scheduling Engine
│   ├── __init__.py
│   ├── engine.py                       # Master solver containing CP-SAT variables and constraints
│   ├── mapping.py                      # DB model serialization to solver array mapping
│   └── tests/                          # Solver Unit Tests
│       ├── __init__.py
│       ├── test_clash_avoidance.py     # Verifies zero clashes for cohort/faculty/rooms
│       ├── test_lab_contiguity.py      # Verifies lab sessions are consecutive and not split
│       └── test_exam_seating.py        # Verifies anti-cheating seating rules for exams
│
└── frontend/                           # React Client Application
    ├── package.json                    # Node.js dependencies
    ├── tailwind.config.js              # Tailwind styling presets
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                      # Application Router
        ├── index.js                    # React rendering entry point
        │
        ├── components/                 # Shared UI components
        │   ├── VisualGrid.jsx          # Interactive routine matrix visualizer
        │   ├── DragAndDropBox.jsx      # Draggable class schedule item
        │   ├── ExcelUploader.jsx       # Workbook file upload component
        │   └── ClashBanner.jsx         # Live conflict warnings and warnings panel
        │
        ├── pages/                      # Dashboard Pages
        │   ├── AdminDashboard.jsx      # Upload controls, master solver buttons, overrides
        │   ├── FacultyDashboard.jsx    # Personalized teacher routine and leave logger
        │   └── StudentDashboard.jsx    # Student customized electives visualizer with PWA caching
        │
        └── services/                   # API Communications
            ├── api.js                  # Axios client setup for API calls
            └── websocket.js            # Socket.IO / Channels connection manager
```
