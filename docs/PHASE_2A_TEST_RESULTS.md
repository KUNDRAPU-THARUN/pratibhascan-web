# PratibhaScan Web — Phase 2A Database Test Results & Security Verification

**Company**: KAARYAN LABS  
**Product**: PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Phase**: Phase 2A — Secure Supabase Database Foundation  
**Auditor**: Senior Database QA & Security Infrastructure Engineer  
**Date**: November 2026  
**Status**: 14 / 14 Automated pgTAP Test Cases PASSED (100% Pass Rate)

---

## 1. Executive Summary

The automated database security and Row-Level Security (RLS) test suite was executed against the active local Supabase PostgreSQL stack (`127.0.0.1:54322`).

```
Target: local stack (127.0.0.1:54322)
/Users/kthar/OneDrive/Documents/Web-PratibhaScan/supabase/tests/database/01_security_and_rls.test.sql .. ok
All tests successful.
Files=1, Tests=14,  0 wallclock secs
Result: PASS
```

- **Tests Planned**: 14
- **Tests Executed**: 14
- **Passed**: 14
- **Failed**: 0
- **Build Status**: `tsc -b && vite build` PASSED (0 errors)
- **Lint Status**: `eslint .` PASSED (0 errors, 0 warnings)

All security policies, constraints, triggers, and tenant isolation mechanisms were verified without weakening any security policies or database constraints.

---

## 2. In-Depth pgTAP `throws_ok()` Function Resolution Diagnosis

### Technical Root Cause of Previous Failures
The test harness inspects PostgreSQL errors via the pgTAP `throws_ok()` function family. Inspection of the pgTAP extension's internal procedure definition revealed the exact matching mechanics:

```sql
-- pgTAP internal throws_ok(query, errcode, errmsg, description)
IF (errcode IS NULL OR SQLSTATE = errcode)
    AND (errmsg IS NULL OR SQLERRM = errmsg)
THEN
    RETURN ok( TRUE, descr );
ELSE
    RETURN ok( FALSE, descr ) || E'\n' || diag(
        '      caught: ' || SQLSTATE || ': ' || SQLERRM ||
        E'\n      wanted: ' || COALESCE( errcode, 'an exception' ) ||
        COALESCE( ': ' || errmsg, '')
    );
END IF;
```

Crucial architectural findings:
1. **Exact String Equality on `SQLERRM`**: pgTAP evaluates `SQLERRM = errmsg` using **exact equality**, not substring matching or regular expressions. Any substring pattern (such as `'violates row-level security policy'`) fails exact equality against the complete error string.
2. **Three-Argument Overload Disambiguation**: In the 3-argument signature `throws_ok(query, errcode, description)` where `octet_length(errcode) = 5`, pgTAP routes the call internally to `throws_ok(query, errcode::char(5), errmsg, NULL)`. It treats the 3rd argument as the expected `errmsg` rather than the test description, leaving the description as `NULL`.
3. **Four-Argument Precision Requirement**: To test both the SQLSTATE error code and an error message with a descriptive test name, the 4-argument signature `throws_ok(query, errcode, errmsg, description)` must be supplied with the exact `SQLSTATE` and the exact `SQLERRM` string raised by the PostgreSQL engine.

### Applied Corrections in Test Suite
The assertions were corrected in [`supabase/tests/database/01_security_and_rls.test.sql`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/supabase/tests/database/01_security_and_rls.test.sql):

1. **Test 8A (Unauthorized Athlete Assessment Insertion blocked by RLS)**:
   - **SQLSTATE**: `'42501'`
   - **Exact SQLERRM**: `'new row violates row-level security policy for table "assessment_sessions"'`
   - **Test Call**:
     ```sql
     SELECT throws_ok(
       'INSERT INTO public.assessment_sessions (athlete_id, evaluator_id, academy_id, assessment_date) VALUES (''11111111-1111-1111-1111-111111111111'', ''11111111-1111-1111-1111-111111111111'', ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''2026-11-13'')',
       '42501',
       'new row violates row-level security policy for table "assessment_sessions"',
       'TEST 8A: Unauthorized athlete cannot insert assessment sessions (rejected by RLS policy)'
     );
     ```
   - **Result**: **PASS**

2. **Test 8B (Self-Evaluation Check Constraint in Authorized Context)**:
   - **SQLSTATE**: `'23514'`
   - **Exact SQLERRM**: `'new row for relation "assessment_sessions" violates check constraint "check_no_self_evaluation"'`
   - **Test Call**:
     ```sql
     RESET ROLE; -- Restore superuser / database owner context to test database table constraint layer directly
     SELECT throws_ok(
       'INSERT INTO public.assessment_sessions (athlete_id, evaluator_id, academy_id, assessment_date) VALUES (''11111111-1111-1111-1111-111111111111'', ''11111111-1111-1111-1111-111111111111'', ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''2026-11-13'')',
       '23514',
       'new row for relation "assessment_sessions" violates check constraint "check_no_self_evaluation"',
       'TEST 8B: check_no_self_evaluation constraint rejects self-evaluation in authorized database context'
     );
     ```
   - **Result**: **PASS**

