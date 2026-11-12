import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { UserRole } from '@/types';
import { ROLES_CONFIG } from '@/lib/constants';
import { Bell, Menu, Sparkles, User, ExternalLink } from 'lucide-react';

interface DashboardTopNavProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onToggleSidebar: () => void;
}

export function DashboardTopNav({
  activeRole,
  onRoleChange,
  onToggleSidebar,
}: DashboardTopNavProps) {
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
          <Wordmark size="sm" showCompany={false} />
        </div>

        {/* Center: Role Foundation Selector */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-navy-100 border border-navy-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-500 px-2 select-none">
            Foundation Role:
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
            className="hidden sm:inline-flex"
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
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary-600" />
          </button>

          {/* User Placeholder */}
          <div className="flex items-center gap-2 pl-2 border-l border-navy-200">
            <div className="h-8 w-8 rounded-full bg-navy-100 border border-navy-200 text-navy-700 flex items-center justify-center font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-navy-900 leading-tight">
                Preview Session
              </span>
              <span className="text-[10px] text-navy-400 capitalize">
                {activeRole} Role
              </span>
            </div>
          </div>

          <Link to="/" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-xs text-navy-500">
              Exit Shell <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Accessible Notifications Modal */}
      <Modal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="System Notifications"
        description="Phase 1 Foundation Notification Center"
        footerActions={
          <Button variant="outline" size="sm" onClick={() => setNotifyModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-900 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Phase 1 Foundation Active</p>
              <p className="text-primary-700">
                You are currently exploring the PratibhaScan design system and layout shell. Live real-time push notifications will be linked with Supabase realtime events in Phase 2.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
