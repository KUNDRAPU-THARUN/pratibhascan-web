# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4B: Squat Repetition Recognition & State Machine Architecture

**Document Version:** 1.0.0  
**Phase:** 4B (Biomechanical Measurement & Squat Repetition Counting)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Overview

In sports biomechanics, automated repetition counting cannot rely on trivial peak detection or single-threshold triggers. Simple thresholding suffers from double counting, twitch artifacts, shallow squat misclassification, and noise-induced state oscillations.

Phase 4B introduces a deterministic, deterministic **Squat Movement Finite State Machine (FSM)**. The engine models the full human kinematic cycle of a bodyweight squat through discrete anatomical phases with explicit hysteresis thresholds, temporal hold constraints, debouncing windows, and partial repetition tracking.

```
 [IDLE]
    │ (Start Session & Knee ≥ 155°)
    ▼
 [STANDING] ◄─────────────────────────────────────────────┐
    │                                                     │
    │ (Knee < 140°)                                       │
    ▼                                                     │
 [DESCENDING] ──── (Returns to ≥ 155° without ≤ 100°) ────┤ [PARTIAL REP]
    │                                                     │
    │ (Knee ≤ 100° for ≥ 50ms)                            │
    ▼                                                     │
  [BOTTOM]                                                │
    │                                                     │
    │ (Knee > 115°)                                       │
    ▼                                                     │
 [ASCENDING]                                              │
    │                                                     │
    │ (Knee ≥ 155° AND Rep Duration ≥ 600ms)              │
    ▼                                                     │
[COMPLETED] ─── (Increment Count & 300ms Cooldown) ───────┘
```

---

## 2. Finite State Machine (FSM) States

The state machine implements seven discrete operational states defined in `src/features/pose-detection/types/squat.types.ts`:

| State | Name | Trigger Condition | Biomechanical Meaning |
| :--- | :--- | :--- | :--- |
| `idle` | Idle | Session inactive / paused | Camera may be active, but workout session is stopped. |
| `standing` | Standing Upright | Knee angle $\ge 155^\circ$ | Athlete is standing tall in full extension, ready to initiate a rep. |
| `descending` | Descending | Knee angle $< 140^\circ$ | Eccentric phase: hips and knees flexing downward. |
| `bottom` | Target Depth | Knee angle $\le 100^\circ$ for $\ge 50\text{ms}$ | Isometric reversal: thighs parallel or sub-parallel to ground. |
| `ascending` | Ascending | Knee angle $> 115^\circ$ (from bottom) | Concentric phase: athlete driving upward against gravity. |
| `completed` | Completed Repetition | Knee angle $\ge 155^\circ$ & duration $\ge 600\text{ms}$ | Full lockout attained; rep count incremented and logged. |
| `tracking_lost` | Tracking Interrupted | Confidence $< 0.5$ or missing landmarks | Key joints occluded or athlete moved outside camera frame. |

---

## 3. Hysteresis Thresholds & Oscillation Immunity

Single-threshold counters fail because human joint movement around a boundary oscillates back and forth across a single degree due to sensor noise. The PratibhaScan engine utilizes **dual-threshold hysteresis**:

### 3.1 Descent Initiation vs. Full Extension
- **Descent Threshold:** $\theta_{\text{knee}} < 140^\circ$
  - The athlete must genuinely initiate downward movement past a $15^\circ$ buffer from standing ($155^\circ$) before `descending` begins.
- **Ascent Completion Threshold:** $\theta_{\text{knee}} \ge 155^\circ$
  - To complete the rep, the athlete must return to full upright extension. A half-extended pause at $145^\circ$ does not complete the rep.

### 3.2 Target Depth vs. Ascent Trigger
- **Target Depth Threshold:** $\theta_{\text{knee}} \le 100^\circ$
  - Requires thighs to reach at least parallel with the floor ($\approx 90^\circ - 100^\circ$).
