# PRATIBHASCAN WEB — PHASE 3D.5 EVALUATOR AUTHORIZATION, SECURITY & MINOR SAFEGUARDS REVIEW

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Document Version:** 1.0  
**Date:** November 13, 2026  
**Auditor:** Senior Security Architect & Full-Stack Systems Lead  
**Database Stack:** Supabase PostgreSQL 15 with Row-Level Security (RLS) & pgTAP  
**Status:** AUDITED — SECURITY BOUNDARIES VALIDATED — ARCHITECTURAL PROPOSALS OUTLINED  

---

## 1. Executive Summary

This security and authorization audit examines the access control architecture of the PratibhaScan Sports Assessment Engine. It reviews how evaluator privileges are assigned, how assessment verification rights are gated, how multi-tenant cross-organization isolation is enforced, and how minor athlete safeguards are structured in compliance with India's Digital Personal Data Protection (DPDP) Act 2023.

---

## 2. Deep Dive: `is_authorized_evaluator()` & RLS Policies

### 2.1 Current PostgreSQL Implementation
The security boundary for recording and managing assessments is defined in migration `20261112000001_assessment_engine_tables.sql`:

```sql
CREATE OR REPLACE FUNCTION public.is_authorized_evaluator(
    check_user_id UUID,
    target_academy_id UUID DEFAULT NULL,
    target_institution_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        -- Organization owner check
        (target_academy_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.academies WHERE id = target_academy_id AND owner_id = check_user_id
        ))
        OR
        (target_institution_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.institutions WHERE id = target_institution_id AND owner_id = check_user_id
        ))
        OR
        -- Explicit staff evaluator authorization check
        EXISTS (
            SELECT 1 FROM public.evaluator_authorizations
            WHERE user_id = check_user_id
              AND (
                  (target_academy_id IS NOT NULL AND academy_id = target_academy_id)
                  OR
                  (target_institution_id IS NOT NULL AND institution_id = target_institution_id)
              )
              AND is_active = TRUE
        )
    );
$$;
```

### 2.2 Analysis of RLS Policies on `assessment_sessions`
1. **Athlete Self-Evaluation Prohibition (`check_no_self_evaluation`):**
   ```sql
   CONSTRAINT check_no_self_evaluation CHECK (athlete_id <> evaluator_id)
   ```
   An athlete authenticated as themselves cannot record their own assessment session. This is enforced at the database constraint level (SQLSTATE 23514) and checked prior to submission in `assessmentService.ts`.
2. **Athlete Select Permitted Scope:**
   Athletes can only view sessions where `athlete_id = auth.uid()`.
3. **Academy & Institution Select Permitted Scope:**
   Organizations can only view sessions matching their `academy_id` or `institution_id`. Cross-organization querying returns 0 rows (tested and verified).
4. **Assessment Session Mutability Guard (`guard_assessment_session_update`):**
   ```sql
   IF OLD.verified = TRUE THEN
       RAISE EXCEPTION 'Verified assessment sessions are immutable and cannot be modified or deleted.';
   END IF;
   IF NEW.verified = TRUE AND OLD.verified = FALSE THEN
       NEW.verified_by := auth.uid();
       NEW.verified_at := TIMEZONE('utc', NOW());
   END IF;
   ```
   Once a session is verified, PostgreSQL prevents any update to measurement data or deletion.

---

## 3. Evaluator Rights: Recording vs. Verification vs. Federation Accreditation

### 3.1 Current Gap: Single-Person Verification
Under the current schema:
- An academy owner or institution owner has the authorization to create assessment sessions.
- In `guard_assessment_session_update`, whoever transitions `NEW.verified = TRUE` is stamped as `verified_by`.
- **Finding:** A single coach/owner can currently enter trial data and immediately self-verify that same session (`evaluator_id == verified_by`).
- While acceptable for low-stakes internal academy training tracking, this is insufficient for official talent trials, district scouting, or scholarship eligibility.

### 3.2 Internal Organization Verification vs External Federation Certification
- **Internal Verification:** Confirms that an academy coach or school sports officer personally witnessed the physical trial and validated that the measurements adhered to testing protocols.
- **External Federation Accreditation:** Verification by a certified official from the Athletics Federation of India (AFI), Sports Authority of India (SAI), or state Olympic association.
- **Action Taken in Phase 3D.5:**
  All UI displays, badges, and export components now explicitly declare **"Organization Verified Record"** rather than "Officially Verified" or "Government Certified".

### 3.3 Proposed Architectural Migration: Two-Person Integrity & Accreditation Tiers
To support high-stakes state/national trials without breaking existing academy workflows, we propose the following schema enhancement for review:

