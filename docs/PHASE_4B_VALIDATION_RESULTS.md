# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4B: Squat Kinematics Validation & Synthetic Benchmark Results

**Document Version:** 1.0.0  
**Phase:** 4B (Biomechanical Measurement & Squat Repetition Counting)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Summary & Verification Methodology

To verify the mathematical accuracy and edge-case resilience of the Phase 4B Squat State Machine prior to physical field trials, an automated synthetic kinematics validation harness was created in `src/features/pose-detection/utils/squatValidationHarness.ts`.

The harness generates precise, mathematically calculated MediaPipe 33-landmark coordinate streams by projecting anatomical joint vectors via planar trigonometry:
$$x_{\text{knee}} = x_{\text{ankle}} + L_{\text{tibia}} \cos \theta_{\text{knee}}$$
$$y_{\text{knee}} = y_{\text{ankle}} - L_{\text{tibia}} \sin \theta_{\text{knee}}$$
$$x_{\text{hip}} = x_{\text{knee}} + L_{\text{femur}} \cos(\pi - \theta_{\text{hip}})$$
$$y_{\text{hip}} = y_{\text{knee}} - L_{\text{femur}} \sin(\pi - \theta_{\text{hip}})$$

This provides zero coordinate deviation ($\pm 0.00001^\circ$ precision), enabling deterministic verification of state transitions, temporal gates, and edge-case handling.

---

## 2. Synthetic Test Sequence Benchmark Results

The validation harness executes five distinct kinematic sequences designed to test authentic athletic movements and edge cases:

| Sequence ID | Scenario Description | Cadence & Trajectory | Expected Output | Actual Output | Accuracy | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **SEQ-01** | **Three Clean Squats** | 3 complete reps ($175^\circ \to 95^\circ \to 175^\circ$) @ 1.8s/rep | 3 Completed, 0 Partial | **3 Completed, 0 Partial** | 100% | **PASS** |
| **SEQ-02** | **Standing Postural Jitter** | Upright stance with micro-noise ($175^\circ \pm 4^\circ$) over 90 frames | 0 Completed, 0 Partial | **0 Completed, 0 Partial** | 100% | **PASS** |
| **SEQ-03** | **Two Partial / Shallow Squats** | Incomplete depth ($175^\circ \to 125^\circ \to 175^\circ$) reversing early | 0 Completed, 2 Partial | **0 Completed, 2 Partial** | 100% | **PASS** |
| **SEQ-04** | **Sub-physiological Twitch (200ms)** | Instantaneous drop to $90^\circ$ and return in 200ms | 0 Completed (Duration Gate) | **0 Completed, 0 Partial** | 100% | **PASS** |
| **SEQ-05** | **Tracking Occlusion & Recovery** | Descent interrupted by 5 frames of low confidence ($< 0.3$) | 0 Completed, Clean Recovery | **0 Completed, Clean Recovery** | 100% | **PASS** |

### Detailed Analysis by Sequence:

### 2.1 SEQ-01: Authentic Athletic Cadence (3 Clean Reps)
- **Objective:** Verify standard repetition counting without missed reps or false transitions.
- **Kinematic Profile:**
  - Rep 1: Frame 0–50 ($t = 0\text{ms} \to 1666\text{ms}$): $175^\circ \to 95^\circ \to 175^\circ$
  - Rep 2: Frame 60–110 ($t = 2000\text{ms} \to 3666\text{ms}$): $175^\circ \to 95^\circ \to 175^\circ$
  - Rep 3: Frame 120–170 ($t = 4000\text{ms} \to 5666\text{ms}$): $175^\circ \to 95^\circ \to 175^\circ$
- **Result:**
  - State progression traversed cleanly: `standing` $\to$ `descending` $\to$ `bottom` $\to$ `ascending` $\to$ `completed` $\to$ `standing` for each cycle.
  - Final Count: **3 valid completed repetitions**, 0 partials, 0 state errors.

### 2.2 SEQ-02: Standing Postural Jitter & Noise Immunity
- **Objective:** Ensure resting breathing, natural body sway, or sub-pixel camera sensor noise does not increment repetition counters.
- **Kinematic Profile:**
  - Knee angle artificially fluctuated between $171^\circ$ and $179^\circ$ across 90 frames (3 seconds).
- **Result:**
  - State remained locked in `standing` throughout.
  - Hysteresis threshold ($< 140^\circ$) safely ignored all noise.
  - Final Count: **0 repetitions, 0 partials (100% false-positive rejection)**.

### 2.3 SEQ-03: Partial / Shallow Squat Discrimination
- **Objective:** Ensure athletes who descend partially without reaching target depth ($\le 100^\circ$) are not credited with full repetitions.
- **Kinematic Profile:**
  - Two reps descending from $175^\circ$ to $125^\circ$ before returning upright to $175^\circ$.
- **Result:**
  - State transitioned from `standing` to `descending`. Upon returning past $155^\circ$ without reaching `bottom`, the engine incremented `partialRepCount` and returned to `standing`.
  - Final Count: **0 completed repetitions, 2 partial repetitions recorded**.

### 2.4 SEQ-04: Sub-physiological Twitch Rejection (Duration Gating)
- **Objective:** Eliminate tracking anomalies where an instantaneous keypoint hop simulates a squat cycle in under 600ms.
- **Kinematic Profile:**
  - Full descent to $90^\circ$ and return to $175^\circ$ executed over 6 frames (200ms).
- **Result:**
  - Repetition duration ($200\text{ms} < 600\text{ms}$) failed the minimum duration gate.
  - The repetition was rejected and not credited.
  - Final Count: **0 repetitions counted**.

### 2.5 SEQ-05: Tracking Occlusion & Graceful Recovery
- **Objective:** Verify safe state handling when an athlete is occluded mid-exercise.
- **Kinematic Profile:**
  - Descent begins towards $120^\circ$. At frame 15, keypoints drop confidence to $0.2$ for 5 consecutive frames, simulating complete body occlusion. Normal tracking resumes at frame 21 with upright posture ($175^\circ$).
- **Result:**
  - FSM shifted to `tracking_lost`. Upon resumption at $175^\circ$, it reset cleanly to `standing`.
  - No phantom repetitions or unhandled exceptions occurred.

---

## 3. Physical Camera Hardware Validation Status

> [!IMPORTANT]
> **PHYSICAL CAMERA HARDWARE VALIDATION STATUS: PENDING**
>
> All reported verification metrics in this document are derived from automated synthetic kinematics simulation, simulated video streams, and deterministic software test harnesses.
>
> **No claim of certified physical camera validation or clinical biomechanical measurement is made.**
>
> Real-world hardware validation with live human subjects across diverse demographic cohorts, skin tones, athletic clothing types, mobile/laptop camera lenses, and varied ambient lighting environments is scheduled for dedicated on-site field testing during Phase 5.
>
> In accordance with KAARYAN LABS standards, the software displays prominent statutory notices:
> 1. *"100% Local Inference — No video is uploaded or recorded by this feature."*
> 2. *"Experimental Studio Disclaimer — Pose detection is experimental and is not a certified sports measurement."*
