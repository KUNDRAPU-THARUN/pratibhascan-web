# PratibhaScan Web Architecture

## Overview
PratibhaScan is a centralized sports talent identification, assessment, and scouting platform designed to standardize fitness battery tests, streamline athlete profiling, and empower state sports boards, academies, and coaches across India.

---

## Directory Architecture

```
pratibhascan-web/
├── public/                 # Static assets, logos, and web manifest
│   ├── images/             # Marketing banners, hero graphics
│   └── icons/              # Favicons and SVG iconography
├── src/
│   ├── app/                # Main application wrapper and providers
│   ├── assets/             # Internal bundle assets and SVGs
│   ├── components/         # Reusable presentation and layout components
│   │   ├── ui/             # Atomic design components (Button, Card, Input, Badge)
│   │   └── layout/         # AppLayout, Navbar, Sidebar, Footer
│   ├── features/           # Feature-driven modules
│   │   ├── auth/           # Authentication, role selector, session management
│   │   ├── athlete/        # Athlete profile, fitness benchmarks, badge tracking
│   │   ├── academy/        # Academy roster management, coach assignments
│   │   ├── institution/    # State board heatmaps, district scouting pipelines
│   │   └── assessments/    # Standard test battery, trial scoring, percentile engine
│   ├── hooks/              # Custom React hooks (useAuth, useAssessments)
│   ├── lib/                # Utilities, Supabase client, test protocol constants
│   ├── pages/              # Primary route view components
│   ├── routes/             # App router definitions and ProtectedRoute guards
│   ├── styles/             # Global CSS and Tailwind directives
│   └── types/              # TypeScript definitions for entities and models
├── supabase/
│   └── migrations/         # PostgreSQL DDL migrations & Row Level Security (RLS)
├── docs/                   # Platform architecture and protocol documentation
├── .env.example            # Environment configuration template
├── package.json            # Dependencies and build scripts
└── vite.config.ts          # Vite bundler configuration with `@/` alias
```

---

## Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite 6
- **Styling**: Tailwind CSS with custom athletic color palettes
- **Routing**: React Router v6
- **Backend / Database**: Supabase (PostgreSQL with RLS)
- **Icons**: Lucide React
