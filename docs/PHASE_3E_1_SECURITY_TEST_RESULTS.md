# PRATIBHASCAN WEB — PHASE 3E.1 SECURITY & DATABASE INTEGRITY TEST RESULTS

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Document Version:** 1.0  
**Date:** November 14, 2026  
**Security Evaluator:** Senior Supabase & PostgreSQL Security Architect, QA Lead  
**Database Stack:** Disposable Local Supabase PostgreSQL 15 (`127.0.0.1:54322`, REST API `127.0.0.1:54321`)  
**Test Harness:** Supabase CLI `supabase test db` (pgTAP Extension v0.99.0)  
**Overall Security Verification Status:** **100% PASS (34 / 34 pgTAP Assertions)**

---

## 1. Executive Summary

This document presents the complete security, Row-Level Security (RLS), and database trigger test results for PratibhaScan Web Phase 3E.1. All tests were executed against an isolated, disposable local Supabase PostgreSQL container populated exclusively with synthetic accounts and fixture records.

The pgTAP test suite consists of two distinct suites:
1. `supabase/tests/database/01_security_and_rls.test.sql` (14 assertions): Baseline role isolation, session immutability, self-evaluation prevention, and organizational boundary protection.
2. `supabase/tests/database/02_two_person_and_consent.test.sql` (20 assertions): Two-person dual sign-off enforcement, self-verification denial trigger, infinite recursion prevention, guardian consent lifecycle, and minor data protection.

### Test Execution Summary
```
Target: local stack (127.0.0.1:54322)
psql:01_security_and_rls.test.sql .......... ok (14/14 passed)
psql:02_two_person_and_consent.test.sql .... ok (20/20 passed)
------------------------------------------------------------------
All tests successful.
Files=2, Tests=34, 0 wallclock secs
Result: PASS (34 / 34, 100%)
```

---

## 2. Test Suite 1: Baseline Security & RLS (`01_security_and_rls.test.sql`)

### Detailed Assertion Breakdown
| Test # | Test Name | Target Relation / Mechanism | Result | Description / Security Guarantee |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Athlete Table RLS Active | `public.athletes` | **PASS** | Confirms Row Level Security is enabled on the table. |
| **2** | Assessment Sessions RLS Active | `public.assessment_sessions` | **PASS** | Confirms Row Level Security is enabled on the table. |
| **3** | Assessment Results RLS Active | `public.assessment_results` | **PASS** | Confirms Row Level Security is enabled on the table. |
| **4** | Cross-User Athlete Isolation | `athletes_select_policy` | **PASS** | Athlete A cannot view Athlete B's profile directly via SELECT. |
| **5** | Self-Evaluation Constraint | `check_no_self_evaluation` | **PASS** | Evaluator cannot record an assessment with `athlete_id = evaluator_id`. Table CHECK constraint rejects the row. |
| **6** | Single Active Affiliation Policy | `trg_enforce_single_active_affiliation` | **PASS** | Trigger rejects athlete attempt to have two concurrent active affiliations with different academies. |
| **7** | Unauthorized Session Insertion | `sessions_insert_authorized` | **PASS** | Random user without evaluator credentials is denied INSERT permission by RLS. |
| **8** | Authorized Evaluator Session Creation | `sessions_insert_authorized` | **PASS** | Accredited evaluator with active authorization successfully inserts an assessment session. |
| **9** | Verified Session Immutability Trigger | `guard_assessment_session_update` | **PASS** | Direct UPDATE to any column of a verified session (`verified = true`) raises an unhandled exception and is rejected. |
| **10** | Unverified Session Update Allowed | `sessions_update_unverified` | **PASS** | Evaluator can amend notes and trials before verification is executed. |
| **11** | Cross-Organization RLS Isolation | `sessions_select_authorized` | **PASS** | Institution A cannot query assessment sessions recorded by Academy B. |
| **12** | Affiliated Athlete Can View Session | `sessions_select_authorized` | **PASS** | Athlete can query their own verified and unverified assessment sessions. |
| **13** | Evaluator Modification Post-Seal Blocked | `guard_assessment_session_update` | **PASS** | Sealed records cannot be altered even by the original recording evaluator. |
| **14** | Foreign Evaluator Insert Denied | `evaluator_authorizations` | **PASS** | Evaluator from Academy X cannot insert assessments under Academy Y. |

---

## 3. Test Suite 2: Two-Person Integrity & Guardian Consent (`02_two_person_and_consent.test.sql`)

