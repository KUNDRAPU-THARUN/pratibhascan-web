import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  register: (fullName: string, email: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock user for immediate zero-config demo experience
const DEMO_USER: UserProfile = {
  id: 'usr_demo_01',
  email: 'coach.rahul@pratibhascan.in',
  fullName: 'Coach Rahul Sharma',
  role: 'coach',
  state: 'Karnataka',
  district: 'Bengaluru Urban',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pratibhascan_user');
    return saved ? JSON.parse(saved) : DEMO_USER;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // If supabase active, map session
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Sports User',
            role: session.user.user_metadata?.role || 'athlete',
            createdAt: session.user.created_at,
          });
        }
      });
    }
  }, []);

  const login = async (email: string, role: UserRole = 'coach') => {
    setLoading(true);
    try {
      const demoUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        fullName: email.split('@')[0].replace('.', ' '),
        role,
        state: 'Maharashtra',
        district: 'Pune',
        createdAt: new Date().toISOString(),
      };
      setUser(demoUser);
      localStorage.setItem('pratibhascan_user', JSON.stringify(demoUser));
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, role: UserRole) => {
    setLoading(true);
    try {
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        fullName,
        role,
        state: 'Delhi',
        district: 'New Delhi',
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem('pratibhascan_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pratibhascan_user');
    if (isSupabaseConfigured()) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
