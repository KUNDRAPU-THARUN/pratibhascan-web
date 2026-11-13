# PratibhaScan Web — Phase 3C Security Review

**Company**: KAARYAN LABS  
**Product**: PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Phase**: Phase 3C — Institution Portal & Secure Student Management  
**Date**: November 2026  
**Auditor**: Senior Security Architect & Full-Stack Engineer  
**Security Verdict**: **APPROVED — SECURE & HARDENED**  

---

## 1. Executive Security Assessment

The Phase 3C implementation connects schools, colleges, universities, and sports federations with students and candidate athletes. The architecture enforces strict multi-tenant isolation, authorization gating for staff testers, and compliance with India's **Digital Personal Data Protection (DPDP) Act 2023** regarding minor students.

Crucially, **no extra user roles were added**; the three primary roles (`athlete`, `academy`, `institution`) remain strictly bounded. All permissions and privacy gates operate at the database engine level via PostgreSQL Row-Level Security policies and plpgsql triggers.

---

## 2. Threat Vector Analysis & Countermeasures

| Threat Vector | Description | Severity | Countermeasure Implemented |
| :--- | :--- | :---: | :--- |
| **Unilateral Enrollment Claiming** | An institution unilaterally links student athletes without mutual student or guardian verification. | **High** | Dual-key affiliation lifecycle: status defaults to `'pending'`. No data access until verified approval by counterparty. |
| **Premature Biometric Exposure** | An institution accesses private physical measurements or test marks while affiliation is pending. | **Critical** | RLS on `assessment_sessions` and `assessment_results` checks `has_active_institution_affiliation()`. Returns 0 rows for pending affiliations. |
| **Cross-Institution Tenant Leakage** | Institution A reads student assessment sessions or passports belonging exclusively to Institution B. | **Critical** | RLS policy `sessions_select_authorized` restricts queries to affiliated active candidates. Multi-tenant isolation verified by live integration test #12. |
| **Post-Revocation Data Snooping** | An institution continues accessing student testing data after affiliation is cancelled or student graduates. | **High** | Revocation immediately transitions status to `'revoked'`. `has_active_institution_affiliation()` returns `FALSE` on the very next query. |
| **Institution Organization Hijacking** | An attacker attempts to alter the `owner_id` of a registered educational board or institution. | **Critical** | Database trigger `trg_guard_institution_update` raises `SQLSTATE P0001` if `NEW.owner_id != OLD.owner_id`. |
| **Automatic Evaluator Escalation** | An institution staff member assumes they can conduct/certify tests without explicit evaluator credentials. | **High** | System strictly distinguishes between institution membership and evaluator authorization (`evaluator_authorizations` table and `is_authorized_evaluator()` helper). |
| **Minor Student Biometric Exposure** | Processing biometric and physical data of school students without verifiable guardian consent under DPDP Act 2023. | **High** | Automated minor detection ($< 18$ years), UI regulatory consent warnings, and restricted initial pending status requiring explicit parental validation. |
| **Self-Evaluation Score Tampering** | A student-athlete attempts to create or verify their own assessment sessions or marks. | **Critical** | Database check constraint `check_no_self_evaluation (athlete_id != evaluator_id)`. |

---

## 3. Database Security Policy & Trigger Breakdown

### 3.1 Organization Ownership Protection Trigger
```sql
CREATE OR REPLACE FUNCTION public.guard_institution_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Unauthorized: Institution ownership cannot be transferred without administrative authorization.';
  END IF;
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
*Verification*: Live integration test #6 verified that attempting to alter `owner_id` is strictly rejected with the expected trigger exception.

### 3.2 Affiliation-Gated Assessment Data Access
```sql
CREATE OR REPLACE FUNCTION public.has_active_institution_affiliation(p_athlete_id UUID, p_institution_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.athlete_affiliations aa
    JOIN public.institutions i ON aa.institution_id = i.id
    WHERE aa.athlete_id = p_athlete_id
      AND aa.organization_type = 'institution'
      AND aa.status = 'active'
      AND i.owner_id = p_institution_owner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```
And the corresponding RLS policy on `public.assessment_sessions`:
```sql
CREATE POLICY sessions_select_authorized ON public.assessment_sessions
  FOR SELECT TO authenticated
  USING (
    public.is_active_user(auth.uid()) AND (
      athlete_id = auth.uid() OR
      evaluator_id = auth.uid() OR
      public.has_active_academy_affiliation(athlete_id, auth.uid()) OR
      public.has_active_institution_affiliation(athlete_id, auth.uid())
    )
  );
```
*Verification*: Live integration test #8 confirmed 0 rows returned when status is `'pending'`. Test #11 confirmed access granted when `'active'`. Test #13 confirmed access terminated immediately when `'revoked'`.

### 3.3 Minor Student Safeguards (DPDP Act 2023)
Section 9 of India's Digital Personal Data Protection Act 2023 mandates verifiable parental consent prior to processing children's personal and biometric data.
- The platform dynamically identifies students under 18 years of age using their verified date of birth.
- The Institution Portal explicitly instructs physical education staff and sports directors:
  > *"Minor Student Safeguard (DPDP Act 2023): This student is under 18 years of age. Processing biometric and athletic performance data mandates verified parental or legal guardian consent. Affiliation approval alone does not substitute for statutory guardian consent."*
- Outbound enrollment invitations to minors remain in pending status with zero biometric data sharing until verified guardian acceptance is recorded.

---

## 4. Security Verification Checklist

- [x] **RLS Enabled on All Tables**: `institutions`, `athlete_affiliations`, `assessment_sessions`, `assessment_results`, `evaluator_authorizations`, `athletes`, `user_profiles`.
- [x] **Ownership Immutability Enforced**: Triggers reject unauthorized `owner_id` updates on institutions.
- [x] **Zero Anonymous Leakage**: Anonymous and unauthenticated requests return 0 records across all protected tables.
- [x] **Multi-Tenant Isolation**: Institutions cannot view or access data of students affiliated exclusively with other institutions.
- [x] **Affiliation Mutuality**: Inbound applications require institution approval; outbound invitations require student/guardian confirmation.
- [x] **Immediate Revocation Cutoff**: Revoking an affiliation instantly cuts off private test session visibility.
- [x] **Self-Evaluation Prohibited**: Constraint `check_no_self_evaluation` enforced.
- [x] **Verified Session Locking**: Trigger `trg_guard_assessment_session_update` prevents modification once verified.
- [x] **DPDP Act 2023 Safeguards**: Minor student notices and consent disclaimers implemented across all views and modals.
