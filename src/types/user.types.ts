/**
 * PratibhaScan Core User and Role Types
 * Strictly designed for the three authorized ecosystem roles:
 * 1. Athlete - Emerging & competitive talent tracking performance
 * 2. Academy - Coaching centers managing batches and rosters
 * 3. Institution - Schools, universities, district & state sports boards
 */

export type UserRole = 'athlete' | 'academy' | 'institution';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationName?: string;
  state?: string;
  district?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface RoleNavigationItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  description: string;
  badge?: string;
  isPhase1Ready?: boolean;
}

export interface RoleConfig {
  role: UserRole;
  title: string;
  badgeText: string;
  description: string;
  navigation: RoleNavigationItem[];
}