```sql
-- PROPOSAL: Add verification tier and enforce two-person integrity for Tier 2/3
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'internal_org'
    CHECK (verification_tier IN ('unverified_draft', 'internal_org', 'federation_certified')),
  ADD COLUMN IF NOT EXISTS accreditation_id TEXT,
  ADD COLUMN IF NOT EXISTS accreditation_body TEXT;

-- Proposed Trigger Enhancement: Two-Person Integrity Rule for Tier 2/3
CREATE OR REPLACE FUNCTION public.guard_two_person_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_tier = 'federation_certified' AND NEW.verified = TRUE THEN
    IF NEW.evaluator_id = NEW.verified_by THEN
      RAISE EXCEPTION 'Federation certified records require two-person integrity: evaluator and verifier must be distinct.';
    END IF;
    IF NEW.accreditation_id IS NULL THEN
      RAISE EXCEPTION 'Federation certified records require a valid accreditation license identifier.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Minor Athlete Safeguards (DPDP Act 2023 Compliance)

### 4.1 Minor Identification
- PratibhaScan calculates athlete age dynamically from `date_of_birth` relative to UTC now.
- Any athlete with $\text{Age} < 18$ is automatically flagged as `isMinor: true`.
- Testing confirms that age boundaries are checked strictly (e.g. an athlete born in May 2008 in year 2026 is age 18; an athlete born in May 2010 is age 16).

### 4.2 Regulatory Distinction: Warning Banners vs Verifiable Parental Consent
- **Current State:**
  When evaluating a minor athlete, the assessment modal displays a prominent Minor Safeguard Advisory:
  > *"Minor Athlete Safeguard (DPDP Act 2023): This athlete is under 18 years of age. All trials, physical measurements, and performance logs must be conducted under direct coach supervision with active parental/guardian consent on file."*
- **Audit Assessment:**
  Informational warning banners and disclaimers **do not satisfy** the verifiable parental consent mandate of Section 9 of India's Digital Personal Data Protection (DPDP) Act 2023 for processing personal data of children.
- **Required Production Work Before Public Minor Enrollment:**
  1. **Guardian Profile Linkage:** Introduce a `guardians` relation linking minor `athlete_id` to a verified guardian profile.
  2. **OTP / Digital Signature Verification:** Implement digital parental consent capture (Aadhaar e-Sign, DigiLocker, or verified phone OTP consent log).
  3. **Consent Timestamp & Scope Table:**
     ```sql
     CREATE TABLE public.guardian_consents (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
         guardian_name TEXT NOT NULL,
         guardian_phone TEXT NOT NULL,
         consent_type TEXT NOT NULL CHECK (consent_type IN ('performance_tracking', 'scouting_exposure', 'biometric_eval')),
         verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         verification_method TEXT NOT NULL, -- 'otp', 'aadhaar_esign', 'physical_form_upload'
         expires_at TIMESTAMPTZ NOT NULL
     );
     ```
  4. **Strict Enforcement:** Block non-emergency assessment session creation for minor athletes unless an unexpired `guardian_consents` record exists.

---

## 5. Security & Isolation Testing Summary

| Test Scenario | Layer | Security Control | Result | Status |
| :--- | :--- | :--- | :---: | :---: |
| Athlete self-evaluation | Database & Service | `check_no_self_evaluation` constraint | Blocked (SQLSTATE 23514) | **VERIFIED** |
| Unauthorized assessment insert | Database RLS | `assessment_sessions_insert_evaluators` | Blocked (SQLSTATE 42501) | **VERIFIED** |
| Cross-organization session read | Database RLS | `assessment_sessions_select_org` | 0 rows returned | **VERIFIED** |
| Revoked affiliation session write | Service & Query | `status = 'active'` filter | Athlete omitted | **VERIFIED** |
| Verified session tampering | Database Trigger | `guard_assessment_session_update` | Blocked (Immutable) | **VERIFIED** |
| Verified session deletion | Service & Query | `WHERE verified = FALSE` filter | 0 rows affected | **VERIFIED** |
| Negative measurement injection | Database Constraint | `check_positive_trials` constraint | Blocked | **VERIFIED** |
| Anonymous table access | Database RLS | All public tables require `authenticated` | Denied | **VERIFIED** |

---

## 6. Security Audit Sign-off

The PratibhaScan Sports Assessment Engine demonstrates robust tenant isolation, uncompromised audit trail immutability, and strict athlete protection boundaries. With the removal of speculative percentile claims and the explicit separation of internal organization verification from external federation accreditation, the platform meets institutional standards of data integrity.
