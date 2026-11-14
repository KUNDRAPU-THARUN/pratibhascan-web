# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4A.1: Skeleton Alignment Accuracy & Pose Coordinate Audit

**Document Version:** 1.0.0  
**Phase:** 4A.1 (Camera Validation, Pose Accuracy & Performance Hardening)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Summary & Scientific Disclaimer

This audit evaluates the geometric and anatomical alignment accuracy of the MediaPipe 33-point human pose estimation pipeline implemented in PratibhaScan Web.

> [!IMPORTANT]
> **Biomechanical Validation Disclaimer:**  
> The 33-landmark pose estimation provided by MediaPipe Tasks Vision is a computer-vision-based approximation derived from monocular RGB video feeds. It is designed for **athletic movement screening, posture feedback, and talent identification assistance**. It is **not** a certified biomechanical gold-standard measurement system (such as Vicon optical motion capture, Qualisys multi-camera systems, or dual-force plates) and should not be used as clinical diagnostic proof.

---

## 2. Coordinate Transformation Architecture

MediaPipe outputs 33 normalized landmarks:
$$x_{\text{norm}} \in [0.0, 1.0], \quad y_{\text{norm}} \in [0.0, 1.0], \quad z_{\text{norm}} \approx 0.0$$
where $(0, 0)$ is the top-left corner of the camera frame, and $(1.0, 1.0)$ is the bottom-right corner.

### Aspect Ratio Projection (`fitMode: 'cover'`)
Because browser viewports have varying aspect ratios (e.g. 16:9 on laptops, 4:3 on tablets, 9:16 or 3:4 on vertical smartphones) that differ from the camera stream's native resolution (e.g. 1280x720 or 640x480), CSS displays the `<video>` element with `object-fit: cover`.

The transformation function in `src/features/pose-detection/utils/landmarkTransform.ts` mirrors this calculation:

```
If canvasAspect > videoAspect:
    renderWidth = canvasWidth
    renderHeight = canvasWidth / videoAspect
    offsetY = (canvasHeight - renderHeight) / 2
    offsetX = 0

Else (canvasAspect <= videoAspect):
    renderHeight = canvasHeight
    renderWidth = canvasHeight * videoAspect
    offsetX = (canvasWidth - renderWidth) / 2
    offsetY = 0
```

Raw projected point:
$$p_x = \text{offsetX} + x_{\text{norm}} \times \text{renderWidth}$$
$$p_y = \text{offsetY} + y_{\text{norm}} \times \text{renderHeight}$$

### Front-Camera Mirroring Formula
For front-facing cameras (`facingMode: 'user'`), users expect a natural mirror experience (lifting right arm moves the screen arm on the right user side). The CSS flips the video with `-scale-x-100` (`transform-origin: center`).
The canvas projection inverts the X coordinate symmetrically around the canvas center:
$$\text{If isMirrored: } \quad p_x = \text{canvasWidth} - p_x$$
For rear-facing cameras (`facingMode: 'environment'`), mirroring is disabled ($p_x$ remains un-inverted), maintaining spatial alignment.

### High-DPI & Device Pixel Ratio (DPR) Scaling
On Retina and modern mobile screens, CSS pixels differ from hardware canvas buffer pixels by a factor of $\text{DPR} \in [1.25, 3.0]$.
- Canvas internal buffer is sized to:
  $$\text{canvas.width} = \text{Math.round}(\text{canvas.clientWidth} \times \text{dpr})$$
  $$\text{canvas.height} = \text{Math.round}(\text{canvas.clientHeight} \times \text{dpr})$$
- Line width and joint radius are scaled:
  $$\text{lineWidth}_{\text{eff}} = \text{lineWidth} \times \text{dpr}$$
  $$\text{radius}_{\text{eff}} = \text{landmarkRadius} \times \text{dpr}$$
This ensures lines and joint circles appear at identical visual proportions across standard (1x) and high-DPI (2x/3x) screens.

---

## 3. Evaluation of 9 Controlled Visual Test Fixtures

The pipeline was verified against 9 controlled geometric fixtures in `landmarkTransform.test.ts`:

| # | Fixture Scenario | Normalized Input Properties | Expected Mathematical Output | Test Result |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Person Centered** | 33 points centered, $x \in [0.45, 0.55]$, $c \ge 0.95$ | Projected directly into middle 20% of canvas; 66 arc calls, all bones drawn. | **PASSED** |
| **2** | **Person Near Screen Edge** | Subject at right boundary ($x \approx 0.95$) | $p_x \in [900, 1000]$ on 1000px canvas; zero boundary overflow or truncation errors. | **PASSED** |
| **3** | **Person Partially Outside Frame** | Limb extends beyond camera boundary ($x = 1.15$, $c = 0.3$) | Coordinates calculate to $p_x = 1150$; low-confidence gate ($< 0.5$) suppresses point. | **PASSED** |
| **4** | **Person Turning Sideways** | Profile view: near side $c \approx 0.95$, far side $c \approx 0.2$ | Occluded limbs filtered out; visible kinetic chain cleanly preserved without ghost bones. | **PASSED** |
| **5** | **Arms Raised Overhead** | Wrists elevated ($y = 0.1$) above shoulders ($y = 0.35$) | $p_{y,\text{wrist}} < p_{y,\text{shoulder}}$ verified (top-origin coordinate space). | **PASSED** |
| **6** | **Squatting Position** | Hips lowered ($y = 0.65$), knees flexed ($y = 0.66$) | Vertical distance $|p_{y,\text{hip}} - p_{y,\text{knee}}| < 50\text{px}$; joints tracked accurately. | **PASSED** |
| **7** | **Walking Gait** | Alternating staggered feet ($y_{\text{left}} = 0.8$, $y_{\text{right}} = 0.9$) | Distinct vertical positions verified; bilateral asymmetry correctly mapped. | **PASSED** |
| **8** | **No Person Visible** | Empty landmark array ($\text{length} = 0$) | 0 arc calls, 0 stroke calls, canvas cleared cleanly. | **PASSED** |
| **9** | **Poor Lighting** | 33 landmarks with low confidence ($c = 0.22 < 0.5$) | All landmarks rejected by confidence filter; zero spurious artifacts rendered. | **PASSED** |

---

## 4. Remaining Physical Alignment Limitations

While the mathematical projection is 100% verified, operators testing physical hardware should note these optical constraints inherent to single-camera webcams:

1. **Optical Lens Distortion (Fisheye):** Cheap wide-angle webcams (FOV $> 90^\circ$) produce barrel distortion near frame edges. Coordinates near boundaries may appear slightly bowed compared to linear pixel projection.
2. **Rolling Shutter Warp:** Rapid athletic motions (e.g. explosive vertical jump takeoff) on rolling-shutter CMOS sensors can cause slight vertical elongation during high-speed movement.
3. **Severe Backlighting:** Strong light sources directly behind the athlete (e.g. outdoor training facing a bright sun or bright window) degrade landmark confidence below the 0.5 threshold, intentionally suppressing skeleton lines until lighting improves.
