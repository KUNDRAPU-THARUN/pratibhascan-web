import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from './AuthContext';
import { resetPasswordSchema } from './authSchemas';
import { AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
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
      const { error } = await updatePassword(password);
      if (error) {
        setFormError(error.message || 'Failed to update password. Recovery link may have expired.');
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch {
      setFormError('Network connection failed. Please try again.');
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
            Create New Password
          </CardTitle>
          <CardDescription className="text-sm text-navy-600">
            Choose a strong new password for your PratibhaScan account
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4 pt-2 text-center">
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
              <CheckCircle2 className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-navy-900">Password Updated Successfully</h3>
              <p className="text-xs text-navy-600 mt-1">
                Your password has been changed. Redirecting you to the sign-in portal...
              </p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {formError && (
                <div
                  className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-3 text-rose-800 text-xs"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    label="New Password"
                    placeholder="Min 8 characters (1 letter, 1 number)"
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

              <div className="space-y-1">
                <Input
                  id="confirm-password"
                  type="password"
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  disabled={isSubmitting}
                  required
                />
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
                Update Password
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
