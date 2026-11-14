# PRATIBHASCAN WEB — PHASE 3E ASSESSMENT INTEGRITY & MULTI-TIER VERIFICATION ARCHITECTURE

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Document Version:** 1.0  
**Date:** November 13, 2026  
**Auditor & Architect:** Senior Sports Technology Architect & Supabase Security Specialist  
**Status:** ARCHITECTURAL SPECIFICATION & PROPOSED ENHANCEMENTS  

---

## 1. Executive Summary

A core requirement of any credible athletic talent identification platform is **data veracity**. In physical fitness and sports testing, fraud or biased measurements (e.g. shaving 0.3 seconds off a sprint time or inflating a vertical jump) undermine scouting decisions and destroy institutional trust.

During Phase 3D.5, a significant structural finding was identified:
> *A single authorized user (e.g. an academy owner) can record an assessment session and immediately mark that same session as verified, leaving no separation of duty.*

Phase 3E designs a **Multi-Tier Verification Architecture** that establishes clear boundaries between informal training measurements, internal single-evaluator records, and high-integrity two-person verified competition trials.

---

## 2. Multi-Tier Verification Hierarchy

To eliminate ambiguity without creating excessive friction for day-to-day training drills, PratibhaScan classifies all assessment records into three distinct integrity tiers:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           ASSESSMENT INTEGRITY TIERS                             │
├───────────────────┬───────────────────────────────┬──────────────────────────────┤
│ Tier 1: Draft     │ Tier 2: Organization-Recorded │ Tier 3: Two-Person Verified  │
├───────────────────┼───────────────────────────────┼──────────────────────────────┤
│ • Status: pending │ • Status: org_recorded        │ • Status: two_person_verified│
│ • Single coach    │ • Single coach / owner        │ • Evaluator + Distinct Judge │
│ • Editable        │ • Immutable once finalized    │ • Strict separation of duty  │
│ • Internal review │ • Academy internal progress   │ • Scouting & state selection │
│ • NOT in rankings │ • Marked as "Org Verified"    │ • Marked as "Independent"    │
└───────────────────┴───────────────────────────────┴──────────────────────────────┘
```

### Tier 1: Draft Measurements (`draft`)
- **Use Case:** Initial trial collection on the field during practice.
- **Rules:**
  - `verified = FALSE`, `verification_tier = 'draft'`, `results.status = 'pending'`.
  - The recording evaluator may edit trial values, correct input errors, or delete erroneous sessions.
  - Drafts appear exclusively in the evaluator's working queue and are flagged with an amber "Draft — Unverified" badge.
  - Drafts do not affect athlete personal bests or benchmark cards.

### Tier 2: Organization-Recorded Measurements (`organization_recorded`)
- **Use Case:** Routine weekly/monthly academy fitness testing or school physical education evaluations.
- **Rules:**
  - Recorded and finalized by the single coach or academy director (`evaluator_id = auth.uid()`).
  - Marked with `verification_tier = 'organization_recorded'` and `verified = TRUE`.
  - Stamped with `verified_by = auth.uid()`.
  - **Becomes permanently immutable:** PostgreSQL trigger prevents any subsequent tampering or score edits.
  - Displayed in UI as **"Organization Verified Record"**.
  - Suitable for internal progression tracking, but clearly flagged as single-evaluator internal data to external scouts.

### Tier 3: Two-Person Verified Measurements (`two_person_verified`)
- **Use Case:** Official talent trials, district selections, state federation scouting camps, and scholarship tryouts.
- **Rules:**
  - **Two-Person Integrity Rule:** The verifier **must be distinct** from the recording evaluator:
    $$\text{verified\_by} \ne \text{evaluator\_id}$$
  - Step 1: Evaluator records the physical trials and submits session for verification.
  - Step 2: An authorized director, head coach, or external federation official reviews the recorded trials, inspects venue and equipment conditions, and signs off.
  - Enforced at the PostgreSQL trigger level: any attempt where `auth.uid() = evaluator_id` raises a hard exception (SQLSTATE `P0001`).
  - Displayed in UI as **"Two-Person Verified Record (Dual Sign-Off)"**.

---

## 3. Database Schema Migration Plan (Proposed)

The proposed schema enhancement is encapsulated in `supabase/migrations/20261114000000_assessment_integrity_and_guardian_consent.sql`:

```sql
-- 1. Extend assessment_sessions with verification tiering
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'draft' NOT NULL
    CHECK (verification_tier IN ('draft', 'organization_recorded', 'two_person_verified')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS secondary_reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 2. Extend assessment_results status CHECK constraint
ALTER TABLE public.assessment_results
  DROP CONSTRAINT IF EXISTS assessment_results_status_check;

ALTER TABLE public.assessment_results
  ADD CONSTRAINT assessment_results_status_check
    CHECK (status IN ('pending', 'organization_recorded', 'two_person_verified', 'flagged'));

-- 3. Upgrade Immutability and Two-Person Integrity Trigger
CREATE OR REPLACE FUNCTION public.guard_assessment_session_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Strict Immutability: Once verified in any tier, records cannot be altered
  IF OLD.verified = TRUE THEN
    RAISE EXCEPTION 'Unauthorized: A verified assessment session is immutable and cannot be modified or deleted.';
  END IF;

  -- Tier 2: Organization Recorded (Single Evaluator finalization)
  IF NEW.verification_tier = 'organization_recorded' AND NEW.verified = TRUE THEN
    NEW.verified_by := auth.uid();
    NEW.verified_at := TIMEZONE('utc', NOW());
  END IF;

  -- Tier 3: Two-Person Integrity (Dual Sign-Off)
  IF NEW.verification_tier = 'two_person_verified' AND NEW.verified = TRUE THEN
    IF auth.uid() = OLD.evaluator_id THEN
      RAISE EXCEPTION 'Two-person integrity violation: An assessment evaluator cannot verify their own session for two-person certification (evaluator_id = %).', OLD.evaluator_id;
    END IF;
    
    NEW.verified_by := auth.uid();
    NEW.secondary_reviewer_id := auth.uid();
    NEW.verified_at := TIMEZONE('utc', NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Verification Workflow & UI States

### Evaluator View:
1. **Creation:** Evaluator opens "Record Assessment".
   - Selects athlete and protocol.
   - Enters trials.
   - Saves as Draft or submits as Organization Recorded.
2. **Review & Lock:**
   - Single coach can finalize as **"Organization Recorded"** (locks record).
   - If marked for **"Two-Person Verification"**, session remains pending until a second coach/director logs in and signs off.

### Athlete & Scout View:
- **Badge Differentiation:**
  - Gray Badge: `Draft` (visible only to author)
  - Blue Badge: `Organization Verified` (Single-evaluator internal)
  - Emerald Badge: `Two-Person Verified` (Dual sign-off with independent reviewer stamp)
- **Transparency:** Hovering or clicking the badge reveals exact provenance:
  - *Evaluator:* Coach Ramesh (Apex Academy)
  - *Verifier:* Director Sharma (Apex Academy)
  - *Timestamp:* 13 Nov 2026, 09:30 UTC

---

## 5. Security & Architectural Safeguards

1. **No External Government/Federation False Claims:**
   - The platform strictly labels Tier 3 as **"Two-Person Verified Record"** rather than "SAI Certified" or "Federation Accredited" unless real accreditation numbers and third-party API verification are attached.
2. **Backward Compatibility:**
   - Existing assessment sessions default safely to `'organization_recorded'`, preserving all Phase 3D/3D.5 test suites and historical records.
3. **Database-Level Guarantee:**
   - Client applications cannot bypass the Two-Person Integrity check because it is enforced within a PostgreSQL `SECURITY DEFINER` trigger before the transaction commits.