- **Ascent Initiation Threshold:** $\theta_{\text{knee}} > 115^\circ$
  - From the bottom state, an upward movement of at least $15^\circ$ past depth is required to transition to `ascending`. This prevents noise at the turnaround point from rapidly cycling states.

---

## 4. Temporal Gates & Physical Anomaly Rejection

To ensure only authentic athletic movements are recorded, four temporal constraints are enforced:

### 4.1 Minimum Bottom Hold Duration (50 ms)
- An athlete cannot bounce off target depth instantaneously.
- The engine requires that $\theta_{\text{knee}} \le 100^\circ$ continuously for at least $50\text{ms}$ before confirming the `bottom` state.
- **Benefit:** Eliminates single-frame tracking glitches where a dropped landmark instantaneously reads as an extreme angle.

### 4.2 Minimum Repetition Duration (600 ms)
- A physiologically authentic human bodyweight squat requires at least 0.6 seconds (typically 1.5s to 3.0s).
- Any descent-and-ascent sequence completed in $< 600\text{ms}$ is rejected as a fast camera twitch, hand pass, or subject repositioning.

### 4.3 Maximum Repetition Timeout (8,000 ms)
- If an athlete initiates a descent but remains in `descending`, `bottom`, or `ascending` for more than 8 seconds without completing the movement, the rep times out.
- The state safely resets to `standing` or `idle` without counting a rep.

### 4.4 Debounce / Post-Repetition Cooldown (300 ms)
- Upon transitioning from `ascending` to `completed`, a 300ms cooldown timer starts.
- Any rapid oscillation across the $155^\circ$ threshold during joint lockout cannot trigger a secondary repetition.

---

## 5. Partial Repetition Detection & Form Feedback

In standard fitness assessments, counting shallow squats as full repetitions compromises data validity. The PratibhaScan engine explicitly tracks **Partial Repetitions**:

- **Trigger:** If the athlete transitions into `descending` ($\theta_{\text{knee}} < 140^\circ$), but reverses direction and returns to upright standing ($\theta_{\text{knee}} \ge 155^\circ$) **without ever satisfying the bottom depth condition** ($\theta_{\text{knee}} \le 100^\circ$), a partial rep is registered:
  ```typescript
  if (this.state === 'descending' && kneeAngle >= this.config.standingExtensionThreshold) {
    this.partialRepCount++;
    this.state = 'standing';
  }
  ```
- **Athlete UI Display:** The live counter UI displays:
  - Valid Completed Reps (green prominent counter)
  - Partial Incomplete Reps (amber advisory badge: *"X incomplete depth reps"*)
  - Real-time Depth Progress Bar (calibrated from $180^\circ = 0\%$ to $100^\circ = 100\%$)

---

## 6. Tracking Loss Handling & Graceful Recovery

Real-world athletes frequently drift out of frame or experience momentary occlusions.

### 6.1 Low Confidence Gating ($< 0.5$)
If the key anatomical landmarks (shoulder, hip, knee, ankle) have average visibility/presence $< 0.5$:
1. A consecutive lost frame counter increments.
2. If lost for more than 5 consecutive frames ($\approx 160\text{ms}$), state shifts to `tracking_lost`.
3. In-flight rep timers are paused to prevent arbitrary timeouts.

### 6.2 Safe Resumption
When valid tracking is restored:
- If the athlete is upright ($\theta_{\text{knee}} \ge 150^\circ$), the state transitions directly to `standing`.
- The engine **never** auto-completes an interrupted rep upon tracking restoration, preventing false positive counts.

---

## 7. Data Privacy & Zero-Persistence Guarantee

In accordance with KAARYAN LABS privacy standards:
- Repetition records, time deltas, and angles exist **solely in React component state and volatile browser RAM**.
- No video, coordinates, or squat logs are saved to Supabase during Phase 4B.
- Stopping or closing the tab immediately deallocates all tracking telemetry.
