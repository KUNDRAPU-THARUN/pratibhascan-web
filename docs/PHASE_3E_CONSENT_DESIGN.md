# PRATIBHASCAN WEB — PHASE 3E GUARDIAN CONSENT ARCHITECTURE & DPDP SPECIFICATION

**Company:** KAARYAN LABS  
**Product:** PratibhaScan (*AI-Powered Sports Talent Assessment & Development Platform*)  
**Document Version:** 1.0  
**Date:** November 13, 2026  
**Auditor & Architect:** Senior Privacy Engineer & Full-Stack Security Architect  
**Regulatory Framework:** Digital Personal Data Protection (DPDP) Act 2023 (India) — Section 9 (Processing of Personal Data of Children)  
**Status:** ARCHITECTURAL SPECIFICATION & PROPOSED SCHEMA (AWAITING LEGAL REVIEW & SIGN-OFF)  

---

## 1. Regulatory Context & Problem Statement

### 1.1 The Legal Mandate (DPDP Act 2023, Section 9)
Under Section 9 of India's Digital Personal Data Protection Act 2023:
1. A data fiduciary shall, before processing any personal data of a child (defined as an individual who has not completed 18 years of age), obtain **verifiable parental consent** or the consent of a lawful guardian in such manner as may be prescribed.
2. A data fiduciary shall not undertake processing of personal data that is likely to cause any detrimental effect on the well-being of a child.
3. A data fiduciary shall not undertake tracking or behavioral monitoring of children or targeted advertising directed at children.

### 1.2 Identified Architectural Gap in Prior Implementation
- In Phase 3D/3D.5, minor status was computed accurately from `date_of_birth` ($\text{Age} < 18$).
- However, minor protection was limited to an **informational warning banner** in the assessment modal:
  > *"Minor Athlete Safeguard: This athlete is under 18 years of age. All trials must be conducted under coach supervision with active parental consent on file."*
- **Privacy Finding:** An informational banner or a simple client-side checkbox **does NOT constitute verifiable parental consent** under Indian privacy law.
- Without an authenticatable guardian identity, verifiable digital consent record, purpose-specific granularity, and auditable revocation workflow, athletic institutions face severe regulatory liability.

---

## 2. Comprehensive Guardian Consent Model

The PratibhaScan Guardian Consent Architecture comprises five interconnected pillars:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GUARDIAN CONSENT MODEL                          │
└────────────────────────────────────────────────────────────────────────┘
          │
          ├── 1. Guardian Identity & Verification (Aadhaar / Phone OTP / DigiLocker)
          │
          ├── 2. Verified Linkage to Minor Athlete (Parent / Legal Guardian / Ward)
          │
          ├── 3. Granular, Purpose-Specific Consent Scopes:
          │        • Scope A: performance_tracking (Physical drills, fitness metrics)
          │        • Scope B: talent_scouting (Sharing data with scouts & state federations)
          │        • Scope C: biometric_eval (High-precision kinematic/video capture)
          │
          ├── 4. Immutable Audit Trail & Expiry (Timestamps, IP, Hashes, 1-Year Expiry)
          │
          └── 5. Revocation & Erasure Lifecycle (Immediate lock on new assessments & exports)
```

---

## 3. Database Schema Design (Proposed Migration)

To guarantee legal auditability and database-level enforcement, the following relational schema is designed for local staging and schema review:

```sql
-- ==============================================================================
-- PRATIBHASCAN PRIVACY SUBSYSTEM: GUARDIAN CONSENT & MINOR SAFEGUARDS
-- ==============================================================================

-- 1. Guardian Profiles
CREATE TABLE IF NOT EXISTS public.guardian_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('mother', 'father', 'legal_guardian', 'appointed_warden')),
    phone_number TEXT NOT NULL,
    email TEXT,
    government_id_type TEXT CHECK (government_id_type IN ('aadhaar', 'passport', 'voter_id', 'driving_license')),
    government_id_hash TEXT, -- Stored as salted cryptographic hash; raw ID is never stored
    id_verified BOOLEAN DEFAULT FALSE NOT NULL,
    id_verified_at TIMESTAMPTZ,
    verification_method TEXT CHECK (verification_method IN ('phone_otp', 'aadhaar_esign', 'digilocker', 'physical_affidavit')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Guardian-Athlete Linkage
CREATE TABLE IF NOT EXISTS public.guardian_athlete_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id UUID REFERENCES public.guardian_profiles(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
    verification_status TEXT DEFAULT 'pending' NOT NULL 
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'terminated')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    supporting_document_url TEXT, -- Storage path to scanned birth certificate/court guardianship order
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_guardian_athlete UNIQUE (guardian_id, athlete_id)
);

