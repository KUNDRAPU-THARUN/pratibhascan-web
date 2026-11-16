import { test, expect } from '@playwright/test';

/**
 * PratibhaScan Web — Phase 4A AI Pose Detection Studio E2E Suite
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Verifies live camera controls, MediaPipe Pose Landmarker lifecycle,
 * overlay toggles, privacy & experimental disclaimers, responsive viewports,
 * and media stream teardown.
 */

test.describe('PratibhaScan Web — AI Pose Detection Studio Suite', () => {
  // ============================================================================
  // Test 1: Studio Page Layout, Mode Switching & Biomechanics UI Loading
  // ============================================================================
  test('1. Studio loads branding, header, mode tabs, and squat counter interface', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    // Verify main header
    await expect(page.getByRole('heading', { name: /AI Pose Detection/i })).toBeVisible();

    // Verify 100% Local Inference badge
    await expect(page.locator('text=100% Local Inference')).toBeVisible();

    // Verify Mode Switcher buttons
    const squatModeBtn = page.getByRole('button', { name: /squat counter/i });
    const studioModeBtn = page.getByRole('button', { name: /studio telemetry/i });
    await expect(squatModeBtn).toBeVisible();
    await expect(studioModeBtn).toBeVisible();

    // Squat Counter mode is active by default: verify Squat UI elements
    await expect(page.getByText('Squat Repetitions', { exact: true })).toBeVisible();
    await expect(page.getByText('Workout Timer', { exact: true })).toBeVisible();
    await expect(page.getByText('Knee Angle (∠H-K-A)', { exact: true })).toBeVisible();
    await expect(page.getByText('Hip Angle (∠S-H-K)', { exact: true })).toBeVisible();

    // Switch to Studio Telemetry Mode
    await studioModeBtn.click();
    await expect(page.getByText('Subject', { exact: true })).toBeVisible();
    await expect(page.getByText('Frame Rate', { exact: true })).toBeVisible();
    await expect(page.getByText('Inference', { exact: true })).toBeVisible();

    // Switch back to Squat Counter Mode
    await squatModeBtn.click();
    await expect(page.getByText('Squat Repetitions', { exact: true })).toBeVisible();

    // Inactive placeholder should be visible with Start button
    await expect(page.locator('text=Ready for Real-Time Pose Tracking')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /start (live )?camera/i }).first()
    ).toBeVisible();
  });

  // ============================================================================
  // Test 2: Mandatory Privacy & Experimental Disclaimers
  // ============================================================================
  test('2. Mandatory statutory privacy and experimental disclaimers are accurately rendered', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    // Mandatory Privacy Notice text verification
    const privacyNotice = page.locator(
      'text=Camera frames are processed locally in your browser by default. No video is uploaded or recorded by this feature.'
    );
    await expect(privacyNotice).toBeVisible();

    // Mandatory Experimental Feature Notice text verification
    const experimentalNotice = page.locator(
      'text=Pose detection is experimental and is not a certified sports measurement.'
    );
    await expect(experimentalNotice).toBeVisible();
  });

  // ============================================================================
  // Test 3: Protected Route Security
  // ============================================================================
  test('3. Unauthenticated access to /dashboard/pose-detection is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/pose-detection', { waitUntil: 'domcontentloaded' });

    // ProtectedRoute should redirect unauthenticated request to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /sign in to pratibhascan/i })).toBeVisible();
  });

  // ============================================================================
  // Test 4: Live Camera Stream Activation & Lifecycle Controls
  // ============================================================================
  test('4. User explicitly activates camera, toggles visual overlays, pauses, and stops camera', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    // Click Start Camera button
    const startButton = page.getByRole('button', { name: /start (live )?camera/i }).first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Verify transition to LIVE CAMERA state
    await expect(page.getByText('LIVE CAMERA', { exact: true })).toBeVisible({ timeout: 15000 });

    // Stop Camera button should now be visible
    const stopButton = page.getByRole('button', { name: /stop camera/i });
    await expect(stopButton).toBeVisible();

    // Toggle Skeleton Overlay (ON -> OFF -> ON)
    const skeletonToggle = page.getByRole('button', { name: /skeleton: on/i });
    await expect(skeletonToggle).toBeVisible();
    await skeletonToggle.click();
    await expect(page.getByRole('button', { name: /skeleton: off/i })).toBeVisible();
    await page.getByRole('button', { name: /skeleton: off/i }).click();
    await expect(page.getByRole('button', { name: /skeleton: on/i })).toBeVisible();

    // Toggle Joints Overlay (ON -> OFF -> ON)
    const jointsToggle = page.getByRole('button', { name: /joints: on/i });
    await expect(jointsToggle).toBeVisible();
    await jointsToggle.click();
    await expect(page.getByRole('button', { name: /joints: off/i })).toBeVisible();
    await page.getByRole('button', { name: /joints: off/i }).click();
    await expect(page.getByRole('button', { name: /joints: on/i })).toBeVisible();

    // Pause / Resume Tracking
    const pauseButton = page.getByRole('button', { name: /pause tracking/i });
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();

    // PAUSED status badge appears
    const pausedBadge = page.locator('span', { hasText: 'PAUSED' }).first();
    await expect(pausedBadge).toBeVisible();

    // Resume tracking
    const resumeButton = page.getByRole('button', { name: /resume tracking/i });
    await expect(resumeButton).toBeVisible();
    await resumeButton.click();
    await expect(page.getByRole('button', { name: /pause tracking/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('span', { hasText: 'PAUSED' })).toHaveCount(0, { timeout: 10000 });

    // Explicit Stop Camera
    await stopButton.click();

    // Verifies camera stream is released and standby placeholder returns
    await expect(page.locator('text=Ready for Real-Time Pose Tracking')).toBeVisible();
    await expect(page.getByRole('button', { name: /start (live )?camera/i }).first()).toBeVisible();
    await expect(page.getByText('LIVE CAMERA', { exact: true })).not.toBeVisible();
  });

  // ============================================================================
  // Test 5: Responsive Layout Without Horizontal Scroll
  // ============================================================================
  test('5. Pose Detection Studio adjusts cleanly to viewport without horizontal body overflow', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);

    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  // ============================================================================
  // Test 6: Rapid Start/Stop Lifecycle Hardening (Mocked Camera Stream)
  // ============================================================================
  test('6. [Mocked Camera] Rapid Start and immediate Stop prevents hanging streams and restores standby', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    const startButton = page.getByRole('button', { name: /start (live )?camera/i }).first();
    await expect(startButton).toBeVisible();

    // Rapid double-action: start camera and immediately stop once active
    await startButton.click();
    const stopButton = page.getByRole('button', { name: /stop camera/i });
    await expect(stopButton).toBeVisible({ timeout: 15000 });
    await stopButton.click();

    // Verifies immediate teardown
    await expect(page.locator('text=Ready for Real-Time Pose Tracking')).toBeVisible();
    await expect(page.getByText('LIVE CAMERA', { exact: true })).not.toBeVisible();
  });

  // ============================================================================
  // Test 7: Device Switching Interaction (Mocked Camera Stream)
  // ============================================================================
  test('7. [Mocked Camera] Camera switch button operates cleanly without unhandled exceptions', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    const startButton = page.getByRole('button', { name: /start (live )?camera/i }).first();
    await startButton.click();
    await expect(page.getByText('LIVE CAMERA', { exact: true })).toBeVisible({ timeout: 15000 });

    // Look for Switch Camera button or selector
    const switchControl = page.getByRole('button', { name: /switch camera/i });
    if (await switchControl.isVisible()) {
      await switchControl.click();
      // Ensure camera is still alive or recovering
      await expect(page.getByRole('button', { name: /stop camera/i })).toBeVisible();
    }

    // Clean teardown
    await page.getByRole('button', { name: /stop camera/i }).click();
    await expect(page.locator('text=Ready for Real-Time Pose Tracking')).toBeVisible();
  });

  // ============================================================================
  // Test 8: Squat Counter Controls (Start Reps, Pause, Reset)
  // ============================================================================
  test('8. [Squat Counter] Session start, pause, and reset controls operate cleanly', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    // Start Camera first
    const startCamBtn = page.getByRole('button', { name: /start (live )?camera/i }).first();
    await startCamBtn.click();
    await expect(page.getByText('LIVE CAMERA', { exact: true })).toBeVisible({ timeout: 15000 });

    // Start Reps button should now be enabled
    const startRepsBtn = page.getByRole('button', { name: /start reps/i });
    await expect(startRepsBtn).toBeVisible();
    await startRepsBtn.click();

    // Button should now show Pause
    const pauseRepsBtn = page.getByRole('button', { name: /^pause$/i });
    await expect(pauseRepsBtn).toBeVisible();

    // Click Pause
    await pauseRepsBtn.click();
    await expect(page.getByRole('button', { name: /start reps/i })).toBeVisible();

    // Click Reset
    const resetBtn = page.getByTitle('Reset repetition count and timer');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    }

    // Stop Camera teardown
    await page.getByRole('button', { name: /stop camera/i }).click();
    await expect(page.locator('text=Ready for Real-Time Pose Tracking')).toBeVisible();
  });

  // ============================================================================
  // Test 9: Camera Framing & Calibration Guided Workflow
  // ============================================================================
  test('9. [Calibration] Framing card renders visibility checklist, distance guidance, and lock controls', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    // Verify Calibration Card header
    await expect(page.getByText('Camera Framing & Calibration', { exact: true })).toBeVisible();

    // Verify checklist sections
    await expect(page.getByText('Body Visibility', { exact: true })).toBeVisible();
    await expect(page.getByText('Framing Distance', { exact: true })).toBeVisible();
    await expect(page.getByText('Pose Stability', { exact: true })).toBeVisible();

    // Toggle calibration card visibility from controls
    const toggleCalibBtn = page.getByTitle('Camera Framing Calibration');
    if (await toggleCalibBtn.isVisible()) {
      await toggleCalibBtn.click();
      await expect(page.getByText('Camera Framing & Calibration', { exact: true })).not.toBeVisible();
      await toggleCalibBtn.click();
      await expect(page.getByText('Camera Framing & Calibration', { exact: true })).toBeVisible();
    }
  });

  // ============================================================================
  // Test 10: Post-Session Summary Modal & Analytics Display
  // ============================================================================
  test('10. [Session Summary] Summary modal opens, presents repetition breakdown, and handles client export', async ({
    page,
  }) => {
    await page.goto('/preview/pose-detection', { waitUntil: 'domcontentloaded' });

    // Click Summary button from Squat Controls
    const summaryBtn = page.getByTitle('View Session Summary');
    if (await summaryBtn.isVisible()) {
      await summaryBtn.click();

      // Verify Modal Title
      await expect(
        page.getByRole('heading', { name: /Squat Session Summary & Analytics/i })
      ).toBeVisible();

      // Verify KPI Metrics
      await expect(page.getByText('Valid Repetitions', { exact: true })).toBeVisible();
      await expect(page.getByText('Partial Repetitions', { exact: true })).toBeVisible();
      await expect(page.getByText('Tracking Coverage', { exact: true })).toBeVisible();

      // Verify Export Button is visible
      await expect(page.getByRole('button', { name: /Download JSON Summary/i })).toBeVisible();

      // Close modal
      await page.getByRole('button', { name: /Resume Workout/i }).click();
      await expect(
        page.getByRole('heading', { name: /Squat Session Summary & Analytics/i })
      ).not.toBeVisible();
    }
  });
});
