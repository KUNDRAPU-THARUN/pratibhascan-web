# PratibhaScan Web (प्रतिभास्कैन)

> Next-Generation Sports Talent Identification, Scouting, and Standardized Assessment Platform.

---

## ⚡ Features

- **Multi-Role Portals**: Tailored interfaces for **Athletes**, **Coaches**, **Sports Academies**, and **State Institutions / Federations**.
- **Standardized Fitness Battery**: Battery tests for Speed (30m Sprint), Explosive Power (Vertical Jump), Aerobic Capacity (Beep Test), Flexibility (Sit & Reach), and Agility (Illinois Test).
- **Verified Digital Scorecards**: Multi-trial recording with automated percentile ranking and coach verification.
- **District Talent Heatmap**: Geographic talent density metrics for institutional scout planning.
- **Supabase-Ready**: PostgreSQL schema with Row Level Security (RLS) for data governance and tamper-proof records.

---

## 📁 Repository Structure

```
pratibhascan-web/
├── public/
│   ├── images/
│   └── icons/
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── features/
│   │   ├── auth/
│   │   ├── athlete/
│   │   ├── academy/
│   │   ├── institution/
│   │   └── assessments/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   └── types/
├── supabase/
│   └── migrations/
├── docs/
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🗄️ Database & Migrations
Supabase migrations are located under `supabase/migrations/`:
- `20261112000000_initial_schema.sql`: Contains initial tables, relations, and RLS policies.

To apply via Supabase CLI:
```bash
supabase db push
```
