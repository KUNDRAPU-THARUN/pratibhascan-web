import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from './AuthContext';
import { registerSchema } from './authSchemas';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { DatabaseRole } from '@/types/database.types';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Building2,
  GraduationCap,
  ArrowRight,
  Mail,
  Lock,
} from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [role, setRole] = useState<DatabaseRole>('athlete');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const handleRoleSelect = (selectedRole: DatabaseRole) => {
    setRole(selectedRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    // Validate with Zod
    const validation = registerSchema.safeParse({
      fullName,
      email,
      role,
      password,
      confirmPassword,
      agreeToTerms,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error, requiresEmailConfirmation } = await signUp({
        fullName,
        email,
        role,
        password,
        confirmPassword,
        agreeToTerms,
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setFormError('An account with this email address already exists. Please sign in instead.');
        } else {
          setFormError(error.message || 'Registration failed. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      if (requiresEmailConfirmation) {
        setVerificationPending(true);
        setIsSubmitting(false);
      } else {
        // Automatically signed in: navigate to onboarding wizard
        navigate('/onboarding', { replace: true });
      }
    } catch {
      setFormError('Network error occurred. Please verify connectivity.');
      setIsSubmitting(false);
    }
  };

  if (verificationPending) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-navy-50/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <Link to="/" className="inline-block">
            <Wordmark size="lg" />
          </Link>
        </div>

        <Card className="w-full max-w-md shadow-card border-navy-200/90 bg-white text-center">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-navy-900">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-sm text-navy-600">
              We have dispatched a verification link to{' '}
              <strong className="text-navy-900">{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <p className="text-xs text-navy-600 leading-relaxed">
              Please click the link in the email to activate your account.
              {import.meta.env.DEV && (
                <>
                  {' '}If you are developing locally, you can view your confirmation message in Mailpit at{' '}
                  <a
                    href="http://127.0.0.1:54324"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary-600 underline"
                  >
                    http://127.0.0.1:54324
                  </a>.
                </>
              )}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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

      {/* Main Registration Card */}
      <Card className="w-full max-w-lg shadow-card border-navy-200/90 bg-white">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-navy-900 tracking-tight">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-sm text-navy-600">
            Select your role to configure your dedicated PratibhaScan environment
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
                    To enable live registration in production, add <code className="font-mono text-amber-950 font-bold bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono text-amber-950 font-bold bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your Vercel Project Settings. You can also explore the{' '}
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

            {/* Role Selection Tabs */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('athlete')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'athlete'
                      ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20 text-navy-900 font-semibold'
                      : 'border-navy-200 bg-white hover:bg-navy-50/70 text-navy-600'
                  }`}
                >
                  <User className={`h-5 w-5 mb-1 ${role === 'athlete' ? 'text-primary-600' : 'text-navy-500'}`} />
                  <span className="text-xs">Athlete</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('academy')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'academy'
                      ? 'border-secondary-600 bg-secondary-50/60 ring-2 ring-secondary-500/20 text-navy-900 font-semibold'
                      : 'border-navy-200 bg-white hover:bg-navy-50/70 text-navy-600'
                  }`}
                >
                  <Building2 className={`h-5 w-5 mb-1 ${role === 'academy' ? 'text-secondary-600' : 'text-navy-500'}`} />
                  <span className="text-xs">Academy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('institution')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'institution'
                      ? 'border-navy-800 bg-navy-100/80 ring-2 ring-navy-600/20 text-navy-950 font-semibold'
                      : 'border-navy-200 bg-white hover:bg-navy-50/70 text-navy-600'
                  }`}
                >
                  <GraduationCap className={`h-5 w-5 mb-1 ${role === 'institution' ? 'text-navy-800' : 'text-navy-500'}`} />
                  <span className="text-xs">Institution</span>
                </button>
              </div>
              <p className="text-[11px] text-navy-500 italic pt-0.5">
                {role === 'athlete' && 'Individual sports talent tracking metrics and talent passport.'}
                {role === 'academy' && 'Sports coaching center or academy managing talent cohorts.'}
                {role === 'institution' && 'School, college, university, or regional sports authority.'}
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <Input
                id="register-fullname"
                type="text"
                label="Full Name"
                placeholder={role === 'athlete' ? 'e.g. Arjun Kumar' : 'e.g. Coach Ramesh / Principal Sharma'}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="register-email"
                  type="email"
                  label="Official Email Address"
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

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  label="Create Password"
                  placeholder="At least 8 characters (1 letter, 1 number)"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <Input
                id="register-confirm-password"
                type="password"
                label="Confirm Password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <div className="flex items-start">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-navy-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  required
                />
                <label htmlFor="agree-terms" className="ml-2 block text-xs text-navy-600 leading-snug cursor-pointer">
                  I agree to the PratibhaScan Terms of Service and acknowledge the biometric talent evaluation privacy guidelines.
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-xs font-medium text-rose-600 mt-1">{errors.agreeToTerms}</p>
              )}
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
              Complete Registration
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>

            <div className="text-center text-xs text-navy-600 pt-2 border-t border-navy-100 w-full">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Sign In
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
