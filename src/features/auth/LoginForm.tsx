import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleSelect } from './RoleSelect';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Lock, Mail } from 'lucide-react';

export function LoginForm() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('coach.rahul@pratibhascan.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('coach');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, role);
    navigate('/dashboard');
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border-slate-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your PratibhaScan talent and assessment portal
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <RoleSelect selectedRole={role} onChange={setRole} />
          </div>

          <div className="space-y-3 pt-2">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@pratibhascan.in"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-1.5 text-slate-600">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-500" />
              Remember me
            </label>
            <a href="#forgot" className="text-brand-600 font-medium hover:underline">
              Forgot password?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            <Lock className="h-4 w-4 mr-2" />
            Sign In to PratibhaScan
          </Button>
          <p className="text-center text-xs text-slate-500">
            Demo mode active: click submit with any credentials to explore.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
