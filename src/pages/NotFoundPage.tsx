import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/Wordmark';
import { Home, LayoutDashboard, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-navy-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Wordmark size="sm" />
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="my-auto max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary-100 text-primary-700 font-extrabold text-3xl shadow-subtle border border-primary-200">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-navy-500 leading-relaxed max-w-md mx-auto">
            The sports assessment or dashboard route you requested does not exist or has been relocated within the PratibhaScan system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Return to Website
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full shadow-sm">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Open Dashboard Shell
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="text-center text-xs text-navy-400 py-4">
        PratibhaScan • A Sports Technology Initiative by KAARYAN LABS
      </footer>
    </div>
  );
}
