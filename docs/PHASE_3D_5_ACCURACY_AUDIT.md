# PRATIBHASCAN WEB — PHASE 3D.5 SCORING ACCURACY & NORMATIVE BENCHMARK AUDIT

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Document Version:** 1.0  
**Date:** November 13, 2026  
**Auditor:** Senior Sports Technology Architect & Full-Stack Systems Lead  
**Status:** AUDIT COMPLETE — SPECULATIVE HEURISTICS REMOVED — RAW DATA PRESERVED  

---

## 1. Executive Summary

In Phase 3D, PratibhaScan introduced an assessment calculation engine and multi-trial sports performance recording system. A comprehensive scientific integrity and scoring accuracy audit was conducted during Phase 3D.5 to ensure that no synthetic, heuristic, or unvalidated percentile ranks or "official" national benchmarking claims are presented to athletes, coaches, or institutions without rigorous empirical backing.

### Key Audit Actions Taken:
1. **Disabled Speculative Percentile Estimations:**
   Heuristic linear percentile approximations previously implemented in `assessmentCalculations.ts` (`estimatePercentileRank()`) have been safely deactivated (returning `null`). This prevents non-peer-reviewed estimations from masquerading as authenticated sports performance metrics.
2. **Preserved 100% Raw Physiological Precision:**
   All physical measurements (seconds, centimeters, shuttle counts, repetitions) are recorded, calculated, and displayed with exact numerical precision (matching PostgreSQL `NUMERIC(8, 2)`).
3. **Clarified Verification Nomenclature:**
   Replaced all UI claims of "Officially Verified Record" with "Organization Verified Record", explicitly distinguishing internal academy/school verification from accredited national sports federation certification.
4. **Maintained Directional Scoring Integrity:**
   Validated the mathematical selection rules:
   - **Lower is Better:** Protocols such as 30m Sprint and Illinois Agility select $\min(t_1, t_2, \dots, t_n)$.
   - **Higher is Better:** Protocols such as Vertical Jump and Sit-and-Reach select $\max(t_1, t_2, \dots, t_n)$.

---

## 2. Protocol Specifications & Scoring Integrity Matrix

The system supports 6 standardized athletic assessment protocols. Every protocol has been audited for directional scoring, attempt limits, allowable biological ranges, and measurement units:

| Protocol Code | Protocol Name | Category | Unit | Directionality | Max Trials | Biological Range | Normative Reference Target |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `TEST_30M_SPRINT` | 30-Meter Acceleration Sprint | Speed | `sec` | **Lower is Better** ($\min$) | 3 | 3.00s – 12.00s | SAI / World Athletics Age Cohorts |
| `TEST_VERT_JUMP` | Countermovement Vertical Jump | Power | `cm` | **Higher is Better** ($\max$) | 3 | 10.0cm – 120.0cm | Bosco Protocol / NSCA Jump Norms |
| `TEST_BEEP_RUN` | 20m Multi-Stage Shuttle Run | Endurance | `shuttles` | **Higher is Better** ($\max$) | 1 | 1 – 200 shuttles | Léger 20m Shuttles / $\text{VO}_2$ Max Tables |
| `TEST_SIT_REACH` | Sit and Reach Flexibility Test | Flexibility | `cm` | **Higher is Better** ($\max$) | 3 | -20.0cm – +50.0cm | Wells and Dillon Standard Scale |
| `TEST_ILLINOIS` | Illinois Agility Run | Agility | `sec` | **Lower is Better** ($\min$) | 3 | 12.00s – 35.00s | Getchell Agility Assessment Norms |
| `TEST_ANTHRO` | Anthropometric & Ape Index | Baseline | `cm` | Structural Ratio | 1 | 100.0cm – 240.0cm | ISAK Kinanthropometry Standards |

---

## 3. Detailed Audit of Calculated Scores & Benchmarks

### 3.1 Multi-Trial Best Score Selection
The mathematical selection engine in `calculateBestScore()` was audited against edge cases:
- **Valid Trial Filtering:** Safely filters out `null`, `undefined`, or unrecorded trials.
- **Directional Accuracy:**
  - In `TEST_30M_SPRINT`, trials `[4.52, 4.38, 4.45]` correctly evaluate to **4.38s**.
  - In `TEST_VERT_JUMP`, trials `[48.5, 52.0, 50.5]` correctly evaluate to **52.0cm**.
- **Partial/Incomplete Sets:**
  - An athlete completing only 1 or 2 trials still produces a valid best score from the recorded trials.
  - A set with zero recorded trials cleanly returns `bestScore = null` and `validCount = 0`.
