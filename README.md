# PratibhaScan Web (प्रतिभास्कैन)

**Company**: KAARYAN LABS  
**Product**: PratibhaScan  
**Description**: AI-Powered Sports Talent Assessment & Development Platform  
**Phase**: Phase 1 Foundation & Premium UI System  

---

## ⚡ Overview

PratibhaScan is a next-generation sports technology web application engineered to standardize physical fitness evaluations, eliminate subjectivity in scouting, and connect emerging athletic talent across India with certified coaches, sports academies, and state athletic federations.

This web application is designed strictly around three target personas:
- **Athlete**: Personal athletic passport, multi-trial fitness tracking, and age-group percentile benchmarks.
- **Academy**: Cohort roster management, batch physical testing, and talent progression tracking.
- **Institution**: State sports board scouting oversight, school testing center density, and Khelo India / SAI compliance.

---

## 🎨 Design Direction

- **Theme**: Premium light-themed interface with high legibility and outdoor readability.
- **Backgrounds**: Pure white (`#FFFFFF`) and very light grey surfaces (`#F8FAFC`, `#F1F5F9`).
- **Typography**: Deep navy text (`#0F172A`, `#1E293B`) using *Plus Jakarta Sans*.
- **Primary Accent**: Precision Teal (`#0D9488`, `teal-600`).
- **Secondary Accent**: Institutional Blue (`#2563EB`, `blue-600`).
- **Styling**: Soft card borders (`border-navy-200/80`), subtle shadows, consistent border radius, and accessible touch targets.

---

## 📁 Repository Structure

```
pratibhascan-web/
├── docs/                                # Technical & Architectural Documentation
│   ├── DESIGN_SYSTEM.md                 # Design tokens, color scales, components
│   ├── PROJECT_ARCHITECTURE.md          # Architecture, routing, and modules
│   └── PHASE_1_REPORT.md                # Phase 1 delivery report and test results
├── public/                              # Static public assets
│   ├── icons/                           # Favicon & SVG logos
│   └── images/                          # High-res SVG banners
├── src/
│   ├── app/
│   │   └── App.tsx                      # Application root & BrowserRouter
│   ├── assets/                          # Bundled SVG illustrations
│   ├── components/
│   │   ├── brand/
│   │   │   └── Wordmark.tsx             # Text-based PratibhaScan wordmark
│   │   ├── layout/
│   │   │   ├── DashboardShell.tsx       # Internal dashboard layout shell
│   │   │   ├── DashboardSidebar.tsx     # Role-aware dashboard sidebar
│   │   │   ├── DashboardTopNav.tsx      # Dashboard top navigation & role switcher
│   │   │   ├── PublicFooter.tsx         # Website footer with KAARYAN LABS attribution
│   │   │   ├── PublicHeader.tsx         # Responsive marketing header & mobile menu
│   │   │   └── PublicLayout.tsx         # Marketing website layout wrapper
│   │   └── ui/                          # Reusable UI Primitives
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── form-field.tsx
│   │       ├── index.ts                 # UI component barrel export
│   │       ├── input.tsx
│   │       ├── modal.tsx                # Accessible WAI-ARIA modal dialog
│   │       └── states.tsx               # LoadingState, EmptyState, ErrorState
│   ├── features/                        # Domain Feature Modules
│   │   ├── academy/
│   │   │   └── AcademyView.tsx          # Academy Hub & Roster Management
│   │   ├── assessments/
│   │   │   └── AssessmentsView.tsx      # Standardized Protocol Battery Engine
│   │   ├── athlete/
│   │   │   └── AthleteView.tsx          # Athlete Passport & Biometrics
│   │   ├── auth/
│   │   │   └── index.ts                 # Auth module metadata (Phase 2 prep)
│   │   ├── design-system/
│   │   │   └── DesignSystemView.tsx     # Living design system showcase
│   │   └── institution/
│   │       └── InstitutionView.tsx      # State Board & Scouting Heatmap
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useDisclosure.ts             # Modal/drawer open-close hook
│   │   └── useMediaQuery.ts             # Responsive viewport query hook
│   ├── lib/
│   │   ├── constants.ts                 # Brand constants, protocols, role configs
│   │   ├── supabase.ts                  # Supabase client singleton & fallback
│   │   └── utils.ts                     # cn (clsx + tailwind-merge) utility
│   ├── pages/
│   │   ├── LandingPage.tsx              # Marketing landing page
│   │   └── NotFoundPage.tsx             # 404 error page
│   ├── routes/
│   │   └── AppRoutes.tsx                # React Router v6 configuration
│   ├── styles/
│   │   ├── index.css                    # Tailwind directives & CSS reset
│   │   └── tokens.ts                    # Design tokens (colors, typography, radii)
│   ├── types/
│   │   ├── assessment.types.ts          # Protocols, trials, results
│   │   ├── athlete.types.ts             # Athletes, academies, institutions
│   │   ├── index.ts                     # Type re-exports
│   │   └── user.types.ts                # Roles (athlete, academy, institution)
│   └── main.tsx                         # React 18 DOM mount entrypoint
├── supabase/
│   └── migrations/
│       └── 20261112000000_initial_schema.sql # Reference PostgreSQL schema & RLS
├── .env.example                         # Environment configuration template
├── .gitignore                           # Git ignore rules
├── eslint.config.js                     # ESLint 9 configuration
├── index.html                           # HTML5 entrypoint
├── package.json                         # Dependencies & npm scripts
├── postcss.config.js                    # PostCSS configuration
├── tailwind.config.js                   # Tailwind CSS configuration
├── tsconfig.json                        # Strict TypeScript compiler options
└── vite.config.ts                       # Vite bundler configuration with `@/` alias
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0+ (Tested on v24.19)
- **npm** or **pnpm**

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Typecheck & Build
```bash
npm run build
```

### 6. Code Linting
```bash
npm run lint
```

---

## 🧪 Phase 1 Validation Status

- **TypeScript Check**: `tsc -b` -> Passed (0 errors)
- **Production Build**: `vite build` -> Passed (0 errors, 34 kB CSS, 307 kB JS)
- **ESLint**: `eslint .` -> Passed (0 errors, 0 warnings)
- **Responsiveness**: Verified at 375px (Mobile), 768px (Tablet), and 1440px (Desktop)
- **Dead Buttons**: None. Non-connected actions open explicit, accessible informational modal dialogues.

---

## 📖 Detailed Documentation

- [Design System Guide](docs/DESIGN_SYSTEM.md): Tokens, color swatches, component specs, and accessible guidelines.
- [Project Architecture](docs/PROJECT_ARCHITECTURE.md): Component breakdown, routing structure, and technology stack.
- [Phase 1 Delivery Report](docs/PHASE_1_REPORT.md): Comprehensive test logs, completed features, and Phase 2 recommendations.
