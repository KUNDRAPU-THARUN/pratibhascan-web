import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthContext';
import { Menu, X, ArrowRight, LogOut } from 'lucide-react';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, role, signOut } = useAuth();

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Platform', href: '/#platform' },
    { label: 'Three Roles', href: '/#roles' },
    { label: 'Assessment Tech', href: '/#assessments' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Benefits', href: '/#benefits' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-navy-200/80 bg-white/95 backdrop-blur-md shadow-subtle transition-all">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-6">
            <Wordmark size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-navy-600 hover:text-primary-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Badge variant={role === 'athlete' ? 'teal' : role === 'academy' ? 'blue' : 'default'} className="capitalize">
                  {role || 'User'}
                </Badge>
                <Link to={`/dashboard/${role || 'athlete'}`}>
                  <Button variant="primary" size="sm" className="shadow-xs">
                    Dashboard
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-navy-600 hover:text-rose-600 p-2"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-navy-700">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="shadow-xs">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            {user ? (
              <Link to={`/dashboard/${role || 'athlete'}`}>
                <Button variant="primary" size="sm" className="text-xs px-2.5 h-8">
                  Portal
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="text-xs px-2.5 h-8">
                  Sign In
                </Button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-navy-600 hover:bg-navy-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-navy-200 bg-white px-4 pt-3 pb-6 shadow-card animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-3" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 hover:text-primary-600"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-navy-100 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="px-3 py-1 flex items-center justify-between text-xs text-navy-600">
                      <span>Signed in as <strong>{profile?.full_name || user.email}</strong></span>
                      <Badge variant="teal">{role}</Badge>
                    </div>
                    <Link to={`/dashboard/${role || 'athlete'}`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="md" className="w-full justify-center">
                        Open {role?.toUpperCase()} Dashboard
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full justify-center text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="md" className="w-full justify-center">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="md" className="w-full justify-center">
                        Register for PratibhaScan
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
