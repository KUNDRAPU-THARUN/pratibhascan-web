import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from './AuthContext';
import { forgotPasswordSchema } from './authSchemas';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message || 'Failed to dispatch reset instructions.');
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
    } catch {
      setError('Network connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-navy-50/60 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
          <Wordmark size="lg" />
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-card border-navy-200/90 bg-white">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-navy-900 tracking-tight">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm text-navy-600">
            Enter your account email address and we will dispatch password recovery instructions.
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4 pt-2">
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-navy-900">Recovery Email Dispatched</h3>
              <p className="text-xs text-navy-600 mt-1 leading-relaxed">
                If an account exists for <strong className="text-navy-900">{email}</strong>, you will receive a secure password reset link shortly.
              </p>
              {import.meta.env.DEV && (
                <p className="text-[11px] text-navy-500 mt-2">
                  In local development, check your message in Mailpit at{' '}
                  <a
                    href="http://127.0.0.1:54324"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary-600 underline"
                  >
                    http://127.0.0.1:54324
                  </a>.
                </p>
              )}
            </div>
            <Link to="/login" className="block pt-2">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Sign In
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {!isSupabaseConfigured() && (
                <div
                  className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-amber-900 text-xs"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-950">Backend Supabase Not Connected</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      To enable live password recovery in production, add <code className="font-mono text-amber-950 font-bold bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono text-amber-950 font-bold bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your Vercel Project Settings.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-3 text-rose-800 text-xs"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    id="reset-email"
                    type="email"
                    label="Account Email Address"
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-9"
                    required
                  />
                  <Mail className="absolute left-3 top-8.5 h-4 w-4 text-navy-400 pointer-events-none" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-sm"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Send Reset Instructions
              </Button>

              <div className="text-center text-xs text-navy-600 pt-2 border-t border-navy-100 w-full">
                Remembered your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center"
                >
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