---

## 3. Comprehensive 14-Assertion Verification Matrix

| # | Test Identifier | Security Mechanism | Execution Context | Expected Security Outcome | Status |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | `TEST 1: Athlete can view own athletic record` | RLS SELECT policy | Authenticated (Athlete 1) | Exactly 1 record returned | **PASS** |
| **2** | `TEST 2: Athlete denied another athlete private sessions` | Cross-tenant RLS isolation | Authenticated (Athlete 2) | Exactly 0 records returned | **PASS** |
| **3** | `TEST 3: Academy owner can view and manage own academy records` | Organization RLS SELECT/UPDATE | Authenticated (Academy Owner) | Exactly 1 record returned | **PASS** |
| **4** | `TEST 4: Academy owner is denied modifying unrelated institution records` | Tenant isolation on UPDATE | Authenticated (Academy Owner) | 0 rows modified; record unchanged | **PASS** |
| **5** | `TEST 5: Institution owner can access own authorized records` | Organization RLS SELECT | Authenticated (Institution Owner) | Exactly 1 record returned | **PASS** |
| **6** | `TEST 6: Privilege escalation via user_profiles.role update rejected` | `guard_user_profile_update` trigger | Authenticated (Athlete 1) | Throws custom privilege escalation exception | **PASS** |
| **7** | `TEST 7: Academy ownership transfer without authorization rejected` | `guard_academy_update` trigger | Authenticated (Academy Owner) | Throws unauthorized ownership transfer exception | **PASS** |
| **8A**| `TEST 8A: Unauthorized athlete cannot insert assessment sessions` | RLS INSERT policy | Authenticated (Athlete 1) | Throws `SQLSTATE 42501` (`new row violates row-level security policy...`) | **PASS** |
| **8B**| `TEST 8B: check_no_self_evaluation constraint rejects self-evaluation` | Table CHECK constraint | Authorized Superuser context | Throws `SQLSTATE 23514` (`...violates check constraint "check_no_self_evaluation"`) | **PASS** |
| **9** | `TEST 9: Modification of verified assessment session rejected` | `guard_assessment_session_update` trigger | Authenticated (Evaluator) | Throws immutability exception | **PASS** |
| **10**| `TEST 10: Anonymous unauthenticated users cannot read private profiles` | RLS anonymous denial | Anonymous (`anon` role) | Exactly 0 records returned | **PASS** |
| **11A**| `TEST 11A: Unauthorized user deletion attempt affects zero records` | RLS DELETE policy | Authenticated (Athlete 2) | `is_empty` confirms 0 deleted rows returned | **PASS** |
| **11B**| `TEST 11B: Protected assessment session remains intact` | Authorized RLS SELECT | Authenticated (Academy Owner) | Exactly 1 record returned (intact) | **PASS** |
| **12**| `TEST 12: Private affiliation helper denies unaffiliated athlete` | Security helper function | Authenticated (Athlete 2) | Returns `FALSE` for unaffiliated academy | **PASS** |

**Summary**: 14 planned / 14 executed / **14 passed** / **0 failed**.

---

## 4. Preservation of Architectural and Security Guarantees

The database migration ([`supabase/migrations/20261112000000_initial_schema.sql`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/supabase/migrations/20261112000000_initial_schema.sql)) was preserved strictly without compromises:

1. **Row Level Security (RLS)**: Enforced on all tables with explicit SELECT, INSERT, UPDATE, and DELETE policies.
2. **`check_no_self_evaluation`**: Preserved as a database-level integrity check (`CHECK (athlete_id != evaluator_id)`).
3. **Three Application Roles**: Exactly `athlete`, `academy`, and `institution` supported across types, triggers, and schema checks.
4. **Organization Isolation**: Academy and Institution records and affiliated athlete biometrics remain isolated by strict tenancy policies and affiliation helpers.
5. **Evaluator Authorization**: Only accredited staff registered in `evaluator_authorizations` or direct organization owners can record assessments.
6. **Verified Record Protections**: Verified assessment sessions and scores are locked against alteration or client deletion via trigger and RLS constraints.

---

## 5. Build & Lint Validation

| Check | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Database Security Test Suite** | `npx supabase test db` | **PASS** | 14/14 pgTAP subtests passed |
| **TypeScript Compilation** | `tsc -b` | **PASS** | 0 errors |
| **Vite Production Bundle** | `vite build` | **PASS** | Built in 8.13s |
| **ESLint Static Analysis** | `eslint .` | **PASS** | 0 errors, 0 warnings |
