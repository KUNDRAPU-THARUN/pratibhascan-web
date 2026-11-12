import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, ShieldCheck, Zap, TrendingUp, Users, ArrowRight } from 'lucide-react';

export function HomePage() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          Next-Generation Indian Sports Talent Discovery
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Discover, Assess &amp; Elevate <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-500">
            Athletic Potential
          </span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          PratibhaScan unifies athletes, coaches, sports academies, and state institutions onto a
          standardized assessment engine to eliminate bias and fast-track grassroots talent to national podiums.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/dashboard">
            <Button size="lg" className="w-full sm:w-auto shadow-md">
              Launch Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link to="/assessments">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore Assessment Battery
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Standardized Biometrics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Standardized protocols for 30m sprint, vertical jump, beep test, flexibility, and agility benchmarked against SAI norms.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verified Credentials</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tamper-proof digital scorecards verified by certified coaches and federations, reducing age-fraud and biased scouting.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Talent Scouting Pipeline</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Heatmaps and composite talent scores help state boards and academies pinpoint high-potential athletes in remote districts.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
