import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { UserRole } from '@/types';
import { ROLES_CONFIG } from '@/lib/constants';
import { useAuth } from '@/features/auth/AuthContext';
import { Bell, Menu, LogOut, Shield } from 'lucide-react';

interface DashboardTopNavProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onToggleSidebar: () => void;
  isPreview?: boolean;
}

export function DashboardTopNav({
  activeRole,
  onRoleChange,
  onToggleSidebar,
  isPreview = false,
}: DashboardTopNavProps) {
  const { user, profile, signOut } = useAuth();
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const currentConfig = ROLES_CONFIG[activeRole];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-navy-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
        {/* Left Side: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-navy-600 hover:bg-navy-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/">
            <Wordmark size="sm" showCompany={false} />
          </Link>
        </div>

        {/* Center: Preview-only Role Selector (HIDDEN for authenticated users) */}
        {isPreview ? (
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 px-2 select-none">
              Demonstration Switcher:
            </span>
            <button
              type="button"
              onClick={() => onRoleChange('athlete')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeRole === 'athlete'
                  ? 'bg-white text-primary-700 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Athlete
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('academy')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeRole === 'academy'
                  ? 'bg-white text-secondary-700 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Academy
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('institution')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeRole === 'institution'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Institution
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-navy-600 font-medium">
            <Shield className="h-4 w-4 text-primary-600" />
            <span>Authenticated Portal · KAARYAN LABS PratibhaScan</span>
          </div>
        )}

        {/* Right Side: Role Badge, Notifications & Profile */}
        <div className="flex items-center gap-3">
          <Badge
            variant={
              activeRole === 'athlete'
                ? 'teal'
                : activeRole === 'academy'
                ? 'blue'
                : 'default'
            }
            className="hidden sm:inline-flex capitalize"
          >
            {currentConfig.badgeText}
          </Badge>

          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => setNotifyModalOpen(true)}
            className="relative rounded-lg p-2 text-navy-500 hover:bg-navy-100 hover:text-navy-800 transition-colors cursor-pointer"
            aria-label="View system notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white" />
          </button>

          {/* User Profile Info or Sign Out */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-navy-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-navy-900 truncate max-w-[140px]">
                  {profile?.full_name || user.email}
                </span>
                <span className="text-[10px] text-navy-500 capitalize">{activeRole}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-navy-600 hover:text-rose-600 p-2 h-9 w-9 rounded-lg"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-navy-200">
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="System Notifications"
        size="md"
      >
        <div className="space-y-3 py-2 text-navy-700">
          <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-xs">
            <p className="font-semibold text-teal-900">Supabase Session Active</p>
            <p className="text-teal-800 mt-0.5">
              Role-based Row Level Security (RLS) policies and authentication active on PratibhaScan.
            </p>
          </div>
          <div className="rounded-lg border border-navy-200 bg-navy-50 p-3 text-xs">
            <p className="font-semibold text-navy-900">Talent Assessment Protocol SAI 2026</p>
            <p className="text-navy-600 mt-0.5">
              Standardized physical battery active for Karnataka state junior talent pool.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
