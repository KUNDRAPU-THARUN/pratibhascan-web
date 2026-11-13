import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AthleteView } from '@/features/athlete/AthleteView';
import { AcademyView } from '@/features/academy/AcademyView';
import { InstitutionView } from '@/features/institution/InstitutionView';
import { AssessmentsView } from '@/features/assessments/AssessmentsView';
import { DesignSystemView } from '@/features/design-system/DesignSystemView';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { useAuth } from '@/features/auth/AuthContext';

function DashboardRoleRedirect() {
  const { role } = useAuth();
  return <Navigate to={`/dashboard/${role || 'athlete'}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Marketing Website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Role Onboarding Wizard (Protected, skips onboarding check) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Dashboard Shell (Protected, requires completed onboarding) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireOnboarding={true}>
            <DashboardShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRoleRedirect />} />
        <Route
          path="athlete"
          element={
            <ProtectedRoute allowedRoles={['athlete']}>
              <AthleteView />
            </ProtectedRoute>
          }
        />
        <Route
          path="academy"
          element={
            <ProtectedRoute allowedRoles={['academy']}>
              <AcademyView />
            </ProtectedRoute>
          }
        />
        <Route
          path="institution"
          element={
            <ProtectedRoute allowedRoles={['institution']}>
              <InstitutionView />
            </ProtectedRoute>
          }
        />
        <Route path="assessments" element={<AssessmentsView />} />
        <Route path="design-system" element={<DesignSystemView />} />
      </Route>

      {/* Separate Demonstration Preview Mode (Publicly Accessible, Non-authenticated) */}
      <Route path="/preview" element={<DashboardShell isPreview={true} />}>
        <Route index element={<Navigate to="/preview/athlete" replace />} />
        <Route path="athlete" element={<AthleteView isPreview={true} />} />
        <Route path="academy" element={<AcademyView isPreview={true} />} />
        <Route path="institution" element={<InstitutionView isPreview={true} />} />
        <Route path="assessments" element={<AssessmentsView />} />
        <Route path="design-system" element={<DesignSystemView />} />
      </Route>

      {/* 404 Not Found Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
