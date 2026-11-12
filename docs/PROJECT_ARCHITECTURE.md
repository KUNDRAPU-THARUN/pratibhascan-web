# PratibhaScan Web — Project Architecture

**Company**: KAARYAN LABS  
**Product**: PratibhaScan (AI-Powered Sports Talent Assessment & Development Platform)  
**Phase**: Phase 1 Foundation & Premium UI System  
**Version**: 1.0.0-phase1  

---

## 1. Architectural Principles

1. **Role-Centric Modularity**:
   The application is strictly designed around three target personas:
   - **Athlete**: Individual athletic passport, biometric tracking, normalized percentile comparison.
   - **Academy**: Cohort roster management, batch field testing, coach evaluation logging.
   - **Institution**: District talent density, partner school oversight, SAI / Khelo India compliance.

2. **Clean Separation of Concerns**:
   - `src/components/brand/`: Wordmark and core brand assets.
   - `src/components/layout/`: Shared responsive shell, navigation bars, headers, footers.
   - `src/components/ui/`: Atomic, accessible, unopinionated UI primitives.
   - `src/features/`: Domain-driven feature modules (`athlete`, `academy`, `institution`, `assessments`, `auth`, `design-system`).
   - `src/hooks/`: Custom utility hooks (`useMediaQuery`, `useDisclosure`).
   - `src/lib/`: Constants, Supabase client configuration, mathematical helpers.
   - `src/pages/`: Route-level entry views.
   - `src/routes/`: Declarative React Router route tree.
   - `src/styles/`: Design tokens, global CSS, and Tailwind directives.
   - `src/types/`: Strict TypeScript interfaces and type definitions.

3. **No Dead Buttons & Transparent Informational UX**:
   Every button or link in Phase 1 triggers an accessible informational modal or navigation preview, explicitly explaining feature roadmaps and preventing misleading fake functionality.

4. **Preparation for Supabase Integration (Phase 2)**:
   - Architecture is decoupled and ready for Supabase Auth, PostgreSQL tables, Row Level Security (RLS), and Storage buckets.
   - In Phase 1, `.env.example` provides placeholders only; no live production connection or secrets exist in the codebase.

---

## 2. Directory Structure

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

## 3. Technology Stack

- **Runtime & Language**: Node.js 18+ (tested with v24.19), TypeScript 5.7 (Strict mode)
- **Framework**: React 18.3
- **Bundler**: Vite 6.1
- **Styling**: Tailwind CSS 3.4 + PostCSS + Autoprefixer
- **Routing**: React Router v6.29
- **Icons**: Lucide React
- **Utilities**: `clsx`, `tailwind-merge`
- **Linting**: ESLint 9 with `typescript-eslint` and `eslint-plugin-react-hooks`
