import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { BRAND, ROLES_CONFIG } from '@/lib/constants';

describe('PratibhaScan Independent Branding Verification Suite', () => {
  describe('1. Global Brand Constants (src/lib/constants.ts)', () => {
    it('sets primary brand name to PratibhaScan', () => {
      expect(BRAND.name).toBe('PratibhaScan');
    });

    it('sets official product tagline to "Discover Potential. Measure Progress."', () => {
      expect(BRAND.tagline).toBe('Discover Potential. Measure Progress.');
    });

    it('defines sports technology product category', () => {
      expect(BRAND.category).toBe('AI-Assisted Sports Talent Assessment & Athlete Performance Platform');
    });

    it('asserts copyright belongs to PratibhaScan without company marketing prefix', () => {
      expect(BRAND.copyright).toContain('PratibhaScan');
      expect(BRAND.copyright).not.toContain('KAARYAN');
    });

    it('preserves exactly three primary roles: athlete, academy, institution', () => {
      expect(Object.keys(ROLES_CONFIG)).toEqual(['athlete', 'academy', 'institution']);
    });
  });

  describe('2. HTML Shell & Browser Metadata (index.html)', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    it('sets browser title to "PratibhaScan | AI Sports Talent Assessment"', () => {
      expect(indexContent).toContain('<title>PratibhaScan | AI Sports Talent Assessment</title>');
    });

    it('sets modern Open Graph metadata for PratibhaScan', () => {
      expect(indexContent).toContain('content="PratibhaScan | AI Sports Talent Assessment"');
      expect(indexContent).toContain('content="/images/hero-banner.svg"');
    });

    it('ensures no visible KAARYAN marketing in index.html', () => {
      expect(indexContent).not.toContain('KAARYAN');
    });
  });

  describe('3. Public Layouts & Footers (PublicFooter.tsx & PublicHeader.tsx)', () => {
    const footerPath = path.resolve(process.cwd(), 'src/components/layout/PublicFooter.tsx');
    const footerContent = fs.readFileSync(footerPath, 'utf-8');

    it('ensures PublicFooter contains no user-facing KAARYAN marketing', () => {
      expect(footerContent).not.toContain('KAARYAN LABS');
      expect(footerContent).not.toContain('kaaryanlabs.com');
      expect(footerContent).toContain('support@pratibhascan.com');
      expect(footerContent).toContain('PratibhaScan — AI-Assisted Sports Talent Assessment');
    });

    const headerPath = path.resolve(process.cwd(), 'src/components/layout/PublicHeader.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');

    it('ensures PublicHeader uses PratibhaScan wordmark and contains no company branding', () => {
      expect(headerContent).not.toContain('KAARYAN');
    });
  });

  describe('4. Dashboard Chrome & Top Navigation', () => {
    const sidebarPath = path.resolve(process.cwd(), 'src/components/layout/DashboardSidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    it('ensures DashboardSidebar displays independent PratibhaScan platform stamp', () => {
      expect(sidebarContent).toContain('PratibhaScan · Sports Performance Hub');
      expect(sidebarContent).not.toContain('KAARYAN LABS');
    });

    const topNavPath = path.resolve(process.cwd(), 'src/components/layout/DashboardTopNav.tsx');
    const topNavContent = fs.readFileSync(topNavPath, 'utf-8');

    it('ensures DashboardTopNav displays PratibhaScan Sports Hub and no company branding', () => {
      expect(topNavContent).toContain('Authenticated Portal · PratibhaScan Sports Hub');
      expect(topNavContent).not.toContain('KAARYAN LABS');
    });
  });

  describe('5. Landing Page Transformation (src/pages/LandingPage.tsx)', () => {
    const landingPath = path.resolve(process.cwd(), 'src/pages/LandingPage.tsx');
    const landingContent = fs.readFileSync(landingPath, 'utf-8');

    it('clearly communicates PratibhaScan brand in hero badge and titles', () => {
      expect(landingContent).toContain('{BRAND.name} • {BRAND.tagline}');
      expect(landingContent).toContain('Standardized Sports Talent Assessment');
    });

    it('includes all dedicated sections including AI Pose Studio and 3 roles', () => {
      expect(landingContent).toContain('Live AI Pose Tracking &amp; Biomechanical Kinematics');
      expect(landingContent).toContain('Designed for Exactly Three Dedicated Roles');
      expect(landingContent).toContain('Six Core Physical Assessment Batteries');
      expect(landingContent).toContain('Privacy, Ethics &amp; Assessment Integrity');
    });

    it('verifies that no visible KAARYAN marketing or emails exist on the landing page', () => {
      expect(landingContent).not.toContain('KAARYAN LABS');
      expect(landingContent).not.toContain('inquiries@kaaryanlabs.com');
    });
  });

  describe('6. Auth Pages & User Modals', () => {
    const loginPath = path.resolve(process.cwd(), 'src/features/auth/LoginPage.tsx');
    const loginContent = fs.readFileSync(loginPath, 'utf-8');

    it('ensures LoginPage uses independent PratibhaScan tagline', () => {
      expect(loginContent).toContain('PratibhaScan — Discover Potential. Measure Progress.');
      expect(loginContent).not.toContain('KAARYAN LABS');
    });

    const registerPath = path.resolve(process.cwd(), 'src/features/auth/RegisterPage.tsx');
    const registerContent = fs.readFileSync(registerPath, 'utf-8');

    it('ensures RegisterPage uses independent PratibhaScan tagline', () => {
      expect(registerContent).toContain('PratibhaScan — Discover Potential. Measure Progress.');
      expect(registerContent).not.toContain('KAARYAN LABS');
    });

    const passportPath = path.resolve(process.cwd(), 'src/features/athlete/AthletePassportExportModal.tsx');
    const passportContent = fs.readFileSync(passportPath, 'utf-8');

    it('ensures printable athletic passport displays PratibhaScan platform verification', () => {
      expect(passportContent).toContain('PratibhaScan · Sports Talent Assessment Platform');
      expect(passportContent).toContain('Standardized protocol benchmark records authenticated by PratibhaScan Platform');
      expect(passportContent).not.toContain('KAARYAN LABS');
    });

    const notFoundPath = path.resolve(process.cwd(), 'src/pages/NotFoundPage.tsx');
    const notFoundContent = fs.readFileSync(notFoundPath, 'utf-8');

    it('ensures NotFoundPage displays PratibhaScan branding', () => {
      expect(notFoundContent).toContain('PratibhaScan • AI-Assisted Sports Talent Assessment Platform');
      expect(notFoundContent).not.toContain('KAARYAN LABS');
    });
  });

  describe('7. AI Pose Studio & Kinematics Telemetry', () => {
    const squatModalPath = path.resolve(process.cwd(), 'src/features/pose-detection/components/SquatSessionSummaryModal.tsx');
    const squatModalContent = fs.readFileSync(squatModalPath, 'utf-8');

    it('ensures exported telemetry JSON identifies as PratibhaScan Sports Technology', () => {
      expect(squatModalContent).toContain("platform: 'PratibhaScan Sports Technology'");
      expect(squatModalContent).not.toContain("company: 'KAARYAN LABS'");
    });
  });
});
