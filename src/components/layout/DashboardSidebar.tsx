import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '@/types';
import { ROLES_CONFIG } from '@/lib/constants';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DashboardSidebarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({
  activeRole,
  onRoleChange,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const location = useLocation();
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

        {/* Role Switcher in Sidebar (especially convenient on mobile) */}
        <div className="p-4 border-b border-navy-100 lg:hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-2">
            Switch Role View
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
                    ? 'border-primary-500 bg-primary-50 text-primary-800'
                    : 'border-navy-200 bg-white text-navy-600'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            {/* Active Role Group */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">
                  {currentConfig.title}
                </span>
                <Badge variant="teal" size="sm" className="text-[9px]">
                  Active
                </Badge>
              </div>

              <nav className="space-y-1" aria-label="Role specific navigation">
                {currentConfig.navigation.map((item) => {
                  const Icon = iconMap[item.iconName] || Layers;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-xs'
                          : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-600' : 'text-navy-400')} />
                        <span>{item.label}</span>
                      </div>
                      {!item.isPhase1Ready && (
                        <span className="text-[9px] font-mono text-navy-400 bg-navy-100 px-1.5 py-0.5 rounded">
                          Phase 2
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Platform-Wide Suites */}
            <div>
              <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-2">
                Standard Protocols
              </span>
              <nav className="space-y-1" aria-label="Platform tools">
                <Link
                  to="/dashboard/assessments"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all',
                    location.pathname === '/dashboard/assessments'
                      ? 'bg-primary-50 text-primary-700'
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
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all',
                    location.pathname === '/dashboard/design-system'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                  )}
                >
                  <Palette className="h-4 w-4 text-navy-400" />
                  <span>UI Design System</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Footer of Sidebar */}
          <div className="pt-4 border-t border-navy-100 space-y-2">
            <div className="p-3 rounded-xl bg-navy-50 border border-navy-200/80 text-[11px] text-navy-600 space-y-1">
              <p className="font-bold text-navy-800">Phase 1 Foundation</p>
              <p className="text-[10px] text-navy-500 leading-relaxed">
                KAARYAN LABS sports tech system. Authentication &amp; database sync activated in Phase 2.
              </p>
            </div>

            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-navy-500 hover:text-navy-800 transition-colors"
            >
              <span>Back to Landing Page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
