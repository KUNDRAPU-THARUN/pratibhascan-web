# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4C: Biomechanical Movement Measurement Architecture

**Document Version:** 1.0.0  
**Phase:** 4C (AI Sports Movement Measurement, Calibration & Accuracy Validation)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Summary & Measurement Philosophy

Phase 4C expands the PratibhaScan pose analysis pipeline from repetition counting into an explainable, deterministic **Biomechanical Movement Measurement Engine**. 

In sports science and athletic talent scouting, computer vision applications often over-claim capabilities by attempting to derive uncalibrated real-world metrics (e.g. bar velocity, jump height in centimeters, ground reaction forces) from single 2D camera streams. 

PratibhaScan Web adheres to strict biomechanical honesty:
1. **Measurable Quantities:** Planar joint angles, angular velocities, temporal phase durations (descent, bottom hold, ascent), and observable landmark ratios.
2. **Observable Proxies:** Planar landmark vertical offsets ($\Delta y = y_{\text{hip}} - y_{\text{knee}}$) are explicitly presented as *visual proxies*, not absolute 3D metric distances.
3. **Unmeasurable Quantities (Explicitly Rejected):** Metric bar speed (m/s), 3D joint torques (Nm), ground reaction forces (N), and clinical joint translations are flagged as **NOT MEASURABLE** from a single monocular 2D webcam without multi-camera calibration or force plates.

---

## 2. Deterministic Kinematic Formulas & Measurement Specifications

The engine processes 33 normalized landmarks from Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) in normalized coordinates:
$$\mathbf{p} = (x, y, z), \quad x \in [0.0, 1.0], \, y \in [0.0, 1.0]$$
Origin $(0, 0)$ is at top-left; $X$ extends right, $Y$ extends downwards.

### 2.1 Left and Right Knee Flexion Angle ($\angle H-K-A$)
- **Formulas:**
  $$\mathbf{u}_L = \vec{K_L H_L} = (x_{H_L} - x_{K_L}, \, y_{H_L} - y_{K_L}), \quad \mathbf{v}_L = \vec{K_L A_L} = (x_{A_L} - x_{K_L}, \, y_{A_L} - y_{K_L})$$
  $$\theta_{\text{knee\_L}} = \arccos\left(\text{clamp}\left(\frac{\mathbf{u}_L \cdot \mathbf{v}_L}{\max(\|\mathbf{u}_L\| \|\mathbf{v}_L\|, 10^{-7})}, -1.0, 1.0\right)\right) \times \frac{180}{\pi}$$
  $$\mathbf{u}_R = \vec{K_R H_R} = (x_{H_R} - x_{K_R}, \, y_{H_R} - y_{K_R}), \quad \mathbf{v}_R = \vec{K_R A_R} = (x_{A_R} - x_{K_R}, \, y_{A_R} - y_{K_R})$$
  $$\theta_{\text{knee\_R}} = \arccos\left(\text{clamp}\left(\frac{\mathbf{u}_R \cdot \mathbf{v}_R}{\max(\|\mathbf{u}_R\| \|\mathbf{v}_R\|, 10^{-7})}, -1.0, 1.0\right)\right) \times \frac{180}{\pi}$$
- **Units:** Degrees ($^\circ$) [0.0° to 180.0°]
- **Input Landmarks:**
  - Left Knee: Hip (23), Knee (25), Ankle (27)
  - Right Knee: Hip (24), Knee (26), Ankle (28)
- **Confidence Gate:** $\min(C_H, C_K, C_A) \ge 0.5$
- **Biomechanical Range:** Standing upright $\approx 170^\circ - 180^\circ$; Thighs parallel to ground $\approx 90^\circ - 100^\circ$; Deep squat $\le 85^\circ$.
- **Validation:** Planar trigonometry synthesis vs. ground truth ($\pm 0.00001^\circ$ precision in validation harness).

### 2.2 Left and Right Hip Flexion Angle ($\angle S-H-K$)
- **Formulas:**
  $$\mathbf{u}_{S-H} = \vec{H S} = (x_S - x_H, \, y_S - y_H), \quad \mathbf{v}_{H-K} = \vec{H K} = (x_K - x_H, \, y_K - y_H)$$
  $$\theta_{\text{hip}} = \arccos\left(\text{clamp}\left(\frac{\mathbf{u}_{S-H} \cdot \mathbf{v}_{H-K}}{\max(\|\mathbf{u}_{S-H}\| \|\mathbf{v}_{H-K}\|, 10^{-7})}, -1.0, 1.0\right)\right) \times \frac{180}{\pi}$$
- **Units:** Degrees ($^\circ$) [0.0° to 180.0°]
- **Input Landmarks:**
  - Left Hip: Shoulder (11), Hip (23), Knee (25)
  - Right Hip: Shoulder (12), Hip (24), Knee (26)
- **Confidence Gate:** $\min(C_S, C_H, C_K) \ge 0.5$
- **Biomechanical Range:** Standing extension $\approx 165^\circ - 180^\circ$; Squat bottom flexion $\approx 65^\circ - 95^\circ$.

### 2.3 Trunk Inclination (Torso Lean Angle)
- **Formula:**
  Angle between the spine segment $(S - H)$ and upward vertical $\mathbf{g} = (0, -1)$:
  $$\mathbf{t} = (x_S - x_H, \, y_S - y_H)$$
  $$\theta_{\text{trunk}} = \arccos\left(\text{clamp}\left(\frac{-t_y}{\max(\|\mathbf{t}\|, 10^{-7})}, -1.0, 1.0\right)\right) \times \frac{180}{\pi}$$
