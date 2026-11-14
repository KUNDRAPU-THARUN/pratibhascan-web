# PRATIBHASCAN WEB — PHASE 3D TEST RESULTS & VERIFICATION REPORT

**Company:** KAARYAN LABS  
**Product:** PratibhaScan  
**Date:** November 13, 2026  
**Environment:** Local Supabase Stack (PostgreSQL 15), Vitest 5.1.0, TypeScript 5.8, ESLint 9  
**Status:** ALL TESTS PASSED (100% Pass Rate Across All Suites)

---

## 1. Test Execution Summary

| Test Category | Suite / Tool | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Unit & Calculation Tests** | Vitest | 107 | 107 | 0 | **PASSED** |
| **Database Security & RLS Tests** | pgTAP (`npx supabase test db`) | 14 | 14 | 0 | **PASSED** |
| **TypeScript Typecheck** | `tsc -b` | Full project | Clean | 0 | **PASSED** |
| **Code Style & Linting** | `eslint .` | Full project | Clean | 0 | **PASSED** |
| **Production Vite Bundler** | `vite build` | Full project | Built in 1m50s | 0 | **PASSED** |

---

## 2. Frontend Unit & Integration Tests (107/107 Passed)

```text
 ✓ src/features/assessments/__tests__/assessmentCalculations.test.ts (24 tests)
 ✓ src/features/assessments/__tests__/assessmentService.test.ts (7 tests)
 ✓ src/features/auth/__tests__/authFlow.test.ts (13 tests)
 ✓ src/features/auth/__tests__/authSchemas.test.ts (14 tests)
 ✓ src/features/academy/__tests__/academyData.test.ts (17 tests)
 ✓ src/features/athlete/__tests__/athleteData.test.ts (16 tests)
 ✓ src/features/institution/__tests__/institutionData.test.ts (16 tests)

 Test Files  7 passed (7)
      Tests  107 passed (107)
   Duration  2.39s
```

### Detailed Assessment Engine Test Coverage

#### 1. `assessmentCalculations.test.ts` (24 Tests)
- **Protocol Specifications Integrity:**
  - Verified 6 standard protocols (`TEST_30M_SPRINT`, `TEST_VERT_JUMP`, `TEST_BEEP_RUN`, `TEST_SIT_REACH`, `TEST_ILLINOIS`, `TEST_ANTHRO`).
  - Validated directionality, units, max attempt counts, and ranges for all 6 protocols.
- **Measurement Validation:**
  - Null/undefined handling for optional attempts.
  - Rejection of negative measurements (matching database check constraints).
  - Rejection of NaN and malformed numbers.
  - Physiological boundaries for sprint (3.0s–12.0s), jump (10cm–120cm), beep test (1–200 shuttles), and agility (12s–35s).
- **Multi-Trial Best Score Calculations:**
  - Lower is better: selects minimum score (e.g. 4.38s from `[4.52, 4.38, 4.45]`).
  - Higher is better: selects maximum score (e.g. 45.0cm from `[42.5, 45.0, 43.8]`).
  - Handled single, double, and triple attempt configurations.
  - Returns `null` when all attempts are empty.
  - Returns explicit error when an individual trial violates allowable ranges.
  - Two-decimal place precision rounding matching `NUMERIC(8, 2)`.
- **Normative Percentiles:**
  - Sprint, jump, and beep test normative curves.
  - Rejection of negative/zero inputs.
  - Null handling for non-normed anthropometric records.

#### 2. `assessmentService.test.ts` (7 Tests)
- **Protocol Fetching:** Supabase table retrieval with local specification fallback.
- **Eligible Athlete Filtering:**
  - Strictly returns athletes with `status = 'active'`.
  - Excludes pending and revoked affiliations.
  - Excludes evaluator themselves to enforce `check_no_self_evaluation`.
  - Minor athlete identification for guardian consent workflows.
- **Session Creation:**
  - Throws immediately when an athlete attempts self-evaluation (`athleteId === user.id`).
  - Creates draft session with `verified = false` and `status = 'pending'`.
- **Verification Workflow:**
  - Updates `verified: true` and marks results as `verified`.
- **Draft Deletion:**
  - Deletes only unverified draft sessions.

---

## 3. Database Security & RLS Tests (pgTAP) (14/14 Passed)

Executed against local PostgreSQL stack `127.0.0.1:54322`:

```text
Target: local stack (127.0.0.1:54322)
psql:.../01_security_and_rls.test.sql:28: NOTICE:  extension "pgtap" already exists, skipping
.../01_security_and_rls.test.sql .. ok
All tests successful.
Files=1, Tests=14, 0 wallclock secs
Result: PASS
```

- **Test 1:** Athlete reading own records (Allowed)
- **Test 2:** Athlete denied another athlete's private records (Denied)
- **Test 3:** Academy owner accessing authorized records (Allowed)
- **Test 4:** Academy denied unrelated institution records (Denied)
- **Test 5:** Institution accessing authorized records (Allowed)
- **Test 6:** Unauthorized role modification rejected by trigger (Denied)
- **Test 7:** Unauthorized organization ownership changes rejected (Denied)
- **Test 8A:** Unauthorized assessment creation blocked by RLS for athlete (Denied, SQLSTATE 42501)
- **Test 8B:** Self-evaluation rejected by `check_no_self_evaluation` constraint (Denied, SQLSTATE 23514)
- **Test 9:** Unauthorized assessment editing rejected on verified sessions (Denied)
- **Test 10:** Anonymous access blocked from private records (Denied)
- **Test 11A:** Unauthorized deletion of assessment session affects 0 rows (Denied)
- **Test 11B:** Protected assessment session confirmed intact by authorized owner (Allowed)
- **Test 12:** Private media/storage access design verification (Verified)

---

## 4. TypeScript & Production Build Verification

```bash
npx tsc -b
# Exit code 0, zero type errors.

npm run build
# vite v6.4.6 building for production...
# ✓ 1787 modules transformed.
# dist/index.html                   1.02 kB │ gzip:   0.56 kB
# dist/assets/index-B-H1D596.css   41.71 kB │ gzip:   7.35 kB
# dist/assets/index-B11F6XV5.js   850.38 kB │ gzip: 220.28 kB
# ✓ built in 1m 50s
```

---

## 5. Code Quality & Linting Verification

```bash
npm run lint
# > pratibhascan-web@0.1.0 lint
# > eslint .
# Exit code 0, 0 errors, 0 warnings.
```
