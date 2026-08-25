# Mathematical Formulation of the Routine Optimization Model

This document formally describes the Constraint Satisfaction Problem (CSP) and Mixed-Integer Programming (MIP) model powering the Automatic Class Routine Generator. The model is solved using Google OR-Tools CP-SAT.

---

## 1. Sets and Indices

The university timetable is modeled over discrete time and space dimensions.

*   **$\mathcal{B}$**: Set of all teaching workloads (blocks). A single block $b \in \mathcal{B}$ represents a continuous teaching session (e.g., a 1-period lecture or a 2-period lab).
*   **$\mathcal{S}$**: Set of all available academic time slots in a week (e.g., 40 slots: 5 days $\times$ 8 periods).
*   **$\mathcal{R}$**: Set of all physical rooms (Auditoriums, Lecture Halls, Labs).
*   **$\mathcal{F}$**: Set of all faculty members.
*   **$\mathcal{C}$**: Set of all student cohorts.
*   **$\mathcal{G}_b$**: Set of valid contiguous slot groups for block $b$. For example, if $b$ is a 2-period lab, $\mathcal{G}_b$ contains all valid sequential pairs $(s_i, s_{i+1})$ that do not bridge a recess break or day boundary.
*   **$\mathcal{R}_b$**: Set of allowed rooms for block $b$. A room $r \in \mathcal{R}_b$ if and only if $Capacity(r) \ge Size(b)$ and $Type(r) = Type(b)$.

---

## 2. Decision Variables

To avoid combinatorial explosion, the model uses a primary 3D assignment variable and a 2D channeled linkage variable.

### 2.1 Primary Assignment Variable ($y$)
A binary variable determining the exact time and location of a block:
$$ y_{b, g, r} \in \{0, 1\} \quad \forall b \in \mathcal{B}, g \in \mathcal{G}_b, r \in \mathcal{R}_b $$
*   $y_{b, g, r} = 1$ if block $b$ is scheduled at contiguous time group $g$ inside room $r$.
*   $y_{b, g, r} = 0$ otherwise.

### 2.2 Channeled Slot Occupancy Variable ($X$)
To prevent the C++ flat-expansion layer from generating millions of overlapping mathematical terms during presolve, we channel the 3D assignment into a 2D boolean slot tracker:
$$ X_{b, s} \in \{0, 1\} \quad \forall b \in \mathcal{B}, s \in \mathcal{S} $$
Linked via a strict equality constraint:
$$ X_{b, s} = \sum_{g \in \mathcal{G}_b : s \in g} \sum_{r \in \mathcal{R}_b} y_{b, g, r} $$
*   $X_{b, s} = 1$ if block $b$ occupies time slot $s$ (regardless of which room).

---

## 3. Hard Constraints

These constraints strictly enforce the physical boundaries of spacetime. A schedule violating any of these is `INFEASIBLE`.

### 3.1 Assignment Completion
Every academic block must be scheduled exactly once.
$$ \forall b \in \mathcal{B}, \quad \sum_{g \in \mathcal{G}_b} \sum_{r \in \mathcal{R}_b} y_{b, g, r} = 1 $$

### 3.2 Room Clash Prevention
At most one block can occupy a specific room $r$ at any specific time slot $s$.
$$ \forall r \in \mathcal{R}, \forall s \in \mathcal{S}, \quad \sum_{b \in \mathcal{B}} \sum_{g \in \mathcal{G}_b : s \in g} y_{b, g, r} \le 1 $$

### 3.3 Faculty Clash Prevention
A faculty member $f$ cannot teach multiple blocks simultaneously. Let $\mathcal{B}_f$ be the set of blocks taught by faculty $f$.
$$ \forall f \in \mathcal{F}, \forall s \in \mathcal{S}, \quad \sum_{b \in \mathcal{B}_f} X_{b, s} \le 1 $$

### 3.4 Cohort Core Clash Prevention
A student cohort $c$ cannot attend multiple core classes simultaneously. Let $\mathcal{B}_c^{core}$ be the core blocks assigned to cohort $c$.
$$ \forall c \in \mathcal{C}, \forall s \in \mathcal{S}, \quad \sum_{b \in \mathcal{B}_c^{core}} X_{b, s} \le 1 $$

