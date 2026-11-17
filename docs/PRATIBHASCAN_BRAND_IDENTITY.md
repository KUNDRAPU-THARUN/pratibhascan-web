# PRATIBHASCAN — BRAND IDENTITY GUIDELINES & DESIGN SYSTEM

## 1. Brand Essence & Positioning

- **Brand Name:** PratibhaScan
- **Category:** AI-Assisted Sports Talent Assessment & Athlete Performance Platform
- **Primary Tagline:** *"Discover Potential. Measure Progress."*
- **Alternative Tagline:** *"Where Talent Meets Technology."*
- **Brand Character:** Objective, Athletic, Scientific, Trustworthy, Accessible, High-Performance.

PratibhaScan is an independent sports technology product built to modernize and democratize athletic talent discovery. It combines standardized physical assessment batteries (modeled after Sports Authority of India and international protocols) with privacy-preserving, on-device computer vision tracking.

---

## 2. Visual Identity & Color System

The PratibhaScan color palette is inspired by elite athletic performance, computational precision, and clear data visualization.

### Core Color Palette

| Token Name | Hex Code | HSL / RGB | Intended Application |
|------------|----------|-----------|----------------------|
| **Primary Navy** | `#0B1736` | `rgb(11, 23, 54)` | Brand anchor, header backgrounds, dark cards, deep contrast text |
| **Sport Blue** | `#2563EB` | `rgb(37, 99, 235)` | Interactive buttons, active navigation states, primary focus rings |
| **Athletic Teal** | `#06B6A8` | `rgb(6, 182, 168)` | AI computer vision overlays, positive benchmark highlights, badges |
| **Performance Green** | `#22C55E` | `rgb(34, 197, 94)` | Validated repetitions, successful assessments, personal best tags |
| **Background White** | `#FFFFFF` | `rgb(255, 255, 255)` | Primary card backgrounds, modal sheets, input surfaces |
| **Soft Background** | `#F5F8FC` | `rgb(245, 248, 252)` | App canvas background, neutral surface fills, table zebra rows |
| **Main Text** | `#111827` | `rgb(17, 24, 39)` | High-emphasis body copy, card titles, table headers |
| **Secondary Text** | `#64748B` | `rgb(100, 116, 139)` | Captions, timestamps, secondary labels, disabled placeholders |

### Semantic Functional Accents

- **Warning Amber:** `#F59E0B` (Incomplete trial, angle boundary advisory)
- **Critical Rose:** `#EF4444` (Invalid repetition, calibration deviation)
- **Accent Indigo:** `#6366F1` (Institutional metrics, state federation aggregate data)

---

## 3. Typography Hierarchy

The typography system uses **Plus Jakarta Sans** with clean fallbacks to modern system sans-serif fonts.

- **Display 1 (Hero Title):** `text-4xl sm:text-6xl font-extrabold tracking-tight text-navy-950`
- **Heading 1 (Page Title):** `text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight`
- **Heading 2 (Section Title):** `text-xl sm:text-2xl font-bold text-navy-900`
- **Heading 3 (Card Title):** `text-base sm:text-lg font-bold text-navy-900`
- **Body Regular:** `text-sm text-navy-600 leading-relaxed`
- **Caption / Meta:** `text-xs font-medium text-navy-500`
- **Monospace Telemetry:** `font-mono text-xs font-semibold` (angles, timestamps, rep counters)

---

## 4. Logo & Wordmark Design

The PratibhaScan brand mark is composed of:
1. **The Athletic Beacon Icon**: An athletic chevron and circular radar pulse symbolizing talent detection, motion capture, and forward kinetic energy.
2. **The Typographic Wordmark**:
   - `Pratibha` in heavy modern navy (`#0B1736`).
   - `Scan` highlighted in vibrant athletic sport blue (`#2563EB`) or athletic teal (`#06B6A8`).
3. **Sub-Brand Descriptor**: *"Discover Potential. Measure Progress."*

---

## 5. UI Component Design Language

- **Cards:** Light, elevated cards with subtle 1px border (`border-navy-200/80`) and soft shadows (`shadow-card` / `shadow-subtle`).
- **Buttons:**
  - `primary`: Athletic gradient or solid Sport Blue (`bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold`).
  - `outline`: Clean white card border (`border-navy-200 hover:bg-navy-50 text-navy-700`).
  - `teal`: AI / Biomechanics actions (`bg-teal-600 hover:bg-teal-700 text-white`).
- **Badges:** Pill-shaped with subtle backgrounds and matching text (`bg-primary-50 text-primary-700 border border-primary-200`).
- **Telemetry Indicators:** Glowing indicator dots (green for tracking locked, teal for active pose, amber for calibration required).