-- 3. Verifiable Guardian Consents (Purpose-Specific)
CREATE TABLE IF NOT EXISTS public.guardian_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID REFERENCES public.guardian_athlete_links(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
    guardian_id UUID REFERENCES public.guardian_profiles(id) ON DELETE CASCADE NOT NULL,
    consent_purpose TEXT NOT NULL 
        CHECK (consent_purpose IN (
            'performance_tracking',  -- Recording physical test trials and standard metrics
            'talent_scouting',       -- Exposing verified records to accredited academies & selectors
            'biometric_eval'         -- Future kinematic video/optical posture analysis
        )),
    status TEXT DEFAULT 'active' NOT NULL 
        CHECK (status IN ('active', 'revoked', 'expired')),
    consent_method TEXT NOT NULL 
        CHECK (consent_method IN ('phone_otp', 'aadhaar_esign', 'digilocker_token', 'signed_affidavit_upload')),
    verification_token_hash TEXT NOT NULL, -- SHA-256 HMAC of OTP / eSign transaction ID
    consented_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL, -- Mandatory maximum 12-month validity period
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT check_consent_validity CHECK (expires_at > consented_at),
    CONSTRAINT unique_active_purpose UNIQUE (athlete_id, consent_purpose, status)
);

-- 4. Immutable Consent Audit Log
CREATE TABLE IF NOT EXISTS public.consent_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_id UUID REFERENCES public.guardian_consents(id) ON DELETE SET NULL,
    athlete_id UUID NOT NULL,
    guardian_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('granted', 'renewed', 'revoked', 'expired', 'erasure_requested')),
    actor_id UUID NOT NULL,
    ip_address INET,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
```

---

## 4. Row-Level Security (RLS) & Access Control Enforcement

### 4.1 Strict Multi-Tenant Isolation
- **Guardian Access:** Guardians may only SELECT and UPDATE consent records for their own linked athletes (`guardian_id = auth.uid()`).
- **Athlete Access:** Minor athletes may view the consent status granted on their behalf, but cannot unilaterally grant or revoke parental consent.
- **Academy/Institution Access:** Evaluators can only query whether an active `performance_tracking` consent token exists for an athlete (`SELECT has_active_minor_consent(p_athlete_id, 'performance_tracking')`). Evaluators are **never permitted to read** the guardian's government ID hashes or private contact details.

### 4.2 Database Pre-Execution Constraint: `check_minor_consent_before_assessment`
```sql
CREATE OR REPLACE FUNCTION public.check_minor_consent_before_assessment()
RETURNS TRIGGER AS $$
DECLARE
    v_dob DATE;
    v_age NUMERIC;
    v_has_consent BOOLEAN;
BEGIN
    -- 1. Fetch athlete date of birth
    SELECT date_of_birth INTO v_dob FROM public.athletes WHERE id = NEW.athlete_id;
    
    -- 2. Compute age relative to current assessment date
    v_age := EXTRACT(YEAR FROM AGE(NEW.assessment_date, v_dob));
    
    -- 3. If minor (< 18), require active, unexpired performance_tracking consent
    IF v_age < 18 THEN
        SELECT EXISTS (
            SELECT 1 FROM public.guardian_consents
            WHERE athlete_id = NEW.athlete_id
              AND consent_purpose = 'performance_tracking'
              AND status = 'active'
              AND expires_at > NOW()
        ) INTO v_has_consent;
        
        IF NOT v_has_consent THEN
            RAISE EXCEPTION 'DPDP Act Violation: Cannot create assessment session for minor athlete (Age %) without active, verified guardian consent.', v_age;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Consent Lifecycle & Rights of the Data Principal

### 5.1 Verification Workflow (Why Checkboxes Are Prohibited)
1. **Initiation:** Minor athlete creates an account and specifies a parent/guardian mobile number.
2. **Guardian Notification:** Guardian receives an SMS/WhatsApp dispatch containing a one-time secure link.
3. **Identity Verification:**
   - **Tier 1 (Testing / Interim):** Dual-factor Phone OTP delivered to guardian. On valid entry, consent token is cryptographically stamped with SHA-256 hash.
   - **Tier 2 (Production Goal):** DigiLocker / Aadhaar e-Sign integrating UIDAI electronic signature.
4. **Purpose Selection:** Guardian must independently toggle each scope (`performance_tracking`, `talent_scouting`, `biometric_eval`). No pre-selected bundle checkboxes.
5. **Annual Expiry:** All consents automatically lapse after 365 days, requiring active re-verification.

### 5.2 Right of Withdrawal (Revocation)
- The guardian can withdraw consent at any time via a dedicated Guardian Portal interface.
- On withdrawal:
  - `status` transitions to `'revoked'` and `revoked_at = NOW()`.
  - The audit log records the revocation event.
  - The database immediately blocks any new assessment sessions for the athlete.
  - Scouting visibility is revoked in real-time.

### 5.3 Right to Erasure & Data Retention Guidelines
- Historical competitive trial results: Under national sports federation guidelines, records entered into public state trials are preserved as historical sports competition archives.
- Private academy training trials: If a parent requests account erasure under Section 12 of the DPDP Act, non-federation assessment measurements and biometric data are purged within 30 days, while retaining only anonymized statistical cohorts.

---

## 6. Implementation Disclaimer & Legal Review Requirement

> [!IMPORTANT]
> This consent architecture has been designed by technical and security engineering in alignment with the statutory language of the DPDP Act 2023. Prior to deploying this workflow to public production with real children in India, **formal independent legal review by qualified privacy counsel** is required to certify that the identity verification mechanism conforms to the impending DPDP Implementation Rules.
