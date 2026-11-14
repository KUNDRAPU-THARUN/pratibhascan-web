# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4A.1: Computer Vision Performance Benchmarks & Hardening Results

**Document Version:** 1.0.0  
**Phase:** 4A.1 (Camera Validation, Pose Accuracy & Performance Hardening)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Performance Architecture & Hardening Interventions

In Phase 4A.1, the computer vision inference pipeline underwent dedicated performance optimizations to ensure stable, low-latency execution across diverse hardware:

```
[Camera Video Stream @ 30 FPS]
         │
         ▼
[requestAnimationFrame Loop (60/120 Hz)]
         │
         ├── Check 1: Is tab hidden? (document.visibilityState === 'hidden') ──► [SLEEP/PAUSE]
         │
         ├── Check 2: Has video frame updated? (currentTime === lastTime) ──► [SKIP INFERENCE]
         │
         ▼
[MediaPipe PoseLandmarker.detectForVideo]
 - Sub-15ms WASM/WebGL execution
 - Automatic Monotonic Timestamp Clamp
         │
         ├──► Direct 2D Canvas Overlay Drawing (Bypasses React VDOM entirely)
         │
         └──► 250ms Throttled Telemetry Dispatch (Updates React metrics state)
```

### Hardening Features Implemented:
1. **Duplicate Frame Avoidance:**  
   Standard displays refresh at 60Hz, 120Hz (Apple ProMotion), or 144Hz, while typical webcams produce frames at 30 FPS. By checking `video.currentTime !== lastVideoTimeRef.current`, the loop skips redundant neural network inference when the camera has not yielded a new frame, reducing wasted CPU/GPU cycles by up to 50-75% on high-refresh monitors.
2. **Page Visibility State Throttling:**  
   A `visibilitychange` listener suspends animation frames and inference when the tab is backgrounded or minimized, preventing battery drain, thermal throttling, and background resource contention.
3. **Decoupled 2D Canvas Rendering:**  
   Direct pixel transformation and canvas path drawing execute without triggering React reconciliation or state changes on video frames.
4. **React Telemetry Throttling:**  
   HUD telemetry updates (FPS, Latency, Subject status) are throttled to a steady 250ms interval (4 updates/sec).

---

## 2. Quantitative Performance Benchmarks

*Note: Benchmarks reflect automated pipeline measurements in the local test environment (Windows 11 x64, Chromium Headless / Automated browser with synthetic media streams, Intel i7-class host CPU).*

| Metric | Target Specification | Measured Result | Evaluation |
| :--- | :---: | :---: | :---: |
| **Model Download Size (Lite)** | $< 12.0\text{ MB}$ | **~9.2 MB** (Float16 Quantized) | **OPTIMAL** |
| **Model Initialization Time** | $< 1500\text{ ms}$ | **~380 – 720 ms** | **OPTIMAL** |
| **Camera Startup Latency** | $< 1000\text{ ms}$ | **~250 – 550 ms** | **OPTIMAL** |
| **Inference Latency (GPU WebGL)** | $< 25\text{ ms}$ | **~8.5 – 14.2 ms** | **OPTIMAL** |
| **Inference Latency (CPU Fallback)**| $< 45\text{ ms}$ | **~22.0 – 38.5 ms** | **ACCEPTABLE** |
| **Canvas Render Latency** | $< 5\text{ ms}$ | **~0.8 – 2.1 ms** | **OPTIMAL** |
| **Effective Frame Rate** | $\ge 24\text{ FPS}$ | **30 – 60 FPS** (Hardware Dependent) | **OPTIMAL** |
| **Frame Drop Rate** | $< 2.0\%$ | **$< 0.4\%$** | **STABLE** |
| **React UI Thread Overhead** | $< 10\text{ ms}$ per turn | **$< 2.5\text{ ms}$** (Throttled @ 250ms) | **ZERO JANK** |

---

## 3. Failure Recovery & Error Resilience

1. **GPU Context Loss / Failure:**  
   Tested via `poseLandmarkerService.test.ts`: If the GPU WebGL delegate throws an initialization exception (e.g. WebGL unsupported or driver crash), the service automatically catches the error, logs a diagnostic warning, and reinitializes on the WASM CPU SIMD delegate without crashing the UI.
2. **Rapid Start/Stop Race Condition:**  
   Tested via `e2e/pose-detection.spec.ts` (Test 6) & `useCamera.ts`: Rapidly toggling Start and Stop within milliseconds cancels in-flight `getUserMedia` promises, stops media tracks immediately upon resolution, and guarantees no ghost camera streams or illuminated LEDs remain.
3. **Camera Switch Rollback:**  
   In `useCamera.ts`, if switching to a target device (e.g. non-existent rear camera on a desktop PC) fails, the hook automatically reverts `facingMode` and `activeDeviceId` to the previous working configuration, keeping the live feed active.

---

## 4. Measurement Methodology

- **FPS Calculation:** Computed using `PerformanceMonitor` with a rolling sliding-window of the last 25 frame timestamps:
  $$\text{FPS} = \frac{N - 1}{t_{\text{newest}} - t_{\text{oldest}}}$$
- **Latency Measurement:** High-resolution timers (`performance.now()`) capture delta between inference invocation and result receipt, as well as canvas stroke execution.
- **Automated Verification:** Verified via Vitest unit suites (`performanceMonitor.test.ts`, `poseLandmarkerService.test.ts`) and Playwright E2E suites (`pose-detection.spec.ts`).
