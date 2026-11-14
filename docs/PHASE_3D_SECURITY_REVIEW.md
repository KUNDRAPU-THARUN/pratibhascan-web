# PRATIBHASCAN WEB — PHASE 3D SECURITY & PRIVACY REVIEW

**Company:** KAARYAN LABS  
**Product:** PratibhaScan  
**Review Target:** Sports Assessment Engine, Evaluator Authorization, Multi-Trial Verification, and Minor Safeguards  
**Date:** November 13, 2026  
**Auditor:** Senior Security Specialist & Sports Technology Architect

---

## 1. Security Scope & Objectives

The Phase 3D assessment engine manages sensitive biometric and physical performance evaluations. This review audits:
1. Row-Level Security (RLS) enforcement on assessment sessions and trial results.
2. Evaluator authorization model and organization ownership implications.
3. Self-evaluation prevention (`check_no_self_evaluation`).
4. Immutability of verified sessions (`guard_assessment_session_update`).
5. Minor athlete safeguards and guardian consent boundaries.
6. Cross-role and cross-organization access isolation.
7. Proposed migrations and database protection boundaries.

---

## 2. Row-Level Security (RLS) Audit

### 1. `assessment_protocols`
- **SELECT:** Permitted for all authenticated users and anonymous visitors (to power preview demonstrations).
- **INSERT, UPDATE, DELETE:** Explicitly revoked from `authenticated` and `anon` (`REVOKE ALL ON public.assessment_protocols FROM authenticated, anon`). Only database administrators or system migrations can add or modify protocol definitions.

### 2. `assessment_sessions`
- **SELECT (`sessions_select_authorized`):**
  - Permitted only if the caller is an active user (`public.is_active_user(auth.uid())`) AND:
    - The athlete themselves (`athlete_id = auth.uid()`), OR
    - The evaluator who recorded the session (`evaluator_id = auth.uid()`), OR
    - An academy owner with an active affiliation (`has_active_academy_affiliation`), OR
    - An institution owner with an active affiliation (`has_active_institution_affiliation`).
  - Pending affiliations grant zero access to private assessment data.
- **INSERT (`sessions_insert_authorized_evaluator`):**
  - Requires `is_active_user(auth.uid())`.
  - Requires `evaluator_id = auth.uid()`.
  - Strictly requires `athlete_id != auth.uid()`.
  - Requires `public.is_authorized_evaluator(auth.uid(), academy_id, institution_id)`.
- **UPDATE (`sessions_update_unverified`):**
  - Permitted only while `verified = FALSE`.
  - Restricted to the evaluator or the organization owner.
  - Attempting to update a verified session triggers `guard_assessment_session_update`, which aborts the transaction with:
    `Unauthorized: A verified assessment session cannot be edited or modified.`
- **DELETE (`sessions_delete_owner_unverified`):**
  - Restricted to organization owners.
  - Restricted to unverified sessions (`verified = FALSE`). Verified sessions can never be deleted through the client API.

### 3. `assessment_results`
- **SELECT (`results_select_authorized`):**
  - Accessible only to authorized identities permitted to view the parent `session_id`.
- **INSERT & UPDATE (`results_insert_evaluator`, `results_update_evaluator_unverified`):**
  - Restricted to the session evaluator while `session.verified = FALSE`.

---

## 3. Audit of Evaluator Authorization Model

