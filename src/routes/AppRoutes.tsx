import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AthleteDashboard } from '@/features/athlete/AthleteDashboard';
import { AcademyDashboard } from '@/features/academy/AcademyDashboard';
import { InstitutionDashboard } from '@/features/institution/InstitutionDashboard';
import { AssessmentRunner } from '@/features/assessments/AssessmentRunner';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated / Core Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/athlete" element={<AthleteDashboard />} />
        <Route path="/academy" element={<AcademyDashboard />} />
        <Route path="/institution" element={<InstitutionDashboard />} />
        <Route path="/assessments" element={<AssessmentRunner />} />

        {/* 404 Not Found Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
