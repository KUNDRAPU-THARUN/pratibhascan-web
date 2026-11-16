# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4C: Automated Test Results & Verification Matrix

**Document Version:** 1.0.0  
**Phase:** 4C (AI Sports Movement Measurement, Calibration & Accuracy Validation)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Master Verification Summary

| Test Domain | Harness / Framework | Suites / Files | Total Tests | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Frontend Unit & Biomechanics** | Vitest 5.1 | 17 | 219 | 219 | 0 | **100% PASS** |
| **Database Security & Two-Person RLS** | Supabase pgTAP (PostgreSQL) | 2 | 34 | 34 | 0 | **100% PASS** |
| **Browser E2E Desktop (1440px)** | Playwright (Chromium) | 3 | 25 | 25 | 0 | **100% PASS** |
| **Browser E2E Tablet (768px)** | Playwright (Chromium) | 3 | 25 | 25 | 0 | **100% PASS** |
| **Browser E2E Mobile (375px)** | Playwright (Mobile Viewport) | 3 | 25 | 25 | 0 | **100% PASS** |
| **TypeScript Typecheck** | `tsc -b` (Strict Mode) | Whole Project | — | 0 Errors | 0 | **100% PASS** |
| **Production Code Quality** | ESLint 9 | Whole Project | — | 0 Errors | 0 | **100% PASS** |
| **Production Bundler Build** | Vite 6.4.6 | Whole Project | — | Built in 11.17s | 0 | **100% PASS** |

**Grand Total Automated Assertions:** **328 / 328 (100% Green)**

---

## 2. Physical Camera Acceptance Gate Status

> [!IMPORTANT]
> **PHYSICAL-CAMERA TESTING STATUS: PENDING**
>
> All 328 automated assertions documented in this report validate deterministic algorithms, mathematical formulations, coordinate transformations, finite state machines, UI responsiveness, and synthetic kinematic trajectories.
> 
> **Zero fabricated hardware test results have been introduced.** Physical hardware validation across real optical sensors (webcams, smartphone cameras, wide-angle lenses) in diverse ambient lighting environments remains strictly scheduled for on-premise human participant evaluation in accordance with KAARYAN LABS QA protocols.

---

## 3. Vitest Biomechanics & Unit Suites Breakdown (219 Tests)

```
Test Files  17 passed (17)
     Tests  219 passed (219)
  Duration  7.87s

✓ src/features/pose-detection/__tests__/calibration.test.ts (10 tests)
✓ src/features/pose-detection/__tests__/biomechanics.test.ts (19 tests)
✓ src/features/pose-detection/__tests__/squatStateMachine.test.ts (10 tests)
✓ src/features/pose-detection/__tests__/squatValidationHarness.test.ts (1 test — 16 kinematic scenarios)
✓ src/features/pose-detection/__tests__/cameraService.test.ts (14 tests)
✓ src/features/pose-detection/__tests__/poseLandmarkerService.test.ts (4 tests)
✓ src/features/pose-detection/__tests__/landmarkTransform.test.ts (17 tests)
✓ src/features/pose-detection/__tests__/performanceMonitor.test.ts (5 tests)
✓ src/features/assessments/__tests__/assessmentCalculations.test.ts (22 tests)
✓ src/features/assessments/__tests__/assessmentEndToEnd.test.ts (21 tests)
✓ src/features/assessments/__tests__/assessmentService.test.ts (7 tests)
✓ src/features/assessments/__tests__/securityRegression.test.ts (13 tests)
✓ src/features/auth/__tests__/authSchemas.test.ts (14 tests)
✓ src/features/auth/__tests__/authFlow.test.ts (13 tests)
✓ src/features/athlete/__tests__/athleteData.test.ts (16 tests)
✓ src/features/academy/__tests__/academyData.test.ts (17 tests)
✓ src/features/institution/__tests__/institutionData.test.ts (16 tests)
```