### 3.5 NEP Student-Level Elective Clashing
Under the New Education Policy (NEP), students within the same cohort choose diverse electives. Let $\mathcal{B}_{st}$ be the set of all blocks (core + chosen electives) that a specific student $st$ must attend.
$$ \forall st, \forall s \in \mathcal{S}, \quad \sum_{b \in \mathcal{B}_{st}} X_{b, s} \le 1 $$

---

## 4. Soft Constraints & Objective Function

The solver explores the feasible search space to maximize the global objective function $Z$.

$$ \text{Maximize } Z = Z_{smart} - P_{unpref} - P_{heavy} - P_{gaps} $$

### 4.1 Smart Classroom Utilization ($Z_{smart}$)
Rewards assigning blocks with a "Preferred" smart room requirement into actual smart rooms. Let $\mathcal{R}_{smart}$ be the set of smart rooms.
$$ Z_{smart} = \sum_{b \in \mathcal{B}_{pref}} \sum_{g \in \mathcal{G}_b} \sum_{r \in (\mathcal{R}_b \cap \mathcal{R}_{smart})} 10 \cdot y_{b, g, r} $$

### 4.2 Faculty Time Preferences ($P_{unpref}$)
Penalizes scheduling faculty during their self-declared "unpreferred" time slots (e.g., late afternoons). Let $U_f \subset \mathcal{S}$ be the unpreferred slots for faculty $f$.
$$ P_{unpref} = \sum_{f \in \mathcal{F}} \sum_{s \in U_f} \sum_{b \in \mathcal{B}_f} 5 \cdot X_{b, s} $$

### 4.3 Heavy Cognitive Spacing ($P_{heavy}$)
Penalizes scheduling "heavy cognitive" subjects (like Advanced Calculus and Physics) back-to-back on the same day. Let $s_i$ and $s_{i+1}$ be consecutive slots.
$$ P_{heavy} = \sum_{\text{day}} \sum_{i} 5 \cdot \text{AND}\left(\sum_{b \in \mathcal{B}_{heavy}} X_{b, s_i}, \sum_{b \in \mathcal{B}_{heavy}} X_{b, s_{i+1}}\right) $$

### 4.4 Cohort Free Period Minimization ($P_{gaps}$)
Penalizes isolated free periods (gaps) between classes for students. For any slot $s_g$, if the cohort has a class before $s_g$ on that day and a class after $s_g$ on that day, but is idle at $s_g$, a penalty of $2$ is applied.
$$ \text{Let } W_{c,s} = \sum_{b \in \mathcal{B}_c} X_{b, s} $$
$$ \text{IsGap}_{c, s_g} \ge \text{HasBefore}_{c, s_g} + \text{HasAfter}_{c, s_g} + (1 - W_{c, s_g}) - 2 $$
$$ P_{gaps} = \sum_{c \in \mathcal{C}} \sum_{s_g} 2 \cdot \text{IsGap}_{c, s_g} $$

---

## 5. Architectural Trade-offs

### 5.1 Pre-Computed Contiguity vs. Interval Variables
Instead of utilizing CP-SAT's native `IntervalVar` (which requires enforcing start/end/duration constraints across millions of bounds), we pre-compute contiguous slot groups $\mathcal{G}_b$. 
*   *Advantage*: It converts the scheduling problem entirely into Binary Integer Programming (BIP) which CP-SAT can presolve significantly faster, while completely isolating Labs from Recess Breaks.

### 5.2 Linear Expression Channeling
Defining the constraint $\sum y \le 1$ at the Room level expands safely because each assignment $y$ dictates exactly one room. However, tracking Student/Faculty clashes across rooms expands into nested sums. 
*   *Advantage*: By establishing $X_{b, s} = \sum y_{b, g, r}$, we collapse the search graph layers, averting the $O(\mathcal{B} \times \mathcal{G} \times \mathcal{R})$ combinatorial term explosion documented during early load testing.
