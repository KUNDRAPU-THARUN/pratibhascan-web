import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { DatabaseRole } from '@/types/database.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: DatabaseRole[];
  requireOnboarding?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireOnboarding = true,
}: ProtectedRouteProps) {
  const { user, role, isLoading, isOnboarded, isSuspended, profile, signOut } = useAuth();
  const location = useLocation();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-50/50 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-navy-200 border-t-primary-600" />
          <p className="text-sm font-medium text-navy-600 animate-pulse">
            Authenticating PratibhaScan session...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Account Suspended State
  if (isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50/50 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-card">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl text-navy-900">Account Access Suspended</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-navy-600">
              Your PratibhaScan account has been temporarily restricted by system administration.
            </p>
            {profile?.suspension_reason && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 text-left border border-red-100">
                <span className="font-semibold">Reason:</span> {profile.suspension_reason}
              </div>
            )}
            <p className="text-xs text-navy-500">
              If you believe this is an error, please contact KAARYAN LABS support.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => signOut()} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Role Isolation Enforcement
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to user's assigned role portal
    const targetPortal = `/dashboard/${role}`;
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50/50 p-4">
        <Card className="max-w-md w-full border-navy-200 shadow-card text-center">
          <CardHeader>
            <CardTitle className="text-lg text-navy-900">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-navy-600">
              Your account is registered as a <strong className="capitalize">{role}</strong>. You do not have permission to access this portal section.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.href = targetPortal}
              className="w-full"
            >
              Go to {role.toUpperCase()} Portal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 5. Onboarding Requirement
  if (requireOnboarding && !isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