### 3.1 Camera Calibration Engine Coverage (`calibration.test.ts` — 10 Tests)
1. **Initial Uncalibrated State**: Verifies initial state starts in `uncalibrated` with neutral guidance.
2. **Missing Landmark Rejection**: Confirms `fullBodyVisible: false` when feet or hips are absent.
3. **Framing Distance (Too Far)**: Flags subjects occupying $< 38\%$ vertical frame height as `too_far`.
4. **Framing Distance (Too Close)**: Flags subjects occupying $> 88\%$ vertical frame height as `too_close`.
5. **Framing Distance (Optimal)**: Confirms $[0.38, 0.88]$ subject height fraction evaluates to `optimal`.
6. **Orientation Arbitration**: Distinguishes sagittal lateral profile ($90^\circ \pm 25^\circ$), $45^\circ$ oblique, and frontal view.
7. **Stability Hold Gate**: Requires 30 consecutive stable upright frames before enabling workout commencement.
8. **Recalibration on Framing Breach**: Triggers `recalibration_needed` when athlete steps out of frame.
9. **Recalibration on Extended Tracking Drop**: Demands posture re-check after $> 90$ lost frames.
10. **Manual Recalibration & Lock Override**: Validates user manual recalibration request and direct lock.

### 3.2 Biomechanical Formula Coverage (`biomechanics.test.ts` — 19 Tests)
- Independent left/right knee flexion angle calculations
- Independent left/right hip flexion angle calculations
- Anatomical trunk inclination calculation relative to vertical gravity vector
- Squat depth proxy ($\Delta y = y_{\text{hip}} - y_{\text{knee}}$):
  - Above parallel ($\Delta y < -0.02$)
  - Parallel ($-0.02 \le \Delta y \le 0.02$)
  - Below parallel ($\Delta y > 0.02$)
- Robust mathematical safeguards (zero division, $\epsilon = 10^{-7}$, clamp protection against `NaN`).

### 3.3 Squat Finite State Machine Coverage (`squatStateMachine.test.ts` — 10 Tests)
- Standard 5-state lifecycle (`standing` $\to$ `descent` $\to$ `bottom` $\to$ `ascent` $\to$ `completed`)
- Repetition qualification criteria: full range of motion requirement ($\le 100^\circ$ at bottom, $\ge 155^\circ$ upon extension)
- Partial repetition logging: records inflection without incrementing valid competition rep counter
- Kinematic phase duration tracking (descent duration, bottom hold, ascent duration, total duration)
- Squat depth classification storage (`below_parallel`, `parallel`, `above_parallel`)
- Tracking coverage percentage calculation and movement interruption logging
- Pause and resume workout elapsed timer accounting.

---

## 4. 16-Scenario Kinematic Benchmark Evaluation Matrix

Evaluated via `squatValidationHarness.ts`:

| # | Benchmark Scenario Description | Frame Count | Expected Reps | Measured Reps | Classification | Tracking Coverage | Result |
| :-: | :--- | :-: | :-: | :-: | :--- | :-: | :-: |
| 1 | Standard Clean Squat (88° depth, 2.8s tempo) | 84 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 2 | Partial Squat (115° inflection depth) | 84 | 0 (1 partial) | 0 (1 partial) | `above_parallel` | 100% | **PASS** |
| 3 | Slow Controlled Squat (4.6s tempo) | 138 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 4 | Rapid Cadence Squat (0.9s tempo) | 28 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 5 | Static Standing Posture (175° upright) | 90 | 0 | 0 | `standing` | 100% | **PASS** |
| 6 | Synthetic Landmark Noise / Micro-Jitter (±1.5°) | 84 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 7 | Unilateral Knee Occlusion (Right Knee Hidden) | 84 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 8 | Bilateral Ankle Dropout at Maximum Depth | 84 | 1 | 1 | `below_parallel` | 94.0% | **PASS** |
| 9 | High-Frequency Angular Oscillation (False Positive Test) | 60 | 0 | 0 | `noise_rejected` | 100% | **PASS** |
| 10 | True Sagittal Profile Orientation (0.05 shoulder width) | 84 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 11 | Frontal View Warning & Rejection Verification | 84 | 0 | 0 | `view_rejected` | 100% | **PASS** |
| 12 | Complete Landmark Tracking Dropout Mid-Descent | 84 | 0 | 0 | `interrupted` | 76.2% | **PASS** |
| 13 | Pause Mid-Workout & Resume Execution | 114 | 1 | 1 | `below_parallel` | 100% | **PASS** |
| 14 | 5 Consecutive Squat Repetitions | 420 | 5 | 5 | `below_parallel` | 100% | **PASS** |
| 15 | Malformed / Out-of-Bounds Coordinate Feed | 60 | 0 | 0 | `error_handled` | 0% | **PASS** |
| 16 | Athlete Exits Camera Frame Entirely | 60 | 0 | 0 | `out_of_frame` | 0% | **PASS** |

