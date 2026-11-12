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

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Marketing Website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Internal Dashboard Shell (Phase 1 Foundation) */}
      <Route path="/dashboard" element={<DashboardShell />}>
        <Route index element={<Navigate to="/dashboard/athlete" replace />} />
        <Route path="athlete" element={<AthleteView />} />
        <Route path="academy" element={<AcademyView />} />
        <Route path="institution" element={<InstitutionView />} />
        <Route path="assessments" element={<AssessmentsView />} />
        <Route path="design-system" element={<DesignSystemView />} />
      </Route>

      {/* 404 Not Found Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
