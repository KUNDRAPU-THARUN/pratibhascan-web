import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/constants';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCompany?: boolean;
  showTagline?: boolean;
  linkToHome?: boolean;
}

export function PratibhaScanIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-tr from-navy-950 via-blue-600 to-teal-400 p-1.5 shadow-xs', className)}>
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Wordmark({
  className,
  size = 'md',
  showCompany = true,
  showTagline,
  linkToHome = true,
}: WordmarkProps) {
  const displayTagline = showTagline !== undefined ? showTagline : showCompany;

  const sizeStyles = {
    sm: {
      icon: 'h-6 w-6 rounded-lg p-1',
      text: 'text-base',
      badge: 'text-[9px] px-1.5 py-0.2',
      tagline: 'text-[8.5px]',
    },
    md: {
      icon: 'h-8 w-8 rounded-xl p-1.5',
      text: 'text-xl',
      badge: 'text-[10px] px-2 py-0.5',
      tagline: 'text-[9.5px]',
    },
    lg: {
      icon: 'h-10 w-10 rounded-xl p-2',
      text: 'text-2xl sm:text-3xl',
      badge: 'text-xs px-2.5 py-0.5',
      tagline: 'text-[11px]',
    },
  };

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <PratibhaScanIcon className={sizeStyles[size].icon} />
      <div className="flex flex-col items-start leading-none">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-extrabold tracking-tight text-navy-950 font-sans',
              sizeStyles[size].text
            )}
          >
            Pratibha<span className="text-blue-600">Scan</span>
          </span>
          <span
            className={cn(
              'rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200/80 uppercase tracking-wider',
              sizeStyles[size].badge
            )}
          >
            Sports AI
          </span>
        </div>
        {displayTagline && (
          <span className={cn('font-semibold tracking-wider text-navy-400 mt-1 uppercase', sizeStyles[size].tagline)}>
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
