# PRATIBHASCAN WEB — PHASE 4A CAMERA & DATA PRIVACY SPECIFICATION

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Scope:** Browser Camera Access, Video Stream Processing & Minor Protection  
**Document Version:** 1.0  
**Date:** November 14, 2026  
**Compliance Lead:** Senior Browser Security & Data Privacy Engineer  

---

## 1. Statutory Context & Principles

PratibhaScan is architected to operate under India's **Digital Personal Data Protection (DPDP) Act 2023** and international biometric data protection standards. Because future phases of PratibhaScan will serve young athletes and minors across Indian schools and sports academies, Phase 4A establishes a strict, privacy-by-design baseline for all live camera operations.

---

## 2. Privacy Guarantees & Constraints Implemented

### 2.1 100% Local Browser Processing
- **No Video Recording:** Neither the frontend nor the browser background services record, buffer to disk, or compress camera frames.
- **No Cloud Upload:** Video frames from `navigator.mediaDevices.getUserMedia()` are fed directly into the local WebAssembly/WebGL memory buffer. Zero bytes of video data are transmitted over WebSocket, HTTP, REST, or WebRTC.
- **No Supabase Storage Writes:** The Supabase Storage client is completely untouched by the Pose Detection Studio.
- **No Biometric Face Templates:** Facial landmarks (indices 0 to 10) are used solely for real-time head orientation estimation on canvas. No facial recognition, facial encoding, or biometric template extraction is performed.
- **No Assessment Record Contamination:** Raw landmark coordinates are kept in volatile memory and are never persisted to `assessment_sessions` or `assessment_results` database tables.

### 2.2 Explicit User Consent & Non-Intrusive Permissions
- **Never Auto-Start:** The camera is strictly inactive when the user navigates to `/dashboard/pose-detection` or `/preview/pose-detection`. The browser camera permission prompt is triggered **only** after an intentional click on the "Start Camera" button.
- **No Audio Permissions:** `requestCameraStream` explicitly requests `{ video: constraints, audio: false }`. The microphone is never activated or queried.
- **Immediate Hardware Release:** When the user clicks "Stop Camera" or navigates to another page, all active `MediaStreamTrack` objects are immediately closed via `track.stop()`. This ensures the hardware LED indicator turns off without latency.

---

## 3. Disclosed External Network Requests

To ensure transparency, the following external asset downloads occur during model initialization:

| Asset | Host Domain | Purpose | Data Transmitted |
| :--- | :--- | :--- | :--- |
| `vision_wasm_internal.wasm` | `cdn.jsdelivr.net` | MediaPipe WebAssembly inference runtime | Standard HTTP GET request (No user data) |
| `pose_landmarker_lite.task` | `storage.googleapis.com` | Google MediaPipe pre-trained neural network weights | Standard HTTP GET request (No user data) |

*Note:* Both assets are static binary models fetched over HTTPS with integrity caching. No user identifiers, session tokens, IP logs, or video streams are transmitted to these endpoints.

---

## 4. Mandatory User-Facing Disclaimers

The Pose Detection Studio renders two permanent, prominent disclaimer cards directly beneath the live camera controls:

### 4.1 Browser-Local Privacy Guarantee
> **"Camera frames are processed locally in your browser by default. No video is uploaded or recorded by this feature."**

### 4.2 Experimental Feature Notice
> **"Pose detection is experimental and is not a certified sports measurement."**

These notices ensure that coaches, athletes, and parents are never misled regarding certified sports rankings or data storage practices during this experimental phase.

---

## 5. Minor Athlete Protection Guidelines for Testing

1. **Adult-Only Testing:** All interactive and browser automated validation during Phase 4A was performed using synthetic test fixtures and consenting adult engineers.
2. **Synthetic Data Exclusivity:** No real children's images, names, or performance data were used or captured.
3. **Guardian Consent Decoupling:** Because Phase 4A does not persist assessment records or associate pose data with athlete profiles, guardian consent triggers from Phase 3E.1 are preserved and unaffected.