- **Units:** Degrees ($^\circ$) [0.0° (vertical) to 90.0° (horizontal)]
- **Input Landmarks:** Shoulder midpoint (11, 12) to Hip midpoint (23, 24) or dominant side.
- **Biomechanical Interpretation:**
  - $0^\circ - 25^\circ$: Upright torso (Olympic style / front squat)
  - $25^\circ - 45^\circ$: Normal athletic torso lean (bodyweight / low bar squat)
  - $> 45^\circ$: Excessive forward lean (flagged: *"caution: forward torso lean"* to highlight potential lumbar flexion)

### 2.4 Observable Squat Depth Proxy ($\Delta y$)
- **Formula:**
  $$\Delta y = y_{\text{hip}} - y_{\text{knee}}$$
  In normalized image space where $Y$ points down:
  - $\Delta y < -0.02$: **Above Parallel** (hip joint visibly higher than knee)
  - $|\Delta y| \le 0.02$: **Parallel** (hip joint level with knee joint horizontal plane)
  - $\Delta y > +0.02$: **Below Parallel** (hip joint visibly lower than knee center)
- **Units:** Dimensionless ratio of camera viewport height
- **Confidence Gate:** Both hip and knee visibility $\ge 0.5$
- **Limitations:** Dependent on camera lens pitch angle and height relative to athlete hips.

---

## 3. Movement Timing Breakdown Specifications

For every repetition cycle, the engine continuously tracks four micro-temporal boundaries:

```
  Descent Start (t_descend)  ───► Knee angle drops < 140°
  Bottom Reached (t_bottom)  ───► Knee angle reaches ≤ 100° (held ≥ 50ms)
  Ascent Start (t_ascent)    ───► Knee angle rises > 115°
  Completion (t_complete)    ───► Knee angle returns ≥ 155°
```

| Phase | Metric Name | Mathematical Formula | Units | Physiological Typical Range |
| :--- | :--- | :--- | :---: | :---: |
| **Eccentric Phase** | `descentDurationMs` | $t_{\text{bottom}} - t_{\text{descend}}$ | ms | 800 ms – 1,800 ms |
| **Isometric Reversal** | `bottomDurationMs` | $t_{\text{ascent}} - t_{\text{bottom}}$ | ms | 50 ms – 500 ms |
| **Concentric Phase** | `ascentDurationMs` | $t_{\text{complete}} - t_{\text{ascent}}$ | ms | 700 ms – 1,600 ms |
| **Total Movement** | `totalDurationMs` | $t_{\text{complete}} - t_{\text{descend}}$ | ms | 1,600 ms – 3,500 ms |

### Anomaly Filters:
- If `totalDurationMs` $< 600\text{ms}$: movement is rejected as a sub-physiological twitch or sensor jump.
- If `totalDurationMs` $> 8,000\text{ms}$: repetition times out and state safely resets to standing.

---

## 4. Repetition Classification: Full vs. Partial Repetitions

1. **Completed Repetition:**
   - Satisfies descent initiation ($< 140^\circ$).
   - Satisfies target depth ($\le 100^\circ$ for $\ge 50\text{ms}$).
   - Satisfies ascent turnaround ($> 115^\circ$).
   - Satisfies full extension lockout ($\ge 155^\circ$).
   - Total duration $\ge 600\text{ms}$.
   - Increments `repetitionCount`, stores `isCompleted: true`, and initiates 300ms debounce cooldown.

2. **Partial Repetition:**
   - Descends below $140^\circ$, but athlete reverses direction before reaching target depth ($\le 100^\circ$) and returns upright past $155^\circ$.
   - Increments `partialRepCount`, stores `isCompleted: false`, logs `depthClassification: 'above_parallel'`, and informs athlete: *"Partial repetition: try squatting a bit lower."*

---

## 5. Movement Coverage & Interruption Telemetry

- **Tracking Coverage Percentage:**
  $$\text{Coverage} = \frac{N_{\text{valid}}}{N_{\text{total}}} \times 100\%$$
  Where $N_{\text{valid}}$ is the number of frames where landmark confidence $\ge 0.5$ and essential joints are unoccluded, and $N_{\text{total}}$ is the total frames received during active session time.
- **Movement Interruptions:**
  Increments whenever tracking drops below confidence threshold during active movement or when the user initiates a manual pause.

---

## 6. Real vs. Proxy Measurement Disclosure Matrix

| Physical Quantity | Engine Status | Output Method | Reason / Hardware Barrier |
| :--- | :---: | :---: | :--- |
| **Planar Knee Angle** | Real | $88.4^\circ$ | Derived directly from 2D Euclidean vectors |
| **Planar Hip Angle** | Real | $76.2^\circ$ | Derived directly from 2D Euclidean vectors |
| **Trunk Inclination** | Real | $28.5^\circ$ | Angular deflection from vertical gravity vector |
| **Phase Timings (ms)** | Real | $1,250\text{ms}$ | Derived from monotonic browser timestamps |
| **Repetition Count** | Real | 12 | State machine hysteresis transitions |
| **Planar Depth** | **Proxy** | `below_parallel` | Observable $\Delta y$ ratio in screen space; not a 3D distance |
| **Bar / Body Velocity (m/s)** | **Not Measurable** | N/A | Monocular depth scale factor unknown without 3D metric reference |
| **Jump Height (cm)** | **Not Measurable** | N/A | Requires calibrated ground plane and focal length extrinsic matrix |
| **Ground Reaction Force (N)** | **Not Measurable** | N/A | Cannot compute Newton forces without contact force plates |
