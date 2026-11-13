# PRATIBHASCAN WEB — VERCEL DEPLOYMENT DIAGNOSTIC & AUDIT REPORT

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Production URL:** [https://pratibhascan-web.vercel.app](https://pratibhascan-web.vercel.app)  
**Date:** November 13, 2026  
**Status:** DIAGNOSIS COMPLETE & RESOLUTION IMPLEMENTED (Ready for Deployment)

---

## 1. Executive Summary

A comprehensive investigation was conducted into why the PratibhaScan Web production deployment on Vercel (`pratibhascan-web.vercel.app`) failed to open, presenting users with either a blank white screen on `/` or HTTP 404 errors on deep routes such as `/login`.

The investigation successfully identified three root causes:
1. **Uncaught Top-Level Runtime Exception at Module Evaluation:** In the deployed JavaScript bundle (`index-Bn-hAQWv.js`), missing Vercel environment variables caused `createClient("http://127.0.0.1:54321", "")` to execute at bundle startup. `@supabase/supabase-js` throws an uncaught `Error: supabaseKey is required.` synchronously, which prevented React from mounting `<div id="root">`, resulting in a blank white screen.
2. **Missing Single Page Application (SPA) Routing Configuration:** Vercel was missing a `vercel.json` routing rewrite rule. Consequently, direct requests to client-side routes (`/login`, `/register`, `/preview`, `/dashboard`) returned `HTTP 404 NOT_FOUND` directly from the edge CDN.
3. **Loopback (`127.0.0.1` / `localhost`) URLs in Production Code:** Links to Mailpit (`http://127.0.0.1:54324`) and default fallback API endpoints (`http://127.0.0.1:54321`) were accessible in production builds, leading to connection failures and mixed-content issues in browser environments.

All issues have been resolved locally, verified with zero regressions (76/76 Vitest tests passing, `tsc` clean, Vite build clean, ESLint clean), and are prepared for immediate redeployment.

---

## 2. Root Cause Analysis

### Root Cause 1: Missing `vercel.json` SPA Rewrites (HTTP 404 on Deep Links)
- **Symptom:** Navigating directly to `https://pratibhascan-web.vercel.app/login` or refreshing any page returned `HTTP/1.1 404 Not Found` with the edge response header `X-Vercel-Error: NOT_FOUND`.
- **Mechanism:** Vercel operates as a static file server by default. When a user requests `/login`, Vercel searches for a physical `/login.html` file or `/login/index.html`. Since Vite compiles a Single Page Application into a single `dist/index.html`, all non-asset requests must be rewritten to `/index.html` so that `react-router-dom` handles client routing.
- **Resolution:** Created `vercel.json` in the project root with the standard rewrite rule:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

---

### Root Cause 2: Top-Level Runtime Exception `supabaseKey is required.` (Blank Screen)
- **Symptom:** Navigating to `https://pratibhascan-web.vercel.app/` loaded HTML and attempted to execute `index-Bn-hAQWv.js`, but rendered a completely empty white page.
- **Mechanism:** Inspection of the live production bundle revealed:
  ```javascript
  const c1 = "http://127.0.0.1:54321", u1 = "", Ee = o1(c1, u1, { auth: { ... } });
  ```
  Where `o1` is `@supabase/supabase-js`'s `createClient`.
  In `.env.production` or Vercel's environment settings, `VITE_SUPABASE_ANON_KEY` was undefined, evaluating to empty string `""`.
  Executing `createClient(url, "")` throws:
  ```text
  Error: supabaseKey is required.
      at new SupabaseClient (.../node_modules/@supabase/supabase-js/...)
  ```
  Because `src/lib/supabase.ts` was executed at the top level when any component imported `supabase`, this unhandled exception crashed script evaluation before `createRoot(document.getElementById('root')).render(...)` ever executed.
- **Resolution:**
  1. Updated `src/lib/supabase.ts` with safe fallback values for production when environment variables are not supplied, preventing `createClient` from throwing.
  2. Updated `AuthContext.tsx` to check `isSupabaseConfigured()`. When Supabase credentials are missing or placeholders, auth initialization gracefully resolves to unauthenticated (`isLoading: false`, `user: null`, `session: null`) without attempting broken network calls.
  3. Added non-blocking user banners on `LoginPage`, `RegisterPage`, and `ForgotPasswordPage` explaining that Supabase backend is pending configuration and offering a link to the interactive preview (`/preview`).

---

### Root Cause 3: Localhost References Exposed in Production
- **Symptom:** UI components exposed links to `http://127.0.0.1:54324` (Mailpit development email preview) to production users.
- **Mechanism:** `RegisterPage.tsx` and `ForgotPasswordPage.tsx` directly contained `<a href="http://127.0.0.1:54324">`.
- **Resolution:** Wrapped all Mailpit references in `{import.meta.env.DEV && (...)}`. In production builds, Vite tree-shakes or suppresses these development-only links.

---

## 3. Files Modified & Created

| File | Change Type | Purpose |
| :--- | :--- | :--- |
| `vercel.json` | **Created** | Directs Vercel CDN to rewrite all SPA requests to `/index.html`. |
| `src/lib/supabase.ts` | **Modified** | Safe fallbacks to prevent `supabaseKey is required` crash during bundle load. |
| `src/features/auth/AuthContext.tsx` | **Modified** | Guard `initAuth` and auth actions with `isSupabaseConfigured()`. |
| `src/features/auth/LoginPage.tsx` | **Modified** | Added user alert when backend Supabase credentials are missing. |
| `src/features/auth/RegisterPage.tsx` | **Modified** | Added user alert and gated Mailpit link with `import.meta.env.DEV`. |
| `src/features/auth/ForgotPasswordPage.tsx` | **Modified** | Added user alert and gated Mailpit link with `import.meta.env.DEV`. |

---

## 4. Security Audit & Credential Hygiene

1. **Client-Side Secret Exposure:**
   - Exhaustive audit performed on `src/`, `vite.config.ts`, `package.json`, and the compiled `dist/` bundle.
   - **Result:** No `service_role` keys, PostgreSQL database passwords, or private API tokens exist anywhere in the frontend codebase.
2. **Environment Variable Security:**
   - Only keys prefixed with `VITE_` are bundled by Vite.
   - `VITE_SUPABASE_ANON_KEY` is designed to be public and works in conjunction with PostgreSQL Row-Level Security (RLS) policies.
3. **`.gitignore` Verification:**
   - `.env`, `.env.local`, `.env.*.local` are present in `.gitignore`.
   - Local database credentials and `.env` files are excluded from Git commits.

---

## 5. Local Verification & Test Results

All verification suites were run against the updated codebase:

```bash
# 1. Vitest Unit & Integration Suites
npm test -- --run
```
- **Test Files:** 5 passed (5/5)
- **Tests:** 76 passed (76/76)
  - `authFlow.test.ts`: 13 passed
  - `authSchemas.test.ts`: 14 passed
  - `institutionData.test.ts`: 16 passed
  - `athleteData.test.ts`: 16 passed
  - `academyData.test.ts`: 17 passed

```bash
# 2. TypeScript Compilation & Vite Production Bundling
npm run build
```
- **TypeScript:** `tsc -b` compiled cleanly with 0 type errors.
- **Vite:** Production build succeeded in 53s.
- **Output:**
  - `dist/index.html`: 1.02 kB
  - `dist/assets/index-*.css`: 40.30 kB
  - `dist/assets/index-*.js`: 809.27 kB

```bash
# 3. ESLint Verification
npm run lint
```
- **Result:** 0 errors, 0 warnings.

---

## 6. Required Vercel Dashboard Settings

To complete the production configuration in Vercel:

### 1. General Project Settings
- **Framework Preset:** `Vite`
- **Root Directory:** `./` (or leave default root)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 2. Environment Variables (Project Settings > Environment Variables)
Add the following two environment variables for **Production**, **Preview**, and **Development**:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your live remote Supabase project URL | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your remote Supabase project Public Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...` |

> **Note on Local vs. Remote Supabase:**
> - When deploying to Vercel, the application runs on the public internet. It cannot connect to `http://127.0.0.1:54321`.
> - If you do not yet have a remote Supabase project provisioned, the application will now load cleanly in "Demo / Unconfigured" mode, allowing stakeholders to explore the landing page, UI components, and the `/preview` route without crashing.

---

## 7. Step-by-Step Safe Redeployment Instructions

Once approved, follow these steps to deploy the fix to Vercel:

### Step 1: Stage and Commit the Configuration Fixes
```bash
git add vercel.json src/lib/supabase.ts src/features/auth/AuthContext.tsx src/features/auth/LoginPage.tsx src/features/auth/RegisterPage.tsx src/features/auth/ForgotPasswordPage.tsx docs/VERCEL_DEPLOYMENT_AUDIT.md
git commit -m "fix(deployment): add vercel.json SPA rewrites and graceful supabase fallbacks"
```

### Step 2: Push to GitHub / Remote Repository
```bash
git push origin main
```

### Step 3: Trigger Vercel Redeployment
- If GitHub automatic deployments are configured in Vercel, the push will automatically trigger a new production build.
- Alternatively, go to **Vercel Dashboard > PratibhaScan Web > Deployments > Redeploy** (with "Use existing build cache" unchecked).

### Step 4: Verify Live Production Deployment
After deployment finishes:
1. Open `https://pratibhascan-web.vercel.app/` — verify that the landing page loads immediately without blank screen.
2. Directly open `https://pratibhascan-web.vercel.app/login` — verify that the page loads without 404 and displays the login card.
3. Open `https://pratibhascan-web.vercel.app/preview` — verify that the interactive prototype/demo view is functional.