- **Database Decimal Precision:**
  - Every calculated score is rounded using `Math.round(best * 100) / 100` to prevent floating-point drift and guarantee parity with PostgreSQL `NUMERIC(8, 2)`.

### 3.2 Biological & Measurement Range Validation
In `validateMeasurement()`, inputs are tested against strict physiological boundaries prior to database insertion:
- **Negative & Zero Values:**
  - Negative values (e.g., `-4.5s`) are strictly rejected with `"Measurement must be a positive number."`
  - Zero values on time/distance trials are rejected as physically invalid.
- **Physiological Boundaries:**
  - Times below 3.00s for a 30m sprint (surpassing senior Olympic world records) are rejected with `"Trial value is below the realistic minimum (3.0s)."`
  - Times exceeding 12.00s are flagged as invalid biological ranges for sprint testing.
- **Non-Numeric Inputs:**
  - Inputs with `NaN`, malformed characters, or non-finite values are caught and rejected before calculating best scores.

---

## 4. Deactivation of Speculative Normative Percentiles

### 4.1 Prior State (Phase 3D Heuristic)
Previously, `estimatePercentileRank()` calculated approximate percentiles using linear interpolation heuristics:
$$\text{Percentile} \approx 50 + (\text{Midpoint} - \text{Score}) \times K$$
While mathematically stable, this heuristic was **not derived from published, stratified normative cohorts**.

### 4.2 Scientific Integrity Concerns
1. **Age Stratification Missing:** A 4.2s 30m sprint represents an elite national score for a 13-year-old, but an intermediate score for an 18-year-old male. Linear unstratified heuristics misrepresent development stages.
2. **Gender Stratification Missing:** Physiological differences in post-pubescent jump and sprint distributions require separate male and female curves.
3. **Legal & Ethical Implications:** Presenting calculated approximations as "National Percentile Ranks" in a talent scouting platform risks misleading scouts, coaches, and parents regarding an athlete's true athletic standing.

### 4.3 Phase 3D.5 Resolution
`estimatePercentileRank()` has been updated to return `null` unconditionally:
```typescript
/**
 * Scientific Validity Notice:
 * National athletic percentile rankings require empirical, age- and gender-stratified
 * reference datasets with published cohort sample sizes, standard deviations, and peer-reviewed
 * testing methodologies. In accordance with Phase 3D.5 scientific accuracy guidelines,
 * heuristic linear approximations are disabled to prevent presenting unvalidated predictions as
 * authenticated sports measurements.
 *
 * Raw physiological metrics (seconds, cm, shuttles) are preserved with 100% precision.
 * This function returns null until an authoritative national normative dataset is integrated.
 */
export function estimatePercentileRank(
  _protocolCode: string,
  _bestScore: number,
  _age?: number,
  _gender?: string
): number | null {
  return null;
}
```

### 4.4 UI Updates Across Views
- **NewAssessmentModal.tsx:** Removed simulated `~Xth %ile` preview badge. Replaced with raw score confirmation and protocol validity indicator.
- **SessionDetailsModal.tsx:** Replaced "Officially Verified Record" with "Organization Verified Record". Replaced speculative "Percentile" column with official "Status" (Draft vs Verified).
- **AssessmentsView.tsx:** Removed speculative percentiles from assessment rows. Replaced "Verified Record" badge with "Verified Session" (Organization Verified).
- **AthleteView.tsx:** In the Core Benchmarks cards, replaced unsupported `${percentile}th Percentile` with `Verified Personal Best` and displayed exact physiological raw scores. Added explanatory scientific advisory.

---

## 5. Missing Normative Validation Evidence & Roadmap

To re-enable normative percentiles in a future release, the following empirical datasets must be acquired and integrated:

1. **Sports Authority of India (SAI) / Khelo India Normative Tables:**
   - Stratified by exact age brackets: Under-12, Under-14, Under-16, Under-18, and Senior.
   - Stratified by biological sex (Male and Female cohorts).
   - Documented cohort sizes ($N \ge 1,000$ per age/gender cell) with mean ($\mu$) and standard deviation ($\sigma$).
2. **National Sports Federation Standards:**
   - Specific benchmark minimums for Athletics Federation of India (AFI), Badminton Association of India (BAI), etc.
3. **Statistical Engine Implementation:**
   - Transition from linear heuristics to Gaussian Z-score transformations:
     $$Z = \frac{X - \mu}{\sigma}, \quad \text{Percentile} = \Phi(Z) \times 100$$
   - Storage of reference tables in a versioned Supabase table `normative_benchmarks` with audit metadata and citation sources.

---

## 6. Audit Conclusion

The PratibhaScan assessment calculations now operate with uncompromising scientific integrity. All raw physical measurements are protected, speculative claims have been eliminated, and users receive authentic, transparent performance data.
