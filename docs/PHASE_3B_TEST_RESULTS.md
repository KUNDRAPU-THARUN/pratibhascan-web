# PratibhaScan Web — Phase 3B Test Results

**Company**: KAARYAN LABS  
**Product**: PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Phase**: Phase 3B — Academy Hub & Secure Athlete Management  
**Date**: November 2026  
**Status**: 100% Tests Passing Across All Suites  

---

## Executive Test Summary

| Test Layer | Suite / Target | Total Executed | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Frontend Unit Tests** | Vitest (`src/**/*.test.ts`) | 60 | 60 | 0 | **PASS** |
| **Database Security (pgTAP)**| PostgreSQL 15 (`supabase test db`) | 14 | 14 | 0 | **PASS** |
| **Live Integration Tests** | Node.js (`phase3b_academy_hub.mjs`) | 20 | 20 | 0 | **PASS** |
| **Regression Integration** | Node.js (`phase3a_athlete_dashboard.mjs`)| 15 | 15 | 0 | **PASS** |
| **Auth Regression Tests** | Node.js (`phase2b_live_integration.mjs`) | 19 | 19 | 0 | **PASS** |
| **Type Check & Build** | `tsc -b && vite build` | 1 | 1 | 0 | **PASS** |
| **Code Quality & Linter** | `eslint .` | 1 | 1 | 0 | **PASS** |

---

## 1. Vitest Unit Test Suite (60/60 Passing)

Ran across 4 test suites:
- `src/features/academy/__tests__/academyData.test.ts` (17 tests)
- `src/features/athlete/__tests__/athleteData.test.ts` (16 tests)
- `src/features/auth/__tests__/authFlow.test.ts` (13 tests)
- `src/features/auth/__tests__/authSchemas.test.ts` (14 tests)

### Phase 3B Specific Unit Tests Breakdown

```
 ✓ src/features/academy/__tests__/academyData.test.ts (17 tests)
   ✓ academyProfileUpdateSchema Validation
     ✓ validates a complete, valid academy update payload
     ✓ rejects short academy name (< 3 chars)
     ✓ rejects invalid email address
     ✓ rejects empty sports offered array
     ✓ accepts optional phone and address as null or omitted
     ✓ rejects invalid phone number formats
   ✓ affiliationRequestSchema Validation
     ✓ accepts valid UUID format for athlete ID
     ✓ rejects malformed non-UUID athlete identifier
     ✓ rejects excessively long notes (> 250 chars)
   ✓ Minor Safeguard Identification (DPDP Act 2023)
     ✓ accurately identifies minor athletes (< 18 years) for regulatory notice
     ✓ treats 17-year-olds on the cusp as minors until their 18th birthday
   ✓ Academy Service Mutation Functions
     ✓ updateAcademyProfile updates permitted fields and handles success
     ✓ approveAffiliation updates status to active and sets approved_by
     ✓ rejectAffiliation updates status to rejected
     ✓ revokeAffiliation updates status to revoked
     ✓ createAffiliationRequest verifies athlete existence before creating pending request
     ✓ createAffiliationRequest returns error if candidate athlete does not exist
```

---

## 2. Phase 3B Live Supabase Integration Tests (20/20 Passing)

Target: Local Supabase Docker Stack (`http://127.0.0.1:54321`)  
Execution script: [`tests/integration/phase3b_academy_hub.mjs`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/tests/integration/phase3b_academy_hub.mjs)

