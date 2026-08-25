# User Flow Document
## Automatic Optimized Class Routine Generation System

This document outlines the workflows and user journeys for the system. It covers Admin setup, routine generation, dynamic leave rescheduling, and student/faculty visualization.

---

## 1. Admin Onboarding and Setup Flow
Before generating a routine, the Administrator must populate the database with institutional parameters and configure constraints.

```mermaid
graph TD
    A([Start: Admin Login]) --> B[Create Institution<br/>Profile]
    B --> C[Define Depts,<br/>Semesters, Sections]
    C --> D[Add Classrooms & Labs<br/>with Capacity & Equipment]
    D --> E[Input Faculty Profiles<br/>with Max Load & Preferences]
    E --> F[Input Subject Registry<br/>with Cognitive Load Tags]
    F --> G[Define Time Slots &<br/>Recess Break Bounds]
    G --> H[Configure Soft Constraint<br/>Weights & Fallbacks]
    H --> I([Setup Complete])
```

---

## 2. Core Routine Generation & Optimization Flow
Once data setup is complete, the admin triggers the routine generator. The system processes constraints and outputs a draft schedule.

```mermaid
graph TD
    A([Start: Click Generate]) --> B[Verify Ingestion Data<br/>Feasibility]
    B -- Insufficient Slots --> C[Highlight Deficit<br/>on Dashboard]
    C --> A
    B -- Valid --> D[Queue Job in Celery]
    D --> E[Start OR-Tools CP-SAT]
    E --> F[Apply Hard Constraints<br/>including NEP Electives]
    F --> G[Optimize Soft Constraints<br/>spacing & teacher load]
    G --> H{Solution Found?}
    H -- No --> I[Run Conflict Analysis]
    I --> J[Display Advisory Report]
    J --> A
    H -- Yes --> K[Output Draft Routine]
    K --> L[Show Grid Visualizer]
    L --> M{Admin Review}
    M -- Tweak --> N[Drag-and-Drop Edit]
    N --> O[Run Quick Check]
    O -- Conflict --> P[Flag Clash in Red]
    P --> N
    O -- Clear --> L
    M -- Approve --> Q[Publish Timetable]
    Q --> R([Routine Live & Shared])
```

---

## 3. Dynamic Rescheduling & Substitute Management Flow
This flow represents the day-to-day operations when a teacher goes on leave or needs an emergency class swap.

```mermaid
graph TD
    A([Start: Log Faculty Leave]) --> B[Scan Impacted Slots]
    B --> C[Query Reschedule Engine]
    C --> D{Choose Strategy}
    
    %% Strategy 1: Substitution
    D -->|Substitute| E[Search Dept Faculty]
    E --> F[Filter Out Clashes]
    F --> G[Rank by Load Preference]
    G --> H[Suggest Substitute List]
    
    %% Strategy 2: Swap / Empty Slot
    D -->|Reschedule/Swap| I[Scan Section Free Slots]
    I --> J{Free Slot Found?}
    J -- Yes --> K[Suggest Empty Slot Run]
    J -- No --> L[Scan for Double-Swap]
    L --> M[Suggest Swap Pairs]

    H & K & M --> N[Admin Confirms Option]
    N --> O[Update DB & Notify Users]
    O --> P([Substitution Active])
```

---

## 4. Exam Routine & Invigilation Duty Flow
Generating an exam routine differs from class routines as student cohorts take exams simultaneously, and classrooms need sparse seating.

```mermaid
graph TD
    A([Start: Exam Mode]) --> B[Input Dates, Times,<br/>& Exam Subjects]
    B --> C[Set Seating Buffer<br/>e.g. 50% capacity]
    C --> D[Retrieve Free Faculty<br/>for Duty Pool]
    D --> E[Run Exam Solver]
    E --> F[Check Student Single-Exam<br/>& Seating Clashes]
    F --> G[Check Invigilator Load<br/>& Duty Limits]
    G --> H[Output Seating Plan<br/>& Invigilation Chart]
    H --> I[Admin Preview]
    I --> J[Publish & Notify]
    J --> K([Exam Schedule Live])
```

---

## 5. Faculty and Student Schedule Visualization Flow
How consumers access the finalized routine.

```mermaid
graph TD
    A([User Visits Portal]) --> B{Identify Role}
    
    B -->|Student| C[View Section Grid]
    C --> D[Filter by Day/Subject]
    C --> E[View Active Substitution<br/>Alerts & Cancellations]
    C --> F[Export Calendar/PDF]
    
    B -->|Faculty| G[View Personal Matrix]
    G --> H[Request Leave or Swaps]
    G --> I[Book Extra Session]
    G --> J[View Exam Duty Schedule]
```
