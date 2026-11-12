import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Menu, X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const location = useLocation();

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInfoModalOpen(true)}
              className="text-navy-700"
            >
              Sign In
            </Button>
            <Link to="/dashboard">
              <Button variant="primary" size="sm" className="shadow-xs">
                Launch Shell
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link to="/dashboard">
              <Button variant="primary" size="sm" className="text-xs px-2.5 h-8">
                Shell
              </Button>
            </Link>
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
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setInfoModalOpen(true);
                  }}
                >
                  Sign In (Pilot Status)
                </Button>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Explore Internal Dashboard Shell
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Accessible Informational Modal for Sign In in Phase 1 */}
      <Modal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="Phase 1 Foundation Preview"
        description="Notice regarding Authentication and Account Access"
        footerActions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setInfoModalOpen(false)}>
              Close
            </Button>
            <Link to="/dashboard">
              <Button variant="primary" size="sm" onClick={() => setInfoModalOpen(false)}>
                Explore Dashboard Shell
              </Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-900 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Production-Oriented Phase 1 Foundation</p>
              <p className="text-primary-700">
                You are currently viewing the Phase 1 Foundation &amp; UI System developed by KAARYAN LABS.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-navy-50 border border-navy-200 text-navy-700 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-navy-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              In accordance with architectural guidelines, live authentication sessions and database write operations will be enabled in Phase 2 with Supabase Auth &amp; PostgreSQL. You can freely explore the three role-aware dashboard shells right now without logging in.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
