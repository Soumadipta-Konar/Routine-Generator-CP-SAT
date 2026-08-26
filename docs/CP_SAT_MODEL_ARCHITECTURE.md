# CP-SAT Routine Generator: Model Architecture & Mathematical Foundations

This document provides a highly detailed breakdown of the mathematical optimization model powering the Routine Generator. The system is built using Google OR-Tools and implements a solution to a variation of the classic **University Course Timetabling Problem (UCTP)**.

## 1. Problem Definition & Graph Transformation

The routine generator transforms academic workloads into a series of **blocks**. A workload represents a curriculum requirement (e.g., "Cohort A needs 4 hours of CS101 with Dr. Smith"). 
Depending on the subject type, these requirements are split into discrete schedulable blocks $B$:
- **Lectures**: Split into individual 1-period blocks.
- **Labs**: Split into contiguous blocks of 2 or 3 periods to ensure continuous practical sessions.

Let:
- $B$ be the set of all schedulable blocks.
- $S$ be the set of all academic slots in the week (e.g., Monday Period 1).
- $R$ be the set of all physical rooms in the institution.
- $F$ be the set of all faculty members.
- $C$ be the set of all cohorts (student sections).

### Continuous Slot Groups (CG)
To handle labs that require 2+ continuous periods, the model pre-computes "Contiguous Slot Groups" ($CG$). For a block $b$ requiring $k$ periods, $CG_k$ represents all valid windows of size $k$ that occur sequentially on the same day without being interrupted by a break.

---

## 2. Decision Variables

The core of the CP-SAT engine relies on Boolean variables.

### The Primary Variable: $y$
For every block $b \in B$, every valid contiguous slot group $cg \in CG_{size(b)}$, and every allowed room $r \in R$, we define a Boolean variable:

$$y_{b, cg, r} \in \{0, 1\}$$

- $y_{b, cg, r} = 1$ if block $b$ is scheduled in room $r$ at the exact time slots defined by $cg$.
- $y_{b, cg, r} = 0$ otherwise.

*(Optimization Note: The domain of $cg$ is pre-filtered to exclude slots where the assigned faculty member is explicitly marked as "unavailable", massively pruning the search space before the solver even starts).*

### The Auxiliary Variable: $X_{slot}$
To make clash-prevention constraints mathematically cleaner, we define an auxiliary variable representing whether block $b$ occupies a specific atomic slot $s$, regardless of the room:

$$X_{b, s} = \sum_{cg \text{ containing } s} \sum_{r \in R} y_{b, cg, r}$$

$X_{b, s} \in \{0, 1\}$ evaluates to true if block $b$ is active during slot $s$.

---

## 3. Hard Constraints (Infeasibility Conditions)

Hard constraints are non-negotiable. If any of these are violated, the mathematical model is deemed **INFEASIBLE**.

### C1: Exact Assignment (Exclusivity)
Every block must be scheduled exactly once, in exactly one valid slot group, and in exactly one room.
$$\forall b \in B, \quad \sum_{cg \in CG_{size(b)}} \sum_{r \in allowed\_rooms(b)} y_{b, cg, r} = 1$$

### C2: Room Clash Prevention
A physical room can hold at most one class at any given time slot.
$$\forall r \in R, \forall s \in S, \quad \sum_{b \in B} \sum_{cg \text{ containing } s} y_{b, cg, r} \le 1$$

### C3: Faculty Clash Prevention
A faculty member cannot be in two places at once. Let $B_f$ be the set of blocks taught by faculty $f$.
$$\forall f \in F, \forall s \in S, \quad \sum_{b \in B_f} X_{b, s} \le 1$$

### C4: Cohort (Core) Clash Prevention
A cohort of students cannot attend two core classes simultaneously. Let $B_c$ be the set of core blocks for cohort $c$.
$$\forall c \in C, \forall s \in S, \quad \sum_{b \in B_c} X_{b, s} \le 1$$

### C5: Student-Level Elective Clashing (NEP compliance)
To support New Education Policy (NEP) electives where students from the same cohort diverge into different subjects, the model ensures individual students do not experience clashes.
Let $B_{stu}$ be the union of the core blocks for a student's cohort and the specific elective blocks the student has registered for.
$$\forall stu, \forall s \in S, \quad \sum_{b \in B_{stu}} X_{b, s} \le 1$$

---

## 4. Soft Constraints & Objective Function

Soft constraints represent preferences. Violating a soft constraint adds a numerical penalty to the Objective Function. The CP-SAT solver attempts to **Minimize** the total sum of these penalties.

$$ \text{Minimize} \quad Z = \sum \text{Penalties} $$

### P1: Smart Classroom Utilization
Rooms are evaluated against the `smart_class_requirement` of the workload:
- **MUST_HAVE but assigned non-smart**: Penalty = $100,000$ (acts almost like a hard constraint).
- **PREFERRED but assigned non-smart**: Penalty = $50$.
- **NOT_REQUIRED but assigned smart**: Penalty = $10$ (discourages wasting premium rooms on standard classes).

### P2: Cognitive Load Distribution (Heavy Subjects)
To prevent student burnout, subjects marked as `is_heavy_cognitive` (e.g., core Mathematics or dense theory) are penalized if scheduled back-to-back on the same day.
For any two consecutive slots $s_1, s_2$, if a cohort has heavy subjects in both:
$$\text{Penalty} = +100$$

### P3: Faculty Fatigue (Consecutive Hours)
Faculty members are penalized if they are scheduled for 3 or more consecutive periods without a break. The model introduces boolean sliding-window variables to detect blocks of 3 consecutive academic slots.
$$\text{Penalty} = +200 \text{ per violation}$$

### P4: Room Stability (Cohort Movement)
Students prefer to stay in the same room for consecutive classes to avoid rushing across campus. If a cohort has consecutive classes $b_1, b_2$ in different rooms, a penalty is applied.
$$\text{Penalty} = +30 \text{ per room change}$$

### P5: Faculty Preferences (Preferred Not)
If a faculty member's metadata marks a slot as `preferred_not` (but not strictly unavailable), scheduling them in that slot incurs a penalty.
$$\text{Penalty} = +40 \text{ per un-preferred slot}$$

---

## 5. Execution & Status Output

When triggered, the engine compiles this mathematical blueprint and hands it to the Google OR-Tools CP-SAT back-end, which uses boolean satisfiability and branch-and-bound techniques to explore the multidimensional space.

Due to containerized limits on platforms like Render:
- The search is strictly limited to **60 seconds**.
- The number of parallel search workers is dynamically throttled to match the container's CPU limits to prevent CPU exhaustion.

**Final Statuses:**
- `OPTIMAL`: The absolute mathematically best schedule was found (zero clashes, lowest possible penalty score).
- `FEASIBLE`: A valid schedule (zero clashes) was found before the 60s timeout, but the solver cannot mathematically prove it is the absolute lowest penalty score. This is fully acceptable for production use.
- `INFEASIBLE`: The hard constraints contradict each other (e.g., requiring 40 hours of classes in a 35-hour week).
- `UNKNOWN`: The solver timed out before finding the first valid schedule. 
