# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4C: Camera Framing, Calibration & Stability Engine

**Document Version:** 1.0.0  
**Phase:** 4C (AI Sports Movement Measurement, Calibration & Accuracy Validation)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Summary

Optical biomechanical measurement from a standard consumer webcam is highly vulnerable to framing artifacts:
- Athletes stepping too close, causing feet or hips to leave the field of view during descent.
- Athletes standing too far, leading to sub-pixel landmark quantization and angle noise.
- Excessive camera tilt angles inducing vertical foreshortening.

Phase 4C implements a **Pre-Session Camera Framing & Calibration Experience** managed by `CalibrationEngine.ts`. The system guides the athlete into an optimal stance and camera position before repetition tracking is locked.

```
 [UNINITIALIZED / AWAITING FRAMING]
                 │
                 ▼ (Subject Enters Camera View)
         [CALIBRATING]
                 │
   ┌─────────────┴─────────────┐
   ▼                           ▼
[VISIBILITY CHECK]     [DISTANCE EVALUATION]
   │                           │
   └─────────────┬─────────────┘
                 │ (Full Body Visible & Distance Optimal)
                 ▼
      [STABILITY HOLD CHECK]
      (Hold upright for 30 stable frames ~ 1.0s)
                 │
                 ▼
       [CALIBRATED & READY] ◄─── (Can Proceed to Workout)
                 │
                 ▼ (Tracking Lost > 3s OR Device Switched OR Scale Shift > 35%)
     [RECALIBRATION REQUIRED]
```

---

## 2. Anatomical Landmark Visibility Checklist

The calibration engine verifies the presence and visibility score of 9 critical landmark anchors:

| Landmark Index | Anatomical Joint | Minimum Confidence | Purpose in Calibration |
| :---: | :--- | :---: | :--- |
| **0** | **Head / Nose** | 0.5 | Ensures athlete's head is not cropped at top of frame |
| **11, 12** | **Shoulders (L/R)** | 0.5 | Torso vector baseline and trunk inclination reference |
| **23, 24** | **Hips (L/R)** | 0.5 | Vertex for hip flexion and proximal point for knee angle |
| **25, 26** | **Knees (L/R)** | 0.5 | Primary joint vertex for squat depth measurement |
| **27, 28** | **Ankles / Feet (L/R)** | 0.5 | Distal anchor ensuring feet are grounded in view |

### Visibility Rule:
$$\text{FullBodyVisible} = \text{HeadVisible} \land (\text{LeftSideVisible} \lor \text{RightSideVisible}) \land (\text{Hip}_L \lor \text{Hip}_R)$$
If feet are cropped: *"Tilt camera down or step back: feet and ankles are clipped."*  
If head is cropped: *"Tilt camera up: head is clipped at the top of the frame."*

---

## 3. Distance & Viewport Proportion Evaluation

Let $y_{\min} = \min_{i \in \text{visible}} y_i$ and $y_{\max} = \max_{i \in \text{visible}} y_i$ in normalized screen coordinates $[0.0, 1.0]$. The athlete's vertical frame proportion is:
$$H_{\text{athlete}} = y_{\max} - y_{\min}$$

The engine classifies framing distance into three zones:

| Category | Height Fraction | User Experience Feedback |
| :--- | :---: | :--- |
| **Too Far** | $H_{\text{athlete}} < 0.38$ | *"Step closer to the camera to ensure accurate joint tracking."* |
| **Optimal** | $0.38 \le H_{\text{athlete}} \le 0.88$ | *"Subject height is well proportioned in frame."* |
| **Too Close** | $H_{\text{athlete}} > 0.88$ or $y_{\max} > 0.98$ or $y_{\min} < 0.02$ | *"Step back 2–3 feet so your entire body remains visible during squats."* |

---

## 4. Postural Stability Confirmation

To avoid locking calibration while the athlete is actively walking into position, the engine requires a **postural hold**:
1. Consecutive stable frames counter: $N_{\text{stable}} \ge 30$ frames ($\approx 1.0\text{second}$ at 30 FPS).
2. Inter-frame displacement tolerance:
   $$\Delta_{\text{hip}} = |y_{\text{hip}}[t] - y_{\text{hip}}[t-1]| < 0.012$$
   $$\Delta_{\text{shoulder}} = |y_{\text{shoulder}}[t] - y_{\text{shoulder}}[t-1]| < 0.012$$
3. Progress indicator: Visual progress bar increments from $0\%$ to $100\%$ ($N_{\text{stable}} / 30 \times 100\%$).
4. If the athlete moves abruptly during the hold, the stability counter is smoothly decremented.

---

## 5. Body Orientation Classification

The engine evaluates orientation relative to the camera lens:
- **Sagittal Profile (90°):** $|C_{\text{left}} - C_{\text{right}}| > 0.40$ (unilateral dominant confidence). **Recommended for pure knee kinematics.**
- **45° Oblique Angle:** Both sides visible with moderate shoulder horizontal width ($W_{\text{shoulder}} < 0.12$). **Acceptable for compound tracking.**
- **Frontal View:** Symmetrical bilateral visibility with wide shoulder spread ($W_{\text{shoulder}} \ge 0.12$). **Acceptable, but knee angles represent projected frontal plane.**

---

## 6. Dynamic Recalibration Triggers

The system automatically invalidates calibration and prompts recalibration when:
1. **Camera Device Switch:** User selects a new webcam from the device dropdown.
2. **Subject Disappearance:** No landmarks detected for $> 3.0\text{seconds}$ during an active session.
3. **Framing Scale Discontinuity:** Detected athlete height changes by $> 35\%$ ($|H_t - H_{\text{calibrated}}| > 0.35$), indicating device movement or significant repositioning.
4. **Manual Trigger:** User clicks the "Reset" or "Calibrate" action button in the UI.

---

## 7. Monocular Perspective Error Disclosure

> [!IMPORTANT]
> **CAMERA CALIBRATION LIMITATION NOTICE:**
>
> Camera framing calibration verifies that anatomical landmarks are positioned within the 2D optical field of view.
>
> **Calibration does NOT eliminate monocular perspective error, out-of-plane rotation, or lens radial distortion.**
>
> If an athlete turns obliquely during a squat, projected 2D joint angles may vary by $\pm 3^\circ - 7^\circ$ relative to true 3D skeletal geometry. For high-stakes official assessment verification, certified multi-camera or wearable sensor systems are required.
