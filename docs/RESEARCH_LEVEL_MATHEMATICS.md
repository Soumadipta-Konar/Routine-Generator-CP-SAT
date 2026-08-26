# Research-Level Mathematical Formulation of the University Course Timetabling Problem (UCTP) using CP-SAT

This document provides a rigorous, graduate-level analysis of the algorithmic and mathematical foundations underpinning the Routine Generator. It explores the reduction of the scheduling problem, the underlying algorithms of the Google OR-Tools CP-SAT solver, and the formalized integer linear programming (ILP) and Boolean satisfiability (SAT) mechanics.

---

## 1. Problem Complexity and NP-Hardness

The University Course Timetabling Problem (UCTP) is a well-known combinatorial optimization problem. In its decision variant—determining whether a valid schedule exists that satisfies all hard constraints—the problem is strongly **NP-Complete**.

### 1.1 Reduction from Graph Coloring
The core of UCTP can be reduced from the **Vertex Coloring Problem**.
Let $G = (V, E)$ be a graph where:
- $V$ represents the set of all classes (blocks) to be scheduled.
- $E$ represents a clash-condition (an edge exists between $v_i$ and $v_j$ if they share a cohort, faculty, or room).

Finding a valid timetable with $|S|$ available timeslots is equivalent to finding a valid $|S|$-coloring of $G$. Since determining the chromatic number $\chi(G)$ is NP-Hard, UCTP is inherently NP-Hard.

### 1.2 The Optimization Variant
The Routine Generator does not merely solve the decision problem; it solves the optimization variant by minimizing a set of soft constraint penalties. This places the problem in the complexity class **NP-Hard**, requiring exact algorithmic approaches (like Branch-and-Bound over SAT) or meta-heuristics to find an $\epsilon$-optimal solution within bounded time.

---

## 2. Boolean Satisfiability & The CP-SAT Engine

The OR-Tools CP-SAT solver is not a pure Integer Linear Programming (ILP) solver (like Gurobi or CPLEX) nor a pure SAT solver (like MiniSAT). It is a **Lazy Clause Generation (LCG)** solver that bridges Constraint Programming (CP) and SAT.

### 2.1 Lazy Clause Generation (LCG)
In traditional SAT, integer variables must be fully booleanized (bit-blasted or order-encoded), which causes an exponential explosion in variables.
CP-SAT uses LCG, where integer constraints are translated into SAT clauses *lazily* during the search. When a constraint is violated, the solver generates a customized boolean clause representing the failure and adds it to the SAT solver's database.

### 2.2 Conflict-Driven Clause Learning (CDCL)
The engine traverses the search tree using CDCL. Let $\Phi$ be the formula in Conjunctive Normal Form (CNF):
1. **Decision**: Assign a truth value to an unassigned boolean variable $y_{b, cg, r}$.
2. **Unit Propagation**: Deduce forced assignments using Boolean Constraint Propagation (BCP).
3. **Conflict Analysis**: If a contradiction occurs (e.g., faculty double-booked), analyze the implication graph to find the **1st Unique Implication Point (1UIP)**.
4. **Learning**: Learn a new clause $\omega$ that prevents this exact conflict from ever occurring again, and backjump to a higher level in the decision tree.

---

## 3. Formal Algorithmic Formulation

Let $B$ be the set of class blocks, $R$ the rooms, $F$ the faculty, $C$ the cohorts, and $S$ the timeslots.

### 3.1 The Multi-Dimensional Boolean Tensor
The foundational variable is a sparse 3D boolean tensor:
$$ y_{b, cg, r} \in \{0, 1\} \quad \forall b \in B, cg \in CG(b), r \in R_b $$
Where $CG(b)$ is the set of valid contiguous slot sequences of length equal to the required periods for $b$, and $R_b$ is the subset of rooms matching the capacity and lab/theory requirements.

By pre-computing $CG(b)$ and $R_b$, the domain of $y$ is drastically pruned, effectively breaking symmetries before the solver initiates.

### 3.2 Projection to 1D Temporal Space
To optimize constraint propagation, we define an affine transformation of the tensor to project it into purely temporal space:
$$ X_{b, s} = \sum_{r \in R_b} \sum_{\{cg \in CG(b) \mid s \in cg\}} y_{b, cg, r} $$
Here, $X_{b, s} \in \{0, 1\}$ is a derived boolean variable. Because $X$ is defined as a linear expression of $y$, CP-SAT enforces arc-consistency across these variables in $O(1)$ time during propagation.