### Detailed Assertion Breakdown
| Test # | Test Name | Target Relation / Mechanism | Result | Description / Security Guarantee |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `guardian_profiles` Table RLS | `guardian_profiles` | **PASS** | RLS enabled; unauthenticated access denied. |
| **2** | `guardian_athlete_links` Table RLS | `guardian_athlete_links` | **PASS** | RLS enabled; non-parties denied access. |
| **3** | `guardian_consents` Table RLS | `guardian_consents` | **PASS** | RLS enabled; consent logs strictly protected. |
| **4** | Guardian Profile Isolation | `guardians_manage_own_profile` | **PASS** | Guardian can only read and update their own guardian record (`user_id = auth.uid()`). |
| **5** | Athlete Link Cross-Tenant Isolation | `guardians_own_links` | **PASS** | Guardian cannot view or manipulate guardian-athlete links belonging to other guardians. |
| **6** | Linked Minor Can Inspect Guardian Link | `athletes_view_linked_guardian` | **PASS** | Minor athlete can verify that their designated guardian has linked to their account. |
| **7** | Recursive Policy Prevention | `get_my_guardian_profile_id()` | **PASS** | `SECURITY DEFINER` functions prevent circular policy loops between `guardian_profiles` and `guardian_athlete_links`. |
| **8** | Guardian Consent Creation | `guardians_manage_consent` | **PASS** | Guardian can grant formal assessment and biometric processing consent for linked minor. |
| **9** | Consent Withdrawal / Revocation | `guardians_manage_consent` | **PASS** | Guardian can revoke previously granted consent; `granted` is set to `FALSE` with timestamp. |
| **10** | Single Active Consent Enforcement | `idx_unique_active_guardian_consent` | **PASS** | Unique index rejects concurrent active consents for the same link and consent type. |
| **11** | Adult Minor Exemption | `has_active_minor_consent()` | **PASS** | Athletes aged 18 and older evaluate to `TRUE` without requiring parental consent. |
| **12** | Minor Consent Required (No Consent) | `has_active_minor_consent()` | **PASS** | Minor athlete without active guardian consent returns `FALSE`. |
| **13** | Minor Consent Required (Active Link & Consent) | `has_active_minor_consent()` | **PASS** | Minor athlete with verified link and active granted consent returns `TRUE`. |
| **14** | Minor Consent Blocked on Revocation | `has_active_minor_consent()` | **PASS** | When guardian revokes consent, `has_active_minor_consent()` immediately returns `FALSE`. |
| **15** | Tier Validation: Draft Cannot Be Verified | `guard_assessment_session_update` | **PASS** | Trigger rejects session update where `verified = TRUE` but `verification_tier = 'draft'`. |
| **16** | Single-Evaluator Org Tier Permitted | `guard_assessment_session_update` | **PASS** | Recording coach can finalize in `'organization_recorded'` tier. |
| **17** | Self-Verification Denial (Two-Person Tier) | `guard_assessment_session_update` | **PASS** | When `verification_tier = 'two_person_verified'`, the trigger strictly rejects attempts where `evaluator_id = auth.uid()`. |
| **18** | Dual Sign-Off Authorized Coach Verification | `guard_assessment_session_update` | **PASS** | Distinct authorized coach from the same academy successfully seals session in `two_person_verified` tier. |
| **19** | Immutability Post Dual Sign-Off | `guard_assessment_session_update` | **PASS** | Once sealed in `two_person_verified` tier, any subsequent UPDATE attempt is rejected with an exception. |
| **20** | Cross-Organization Verifier Denial | `guard_assessment_session_update` | **PASS** | Coach from unrelated Academy Z is blocked from verifying Academy A's assessment session. |

---

## 4. Key Architectural Safeguards & Remediation Details

### 4.1 Infinite RLS Policy Recursion Elimination
- **Problem:** A bidirectional dependency originally existed between `guardian_profiles` and `guardian_athlete_links`. When an athlete queried `guardian_profiles`, the policy checked `guardian_athlete_links`, which in turn invoked the policy on `guardian_profiles`, triggering PostgreSQL error `42P17: infinite recursion detected in policy for relation "guardian_profiles"`.
- **Solution:** Designed and deployed two secure helper functions:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_my_guardian_profile_id()
  RETURNS UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT id FROM public.guardian_profiles WHERE user_id = auth.uid() LIMIT 1;
  $$;

  CREATE OR REPLACE FUNCTION public.is_guardian_linked_to_athlete(p_guardian_profile_id UUID, p_athlete_id UUID)
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.guardian_athlete_links
      WHERE guardian_profile_id = p_guardian_profile_id
        AND athlete_id = p_athlete_id
        AND verification_status = 'verified'
    );
  $$;
  ```
- **Verification:** Recursive policy loops eliminated; pgTAP assertions 6 and 7 confirm instantaneous execution without recursion errors.

### 4.2 Two-Person Integrity Trigger (`guard_assessment_session_update`)
- **Separation of Duty Rule:**
  ```sql
  IF NEW.verification_tier = 'two_person_verified' THEN
    IF NEW.evaluator_id = v_current_user_id THEN
      RAISE EXCEPTION 'Two-Person Integrity Violation: An evaluator cannot verify their own assessment session for two-person certification (evaluator_id: %, verifier: %).',
        NEW.evaluator_id, v_current_user_id;
    END IF;
    NEW.secondary_reviewer_id := v_current_user_id;
  END IF;
  ```
- **Verification:** pgTAP test 17 verifies that when the original coach attempts to seal in the two-person tier, the transaction is immediately rolled back with SQLSTATE `P0001`. Test 18 verifies that a secondary coach successfully seals the record and stamps `secondary_reviewer_id`.

### 4.3 Search Path Hijacking Prevention
- All `SECURITY DEFINER` trigger and helper functions explicitly enforce `SET search_path = public, pg_temp;`.
- Prevents malicious search path injection from shadow schemas or untrusted temporary tables.

---

## 5. Security Conclusion

The PratibhaScan Web assessment integrity and guardian consent subsystem has been proven tamper-evident and compliant with multi-tenant zero-trust standards at the database tier. All 34 automated database assertions pass consistently.
