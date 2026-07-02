# STAG School Transport Cost Analysis Model

This repository contains the **STAG School Transport Financial Model**, an interactive, data-driven cost-analysis tool built to audit the financial projections of North Yorkshire Council's (NYC) home-to-school transport policy changes. 

The dashboard provides a realistic projection of the policy's true fiscal outcome by accounting for rolling cohort transitions (grandfathering), dispute/appeal costs, and the operational inefficiencies that result from fracturing bus routes.

---

## 📅 Timeline & Phasing

The model calculates annual projections over an **8-year timeline**, starting in **2025-26** and maturing in **2032-33**.

### Council Claimed Savings (Phasing weights)
Rather than assuming day-one savings, the model phases in the council's savings claim according to the official implementation schedule. Claimed savings are scaled relative to the **Claimed Annual Savings at Maturity (Yr 8)**—defaulting to **£4,263,445**—using the following weights:

| Academic Year | Step | % of Maturity | Default Phased Savings | Notes / Milestones |
| :--- | :--- | :---: | :---: | :--- |
| **2025-26** | Step 1 | 19.72% | £840,800 | New starters only |
| **2026-27** | Step 2 | 37.39% | £1,594,191 | |
| **2027-28** | Step 3 | 56.06% | £2,390,050 | |
| **2028-29** | Step 4 | 73.79% | £3,146,036 | |
| **2029-30** | Step 5 | 84.12% | £3,586,200 | Interpolated |
| **2030-31** | Step 6 | 94.44% | £4,026,363 | |
| **2031-32** | Step 7 | 96.96% | £4,133,978 | |
| **2032-33** | Step 8 | 100.00% | **£4,263,445** | Full transition / Maturity |

---

## 🧮 How the Model Calculates Costs

The STAG model calculates the true cost of policy implementation by summing three distinct overheads:

### 1. Alternative Vehicle Costs (Volume-Based Geographic Scaling)
When the council cancels a large-capacity bus route to restrict travel to the "nearest school only," grandfathered pupils on that route must still be transported. Instead of assuming county-wide efficiency, the model partitions the population into distinct rural zones (representing primary feeder clusters) to simulate local routing realities.

*   **Active Pupils per Zone**: The total active displaced cohort population in Year $t$ is divided equally across the **Feeder Zones / Clusters** (default: 50).
*   **Rural Isolation**: A percentage of the zone's population (defined by the **Isolation Rate**, default 25%) live down remote single-track roads or lanes, requiring individual standard Taxis (capacity: 3).
*   **Consolidation Group**: The remaining pupils in the zone (non-isolated) consolidate:
    *   **Tier 1 (Taxi)**: If their number is **less than the Minibus Threshold** (default: 8), they use standard Taxis (capacity: 3).
    *   **Tier 2 (Minibus)**: If their number is **greater than or equal to the Minibus Threshold BUT less than the Coach Threshold** (default: 17), they upgrade to a Minibus contract (capacity: 16; cost: 1.5x standard).
    *   **Tier 3 (Coach)**: If their number is **greater than or equal to the Coach Threshold**, they consolidate into a full-sized Coach contract (capacity: 50; cost: 3x standard to reflect bulk commercial coach rates).
*   **Aggregation**: Taxis, Minibuses, and Coach contracts are summed for a single zone, multiplied by the **number of zones**, and multiplied by **190 school days** to compute the annual spot vehicle cost for Year $t$.

### 2. Chained Appeals Overhead
Families who lose free transport rights can appeal the council's decision. This cost is calculated as a sequential funnel:
1.  **Stage 1 (Internal Review)**: Filed by a percentage of the annual displaced cohort intake.
    \[
    \text{Stage 1 Cost} = (\text{Cohort Intake} \times \text{S1 Appeal Rate}) \times \text{S1 Unit Cost}
    \]
2.  **Stage 2 (Independent Panel)**: A percentage of the rejected Stage 1 appellants escalate their cases.
    \[
    \text{Stage 2 Cost} = (\text{Stage 1 Count} \times \text{S2 Escalation Rate}) \times \text{S2 Unit Cost}
    \]
3.  **Stage 3 (Ombudsman)**: A percentage of the rejected Stage 2 appellants escalate to the Local Government Ombudsman.
    \[
    \text{Stage 3 Cost} = (\text{Stage 2 Count} \times \text{S3 Ombudsman Rate}) \times \text{S3 Unit Cost}
    \]

### 3. General Administration Costs
Includes the constant yearly overhead (default £20,000) for mapping software licenses, routes restructuring review, database updates, and system maintenance.

---

## 📊 Key Performance Indicators (KPIs)

-   **8-Year Net Cumulative Balance**: The final net fiscal position at the end of the 8-year timeline.
    \[
    \text{Net Balance} = \text{Cumulative Phased Savings} - \text{Cumulative STAG Projected Costs}
    \]
-   **Savings Eaten By Costs**: The percentage of the council's claimed savings that is consumed by alternative transport contracts, disputes, and admin overheads.
-   **Policy Audit Verdict**:
    *   **Good Policy Decision**: Cumulative savings exceed costs.
    *   **Bad Policy Decision**: Cumulative costs exceed savings.

---

## 💻 Running the Dashboard Locally

To start the interactive dashboard locally, ensure you have Node.js installed, then run:

```bash
# Start the local development server
npm run dev
```

Then open your browser and navigate to `http://localhost:8000`.