```
======================================================================
PRATIBHASCAN WEB — PHASE 3B ACADEMY HUB & AFFILIATION INTEGRATION TESTS
Target: http://127.0.0.1:54321 (Local Docker Stack)
======================================================================

--- 1. PROVISIONING SYNTHETIC ACADEMY A ---
[✓] Academy A Provisioning -> User ID: a77ecad4-e0c8-40ea-9529-2e63163818a6
[✓] Academy A Onboarding Insert -> Academy ID: 8069505b-88f3-4211-af41-a2638deba1c4

--- 2. PROVISIONING SYNTHETIC ACADEMY B (ISOLATION TARGET) ---
[✓] Academy B Provisioning -> User ID: ed5a0971-1309-4922-91f5-fe19d32440e9
[✓] Academy B Onboarding Insert -> Academy ID: 786400aa-8320-458e-a67f-5327748310e0

--- 3. PROVISIONING SYNTHETIC MINOR ATHLETE ---
[✓] Minor Athlete Provisioning -> Athlete ID: f95a6ead-aab4-4d2c-b80f-158b829eb3c4
[✓] Athlete Baseline Insert -> Minor baseline (Age ~16) registered

--- 4. TESTING ACADEMY PROFILE RETRIEVAL ---
[✓] Academy Profile Retrieval -> Retrieved: Apex Sports High Performance Center

--- 5. TESTING ACADEMY PROFILE UPDATE ---
[✓] Academy Profile Update (Permitted) -> Updated name, sports offered, and phone

--- 6. TESTING ACADEMY OWNERSHIP IMMUTABILITY TRIGGER ---
[✓] Academy Ownership Guard Trigger -> Rejected transfer: Unauthorized: Academy ownership cannot be transferred without administrative authorization.

--- 7. TESTING ATHLETE INBOUND AFFILIATION REQUEST ---
[✓] Inbound Affiliation Request -> Affiliation ID: 84142491-3bd3-45c0-a11c-f4f0888831b8, Status: pending

--- 8. TESTING RLS GATE ON PENDING AFFILIATION ---
[✓] RLS Gating on Pending Affiliation -> Assessment sessions inaccessible while affiliation is pending

--- 9. TESTING AFFILIATION APPROVAL ---
[✓] Affiliation Approval -> Affiliation transitioned from pending -> active

--- 10. TESTING ASSESSMENT CREATION FOR ACTIVE ATHLETE ---
[✓] Assessment Session Creation -> Session ID: e1d1dd68-3717-46eb-9f73-7fb781f74290
[✓] Assessment Trial Result Insert -> Trial 4.08s recorded (Best Score)

--- 11. TESTING ACTIVE ROSTER & ASSESSMENT SCORE ACCESS ---
[✓] Active Roster Assessment Access -> Retrieved 1 session for active candidate

--- 12. TESTING CROSS-ACADEMY TENANT ISOLATION ---
[✓] Cross-Academy Tenant Isolation -> Academy B cannot read Academy A athlete assessment records (0 rows returned)

--- 13. TESTING AFFILIATION REVOCATION & ACCESS TERMINATION ---
[✓] Affiliation Revocation -> Affiliation transitioned to revoked
[✓] Access Cutoff Verification -> Active affiliation check evaluates to false after revocation

--- 14. TESTING ANONYMOUS ACCESS REJECTION ---
[✓] Anonymous Access Blocked -> Unauthenticated queries return 0 protected rows under RLS

--- 15. TESTING MINOR SAFEGUARD AGE LOGIC ---
[✓] Minor Safeguard Identification -> Candidate age 16 (< 18) mandates DPDP Act guardian consent

--- CLEANING UP SYNTHETIC TEST RECORDS ---
Test cleanup complete.

======================================================================
TOTAL: 20 | PASSED: 20 | FAILED: 0
======================================================================
```

---

## 3. Database Security pgTAP Test Suite (14/14 Passing)

Target: Local PostgreSQL container port 54322 (`supabase test db`)  
Test script: [`supabase/tests/database/01_security_and_rls.test.sql`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/supabase/tests/database/01_security_and_rls.test.sql)

```
Target: local stack (127.0.0.1:54322)
supabase/tests/database/01_security_and_rls.test.sql .. ok
All tests successful.
Files=1, Tests=14, 0 wallclock secs
Result: PASS
```

### Assertions Verified:
1. `Test 1: Athlete reading own profile` — PASS
2. `Test 2: Athlete denied reading other athlete's baseline` — PASS
3. `Test 3: Academy owner accessing authorized academy records` — PASS
4. `Test 4: Academy denied unrelated institution records` — PASS
5. `Test 5: Institution accessing its authorized records` — PASS
6. `Test 6: Unauthorized role modification rejected by trigger` — PASS
7. `Test 7: Unauthorized organization ownership transfer rejected` — PASS
8. `Test 8A: Unauthorized assessment creation blocked by RLS for athlete (42501)` — PASS
9. `Test 8B: Assessment self-evaluation rejected by check constraint in authorized context (23514)` — PASS
10. `Test 9: Verified assessment session modification locked` — PASS
11. `Test 10: Anonymous access blocked from private records` — PASS
12. `Test 11A: Unauthorized deletion affects 0 protected records` — PASS
13. `Test 11B: Protected assessment session intact in authorized context` — PASS
14. `Test 12: Private storage access design verification` — PASS

---

## 4. Build and Lint Verification

### Production Build
```
> pratibhascan-web@0.1.0 build
> tsc -b && vite build

✓ 1777 modules transformed.
dist/index.html                   1.02 kB │ gzip:   0.56 kB
dist/assets/index-hN74HTh9.css   40.25 kB │ gzip:   7.16 kB
dist/assets/index-PgFHxZKh.js   762.78 kB │ gzip: 200.65 kB
✓ built in 17.17s
```

### ESLint Check
```
> pratibhascan-web@0.1.0 lint
> eslint .

(No warnings, no errors)
```
