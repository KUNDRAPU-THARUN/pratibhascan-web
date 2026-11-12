import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleSelect } from './RoleSelect';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { UserPlus } from 'lucide-react';

export function RegisterForm() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('athlete');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    await register(fullName, email, role);
    navigate('/dashboard');
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border-slate-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
        <CardDescription>
          Join PratibhaScan to discover, track, or verify athletic talent
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
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Neeraj Chopra"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@domain.com"
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
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
