import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Building2,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Athlete Hub', href: '/athlete', icon: User, allowed: ['athlete', 'coach', 'admin'] },
    { name: 'Academy Center', href: '/academy', icon: Building2, allowed: ['academy_admin', 'coach', 'admin'] },
    { name: 'Institution Scouting', href: '/institution', icon: GraduationCap, allowed: ['institution_officer', 'admin'] },
    { name: 'Assessments & Tests', href: '/assessments', icon: ClipboardCheck },
    { name: 'Talent Analytics', href: '/analytics', icon: TrendingUp },
  ];

  const filteredNav = navigation.filter(
    (item) => !item.allowed || (user && item.allowed.includes(user.role))
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white pt-16 transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
            <div className="mt-2 space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-200 pt-4">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </NavLink>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help &amp; Docs</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
