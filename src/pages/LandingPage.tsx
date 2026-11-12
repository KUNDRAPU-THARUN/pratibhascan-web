import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { BRAND, STANDARD_PROTOCOLS, ROLES_CONFIG } from '@/lib/constants';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  GraduationCap,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

export function LandingPage() {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedProtocolCode, setSelectedProtocolCode] = useState<string | null>(null);

  const selectedProtocol = STANDARD_PROTOCOLS.find((p) => p.code === selectedProtocolCode);

  return (
    <div className="space-y-24 py-8 sm:py-12">
      {/* 1. HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-bold text-primary-800 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary-600 animate-pulse" />
          <span>A Sports Technology Platform by {BRAND.company}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-navy-950 max-w-5xl mx-auto leading-[1.12]">
          Standardized Sports Talent Assessment &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-teal-500 to-secondary-600">
            Development Platform
          </span>
        </h1>

        <p className="text-base sm:text-xl text-navy-600 max-w-3xl mx-auto leading-relaxed font-normal">
          PratibhaScan unifies physical biometric testing, computer-vision validation protocols, and verified digital passports to identify, track, and elevate athletic potential across India.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/dashboard">
            <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-sm">
              Explore Dashboard Shell
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setInquiryModalOpen(true)}
          >
            Inquire for Pilot Deployment
          </Button>
        </div>

        {/* Factual Trust Indicators */}
        <div className="pt-8 border-t border-navy-200/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-3.5 rounded-xl bg-white border border-navy-200/80 shadow-subtle">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Test Standards</p>
            <p className="text-sm font-bold text-navy-900 mt-1">SAI &amp; World Norms</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-navy-200/80 shadow-subtle">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Target Roles</p>
            <p className="text-sm font-bold text-navy-900 mt-1">Athlete, Academy, Board</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-navy-200/80 shadow-subtle">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Verification</p>
            <p className="text-sm font-bold text-navy-900 mt-1">Multi-Trial Field Data</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-navy-200/80 shadow-subtle">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Architecture</p>
            <p className="text-sm font-bold text-navy-900 mt-1">Supabase-Ready SaaS</p>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT EXPLANATION SECTION */}
      <section id="platform" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-navy-200 bg-white p-8 sm:p-12 shadow-card">
          <div className="max-w-3xl space-y-4">
            <Badge variant="teal">Why PratibhaScan</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Bridging Grassroots Talent with Objective, Data-Driven Scouting
            </h2>
            <p className="text-sm sm:text-base text-navy-600 leading-relaxed">
              Traditional athletic scouting has long depended on paper trials, localized discretion, and subjective visual judgment. This often overlooks promising athletes in rural and semi-urban districts who lack immediate access to elite coaching infrastructure.
            </p>
            <p className="text-sm sm:text-base text-navy-600 leading-relaxed">
              PratibhaScan replaces subjective assumptions with scientifically benchmarked physical protocols. By measuring foundational biometrics—speed, explosive vertical power, aerobic endurance, agility, and flexibility—the platform provides every athlete an equitable, verified record of athletic potential.
            </p>
          </div>
        </div>
      </section>

      {/* 3. THREE ROLE FEATURE CARDS (ATHLETE, ACADEMY, INSTITUTION) */}
      <section id="roles" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="blue">Ecosystem Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Designed for Exactly Three Dedicated Roles
          </h2>
          <p className="text-sm sm:text-base text-navy-600">
            Tailored interfaces engineered to support the complete talent lifecycle from athlete self-tracking to national federation discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role 1: Athlete */}
          <Card className="flex flex-col justify-between hover:border-primary-400 transition-all hover:shadow-elevated">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="teal" className="mb-2">For Athletes</Badge>
                <CardTitle className="text-xl">Athlete Passport &amp; Progress</CardTitle>
                <CardDescription className="mt-2 text-navy-600">
                  {ROLES_CONFIG.athlete.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-navy-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>Standardized biometric fitness testing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>Percentile benchmarks against age &amp; sport</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>Shareable digital talent scorecard</span>
                </li>
              </ul>
              <Link to="/dashboard/athlete" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Preview Athlete Shell</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Role 2: Academy */}
          <Card className="flex flex-col justify-between hover:border-secondary-400 transition-all hover:shadow-elevated">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center border border-secondary-200">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="blue" className="mb-2">For Academies</Badge>
                <CardTitle className="text-xl">Cohort Roster &amp; Batch Testing</CardTitle>
                <CardDescription className="mt-2 text-navy-600">
                  {ROLES_CONFIG.academy.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-navy-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary-600 shrink-0" />
                  <span>Cohort roster &amp; attendance management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary-600 shrink-0" />
                  <span>Multi-trial batch physical assessments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary-600 shrink-0" />
                  <span>Talent index ranking across training batches</span>
                </li>
              </ul>
              <Link to="/dashboard/academy" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Preview Academy Shell</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Role 3: Institution */}
          <Card className="flex flex-col justify-between hover:border-navy-400 transition-all hover:shadow-elevated">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center border border-navy-200">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="default" className="mb-2">For Institutions</Badge>
                <CardTitle className="text-xl">Regional Scouting &amp; Analytics</CardTitle>
                <CardDescription className="mt-2 text-navy-600">
                  {ROLES_CONFIG.institution.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-navy-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0" />
                  <span>District and school talent density metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0" />
                  <span>State sports board tournament talent funnel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0" />
                  <span>Verified credentials preventing age misrepresentation</span>
                </li>
              </ul>
              <Link to="/dashboard/institution" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Preview Institution Shell</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="teal">Standardized Workflow</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            How PratibhaScan Works
          </h2>
          <p className="text-sm sm:text-base text-navy-600">
            A three-step methodology ensuring data authenticity and rigorous athletic evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="p-6 rounded-2xl bg-white border border-navy-200/90 shadow-subtle space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-base">
              01
            </div>
            <h3 className="text-lg font-bold text-navy-900">Standardized Field Testing</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Coaches and scouts execute standard physical protocols (sprint, jump, beep test, flexibility) using documented calibration tools and standardized measurement rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-navy-200/90 shadow-subtle space-y-4">
            <div className="h-10 w-10 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center font-bold text-base">
              02
            </div>
            <h3 className="text-lg font-bold text-navy-900">Multi-Trial Verification</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Each assessment captures 3 consecutive valid trials. Values are calculated against national age-group benchmarks to produce normalized percentile ratings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-navy-200/90 shadow-subtle space-y-4">
            <div className="h-10 w-10 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-base">
              03
            </div>
            <h3 className="text-lg font-bold text-navy-900">Verified Talent Passport</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Results sync to a tamper-proof athletic profile, accessible by state sports boards and academies for scholarship selection and national camp invitations.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ASSESSMENT TECHNOLOGY OVERVIEW */}
      <section id="assessments" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="teal">Standardized Protocol Suite</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Six Core Physical Assessment Batteries
            </h2>
            <p className="text-sm text-navy-600">
              Benchmarked against Sports Authority of India (SAI) norms and internationally recognized biomechanical procedures.
            </p>
          </div>
          <Link to="/dashboard/assessments">
            <Button variant="outline" size="sm">
              <ClipboardCheck className="h-4 w-4 mr-1.5" />
              View Protocol Library
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD_PROTOCOLS.map((protocol) => (
            <Card
              key={protocol.code}
              className="p-5 flex flex-col justify-between hover:border-navy-300 transition-all shadow-subtle cursor-pointer"
              onClick={() => setSelectedProtocolCode(protocol.code)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                    {protocol.categoryLabel}
                  </span>
                  <span className="text-xs font-mono text-navy-400 font-medium">{protocol.unit}</span>
                </div>
                <h4 className="text-base font-bold text-navy-900">{protocol.name}</h4>
                <p className="text-xs text-navy-500 line-clamp-2 leading-relaxed">
                  {protocol.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs font-semibold text-primary-600">
                <span>View Protocol Details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          ))}
        </div>

        {/* AI & Computer Vision Notice */}
        <div className="rounded-xl border border-secondary-200 bg-secondary-50/50 p-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2.5 rounded-xl bg-secondary-600 text-white shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1 text-navy-700">
            <p className="font-bold text-sm text-navy-900">
              Future Computer Vision Assessment Integration (Roadmap)
            </p>
            <p className="leading-relaxed">
              Under development at KAARYAN LABS: Automated camera-based posture detection, sprint time verification, and jump displacement tracking. In Phase 1, assessments use manual coach input with multi-trial integrity checks. Computer vision automation will undergo rigorous calibration before deployment.
            </p>
          </div>
        </div>
      </section>

      {/* 6. BENEFITS SECTION */}
      <section id="benefits" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="blue">Strategic Impact</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Key Institutional Benefits
          </h2>
          <p className="text-sm sm:text-base text-navy-600">
            Transforming Indian sports development from fragmented scouting to high-performance intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900">Elimination of Scouting Bias</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Standardized objective scores remove personal favoritism, ensuring selection is purely determined by physical capability and validated test metrics.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900">Equitable Grassroots Inclusion</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              School and district talent scouts can record tests offline on mobile or web, ensuring talented athletes from remote areas enter the national pipeline.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900">Tamper-Proof Data Governance</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Future Supabase Row Level Security (RLS) and digital audit trails ensure test records cannot be retroactively manipulated or falsified.
            </p>
          </Card>
        </div>
      </section>

      {/* 7. CALL TO ACTION SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-navy-200 bg-gradient-to-br from-navy-900 to-navy-950 p-8 sm:p-14 text-white text-center space-y-6 shadow-elevated">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 px-3 py-1 text-xs font-semibold text-primary-300 border border-primary-500/30">
            <span>KAARYAN LABS Sports Tech Initiative</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Ready to Explore the PratibhaScan Architecture?
          </h2>

          <p className="text-sm sm:text-base text-navy-300 max-w-2xl mx-auto leading-relaxed">
            Experience the Phase 1 Foundation: Explore the shared dashboard shell, inspect the three role-aware navigation structures, and review the standardized protocol engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/dashboard">
              <Button size="lg" variant="primary">
                Open Dashboard Shell
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-navy-700 hover:bg-navy-800"
              onClick={() => setInquiryModalOpen(true)}
            >
              Contact KAARYAN LABS
            </Button>
          </div>
        </div>
      </section>

      {/* Modal: Protocol Details View */}
      {selectedProtocol && (
        <Modal
          isOpen={Boolean(selectedProtocolCode)}
          onClose={() => setSelectedProtocolCode(null)}
          title={selectedProtocol.name}
          description={`Standard Assessment Category: ${selectedProtocol.categoryLabel}`}
          footerActions={
            <Button variant="outline" size="sm" onClick={() => setSelectedProtocolCode(null)}>
              Close Protocol
            </Button>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm text-navy-700">
            <div>
              <p className="font-bold text-navy-900 mb-1">Methodology &amp; Execution:</p>
              <p className="text-navy-600 leading-relaxed bg-navy-50 p-3 rounded-lg border border-navy-200">
                {selectedProtocol.methodology}
              </p>
            </div>

            <div>
              <p className="font-bold text-navy-900 mb-1">Equipment Required:</p>
              <ul className="list-disc pl-5 space-y-1 text-navy-600">
                {selectedProtocol.equipmentRequired.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-navy-100 flex items-center justify-between text-xs text-navy-500">
              <span>Standard Reference:</span>
              <span className="font-semibold text-navy-800">{selectedProtocol.standardNormsReference}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Pilot Deployment Inquiry */}
      <Modal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        title="KAARYAN LABS — Pilot Inquiries"
        description="Partnership &amp; Deployment Information for PratibhaScan"
        footerActions={
          <Button variant="primary" size="sm" onClick={() => setInquiryModalOpen(false)}>
            Close Notice
          </Button>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm text-navy-700">
          <p className="leading-relaxed">
            Thank you for your interest in PratibhaScan. We are actively collaborating with state athletic federations, sports academies, and educational institutions for pilot deployments.
          </p>
          <div className="p-3.5 rounded-xl bg-navy-50 border border-navy-200 text-xs space-y-1">
            <p className="font-bold text-navy-900">Direct Contact:</p>
            <p className="text-navy-600">Email: inquiries@kaaryanlabs.com</p>
            <p className="text-navy-600">Product: PratibhaScan (Web &amp; Android Ecosystem)</p>
          </div>
          <p className="text-xs text-navy-500 leading-relaxed">
            In Phase 1, self-serve account signups are disabled while the architecture is validated. Institutional inquiries receive priority access for Phase 2 onboarding.
          </p>
        </div>
      </Modal>
    </div>
  );
}
