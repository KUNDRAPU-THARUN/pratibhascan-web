import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '@/types';
import { ROLES_CONFIG } from '@/lib/constants';
import { useAuth } from '@/features/auth/AuthContext';
import {
  User,
  Users,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  FileText,
  Palette,
  ExternalLink,
  X,
  Layers,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DashboardSidebarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isOpen: boolean;
  onClose: () => void;
  isPreview?: boolean;
}

export function DashboardSidebar({
  activeRole,
  onRoleChange,
  isOpen,
  onClose,
  isPreview = false,
}: DashboardSidebarProps) {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const currentConfig = ROLES_CONFIG[activeRole];

  // Icon mapping
  const iconMap: Record<string, typeof User> = {
    User,
    Users,
    GraduationCap,
    ClipboardCheck,
    TrendingUp,
    BarChart3,
    FileText,
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-68 flex-col border-r border-navy-200/80 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-navy-100 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-500">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-navy-400 hover:bg-navy-100 cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview-only Role Switcher in Sidebar (HIDDEN for authenticated users) */}
        {isPreview && (
          <div className="p-4 border-b border-navy-100 bg-amber-50/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">
              Demonstration Preview Switcher
            </p>
            <div className="grid grid-cols-3 gap-1">
              {(['athlete', 'academy', 'institution'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    onRoleChange(r);
                    onClose();
                  }}
                  className={cn(
                    'py-1.5 text-xs font-semibold rounded-lg capitalize border cursor-pointer',
                    activeRole === r
                      ? 'border-primary-500 bg-white text-primary-800 shadow-xs'
                      : 'border-navy-200 bg-white/70 text-navy-600'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Active Role Indicator */}
        <div className="p-4 border-b border-navy-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy-500">
              Active Context
            </span>
            <Badge
              variant={
                activeRole === 'athlete'
                  ? 'teal'
                  : activeRole === 'academy'
                  ? 'blue'
                  : 'default'
              }
              className="text-[10px] uppercase font-bold"
            >
              {activeRole}
            </Badge>
          </div>
          <p className="text-sm font-bold text-navy-900 mt-1 truncate">
            {profile?.full_name || currentConfig.title}
          </p>
          <p className="text-xs text-navy-500 truncate">
            {user?.email || currentConfig.description}
          </p>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Role Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-2">
              {currentConfig.title} Features
            </p>
            {currentConfig.navigation.map((item) => {
              const Icon = iconMap[item.iconName] || User;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold shadow-xs'
                      : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary-600' : 'text-navy-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Shared Tools Section */}
          <div className="space-y-1 pt-2 border-t border-navy-100">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-2">
              System Modules
            </p>
            <Link
              to="/dashboard/assessments"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all',
                location.pathname === '/dashboard/assessments'
                  ? 'bg-primary-50 text-primary-700 font-bold'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              )}
            >
              <ClipboardCheck className="h-4 w-4 text-navy-400" />
              <span>Assessment Battery</span>
            </Link>

            <Link
              to="/dashboard/design-system"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all',
                location.pathname === '/dashboard/design-system'
                  ? 'bg-primary-50 text-primary-700 font-bold'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              )}
            >
              <Palette className="h-4 w-4 text-navy-400" />
              <span>Design System Tokens</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-navy-100 p-4 space-y-2 bg-navy-50/40">
          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-navy-400" />
                <span>Public Portal</span>
              </span>
              <ExternalLink className="h-3 w-3 text-navy-400" />
            </Link>
          )}

          <div className="text-[10px] text-navy-400 text-center font-medium">
            PratibhaScan Web v0.1.0 · KAARYAN LABS
          </div>
        </div>
      </aside>
    </>
  );
}