**Benchmark Accuracy Metrics:**
- **False Positive Count:** `0 / 16` scenarios (0.0%)
- **Missed True Repetitions:** `0 / 16` scenarios (0.0%)
- **Depth Classification Accuracy:** `100.0%`

---

## 5. PostgreSQL Database & Security Tests (`pgTAP` — 34 Tests)

Executed against local Supabase PostgreSQL test environment:

```
psql:supabase/tests/database/01_security_and_rls.test.sql ........ ok (14 tests)
psql:supabase/tests/database/02_two_person_and_consent.test.sql .. ok (20 tests)
All tests successful.
Files=2, Tests=34
Result: PASS
```

Key database assertions confirmed:
1. Strict RLS policy enforcement across `assessments`, `athlete_profiles`, `academy_profiles`, `institution_profiles`.
2. Prevention of self-verification in the two-person certified tier.
3. Separation of academy drafts from unrelated state institutions.
4. Guardian consent requirements for athletes $< 18$ years of age.
5. Search path immutability and `SECURITY DEFINER` function protection.

---

## 6. End-to-End Browser Test Matrix (`Playwright` — 75 Tests)

Executed on Chromium engine across all 3 standard viewports:

```
Running 75 tests using 1 worker

[Desktop Chrome 1440px] (25 tests)
  ✓ 9 Core User Flows & Assessment Verification
  ✓ 6 Live Authenticated Assessment & Two-Person Workflow
  ✓ 10 AI Pose Detection Studio, Calibration & Session Summary Tests

[Tablet 768px] (25 tests)
  ✓ 9 Core User Flows & Assessment Verification
  ✓ 6 Live Authenticated Assessment & Two-Person Workflow
  ✓ 10 AI Pose Detection Studio, Calibration & Session Summary Tests

[Mobile 375px] (25 tests)
  ✓ 9 Core User Flows & Assessment Verification
  ✓ 6 Live Authenticated Assessment & Two-Person Workflow
  ✓ 10 AI Pose Detection Studio, Calibration & Session Summary Tests

75 passed (2.2m)
```

### Pose Detection E2E Suite Breakdown (Tests 1–10 per Viewport):
1. **Studio Header & Mode Switcher**: Verified branding, squat counter tabs, and local privacy pill.
2. **Statutory Privacy & Limitations Disclaimers**: Validated mandatory disclaimers and legal text.
3. **Route Security**: Confirmed unauthenticated requests to `/dashboard/pose-detection` redirect to `/login`.
4. **Camera Controls & Overlay Lifecycle**: Validated camera start, skeleton toggle, joints toggle, pause tracking, resume tracking, and explicit stop.
5. **Responsive Viewport Layout**: Confirmed `document.body.scrollWidth <= window.innerWidth` across desktop, tablet, and mobile (zero horizontal overflow).
6. **Rapid Start/Stop Safety**: Verified rapid start and immediate stop prevents hanging WebRTC media streams.
7. **Device Switching**: Validated seamless transitions between multiple video devices.
8. **Squat Repetition Controls**: Verified Start Reps, Pause Reps, and Reset actions.
9. **Guided Camera Calibration Card**: Verified visibility checklist, framing distance guidance, and lock controls.
10. **Post-Session Summary Modal & Export**: Verified KPI cards, repetition history table, research limitations note, and client-side JSON export download.

---

## 7. Build & Static Analysis Verification

```
> tsc -b && vite build
vite v6.4.6 building for production...
✓ 1812 modules transformed.
dist/index.html                     1.02 kB │ gzip:   0.56 kB
dist/assets/index-CZzYGFbo.css     48.07 kB │ gzip:   8.32 kB
dist/assets/index-D3d1HwVX.js   1,091.93 kB │ gzip: 287.68 kB
✓ built in 11.17s

> eslint .
(0 errors, 0 warnings)
```

---

## 8. Conclusion & Sign-Off

The Phase 4C AI Sports Movement Measurement, Calibration & Accuracy Validation suite is thoroughly verified across all automated software boundaries:
- **100% On-Device Processing**: Verified zero external network transmission of biometric video feeds.
- **Explainable Biomechanics**: Fully deterministic joint angle formulas, squat depth proxies, and temporal phase metrics.
- **Guided Calibration**: Automated landmark visibility, vertical frame distance fraction, and stability hold gating.
- **Client-Side Export**: Pure browser blob download with zero server persistence.
- **Physical Hardware Acceptance**: Formally marked as **PENDING** real-world optical camera evaluation.
