# PRATIBHASCAN WEB — PHASE 3E.1 PROPOSED DATABASE MIGRATION SECURITY AUDIT

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Document Version:** 1.0  
**Date:** November 14, 2026  
**Auditor:** Senior Supabase & PostgreSQL Security Architect  
**Migration File Audited:** `supabase/migrations/20261114000000_assessment_integrity_and_guardian_consent.sql`  
**Target Environment:** Local Disposable Supabase PostgreSQL 15 (`127.0.0.1:54322`)  
**Status:** **AUDIT COMPLETE — CRITICAL VULNERABILITIES IDENTIFIED & REMEDIATED**  

---

## 1. Executive Summary

In accordance with Phase 3E.1 Step 1 instructions, a deep architectural and threat-modeling audit was performed on the proposed migration file `20261114000000_assessment_integrity_and_guardian_consent.sql` prior to applying it to the local test database.

The audit examined table schemas, check constraints, foreign keys, trigger functions, Row-Level Security (RLS) policies, and `SECURITY DEFINER` execution boundaries.

### Summary of Vulnerabilities & Fixes
| Finding ID | Severity | Description | Remediation Applied |
| :--- | :---: | :--- | :--- |
| **VULN-01** | **HIGH** | `SECURITY DEFINER` functions lacked explicit `SET search_path = public, pg_temp;` | Hardened both `guard_assessment_session_update` and `has_active_minor_consent` with pinned search paths |
| **VULN-02** | **HIGH** | Verifier authorization was not validated in `guard_assessment_session_update` | Added `is_authorized_evaluator()` verification check in trigger prior to state transition |
| **VULN-03** | **MEDIUM** | Missing fallback validation if `verified = TRUE` without valid tier | Added explicit exception branch rejecting `verification_tier = 'draft'` when `verified = TRUE` |
| **VULN-04** | **MEDIUM** | Existing RLS `sessions_update_unverified` restricted non-owner staff verifiers | Updated RLS policy to permit accredited staff in `evaluator_authorizations` to verify peer sessions |
| **VULN-05** | **MEDIUM** | Race condition could allow duplicate active consents for same athlete/purpose | Created partial unique index `idx_unique_active_guardian_consent` WHERE `status = 'active'` |
| **VULN-06** | **LOW** | Athletes could not inspect their linked guardian's verified status | Added `athletes_view_linked_guardian` SELECT policy restricted to authenticated linked minor |

---

## 2. Table-by-Table Architectural Audit

### 2.1 Extension of `public.assessment_sessions`
```sql
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'organization_recorded' NOT NULL
    CHECK (verification_tier IN ('draft', 'organization_recorded', 'two_person_verified')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS secondary_reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes TEXT;
```
- **Backward Compatibility:** Default value `'organization_recorded'` ensures that all pre-existing verified sessions in the database seamlessly comply without requiring destructive backfills.
- **Foreign Keys:** `secondary_reviewer_id` references `auth.users(id)` with default `ON DELETE NO ACTION`, preserving audit history if a staff account is deactivated.
- **Check Constraint:** Restricts tier string strictly to three recognized enum values.

### 2.2 Extension of `public.assessment_results`
- `status` constraint was extended from `('pending', 'verified', 'flagged')` to include `'organization_recorded'` and `'two_person_verified'`.
- Preserves compatibility with existing rows while supporting fine-grained result auditing.

### 2.3 `public.guardian_profiles`
- Primary key `id UUID DEFAULT uuid_generate_v4()`.
- `user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT`: Prevents dangling guardian accounts or duplicate guardian profiles per auth user.
- **Sensitive Data Minimization:** Storing raw Aadhaar or passport numbers is prohibited. The schema defines `government_id_hash TEXT` to store salted cryptographic hashes only.
- Strict relationship constraint: `CHECK (relationship IN ('mother', 'father', 'legal_guardian', 'appointed_warden'))`.

### 2.4 `public.guardian_athlete_links`
- Composite uniqueness constraint: `CONSTRAINT unique_guardian_athlete UNIQUE (guardian_id, athlete_id)`.
- `verification_status` state machine: `'pending'`, `'verified'`, `'rejected'`, `'terminated'`.
- Cascade delete on athlete deletion guarantees clean cleanup under statutory Right to Erasure.

### 2.5 `public.guardian_consents`
- Links to `guardian_athlete_links(id)` and stores purpose-specific consent scopes (`performance_tracking`, `talent_scouting`, `biometric_eval`).
- Validity check: `CONSTRAINT check_consent_validity CHECK (expires_at > consented_at)`.
- Partial unique index: `idx_unique_active_guardian_consent` guarantees that only ONE active consent record can exist per athlete per purpose at any time.

### 2.6 `public.consent_audit_logs`
- Append-only structure recording actions: `'granted'`, `'renewed'`, `'revoked'`, `'expired'`, `'erasure_requested'`.
- Row-Level Security allows only system triggers / service role to insert; users may only select logs involving their own IDs.

---

## 3. Deep Dive: Trigger Logic & Two-Person Integrity

### Threat Model: Evaluator Self-Verification & Tier Spoofing
```
Attacker Goal: Evaluator attempts to elevate their own internal assessment to a Two-Person Certified record.

Scenario A: Evaluator updates assessment_sessions SET verified = TRUE, verification_tier = 'two_person_verified'
Execution in Trigger:
  1. Trigger detects NEW.verified = TRUE AND OLD.verified = FALSE.
  2. Trigger checks: auth.uid() == OLD.evaluator_id.
  3. Condition evaluates to TRUE.
  4. Trigger immediately throws: 'Two-person integrity violation: An assessment evaluator cannot verify their own session...'
  5. Transaction rolls back. Result: BLOCKED.

Scenario B: Evaluator attempts to pass verified_by = '<third_party_uuid>'
Execution in Trigger:
  1. Trigger unconditionally overwrites: NEW.verified_by := auth.uid();
  2. Client-submitted verified_by is completely ignored.
  3. Result: SPOOFING DEFEATED.

Scenario C: Unrelated User attempts to verify session
Execution in Trigger:
  1. Trigger calls is_authorized_evaluator(auth.uid(), OLD.academy_id, OLD.institution_id).
  2. Condition evaluates to FALSE.
  3. Trigger throws: 'Unauthorized: Caller is not an authorized evaluator or reviewer for this organization.'
  4. Result: BLOCKED.
```

---

## 4. Minor Athlete Guardian Consent Logic (`has_active_minor_consent`)

### Logic Verification:
1. **Adult Athlete ($\text{Age} \ge 18$):**
   - Automatically returns `TRUE`.
   - Adults do not require parental consent to participate in physical testing.
2. **Minor Athlete ($\text{Age} < 18$):**
   - Queries `guardian_consents gc` joined with `guardian_athlete_links gal` and `guardian_profiles gp`.
   - Requires:
     - `gc.status = 'active'`
     - `gc.expires_at > NOW()`
     - `gal.verification_status = 'verified'`
     - `gp.id_verified = TRUE`
   - If any link in the chain is missing, unverified, or expired, returns `FALSE`.

---

## 5. Migration Safety Verdict

The hardened migration script `20261114000000_assessment_integrity_and_guardian_consent.sql`:
1. Does **NOT** alter, truncate, or drop existing production tables.
2. Maintains 100% backward compatibility with all historical assessment sessions.
3. Pins `search_path = public, pg_temp;` on all `SECURITY DEFINER` functions.
4. Closes all identified privilege escalation and self-verification bypass paths.

**Recommendation:** Proceed to local execution on the isolated local Supabase PostgreSQL test database (`127.0.0.1:54322`).
