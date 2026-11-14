# KAARYAN LABS · PRATIBHASCAN WEB
# Phase 4A.1: Real Camera Validation & Hardware Verification Protocol

**Document Version:** 1.0.0  
**Phase:** 4A.1 (Camera Validation, Pose Accuracy & Performance Hardening)  
**Date:** November 2026  
**Product:** PratibhaScan Web — AI Sports Talent Assessment Platform  
**Owner:** KAARYAN LABS  

---

## 1. Executive Status: Real Hardware vs. Mocked Environment

In strict accordance with KAARYAN LABS engineering guidelines, **automated agent test runners in headless and sandboxed CI environments cannot access physical optical sensors (webcams, mobile camera modules)**. Therefore:

- **Automated Mocked-Camera Validation:** **COMPLETED & VERIFIED (66/66 E2E Tests Passing)**.  
  Validated in Chromium using the Chromium synthetic video streaming harness (`--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream`).
- **Physical Hardware Validation:** **PENDING OPERATOR VERIFICATION**.  
  Physical hardware validation is not fabricated. Below is the rigorous manual testing protocol and verification checklist for QA operators.

---

## 2. Hardware Matrix & Field Validation Checklist

Operators must execute this 13-point protocol across each target hardware profile and record observations.

### Device Profiles Under Test
1. **Windows Laptop Webcam** (Integrated e.g. Realtek/Intel HD Webcam, Windows 11/10, Edge / Chrome)
2. **External USB Webcam** (e.g. Logitech C920/Brio, 1080p 30/60 FPS, Windows/macOS/Linux)
3. **Android Chrome Camera** (Android 12+, Chrome Mobile 120+, Front & Rear sensors)
4. **iPhone Safari Camera** (iOS 16+, Safari WebKit, Front TrueDepth & Rear Wide Angle)

---

### Master Operator Validation Checklist

| Check # | Verification Item | Expected Behavior | Windows Laptop | USB Webcam | Android Chrome | iPhone Safari | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | **Permission Request** | Browser displays native modal asking for camera access on explicit user button click. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **2** | **Camera Startup** | Hardware indicator LED turns on. Video stream initializes within < 1.5s. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **3** | **Live Video Preview** | Video preview displays in aspect-4/3 (mobile) or aspect-16/9 (desktop). No stretched frames. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **4** | **Model Loading** | MediaPipe Pose Landmarker initializes on GPU delegate (WebGL) or gracefully on CPU. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **5** | **Pose Detection** | Subject in frame triggers "TRACKING ACTIVE" status chip; telemetry updates FPS & Latency. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **6** | **Skeleton Rendering** | 33 anatomical landmarks rendered on canvas; joints in Saffron/Teal, bones in Athletic Blue. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **7** | **Dynamic Movement** | Rapid motion (jumping jacks, squats, arms raised) maintains tracking without frame stalls. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **8** | **Stop Camera** | Clicking "Stop Camera" halts video, clears canvas, turns off hardware LED immediately. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **9** | **Pause & Resume** | "Pause Tracking" freezes inference and shows standby badge; "Resume" smoothly continues. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **10** | **Camera Switching** | Front-to-rear or multi-device toggle switches optical input without page refresh. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **11** | **Navigation Away** | Navigating to Athlete Dashboard or Institution Portal immediately releases camera hardware. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **12** | **Browser Refresh** | Hard refresh (F5 / Cmd+R) returns Studio to initial dormant state; camera does NOT auto-start. | [ ] | [ ] | [ ] | [ ] | PENDING |
| **13** | **Rapid Start/Stop** | Clicking Start followed immediately by Stop within < 200ms halts cleanly without memory leaks. | [ ] | [ ] | [ ] | [ ] | PENDING |

---

## 3. Step-by-Step Execution Guide for Operators

### A. Local Development Testing (Localhost)
1. Launch local development server from terminal:
   ```bash
   npm run dev
   ```
2. Open Google Chrome, Microsoft Edge, or Safari to:
   ```
   http://localhost:5173/preview/pose-detection
   ```
   *(Localhost is treated as a Secure Context by modern browsers without requiring SSL certificates).*
3. Verify that the studio displays `100% Local Inference` and dormant standby placeholder.
4. Click **Start Live Camera Studio**.
5. Grant permission when the browser prompts.
6. Verify hardware LED lights up, live video displays, and skeleton is drawn over your body.
7. Test toggling **Skeleton: OFF**, **Joints: OFF**, and **Pause Tracking**.
8. Click **Stop Camera** and verify hardware LED immediately extinguishes.

### B. HTTPS Staging / Production Testing (Mobile & Remote Devices)
Modern mobile browsers (Chrome Android, Safari iOS) **strictly reject** camera access on unencrypted HTTP connections across local network IP addresses.

To test on physical smartphones:
1. **Option 1: Vercel Production Deployment**
   - Access the verified HTTPS deployment: `https://pratibhascan-web.vercel.app/preview/pose-detection`
   - Test on Android Chrome and iOS Safari.
2. **Option 2: Local HTTPS Tunnel (Cloudflare or ngrok)**
   - Run local server: `npm run dev`
   - Expose over secure tunnel:
     ```bash
     cloudflared tunnel --url http://localhost:5173
     # or
     ngrok http 5173
     ```
   - Open the generated `https://*.trycloudflare.com/preview/pose-detection` URL on mobile devices.
3. **Verify Mobile Specifics:**
   - Front camera mirrors correctly (moving your right arm moves the screen's left/mirrored arm as a mirror reflection).
   - Switching to rear camera disables horizontal mirroring.
   - Screen rotation between portrait and landscape updates canvas overlay coordinates within one frame.
   - Backgrounding browser tab (pressing home screen or switching apps) pauses inference loop and prevents thermal buildup.

---

## 4. Hardware Disconnection & Anomaly Recovery Test

| Anomaly Scenario | Physical Action | Expected System Reaction |
| :--- | :--- | :--- |
| **USB Disconnect** | Unplug external USB webcam while camera is actively streaming. | `track.onended` handler catches disconnect, stops stream, sets camera status to error, and displays "Camera was disconnected or stopped by operating system" with a Retry button. |
| **Tab Minimization** | Minimize browser window or switch to another browser tab. | `visibilitychange` listener sets loop to dormant, pauses RAF, and stops CPU consumption until tab returns to foreground. |
| **Lock Screen** | Lock phone or laptop screen while camera is active. | OS revokes camera stream; app cleanly handles track end without unhandled Promise rejections. |

---

## 5. Certification Sign-Off Block

| Role | Name | Device Tested | Date | Decision | Signature |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **QA Engineer** | *Pending Field Test* | Windows Laptop Webcam | — | PENDING | — |
| **CV Engineer** | *Pending Field Test* | External USB Webcam | — | PENDING | — |
| **Mobile Lead** | *Pending Field Test* | Android Chrome (Pixel/Samsung) | — | PENDING | — |
| **iOS Lead** | *Pending Field Test* | iPhone Safari (iOS 17+) | — | PENDING | — |
