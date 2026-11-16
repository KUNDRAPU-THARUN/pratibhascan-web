# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4C: Privacy Architecture & Scientific Limitations

**Document Version:** 1.0.0  
**Phase:** 4C (AI Sports Movement Measurement, Calibration & Accuracy Validation)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Zero-Footage Privacy Architecture

KAARYAN LABS enforces strict privacy standards regarding computer vision and biometric data collection.

```
       [USER CAMERA]
             │
             ▼ (getUserMedia stream)
     [HTML5 <video> TAG]
             │
             ▼ (Local frame canvas transfer)
[MediaPipe WebAssembly / WebGL] ◄─── (Runs 100% On-Device)
             │
             ▼ (33 Landmark normalized coordinates)
  [Volatile React Memory]
             │
             ├──► [Live Canvas Overlay] (Rendered locally in browser)
             ├──► [Squat State Machine] (Computed locally in RAM)
             │
             └──► [User-Initiated JSON Export] (Pure client Blob download)
                   │
                   ▼
             [NO NETWORK UPLOADS] ──► (Supabase / External Servers: 0 KB)
```

### Statutory Privacy Guarantees:
1. **Zero Video Uploads:** Video frames are passed directly from the browser `MediaStream` to the MediaPipe WebAssembly memory buffer. No frames, snapshots, or video clips are transmitted over the network.
2. **Zero Footage Persistence:** Camera frames are overwritten frame-by-frame in volatile RAM. No video data is cached in IndexedDB, LocalStorage, or cookies.
3. **No Biometric Template Storage:** The engine does not perform facial recognition, iris scanning, or permanent skeletal templating. Coordinates represent ephemeral geometric coordinates that vanish upon closing or refreshing the tab.
4. **Database Isolation:** Experimental pose and repetition results are strictly segregated from official Supabase tables (`assessment_sessions`, `assessment_trials`). No uncertified AI numbers can overwrite verified sports talent records.
5. **No Minor Data Processing:** Minor athlete data is never processed or used for testing in compliance with child online protection regulations.

---

## 2. Scientific & Biomechanical Limitations

The PratibhaScan movement measurement system is an **experimental research and training feedback utility**. It is designed with conservative boundaries and must not be misrepresented as a certified sports or medical diagnostic instrument.

### 2.1 Monocular 2D Projection Artifacts
- **Out-of-Plane Perspective Error:** Standard webcams record 2D projections of 3D human movement. When an athlete stands at an angle other than pure 90° sagittal profile, joint angles experience foreshortening. While Phase 4C includes side-arbitration and calibration orientation detection, planar angle error can reach $\pm 3^\circ - 7^\circ$ during unaligned rotation.
- **Observable Depth Proxy vs. 3D Kinematics:** Squat depth is estimated via relative vertical joint offsets ($\Delta y = y_{\text{hip}} - y_{\text{knee}}$). While effective as a training indicator, this is an observable optical proxy, not a 3D millimeter-accurate anatomical femur inclination measurement.

### 2.2 Clothing & Environmental Constraints
- **Loose / Baggy Clothing:** Bulky sweatpants or long athletic shorts obscure the hip crease and patella center, causing the pose landmarker to approximate joint centers based on garment contours.
- **Ambient Lighting:** Poor contrast, deep backlighting (e.g. standing directly in front of a window), or low indoor lux levels degrade landmark confidence below the $0.5$ threshold.

### 2.3 Hardware & Processing Heterogeneity
- **Frame Rate Stability:** On low-power mobile or laptop chipsets, inference frame rates may drop from 30 FPS to 15–20 FPS. The state machine incorporates temporal interpolation and duration gates, but rapid ballistic movements are best captured at 30 FPS or higher.
- **Rolling Shutter Distortion:** CMOS sensors in mobile webcams exhibit slight rolling shutter skew during fast explosive movements.

---

## 3. Disclaimers & Regulatory Positioning

The PratibhaScan Web application prominently displays the following notices across all pose detection interfaces:

> [!NOTE]
> **Browser-Local Privacy Guarantee:**  
> Camera frames are processed locally in your browser by default. No video is uploaded or recorded by this feature.

> [!WARNING]
> **Experimental Studio Disclaimer:**  
> Pose detection is experimental and is not a certified sports measurement. Do not use for clinical assessment, medical diagnosis, or injury risk evaluation.
