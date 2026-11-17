import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { PratibhaScanIcon } from '@/components/brand/Wordmark';
import { BRAND, STANDARD_PROTOCOLS, ROLES_CONFIG } from '@/lib/constants';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Users,
  GraduationCap,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  Cpu,
  ChevronRight,
  Camera,
  Lock,
  BarChart3,
  Award,
  Eye,
} from 'lucide-react';

export function LandingPage() {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedProtocolCode, setSelectedProtocolCode] = useState<string | null>(null);

  const selectedProtocol = STANDARD_PROTOCOLS.find((p) => p.code === selectedProtocolCode);

  return (
    <div className="space-y-24 py-8 sm:py-12">
      {/* 1. HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-blue-900 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
          <span>{BRAND.name} • {BRAND.tagline}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-navy-950 max-w-5xl mx-auto leading-[1.12]">
          Standardized Sports Talent Assessment &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500">
            Athlete Performance Platform
          </span>
        </h1>

        <p className="text-base sm:text-xl text-navy-600 max-w-3xl mx-auto leading-relaxed font-normal">
          PratibhaScan unifies physical biometric testing, on-device AI pose tracking, and authenticated digital athletic passports to discover, evaluate, and elevate athletic potential across India.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/register">
            <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-sm">
              Get Started with PratibhaScan
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link to="/dashboard/pose-detection">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-navy-300 hover:bg-navy-50 text-navy-800">
              <Camera className="h-4 w-4 mr-2 text-teal-600" />
              Try AI Pose Studio
            </Button>
          </Link>
          <Link to="/preview">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto text-navy-600">
              Explore Demo Preview
            </Button>
          </Link>
        </div>

        {/* Core Architecture Trust Badges */}
        <div className="pt-8 border-t border-navy-200/60 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-white border border-navy-200/80 shadow-subtle flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">AI Pose Engine</p>
              <p className="text-sm font-bold text-navy-900 mt-0.5">33-Point Live Tracking</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-navy-200/80 shadow-subtle flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 shrink-0">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">Test Standards</p>
              <p className="text-sm font-bold text-navy-900 mt-0.5">SAI Benchmark Batteries</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-navy-200/80 shadow-subtle flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">Verification</p>
              <p className="text-sm font-bold text-navy-900 mt-0.5">Two-Person Integrity</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-navy-200/80 shadow-subtle flex items-start gap-3">
            <div className="p-2 rounded-lg bg-navy-100 text-navy-700 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">Privacy Model</p>
              <p className="text-sm font-bold text-navy-900 mt-0.5">100% On-Device Edge</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT IS PRATIBHASCAN */}
      <section id="platform" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-navy-200 bg-white p-8 sm:p-12 lg:p-16 shadow-card space-y-8">
          <div className="max-w-3xl space-y-4">
            <Badge variant="teal">What Is PratibhaScan</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Bridging Grassroots Talent with Objective, Empirical Sports Science
            </h2>
            <p className="text-base text-navy-600 leading-relaxed">
              Traditional athletic scouting often depends on paper trial forms, localized discretion, and subjective visual judgment. Promising young athletes in rural and semi-urban districts are frequently overlooked simply because they lack immediate access to metropolitan academies or costly sports laboratory equipment.
            </p>
            <p className="text-base text-navy-600 leading-relaxed">
              <strong>PratibhaScan</strong> replaces subjective assumptions with scientifically standardized athletic testing. By combining standard field tests—sprint velocity, explosive jump displacement, endurance capacity, and agility—with computer-vision movement validation, PratibhaScan creates an authentic, tamper-evident Athletic Passport for every aspiring competitor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-navy-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                <CheckCircle2 className="h-5 w-5" />
                <span>Empirical Objectivity</span>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Consistent protocols ensure every candidate is measured by verifiable physical performance rather than subjective impression.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-teal-600 font-bold text-base">
                <CheckCircle2 className="h-5 w-5" />
                <span>Grassroots Accessibility</span>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Runs entirely in modern web browsers on laptops, tablets, and phones without requiring proprietary hardware or expensive sensor rigs.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <CheckCircle2 className="h-5 w-5" />
                <span>Tamper-Resistant Records</span>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Multi-trial entry with independent two-person reviewer verification prevents self-certification and protects record authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THREE PLATFORM ROLES */}
      <section id="roles" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="blue">Ecosystem Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Designed for Exactly Three Dedicated Roles
          </h2>
          <p className="text-sm sm:text-base text-navy-600">
            Tailored interfaces engineered to support the complete athletic lifecycle—from individual athlete self-tracking to state sports board talent funnels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role 1: Athlete */}
          <Card className="flex flex-col justify-between hover:border-blue-400 transition-all hover:shadow-elevated">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="teal" className="mb-2">For Athletes</Badge>
                <CardTitle className="text-xl text-navy-950">Athletic Passport &amp; Progress</CardTitle>
                <CardDescription className="mt-2 text-navy-600">
                  {ROLES_CONFIG.athlete.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-navy-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Standardized biometric fitness testing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Percentile benchmarks against age &amp; sport norms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Shareable digital talent passport with PDF export</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>AI movement analysis and repetition tracking</span>
                </li>
              </ul>
              <Link to="/dashboard/athlete" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-between border-navy-200 hover:bg-navy-50">
                  <span>Enter Athlete Portal</span>
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Role 2: Academy */}
          <Card className="flex flex-col justify-between hover:border-teal-400 transition-all hover:shadow-elevated">
            <CardHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="blue" className="mb-2">For Academies</Badge>
                <CardTitle className="text-xl text-navy-950">Cohort Rosters &amp; Batch Assessments</CardTitle>
                <CardDescription className="mt-2 text-navy-600">
                  {ROLES_CONFIG.academy.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-navy-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Cohort roster &amp; attendance management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Multi-trial batch physical assessments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Talent index rankings across training squads</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Evaluator authorization and session auditing</span>
                </li>
              </ul>
              <Link to="/dashboard/academy" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-between border-navy-200 hover:bg-navy-50">
                  <span>Enter Academy Portal</span>
                  <ChevronRight className="h-4 w-4 text-teal-600" />
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
                <CardTitle className="text-xl text-navy-950">Regional Scouting &amp; Analytics</CardTitle>
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
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0" />
                  <span>Statewide athletic benchmark distributions</span>
                </li>
              </ul>
              <Link to="/dashboard/institution" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-between border-navy-200 hover:bg-navy-50">
                  <span>Enter Institution Portal</span>
                  <ChevronRight className="h-4 w-4 text-navy-700" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. AI POSE DETECTION & BIOMECHANICS STUDIO */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-navy-950 via-navy-900 to-teal-950 p-8 sm:p-12 lg:p-16 text-white space-y-8 shadow-elevated">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3.5 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
                <Cpu className="h-4 w-4 text-teal-400" />
                <span>On-Device Computer Vision Studio</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Live AI Pose Tracking &amp; Biomechanical Kinematics
              </h2>
              <p className="text-sm sm:text-base text-navy-200 leading-relaxed">
                PratibhaScan runs the MediaPipe Tasks Vision Pose Landmarker in real-time on your device's web browser. It extracts 33 landmark anatomical keypoints with sub-millisecond precision, providing automated squat repetition counting and multi-joint kinematics analysis without sending video frames over the internet.
              </p>
            </div>
            <Link to="/dashboard/pose-detection">
              <Button size="lg" variant="primary" className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold shadow-md">
                <Camera className="h-5 w-5 mr-2" />
                Open AI Camera Studio
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                33
              </div>
              <p className="text-sm font-bold text-white">Landmark Keypoints</p>
              <p className="text-xs text-navy-300">
                Real-time tracking of hips, knees, ankles, shoulders, and spine with GPU/CPU fallback.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                16
              </div>
              <p className="text-sm font-bold text-white">Validated Kinematic Scenarios</p>
              <p className="text-xs text-navy-300">
                Extensively verified against deep squats, partial reps, trunk leans, knee caving, and occlusions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                100%
              </div>
              <p className="text-sm font-bold text-white">Edge Privacy Guarantee</p>
              <p className="text-xs text-navy-300">
                All camera frames remain strictly on your device. Zero biometric video is uploaded or recorded.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                CAL
              </div>
              <p className="text-sm font-bold text-white">Dynamic Calibration</p>
              <p className="text-xs text-navy-300">
                Calibrates athlete height, stance width, and camera tilt for accurate joint angle computation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SPORTS ASSESSMENT SUITE */}
      <section id="assessments" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="teal">Standardized Protocol Suite</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Six Core Physical Assessment Batteries
            </h2>
            <p className="text-sm text-navy-600">
              Benchmarked against Sports Authority of India (SAI) norms and internationally recognized athletic testing procedures.
            </p>
          </div>
          <Link to="/dashboard/assessments">
            <Button variant="outline" size="sm" className="border-navy-300">
              <ClipboardCheck className="h-4 w-4 mr-1.5 text-blue-600" />
              View Protocol Library
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD_PROTOCOLS.map((protocol) => (
            <Card
              key={protocol.code}
              className="p-5 flex flex-col justify-between hover:border-blue-400 transition-all shadow-subtle cursor-pointer hover:shadow-card"
              onClick={() => setSelectedProtocolCode(protocol.code)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {protocol.categoryLabel}
                  </span>
                  <span className="text-xs font-mono text-navy-500 font-bold">{protocol.unit}</span>
                </div>
                <h4 className="text-base font-bold text-navy-950">{protocol.name}</h4>
                <p className="text-xs text-navy-600 line-clamp-2 leading-relaxed">
                  {protocol.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>View Protocol Details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. ATHLETE PERFORMANCE TRACKING */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="rounded-3xl border border-navy-200 bg-navy-50/70 p-8 sm:p-12 space-y-8">
          <div className="max-w-2xl space-y-3">
            <Badge variant="blue">Performance Intelligence</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Comprehensive Athletic Performance Tracking
            </h2>
            <p className="text-sm text-navy-600 leading-relaxed">
              Every assessment recorded on PratibhaScan feeds into an athletic talent trajectory. Results are normalized by gender, age bracket, and sport discipline to provide meaningful national percentiles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 bg-white">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">Multi-Trial Progressions</h3>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
                Track personal bests, trial-by-trial variance, and training adaptation curves over 3-month, 6-month, and annual evaluation windows.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-white">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">Composite Talent Index</h3>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
                Synthesizes speed, explosive strength, aerobic base, and flexibility into an overall athletic readiness score for scouting comparisons.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-white">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">Official Athletic Passport</h3>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
                Generate clean, printable PDF talent passports containing verified trial metrics, biometric measurements, and affiliation credentials.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. HOW PRATIBHASCAN WORKS */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="teal">Standardized Workflow</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            How PratibhaScan Works
          </h2>
          <p className="text-sm sm:text-base text-navy-600">
            A three-step methodology ensuring data authenticity and rigorous athletic evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="p-6 rounded-2xl bg-white border border-navy-200/90 shadow-subtle space-y-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
              01
            </div>
            <h3 className="text-lg font-bold text-navy-950">Standardized Field Testing</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Coaches and certified evaluators execute standard physical protocols (sprint, jump, beep test, flexibility, squats) using documented calibration instructions and measurement rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-navy-200/90 shadow-subtle space-y-4">
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base">
              02
            </div>
            <h3 className="text-lg font-bold text-navy-950">Multi-Trial Verification</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Each assessment captures 3 consecutive valid trials. Values are calculated against national age-group benchmarks, certified through independent secondary evaluator sign-off.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-navy-200/90 shadow-subtle space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
              03
            </div>
            <h3 className="text-lg font-bold text-navy-950">Structured Talent Passport</h3>
            <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
              Results consolidate into a standardized digital athletic profile, accessible by authorized sports boards and academies for scholarship review and national camp consideration.
            </p>
          </div>
        </div>
      </section>

      {/* 8. PRIVACY, ETHICS & GUARDIAN CONSENT */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-navy-200 bg-white p-8 sm:p-12 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="teal">Governance &amp; Safeguards</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight mt-1">
                Privacy, Ethics &amp; Assessment Integrity
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <p className="font-bold text-sm text-navy-900 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-600" />
                Minor Athlete Guardian Consent
              </p>
              <p className="text-xs text-navy-600 leading-relaxed">
                Athletes under 18 require verifiable guardian authorization prior to official assessment logging, ensuring complete adherence to national data protection standards.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm text-navy-900 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                Two-Person Evaluator Separation
              </p>
              <p className="text-xs text-navy-600 leading-relaxed">
                Assessment sessions cannot be self-verified. Database security rules require an independent secondary coach to certify trial measurements before tier promotion.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm text-navy-900 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-teal-600" />
                Zero Video Cloud Retention
              </p>
              <p className="text-xs text-navy-600 leading-relaxed">
                Computer vision models process video streams frame-by-frame on-device. No raw camera frames or biometric pixels are ever recorded, uploaded, or sold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. GET STARTED CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-navy-200 bg-gradient-to-br from-navy-950 via-navy-900 to-blue-950 p-8 sm:p-14 text-white text-center space-y-6 shadow-elevated">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
            <PratibhaScanIcon className="h-4 w-4" />
            <span>PratibhaScan Sports Technology Platform</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight text-white">
            Ready to Standardize Sports Talent Identification?
          </h2>

          <p className="text-sm sm:text-base text-navy-300 max-w-2xl mx-auto leading-relaxed">
            Configure your Athlete passport, manage your Academy cohort, or register your Institution sports board today with real-time pose tracking and auditable assessment integrity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/register">
              <Button size="lg" variant="primary" className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md">
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/dashboard/pose-detection">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-navy-600 hover:bg-navy-800"
              >
                <Camera className="h-4 w-4 mr-2 text-teal-400" />
                Launch AI Camera
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setInquiryModalOpen(true)}
              className="text-xs text-navy-300 hover:text-white underline pt-2 sm:pt-0"
            >
              Institutional Pilot Inquiries
            </button>
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
              <p className="font-bold text-navy-950 mb-1">Methodology &amp; Execution:</p>
              <p className="text-navy-600 leading-relaxed bg-navy-50 p-3 rounded-lg border border-navy-200">
                {selectedProtocol.methodology}
              </p>
            </div>

            <div>
              <p className="font-bold text-navy-950 mb-1">Equipment Required:</p>
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
        title="PratibhaScan — Pilot &amp; Field Trials"
        description="Partnership &amp; Deployment Information for Sports Academies &amp; Boards"
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
            <p className="font-bold text-navy-950">Direct Contact:</p>
            <p className="text-navy-600">Email: pilot@pratibhascan.com</p>
            <p className="text-navy-600">Product: PratibhaScan (AI Sports Talent Assessment Platform)</p>
          </div>
          <p className="text-xs text-navy-500 leading-relaxed">
            Institutional sports bodies and academies receive priority onboarding for standardized talent scouting sessions and automated computer vision assessment trials.
          </p>
        </div>
      </Modal>
    </div>
  );
}