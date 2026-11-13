# PratibhaScan Web — Phase 2A Security & RLS Review

**Company**: KAARYAN LABS  
**Product**: PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Phase**: Phase 2A — Secure Supabase Database Foundation  
**Date**: November 2026  
**Auditor**: Senior Application Security & Database Architect  

---

## 1. Threat Modeling & Vulnerability Mitigation

| Vulnerability Threat | Insecure Pattern | Hardened Phase 2A Mitigation |
| :--- | :--- | :--- |
| **Privilege Escalation** | Client updates `user_profiles.role` to elevate from `athlete` to `institution` | Database trigger `guard_user_profile_update()` rejects role modifications; direct client INSERT revoked |
| **Self-Evaluation & Score Fabrication** | Athlete conducts self-evaluation or inserts fraudulent high scores | Strict constraint `check_no_self_evaluation` and RLS check `evaluator_id = auth.uid() AND athlete_id != auth.uid()` |
| **Unilateral Organization Hijacking** | User registers an academy or changes `owner_id` to usurp ownership | Trigger `guard_academy_update()` forbids ownership transfer without admin intervention; RLS restricts updates to `owner_id = auth.uid()` |
| **Cross-Tenant Data Leakage** | Academy accesses un-affiliated athletes or competing academy rosters | `athlete_affiliations` table requires mutual active consent (`status = 'active'`) verified by `has_active_academy_affiliation()` |
| **Verified Record Tampering** | Evaluator retroactively alters a score after official verification | Trigger `guard_assessment_session_update()` locks verified sessions permanently against updates or deletion |
| **Compromised Account Usage** | Suspended user continues reading/writing via valid JWT token | Security helper `is_active_user()` checks `is_suspended = FALSE` across every RLS policy |
| **Anonymous Scraping** | Anonymous public reads private athlete biometrics or contacts | All domain tables deny unauthenticated requests (`TO authenticated`) |

---

## 2. Row Level Security (RLS) Policy Inventory

### `public.user_profiles`
- `REVOKE INSERT ON public.user_profiles FROM authenticated, anon;`  
  *Defense*: Only the trusted `handle_new_auth_user()` trigger (running with `SECURITY DEFINER`) can create user profiles.
- **SELECT**: `profiles_select_active`  
  *Policy*: `USING (public.is_active_user(auth.uid()))`
- **UPDATE**: `profiles_update_own`  
  *Policy*: `USING (auth.uid() = id AND public.is_active_user(auth.uid())) WITH CHECK (auth.uid() = id AND public.is_active_user(auth.uid()))`  
  *Trigger Enforcement*: Trigger blocks updating `role` or `is_suspended`.

### `public.academies`
- **SELECT**: `academies_select_authenticated`  
  *Policy*: `USING (public.is_active_user(auth.uid()))`
- **INSERT**: `academies_insert_owner`  
  *Policy*: `WITH CHECK (auth.uid() = owner_id AND public.is_active_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'academy'))`
- **UPDATE**: `academies_update_owner`  
  *Policy*: `USING (auth.uid() = owner_id AND public.is_active_user(auth.uid())) WITH CHECK (auth.uid() = owner_id AND public.is_active_user(auth.uid()))`
- **DELETE**: `academies_delete_owner`  
  *Policy*: `USING (auth.uid() = owner_id AND public.is_active_user(auth.uid()))`

### `public.institutions`
- **SELECT**: `institutions_select_authenticated`  
  *Policy*: `USING (public.is_active_user(auth.uid()))`
- **INSERT**: `institutions_insert_owner`  
  *Policy*: `WITH CHECK (auth.uid() = owner_id AND public.is_active_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'institution'))`
- **UPDATE**: `institutions_update_owner`  
  *Policy*: `USING (auth.uid() = owner_id AND public.is_active_user(auth.uid())) WITH CHECK (auth.uid() = owner_id AND public.is_active_user(auth.uid()))`
- **DELETE**: `institutions_delete_owner`  
  *Policy*: `USING (auth.uid() = owner_id AND public.is_active_user(auth.uid()))`

### `public.athletes`
- **SELECT**: `athletes_select_authenticated`  
  *Policy*: `USING (public.is_active_user(auth.uid()))`
