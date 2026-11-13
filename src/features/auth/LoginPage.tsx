import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from './AuthContext';
import { loginSchema } from './authSchemas';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if redirected from a protected route
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Validate with Zod
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signIn({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please verify your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setFormError('Your email address has not been confirmed yet. Please check your inbox for the verification link.');
        } else {
          setFormError(error.message || 'An error occurred during sign in. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      // Successful login: navigate to requested route or dashboard root
      navigate(from || '/dashboard', { replace: true });
    } catch {
      setFormError('Network connection failed. Please check your connectivity and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-navy-50/60 px-4 py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
          <Wordmark size="lg" />
        </Link>
        <p className="mt-2 text-xs font-semibold text-navy-500 uppercase tracking-wider">
          AI-Powered Sports Talent Assessment & Development
        </p>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-md shadow-card border-navy-200/90 bg-white">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-navy-900 tracking-tight">
            Sign In to PratibhaScan
          </CardTitle>
          <CardDescription className="text-sm text-navy-600">
            Enter your credentials to access your Athlete, Academy, or Institution portal
          </CardDescription>
        </CardHeader>

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
                    To enable live authentication in production, add <code className="font-mono text-amber-950 font-bold bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono text-amber-950 font-bold bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your Vercel Project Settings. You can also explore the{' '}
                    <Link to="/preview" className="font-bold underline text-amber-950 hover:text-primary-700">
                      Interactive Demo Preview
                    </Link>.
                  </p>
                </div>
              </div>
            )}

            {formError && (
              <div
                className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{formError}</div>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="login-email"
                  type="email"
                  label="Email Address"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  disabled={isSubmitting}
                  className="pl-9"
                  required
                />
                <Mail className="absolute left-3 top-8.5 h-4 w-4 text-navy-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  disabled={isSubmitting}
                  className="pl-9 pr-10"
                  required
                />
                <Lock className="absolute left-3 top-8.5 h-4 w-4 text-navy-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8.5 text-navy-400 hover:text-navy-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-navy-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-navy-600 cursor-pointer">
                  Remember session
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Forgot password?
              </Link>
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
              Sign In
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>

            <div className="text-center text-xs text-navy-600 pt-2 border-t border-navy-100 w-full">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Register for PratibhaScan
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Attribution */}
      <p className="mt-8 text-center text-xs text-navy-500">
        PratibhaScan is an enterprise product by <span className="font-semibold text-navy-700">KAARYAN LABS</span>.
      </p>
    </div>
  );
}
