import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { BRAND } from '@/lib/constants';
import { ShieldCheck, Mail, Globe, ArrowUpRight } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-navy-200/80 bg-white text-navy-600 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Wordmark size="md" />
            <p className="text-xs sm:text-sm text-navy-500 max-w-sm leading-relaxed">
              {BRAND.tagline}. Designed to standardize physical fitness evaluations, eliminate subjectivity in scouting, and connect emerging athletes across India.
            </p>
            <div className="flex items-center gap-2 text-xs text-navy-400">
              <ShieldCheck className="h-4 w-4 text-primary-600" />
              <span>Standardized SAI &amp; Khelo India Protocols Reference</span>
            </div>
          </div>

          {/* Platform Columns */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Three Roles
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/dashboard/athlete" className="hover:text-primary-600 transition-colors">
                  For Athletes
                </Link>
              </li>
              <li>
                <Link to="/dashboard/academy" className="hover:text-primary-600 transition-colors">
                  For Academies
                </Link>
              </li>
              <li>
                <Link to="/dashboard/institution" className="hover:text-primary-600 transition-colors">
                  For Institutions &amp; Boards
                </Link>
              </li>
              <li>
                <Link to="/dashboard/assessments" className="hover:text-primary-600 transition-colors">
                  Assessment Battery
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Technology
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#assessments" className="hover:text-primary-600 transition-colors">
                  Standardized Biometrics
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary-600 transition-colors">
                  Multi-Trial Verification
                </a>
              </li>
              <li>
                <a href="#platform" className="hover:text-primary-600 transition-colors">
                  Computer Vision Pipeline
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="text-primary-600 font-semibold hover:underline flex items-center gap-1">
                  Internal Shell <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Company
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="font-semibold text-navy-800">
                {BRAND.company}
              </li>
              <li className="flex items-center gap-1.5 text-navy-500">
                <Globe className="h-3.5 w-3.5 text-navy-400" />
                <span>Karnataka, India</span>
              </li>
              <li className="flex items-center gap-1.5 text-navy-500">
                <Mail className="h-3.5 w-3.5 text-navy-400" />
                <span>inquiries@kaaryanlabs.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution & Legal */}
        <div className="mt-12 border-t border-navy-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-navy-400">
          <p>
            {BRAND.copyright} PratibhaScan is a proprietary sports technology initiative of {BRAND.company}.
          </p>
          <div className="flex items-center gap-4">
            <span className="hover:text-navy-600 transition-colors cursor-pointer">
              Privacy Standards
            </span>
            <span>•</span>
            <span className="hover:text-navy-600 transition-colors cursor-pointer">
              Ethical AI &amp; Fair Play
            </span>
            <span>•</span>
            <span className="hover:text-navy-600 transition-colors cursor-pointer">
              Terms of Use
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
