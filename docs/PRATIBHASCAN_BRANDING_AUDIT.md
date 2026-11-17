# PRATIBHASCAN WEB — COMPLETE BRANDING AUDIT
**Product:** PratibhaScan (AI-Assisted Sports Talent Assessment & Athlete Performance Platform)  
**Date:** November 17, 2026  
**Auditor:** Senior Product Designer & Frontend Architecture Lead  
**Audit Scope:** Entire React/TypeScript web repository (`src/`, `public/`, `index.html`)

---

## 1. Executive Summary

This branding audit was conducted to identify and catalog every user-facing occurrence of parent-company marketing branding (such as "KAARYAN LABS", "A Product of KAARYAN LABS", and related references) across public pages, authenticated portals, modals, metadata, printable exports, and layout components.

The objective is to establish an **independent, premium sports technology product brand** for **PratibhaScan**, while preserving underlying legal entity definitions, database infrastructure, migrations, and internal engineering documentation.

---

## 2. Identified User-Facing Occurrences & Remediation Plan

| # | File Path | Current Content / Element | Issue Description | Remediation Action |
|---|-----------|---------------------------|-------------------|-------------------|
| 1 | `src/lib/constants.ts` | `company: 'KAARYAN LABS'` & `copyright: © KAARYAN LABS` | Global brand constant displayed in wordmarks and footers | Update `BRAND` to independent product identity (`PratibhaScan`), tagline `"Discover Potential. Measure Progress."`, and product copyright |
| 2 | `src/components/brand/Wordmark.tsx` | `A Product of {BRAND.company}` | Default subtitle on all `<Wordmark />` instances | Replace with independent product tagline `"Discover Potential. Measure Progress."` or sport tech category |
| 3 | `src/components/layout/PublicFooter.tsx` | Company column: `KAARYAN LABS`, `inquiries@kaaryanlabs.com` | Corporate agency presence on public marketing footer | Replace with PratibhaScan platform navigation, support inquiries, and product governance |
| 4 | `src/components/layout/PublicFooter.tsx` | Copyright & policy texts: `KAARYAN LABS Policy Document`, `KAARYAN LABS is committed...` | Corporate policy attribution | Transform into PratibhaScan sports technology ethics and platform standards |
| 5 | `src/components/layout/DashboardSidebar.tsx` | Footer text: `PratibhaScan Web v0.1.0 · KAARYAN LABS` | Dashboard bottom brand stamp | Update to independent product version stamp: `PratibhaScan · Sports Performance Hub` |
| 6 | `src/components/layout/DashboardTopNav.tsx` | Banner: `Authenticated Portal · KAARYAN LABS PratibhaScan` | Top navigation branding badge | Update to `PratibhaScan · Sports Performance Hub` |
| 7 | `src/pages/LandingPage.tsx` | Hero badge: `A Sports Technology Platform by KAARYAN LABS` | Company attribution in main hero banner | Replace with athletic tagline: `Discover Potential. Measure Progress.` |
| 8 | `src/pages/LandingPage.tsx` | CV section: `Under development at KAARYAN LABS...` | Company development reference in sports tech section | Update to focus on PratibhaScan's real-time computer vision and pose tracking capabilities |
| 9 | `src/pages/LandingPage.tsx` | CTA banner: `KAARYAN LABS Sports Tech Initiative` | Slogan tag in CTA box | Update to `PratibhaScan Sports Technology Platform` |
| 10 | `src/pages/LandingPage.tsx` | Inquiry modal: `title="KAARYAN LABS — Pilot Inquiries"`, `inquiries@kaaryanlabs.com` | Agency pilot inquiry modal | Update to PratibhaScan Pilot & Field Assessment Inquiries (`pilot@pratibhascan.com`) |
| 11 | `src/features/athlete/AthletePassportExportModal.tsx` | Header: `KAARYAN LABS · Sports Talent Assessment Platform` | PDF printable athletic passport header | Update to `PratibhaScan · Sports Talent Assessment Platform` |
| 12 | `src/features/athlete/AthletePassportExportModal.tsx` | Verification note: `...authenticated by KAARYAN LABS` | Verifiable benchmark note | Update to `...authenticated by PratibhaScan Platform` |
| 13 | `src/features/auth/LoginPage.tsx` | Attribution: `PratibhaScan is an enterprise product by KAARYAN LABS.` | Login page footer attribution | Update to `PratibhaScan — Discover Potential. Measure Progress.` |
| 14 | `src/features/auth/RegisterPage.tsx` | Attribution: `PratibhaScan is an enterprise product by KAARYAN LABS.` | Registration page footer attribution | Update to `PratibhaScan — Discover Potential. Measure Progress.` |
| 15 | `src/features/auth/ProtectedRoute.tsx` | Alert: `...please contact KAARYAN LABS support.` | Suspension and security alert text | Update to `...please contact PratibhaScan support.` |
| 16 | `src/pages/NotFoundPage.tsx` | Subtitle: `PratibhaScan • A Sports Technology Initiative by KAARYAN LABS` | 404 page attribution | Update to `PratibhaScan • AI-Assisted Sports Talent Assessment Platform` |
| 17 | `src/features/design-system/DesignSystemView.tsx` | Description: `...engineered for KAARYAN LABS sports technology.` | Internal design system view header | Update to `...engineered for PratibhaScan sports technology.` |
| 18 | `src/features/pose-detection/components/SquatSessionSummaryModal.tsx` | JSON export: `company: 'KAARYAN LABS'` | Exported telemetry JSON payload | Update to `platform: 'PratibhaScan Sports Technology'` |
| 19 | `index.html` | Page title & meta: `PratibhaScan \| Sports Talent Identification & Assessment` | Browser title and SEO description | Update to `PratibhaScan \| AI Sports Talent Assessment` and comprehensive Open Graph tags |
| 20 | `public/icons/logo.svg` | Orange generic sunburst icon | Brand favicon & icon asset | Create dedicated PratibhaScan athletic beacon logo icon with sport blue & athletic teal palette |
| 21 | `public/images/hero-banner.svg` | Basic generic vector banner | Marketing preview image | Update to modern athletic telemetry graphic |

---

## 3. Preserved Infrastructure & Legal Boundaries

In strict compliance with project instructions:
1. **Repository & Directory Structure**: Repository name (`pratibhascan-web`), Git commit history, and directory structures remain intact.
2. **Database Migrations & Schema**: Table names, constraints, RLS policies, trigger names, and SQL comments in `supabase/migrations/` are preserved without alteration.
3. **E2E Test Accounts**: Automated test email aliases (`athlete.e2e@kaaryan.test`, etc.) are retained for regression testing stability.
4. **Code File Headers**: Development documentation comments in engineering source files (`* Company: KAARYAN LABS`) are preserved as internal engineering provenance.

---

## 4. Brand Design Tokens Target

- **Brand Name:** PratibhaScan
- **Brand Tagline:** "Discover Potential. Measure Progress."
- **Category:** AI-Assisted Sports Talent Assessment & Athlete Performance Platform
- **Primary Navy:** `#0B1736`
- **Sport Blue:** `#2563EB`
- **Athletic Teal:** `#06B6A8`
- **Performance Green:** `#22C55E`
- **Background White:** `#FFFFFF`
- **Soft Background:** `#F5F8FC`
- **Main Text:** `#111827`
- **Secondary Text:** `#64748B`