---

## 4. Constraint Formalization

### 4.1 Cardinality & Exclusivity (Exactly-One Constraint)
The solver uses specialized `ExactlyOne` constraints rather than standard linear inequalities, allowing the SAT engine to utilize highly optimized bipartite matching algorithms.
$$ \forall b \in B: \sum_{cg} \sum_r y_{b, cg, r} = 1 $$

### 4.2 The Clique-Clash Matrix (At-Most-One Constraints)
Conflicts (Room, Faculty, Cohort, Student) are represented as maximal cliques in the conflict graph.
For any resource constraint $M \in \{R, F, C\}$ and an instance $m \in M$:
$$ \forall s \in S: \sum_{b \in B_m} X_{b, s} \le 1 $$

In CP-SAT, this is internally represented as an `AtMostOne` constraint. The engine implements this using a bipartite formulation or pairwise boolean clauses depending on $|B_m|$. If $|B_m|$ is small, it expands to $O(|B_m|^2)$ clauses: $\neg X_{i,s} \lor \neg X_{j,s}$. 

### 4.3 NEP Elective Divergence (Sub-Cohort Graph Bipartition)
To satisfy the New Education Policy (NEP) where cohorts fragment into electives, the problem requires dynamic student-level conflict generation.
Let $B_{core}(c)$ be the core subjects for cohort $c$, and $B_{elec}(u)$ be the elective subjects for student $u \in c$.
The solver enforces:
$$ \forall u, \forall s \in S: \sum_{b \in B_{core}(c)} X_{b, s} + \sum_{b \in B_{elec}(u)} X_{b, s} \le 1 $$
Because this generates massive constraint sets, identical student profiles are hashed and merged to reduce the constraint matrix rank, drastically reducing polynomial time complexity during the presolve phase.

---

## 5. Non-Linear Soft Constraints & Penalization

The objective function is defined as:
$$ \min Z(y) = \sum_{p \in P} W_p \cdot V_p(y) $$
where $W_p$ is the scalar weight and $V_p(y)$ is the boolean violation trigger.

### 5.1 Cognitive Load Distribution (Quadratic to Linear Reduction)
We penalize back-to-back heavy cognitive subjects. Mathematically, this is a quadratic constraint:
$$ \text{Penalty if } \left( \sum_{b \in B_{heavy}} X_{b, s_t} \right) \times \left( \sum_{b \in B_{heavy}} X_{b, s_{t+1}} \right) = 1 $$

Since SAT solvers require linear constraints, this is linearized by introducing artificial boolean variables $v_1, v_2, v_c$:
$$ v_1 = \sum X_{b, s_t}, \quad v_2 = \sum X_{b, s_{t+1}} $$
$$ v_c \ge v_1 + v_2 - 1 $$
The objective function then minimizes $W \cdot v_c$. This transforms a non-convex quadratic problem into a linear mixed-integer formulation, ensuring the branch-and-bound algorithm maintains tight lower bounds.

### 5.2 Faculty Fatigue (Sliding Window Convolution)
A 1D convolutional window of size 3 is passed over the temporal variables for each faculty member.
Let $T = (1, 1, 1)$ be the fatigue kernel. For faculty $f$:
$$ \forall t: \sum_{\tau=0}^{2} \left( \sum_{b \in B_f} X_{b, s_{t+\tau}} \right) \le 2 + v_{fatigue} $$
This enforces that no faculty teaches 3 consecutive blocks without a break unless the penalty variable $v_{fatigue} = 1$.

---

## 6. Optimization Phase: Branch and Bound

Once the SAT constraints are generated, the CP-SAT engine employs Branch-and-Bound:
1. **Presolve**: Applies mathematical simplifications, Gaussian elimination on boolean variables, and equivalence reasoning to reduce the matrix size.
2. **Linear Relaxation**: Solves the continuous LP relaxation to establish a lower bound $LB$.
3. **Core-Guided Search (MaxSAT)**: Identifies unsatisfiable cores in the soft constraints and iteratively increases the lower bound.
4. **Pruning**: If a branch in the decision tree has an LP relaxation score $Z_{LP} \ge Z_{best}$, the branch is pruned.
5. **Termination**: The algorithm terminates when $LB = Z_{best}$ (yielding an `OPTIMAL` status), or when the computational time limit is reached, yielding the lowest evaluated `FEASIBLE` solution.