### Analysis of Organization Ownership as Evaluator Authorization
In PostgreSQL function `public.is_authorized_evaluator`:
```sql
CREATE OR REPLACE FUNCTION public.is_authorized_evaluator(p_user_id UUID, p_academy_id UUID, p_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct ownership of the academy
  IF p_academy_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.academies WHERE id = p_academy_id AND owner_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Direct ownership of the institution
  IF p_institution_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.institutions WHERE id = p_institution_id AND owner_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Accredited staff evaluator
  RETURN EXISTS (
    SELECT 1 FROM public.evaluator_authorizations
    WHERE evaluator_id = p_user_id
      AND status = 'active'
      AND (
        (p_academy_id IS NOT NULL AND academy_id = p_academy_id) OR
        (p_institution_id IS NOT NULL AND institution_id = p_institution_id)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Security Findings & Recommendations:
1. **Practical Grassroots Reality:** In grassroots sports academies and school physical education departments, the academy director or head coach is often the primary field evaluator. Permitting organization owners to conduct assessments is necessary for field operations.
2. **Conflict of Interest & Self-Verification:**
   - Under current logic, an owner who evaluates a session (`evaluator_id = owner_id`) can also verify it (`verified_by = owner_id`).
   - For high-stakes federation trials or state scouting selections, self-verification presents an integrity risk.
3. **Mitigations Implemented in Phase 3D:**
   - The UI and database records explicitly capture both `evaluator_id` and `verified_by`.
   - The UI surfaces tamper-evident verification badges and displays the certifying official's identity.
   - For Phase 3E, an optional **Two-Person Integrity Rule** (dual-signoff requirement for official federation selection trials) is recommended.

---

## 4. Self-Evaluation Prevention

Athletes are strictly prevented from evaluating themselves at two distinct layers:
1. **Database Constraint:** `CONSTRAINT check_no_self_evaluation CHECK (athlete_id != evaluator_id)` prevents any session from being written where the athlete and evaluator are the same identity.
2. **RLS Policy:** `sessions_insert_authorized_evaluator` checks `athlete_id != auth.uid()`.
3. **Application Layer:** `fetchEligibleAthletesForEvaluator` filters out the evaluator's own user ID. `createAssessmentSession` validates `athleteId !== user.id` before executing the insert.

---

## 5. Minor Athlete Protection & Consent Safeguards

Under Indian digital personal data protection principles and sports child safeguarding guidelines:
1. **Age Determination:** The system calculates exact chronological age from date of birth. Any candidate where `age < 18` is flagged with `isMinor = true`.
2. **Explicit Consent Required:**
   - In accordance with project instructions, a mere checkbox or warning notice does **not** constitute legal proof of guardian consent.
   - The application does not collect real minor biometric data in production without verified parental authorization.
   - In testing and demonstration environments, only synthetic accounts are utilized.
3. **Restricted Storage:** When guardian consent forms and athlete passports are stored, they are planned for private, encrypted storage buckets (`parental-consents`, `athlete-passports`) governed by RLS folder matching.

---

## 6. Verified Record Immutability

The integrity of sports assessment data is guaranteed through the PostgreSQL database trigger:
```sql
CREATE OR REPLACE FUNCTION public.guard_assessment_session_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verified = TRUE THEN
    RAISE EXCEPTION 'Unauthorized: A verified assessment session cannot be edited or modified.';
  END IF;

  IF NEW.verified = TRUE AND OLD.verified = FALSE THEN
    NEW.verified_by = auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- Any attempt to modify a verified session raises PostgreSQL exception SQLSTATE `P0001`.
- Any attempt to delete a verified session is rejected by RLS policy `sessions_delete_owner_unverified`.
- This ensures verified test benchmarks cannot be inflated or manipulated post-verification.

---

## 7. Remote Deployment & Environment Isolation

In accordance with strict project boundaries:
- **Zero Remote Changes:** No hosted Supabase databases were modified, and no remote migrations were run.
- **Local Verification:** All migrations and tests were executed exclusively against the local Supabase Docker stack (`127.0.0.1:54321` / `127.0.0.1:54322`).
- **Proposed Migration Documented:** Migration `20261113000000_seed_assessment_protocols.sql` is committed locally and documented for hosted review prior to Phase 3E deployment.
- **Zero Secret Exposure:** Only public anonymous keys (`VITE_SUPABASE_ANON_KEY`) are utilized in client bundles; service-role keys remain completely isolated.
