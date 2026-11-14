# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4B: Biomechanical Angle Calculation & Mathematical Modeling

**Document Version:** 1.0.0  
**Phase:** 4B (Biomechanical Measurement & Squat Repetition Counting)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Summary & Biomechanical Objectives

In Phase 4B, PratibhaScan Web integrates real-time biomechanical kinematics directly into the client-side browser pipeline. Built on the 33 anatomical landmarks provided by Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`), the engine computes exact 2D/3D planar joint angles with strict numerical stability guarantees, bilateral side arbitration, and temporal jitter smoothing.

The primary kinematics focus for Phase 4B is the **Bodyweight Squat**, requiring real-time tracking of:
1. **Knee Angle ($\angle H-K-A$):** Hip $\to$ Knee $\to$ Ankle
2. **Hip Angle ($\angle S-H-K$):** Shoulder $\to$ Hip $\to$ Knee
3. **Trunk Inclination:** Angular deflection of the torso from the vertical gravity axis

All calculations are executed in browser volatile memory with $O(1)$ constant computational complexity per frame, sustaining zero latency overhead and complete data privacy.

---

## 2. Mathematical Definition of 3-Point Joint Angles

Given three anatomical keypoints in 2D/3D space:
- Point $A$: Proximal joint (e.g., Hip)
- Point $B$: Vertex joint (e.g., Knee)
- Point $C$: Distal joint (e.g., Ankle)

Let landmark coordinates be denoted as $A(x_A, y_A)$, $B(x_B, y_B)$, and $C(x_C, y_C)$.

### 2.1 Vector Formulation
Two displacement vectors originating at vertex joint $B$ are formed:
$$\mathbf{u} = \vec{BA} = (x_A - x_B, \, y_A - y_B)$$
$$\mathbf{v} = \vec{BC} = (x_C - x_B, \, y_C - y_B)$$

### 2.2 Dot Product & Vector Magnitudes
The scalar dot product between $\mathbf{u}$ and $\mathbf{v}$ is given by:
$$\mathbf{u} \cdot \mathbf{v} = u_x v_x + u_y v_y$$

The Euclidean norms (magnitudes) are:
$$\|\mathbf{u}\| = \sqrt{u_x^2 + u_y^2}$$
$$\|\mathbf{v}\| = \sqrt{v_x^2 + v_y^2}$$

### 2.3 Cosine Ratio & Angular Inversion
Applying the Law of Cosines via the Euclidean inner product:
$$\cos \theta = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$$

The planar angle in radians is obtained via the inverse cosine:
$$\theta = \arccos(\cos \theta)$$

Converting from radians to degrees:
$$\theta_{\text{deg}} = \theta \times \frac{180}{\pi}$$

---

## 3. Numerical Stability & Floating-Point Hardening

In real-world computer vision, camera noise, occlusions, or sub-pixel coordinate snapping can cause degenerate vectors or floating-point domain errors. The PratibhaScan biomechanics engine implements three mandatory safeguards:

### 3.1 Epsilon Magnitude Protection
If either vector magnitude $\|\mathbf{u}\|$ or $\|\mathbf{v}\|$ approaches zero (e.g., when keypoints coincide or overlap), standard division yields `NaN` or `Infinity`. An epsilon floor ($\epsilon = 10^{-7}$) is enforced:
```typescript
const magnitudeProduct = Math.sqrt(magUSq * magVSq);
if (magnitudeProduct < 1e-7) {
  return null;
}
```

### 3.2 Strict Domain Clamping for Arccos
Due to IEEE 754 floating-point rounding errors, the ratio $\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$ can occasionally evaluate to `1.0000000000000002` or `-1.0000000000000002`. In JavaScript, `Math.acos(1.0000000000000002)` evaluates to `NaN`.

The engine clamps the cosine ratio to the closed interval $[-1.0, 1.0]$ prior to calling `Math.acos()`:
```typescript
const clampedCos = Math.max(-1.0, Math.min(1.0, dotProduct / magnitudeProduct));
const angleRad = Math.acos(clampedCos);
```

### 3.3 Non-Finite Coordinate Gating
Before any trigonometric operations occur, all coordinates ($x, y$) and landmark visibility/presence scores are validated against non-finite values (`isNaN`, `!isFinite`, `null`, `undefined`). Any corrupted coordinate immediately returns `null` rather than poisoning downstream state machines.

---

## 4. Anatomical Angle Specifications

### 4.1 Knee Angle ($\angle H-K-A$)
- **Vertex:** Knee (Landmark 25 Left, 26 Right)
- **Proximal:** Hip (Landmark 23 Left, 24 Right)
- **Distal:** Ankle (Landmark 27 Left, 28 Right)
- **Biomechanical Range:**
  - Full Standing Extension: $\approx 170^\circ - 180^\circ$
  - Descending Transition: $140^\circ \to 100^\circ$
  - Target Squat Depth (Thigh Parallel / Sub-parallel): $\le 100^\circ$
  - Deep Squat: $\le 80^\circ$

### 4.2 Hip Angle ($\angle S-H-K$)
- **Vertex:** Hip (Landmark 23 Left, 24 Right)
- **Proximal:** Shoulder (Landmark 11 Left, 12 Right)
- **Distal:** Knee (Landmark 25 Left, 26 Right)
- **Biomechanical Range:**
  - Full Standing Extension: $\approx 170^\circ - 180^\circ$
  - Squat Bottom Flexion: $\approx 75^\circ - 110^\circ$ (depending on anthropometry)

### 4.3 Trunk Inclination (Torso Lean)
Measures the angular departure of the spinal column from true vertical.
- **Proximal:** Shoulder ($S$)
- **Distal:** Hip ($H$)
- **Reference Vector:** Upward vertical $\mathbf{g} = (0, -1)$
- **Calculation:**
$$\mathbf{t} = S - H = (x_S - x_H, \, y_S - y_H)$$
$$\theta_{\text{trunk}} = \arccos\left(\frac{-t_y}{\|\mathbf{t}\|}\right) \times \frac{180}{\pi}$$
- **Interpretation:**
  - $0^\circ - 25^\circ$: Upright torso (Olympic style / high-bar squat)
  - $25^\circ - 45^\circ$: Normal athletic forward lean (low-bar / bodyweight squat)
  - $> 45^\circ$: Excessive forward lean (flagged as posture breakdown / risk of lumbar shear)

---

## 5. Side Profile Visibility Arbitration

Athletes may perform squats facing the camera obliquely, directly from the side (sagittal plane), or straight on (frontal plane). Single-camera 2D projection suffers from perspective foreshortening when a limb is viewed off-axis.

The engine computes an average confidence score for each body profile:
$$C_{\text{left}} = \frac{c_{\text{shoulder\_l}} + c_{\text{hip\_l}} + c_{\text{knee\_l}} + c_{\text{ankle\_l}}}{4}$$
$$C_{\text{right}} = \frac{c_{\text{shoulder\_r}} + c_{\text{hip\_r}} + c_{\text{knee\_r}} + c_{\text{ankle\_r}}}{4}$$

### Arbitration Policy:
1. **Dominant Sagittal Profile ($|C_{\text{left}} - C_{\text{right}}| > 0.1$):**
   The side with higher confidence is selected as the primary kinematic chain. This prevents occlusion artifacts where the far leg is partially hidden by the near leg.
2. **Bilateral Frontal Tracking ($|C_{\text{left}} - C_{\text{right}}| \le 0.1$ and both $> 0.6$):**
   When the athlete directly faces the camera or is at a symmetrical 45° angle, both left and right angles are computed and averaged:
   $$\theta_{\text{knee}} = \frac{\theta_{\text{knee\_left}} + \theta_{\text{knee\_right}}}{2}$$
3. **Low Confidence Gate ($C < 0.5$):**
   If key anatomical points fall below a visibility/presence confidence threshold of 0.5, joint angles are not computed and the frame is flagged as low quality.

---

## 6. Temporal Jitter Reduction (Exponential Moving Average)

Even with optimal lighting and MediaPipe tracking, raw per-frame landmark coordinates exhibit discrete 1-3 pixel quantization noise. Direct angular calculation produces micro-fluctuations ($\pm 2^\circ - 5^\circ$) that could trigger false state transitions.

The engine applies a first-order Exponential Moving Average (EMA) filter:
$$\theta_{\text{smooth}}[t] = \alpha \cdot \theta_{\text{raw}}[t] + (1 - \alpha) \cdot \theta_{\text{smooth}}[t-1]$$

- **Smoothing Factor ($\alpha = 0.65$):**
  - High responsiveness: 65% weight on the current instantaneous frame.
  - Jitter suppression: 35% memory from the smoothed historical value.
  - Latency impact: $< 1.5$ frames ($\approx 33\text{ms}$ at 30 FPS), maintaining zero perceivable lag for the user.

---

## 7. Performance & Computational Footprint

- **Time Complexity:** $O(1)$ per frame (6 vector subtractions, 4 square roots, 3 dot products, 3 arccos operations).
- **Memory Allocation:** Zero garbage collection pressure — vectors are computed using primitive scalar variables without creating intermediate objects in the render loop.
- **Client Execution:** Runs entirely on CPU/GPU WebAssembly thread; zero data packets sent to server.
