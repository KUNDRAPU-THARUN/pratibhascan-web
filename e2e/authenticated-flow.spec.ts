import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * PratibhaScan Web — Authenticated End-to-End Workflow & Security Suite
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Verifies live authentication, two-person verification, role isolation,
 * and athlete benchmark updates against local Supabase container.
 */

const CREDENTIALS = {
  athlete: {
    email: 'athlete.e2e@kaaryan.test',
    password: 'TestPassword123!',
    name: 'Arjun E2E Athlete',
  },
  academyDirector: {
    email: 'academy.e2e@kaaryan.test',
    password: 'TestPassword123!',
    name: 'Coach Vikram Director',
  },
  secondaryCoach: {
    email: 'coach2.e2e@kaaryan.test',
    password: 'TestPassword123!',
    name: 'Coach Neha Reviewer',
  },
  institutionOfficer: {
    email: 'institution.e2e@kaaryan.test',
    password: 'TestPassword123!',
    name: 'Officer Rahul State',
  },
};

test.describe.serial('PratibhaScan Web — Live Authenticated Assessment & Two-Person Workflow', () => {
  test.beforeAll(async () => {
    // Ensure clean synthetic accounts and test baseline before suite runs
    execSync('node scripts/seed-e2e-accounts.js', { stdio: 'inherit' });
  });

  // ----------------------------------------------------------------------------
  // Helper: Perform Web UI Login
  // ----------------------------------------------------------------------------
  async function performLogin(page: any, email: string, pass: string) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#login-email', email);
    await page.fill('#login-password', pass);
    await page.click('button[type="submit"]');
    // Wait until login completes and navigates away from /login
    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 15000 });
  }

  // Helper: Perform Web UI Logout
  async function performLogout(page: any) {
    try {
      const signOutBtn = page.locator('button[aria-label="Sign Out"], button:has-text("Sign Out")').first();
      if (await signOutBtn.isVisible({ timeout: 1500 })) {
        await signOutBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    } catch {
      // Fallback
    }
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
  }

  // ============================================================================
  // Test 1: Athlete Authenticated Dashboard & Benchmark Inspection
  // ============================================================================
  test('1. Athlete logs in, verifies authenticated state, and views verified benchmarks', async ({ page }) => {
    await performLogin(page, CREDENTIALS.athlete.email, CREDENTIALS.athlete.password);

    // Should redirect to athlete dashboard
    await expect(page).toHaveURL(/\/dashboard\/athlete/, { timeout: 15000 });

    // Verify athlete header / profile displays authenticated name
    await expect(page.getByRole('heading', { name: CREDENTIALS.athlete.name })).toBeVisible();

    // Verify baseline two-person verified benchmark appears
    await expect(page.locator('text=30m Acceleration Sprint').first()).toBeVisible();
    await expect(page.locator('text=3.92').first()).toBeVisible();

    // Sign out cleanly
    await performLogout(page);
  });

  // ============================================================================
  // Test 2: Academy Hub Roster & Multi-Trial Assessment Creation
  // ============================================================================
  test('2. Academy Director logs in, inspects roster, and creates a multi-trial draft assessment', async ({ page }) => {
    await performLogin(page, CREDENTIALS.academyDirector.email, CREDENTIALS.academyDirector.password);

    // Should redirect to academy dashboard
    await expect(page).toHaveURL(/\/dashboard\/academy/, { timeout: 15000 });

    // Verify Academy Hub displays organization name and enrolled athlete
    await expect(page.locator('text=Apex E2E High Performance Academy').first()).toBeVisible();
    await expect(page.locator(`text=${CREDENTIALS.athlete.name}`).first()).toBeVisible();

    // Navigate to Assessments view
    await page.goto('/dashboard/assessments', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /standardized assessment suite/i })).toBeVisible();

    // Open Conduct Assessment modal
    const conductBtn = page.getByRole('button', { name: /conduct assessment/i });
    await expect(conductBtn).toBeVisible();
    await conductBtn.click();

    // Modal should be visible
    await expect(page.getByRole('heading', { name: /conduct.*assessment/i })).toBeVisible();

    // Select Athlete (use first eligible athlete option)
    const athleteSelect = page.getByLabel(/Eligible Affiliated Athlete/i);
    if (await athleteSelect.isVisible()) {
      await athleteSelect.selectOption({ index: 0 });
    }

    // Select Protocol: 30m Acceleration Sprint
    const protocolSelect = page.getByLabel(/Assessment Protocol/i);
    if (await protocolSelect.isVisible()) {
      await protocolSelect.selectOption({ value: 'TEST_30M_SPRINT' });
    }

    // Enter Multi-Trial inputs
    const trial1Input = page.getByLabel(/Trial 1/i);
    const trial2Input = page.getByLabel(/Trial 2/i);
    const trial3Input = page.getByLabel(/Trial 3/i);

    if (await trial1Input.isVisible()) {
      await trial1Input.fill('4.10');
      await trial2Input.fill('3.98');
      await trial3Input.fill('4.05');
    }

    // Enter Venue
    const venueInput = page.locator('input[placeholder*="Main Track"]');
    if (await venueInput.isVisible()) {
      await venueInput.fill('Apex Main Synthetic Track');
    }

    // Save as Draft
    const saveDraftBtn = page.getByRole('button', { name: /save as draft/i });
    await saveDraftBtn.scrollIntoViewIfNeeded();
    await saveDraftBtn.click({ force: true });

    // Wait for modal to close and session records table to update
    await page.waitForTimeout(2000);

    // Switch to Assessment Records tab if not already active
    const recordsTab = page.locator('button', { hasText: 'Assessment Records' });
    if (await recordsTab.isVisible()) {
      await recordsTab.click();
    }

    // Verify draft assessment appears in the records list
    await expect(page.locator('text=Draft / Pending').first()).toBeVisible();

    await performLogout(page);
  });

  // ============================================================================
  // Test 3: Self-Verification Rejection (Two-Person Separation of Duty)
  // ============================================================================
  test('3. Academy Director is blocked from self-verifying in two-person certified tier', async ({ page }) => {
    await performLogin(page, CREDENTIALS.academyDirector.email, CREDENTIALS.academyDirector.password);
    await page.goto('/dashboard/assessments', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /standardized assessment suite/i })).toBeVisible();

    // Switch to Assessment Records tab
    const recordsTab = page.locator('button', { hasText: 'Assessment Records' });
    await expect(recordsTab).toBeVisible();
    await recordsTab.click();

    // Click Details on the Draft session specifically
    const draftRow = page.locator('tr', { hasText: 'Draft / Pending' }).first();
    await expect(draftRow).toBeVisible();
    await draftRow.getByRole('button', { name: 'Details' }).click();

    // Modal dialog opens
    await expect(page.getByRole('heading', { name: /assessment session record/i })).toBeVisible();

    // Select Two-Person Verified tier
    const twoPersonRadio = page.locator('input[value="two_person_verified"]');
    await expect(twoPersonRadio).toBeVisible();
    await twoPersonRadio.check();

    // Separation of duty warning should appear
    await expect(
      page.locator('text=Two-Person Separation of Duty Warning').first()
    ).toBeVisible();

    // Attempt to click Verify & Seal Session
    const sealBtn = page.getByRole('button', { name: /verify.*seal session/i });
    await sealBtn.click();

    // Error banner should be presented rejecting self-verification
    await expect(
      page.locator('text=Two-Person Integrity Violation').first()
    ).toBeVisible();

    // Close modal cleanly
    const closeBtn = page.getByRole('button', { name: 'Close', exact: true });
    await closeBtn.click();

    await performLogout(page);
  });

  // ============================================================================
  // Test 4: Secondary Coach Reviews & Verifies (Dual Sign-Off)
  // ============================================================================
  test('4. Secondary authorized coach reviews draft and successfully verifies with dual sign-off', async ({ page }) => {
    await performLogin(page, CREDENTIALS.secondaryCoach.email, CREDENTIALS.secondaryCoach.password);
    await page.goto('/dashboard/assessments', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /standardized assessment suite/i })).toBeVisible();

    // Switch to Assessment Records tab
    const recordsTab = page.locator('button', { hasText: 'Assessment Records' });
    await expect(recordsTab).toBeVisible();
    await recordsTab.click();

    // Click Details on the Draft session specifically
    const draftRow = page.locator('tr', { hasText: 'Draft / Pending' }).first();
    await expect(draftRow).toBeVisible();
    await draftRow.getByRole('button', { name: 'Details' }).click();

    // Secondary coach is NOT the evaluator, so no self-evaluation warning
    const twoPersonRadio = page.locator('input[value="two_person_verified"]');
    await twoPersonRadio.check();

    // Add optional review remarks
    const remarksInput = page.locator('input[placeholder*="Video reviewed"]');
    if (await remarksInput.isVisible()) {
      await remarksInput.fill('Independently certified by Coach Neha');
    }

    // Click Verify & Seal Session
    const sealBtn = page.getByRole('button', { name: /verify.*seal session/i });
    await sealBtn.click();

    // Wait for modal to seal and close
    await page.waitForTimeout(2000);

    // Confirm that the status in the table has transitioned to Two-Person Verified
    await expect(page.locator('text=Two-Person Verified').first()).toBeVisible();

    await performLogout(page);
  });

  // ============================================================================
  // Test 5: Athlete Performance History Reflects Certified Assessment
  // ============================================================================
  test('5. Athlete logs in and confirms certified assessment is visible in Athletic Passport', async ({ page }) => {
    await performLogin(page, CREDENTIALS.athlete.email, CREDENTIALS.athlete.password);
    await expect(page).toHaveURL(/\/dashboard\/athlete/, { timeout: 15000 });

    // Verify benchmark and assessment log
    await expect(page.locator('text=Standardized Protocol Assessment Log').first()).toBeVisible();
    await expect(page.locator('text=30m Acceleration Sprint').first()).toBeVisible();

    await performLogout(page);
  });

  // ============================================================================
  // Test 6: Cross-Organization Isolation (Institution Cannot View Academy Records)
  // ============================================================================
  test('6. State Institution Officer is isolated from unrelated Academy draft assessments', async ({ page }) => {
    await performLogin(page, CREDENTIALS.institutionOfficer.email, CREDENTIALS.institutionOfficer.password);
    await expect(page).toHaveURL(/\/dashboard\/institution/, { timeout: 15000 });

    // Verify institution portal heading
    await expect(page.locator('text=State Sports Authority E2E').first()).toBeVisible();

    // Navigate to Assessments view
    await page.goto('/dashboard/assessments', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /standardized assessment suite/i })).toBeVisible();

    // Switch to Assessment Records tab
    const recordsTab = page.locator('button', { hasText: 'Assessment Records' });
    if (await recordsTab.isVisible()) {
      await recordsTab.click();

      // Should show zero records for the institution
      await expect(
        page.locator('text=No Assessment Records Found').first()
      ).toBeVisible();
    }

    await performLogout(page);
  });
});