- **INSERT**: `athletes_insert_self`  
  *Policy*: `WITH CHECK (auth.uid() = id AND public.is_active_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'athlete'))`
- **UPDATE**: `athletes_update_self`  
  *Policy*: `USING (auth.uid() = id AND public.is_active_user(auth.uid())) WITH CHECK (auth.uid() = id AND public.is_active_user(auth.uid()))`

### `public.athlete_affiliations`
- **SELECT**: `affiliations_select_involved`  
  *Policy*: Only athlete or the academy/institution owner can view affiliation status.
- **INSERT**: `affiliations_insert_requester`  
  *Policy*: `WITH CHECK (requested_by = auth.uid() AND (athlete_id = auth.uid() OR academy_id IN (...) OR institution_id IN (...)))`
- **UPDATE**: `affiliations_update_approver`  
  *Policy*: Either party can approve or revoke an affiliation.

### `public.assessment_sessions`
- **SELECT**: `sessions_select_authorized`  
  *Policy*: Athlete, session evaluator, or actively affiliated academy/institution owners can view.
- **INSERT**: `sessions_insert_authorized_evaluator`  
  *Policy*: `WITH CHECK (public.is_active_user(auth.uid()) AND evaluator_id = auth.uid() AND athlete_id != auth.uid() AND public.is_authorized_evaluator(auth.uid(), academy_id, institution_id))`
- **UPDATE**: `sessions_update_unverified`  
  *Policy*: Only editable when `verified = FALSE`.
- **DELETE**: `sessions_delete_owner_unverified`  
  *Policy*: Verified sessions can never be deleted by client accounts.

### `public.assessment_results`
- **SELECT**: `results_select_authorized`  
  *Policy*: Read access restricted to sessions the user is authorized to inspect.
- **INSERT**: `results_insert_evaluator`  
  *Policy*: Only the evaluator of the parent unverified session can insert trial scores.
- **UPDATE**: `results_update_evaluator_unverified`  
  *Policy*: Only the evaluator can update trials before session verification.

---

## 3. Analysis of `SECURITY DEFINER` Functions

`SECURITY DEFINER` functions execute with the privileges of the database owner and bypass caller RLS. To avoid security pitfalls:

1. **`is_active_user(user_id UUID)`**:
   - Marked `STABLE` and strictly parameterized. Reads single boolean column from `user_profiles`. Does not accept arbitrary dynamic SQL.
2. **`has_active_academy_affiliation(p_athlete_id, p_academy_owner)`**:
   - Parameterized join with explicit equality conditions. Eliminates SQL injection surface.
3. **`guard_user_profile_update()` & `guard_academy_update()`**:
   - Triggers execute exclusively inside PostgreSQL internal event pipeline.

---

## 4. Storage Security Design

Target buckets planned for Phase 2 integration:

1. **`athlete-passports` (Private)**:
   - Contains generated biometric scorecards, radar charts, and official evaluation exports.
   - Storage RLS Policy:
     ```sql
     CREATE POLICY "passports_access_policy"
       ON storage.objects FOR SELECT TO authenticated
       USING (
         bucket_id = 'athlete-passports' AND (
           (storage.foldername(name))[1] = auth.uid()::text OR
           public.has_active_academy_affiliation((storage.foldername(name))[1]::UUID, auth.uid()) OR
           public.has_active_institution_affiliation((storage.foldername(name))[1]::UUID, auth.uid())
         )
       );
     ```
2. **`avatars` (Public Read, Owner Write)**:
   - Publicly readable profile photos. Write access restricted to the user's specific subfolder: `(storage.foldername(name))[1] = auth.uid()::text`.
3. **`parental-consents` (Private Encrypted)**:
   - Scanned consent forms for athletes under 18 years. Accessible strictly by the athlete and compliance officers.

---

## 5. Least Privilege & Secret Hygiene

- **No Service Role Keys**: Client-side code (`src/lib/supabase.ts`) references solely the public anonymous key (`VITE_SUPABASE_ANON_KEY`).
- **No Production Connections**: Validated that `.env.example` contains placeholders only and no production URL or keys exist in the repository.
