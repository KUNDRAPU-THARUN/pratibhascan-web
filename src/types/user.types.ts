export type UserRole = 'athlete' | 'coach' | 'academy_admin' | 'institution_officer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  state?: string;
  district?: string;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}
