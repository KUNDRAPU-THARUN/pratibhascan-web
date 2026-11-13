import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Wordmark } from '@/components/brand/Wordmark';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile, isOnboarded, role } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        if (!supabase) {
          setError('Supabase authentication client is not configured.');
          return;
        }

        // Handle password recovery callback explicitly
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash.includes('type=recovery') || search.includes('type=recovery')) {
          navigate('/reset-password', { replace: true });
          return;
        }

        // Get session after redirect callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message || 'Authentication callback failed.');
          return;
        }

        if (session) {
          await refreshProfile();
          // Delay briefly to allow profile sync
          setTimeout(() => {
            if (isOnboarded && role) {
              navigate(`/dashboard/${role}`, { replace: true });
            } else {
              navigate('/onboarding', { replace: true });
            }
          }, 600);
        } else {
          // No session found in callback
          navigate('/login', { replace: true });
        }
      } catch (err) {
        setError((err as Error).message || 'Unexpected error processing authentication callback.');
      }
    }

    handleAuthCallback();
  }, [navigate, refreshProfile, isOnboarded, role]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-navy-50/60 px-4 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-block">
          <Wordmark size="lg" />
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-card border-navy-200/90 bg-white text-center">
        <CardHeader>
          {error ? (
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          ) : (
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-primary-600">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <CardTitle className="text-xl font-bold text-navy-900">
            {error ? 'Authentication Error' : 'Confirming Credentials'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-100">
                {error}
              </p>
              <Link to="/login" className="block">
                <Button variant="primary" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-navy-600">
              Finalizing secure token exchange and restoring your PratibhaScan session...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
