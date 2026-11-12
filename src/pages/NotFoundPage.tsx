import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The assessment or portal page you are looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>
          <Home className="h-4 w-4 mr-2" />
          Back to PratibhaScan Home
        </Button>
      </Link>
    </div>
  );
}
