import { Link, useNavigate } from 'react-router-dom';
import { Activity, Bell, LogOut, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/30">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Pratibha<span className="text-brand-500">Scan</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Talent Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500"></span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">{user.fullName}</span>
                <span className="text-[10px] capitalize text-slate-500">{user.role.replace('_', ' ')}</span>
              </div>
              <Badge variant="brand" className="capitalize text-[10px]">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-rose-600">
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
            </Link>
            <Link to="/login?mode=register">
              <Button variant="primary" size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
