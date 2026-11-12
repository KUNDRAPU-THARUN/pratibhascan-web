import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/constants';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCompany?: boolean;
  linkToHome?: boolean;
}

export function Wordmark({
  className,
  size = 'md',
  showCompany = true,
  linkToHome = true,
}: WordmarkProps) {
  const sizeStyles = {
    sm: {
      text: 'text-base',
      badge: 'text-[9px] px-1.5 py-0.2',
      dot: 'h-1.5 w-1.5',
    },
    md: {
      text: 'text-xl',
      badge: 'text-[10px] px-2 py-0.5',
      dot: 'h-2 w-2',
    },
    lg: {
      text: 'text-2xl sm:text-3xl',
      badge: 'text-xs px-2.5 py-0.5',
      dot: 'h-2.5 w-2.5',
    },
  };

  const content = (
    <div className={cn('inline-flex flex-col items-start select-none', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-extrabold tracking-tight text-navy-900 leading-none font-sans',
            sizeStyles[size].text
          )}
        >
          Pratibha<span className="text-primary-600">Scan</span>
        </span>
        <span
          className={cn(
            'rounded-full bg-primary-50 text-primary-700 font-semibold border border-primary-200/80',
            sizeStyles[size].badge
          )}
        >
          Phase 1
        </span>
      </div>
      {showCompany && (
        <span className="text-[10px] uppercase font-bold tracking-widest text-navy-400 mt-1">
          A Product of {BRAND.company}
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md">
        {content}
      </Link>
    );
  }

  return content;
}
