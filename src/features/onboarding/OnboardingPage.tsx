import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  athleteOnboardingSchema,
  academyOnboardingSchema,
  institutionOnboardingSchema,
} from '@/features/auth/authSchemas';
import {
  AlertCircle,
  Building2,
  GraduationCap,
  User,
  ArrowRight,
  LogOut,
} from 'lucide-react';

const COMMON_SPORTS = [
  'Athletics',
  'Badminton',
  'Boxing',
  'Wrestling',
  'Swimming',
  'Shooting',
  'Archery',
  'Weightlifting',
  'Table Tennis',
  'Football',
  'Hockey',
  'Basketball',
  'Volleyball',
  'Gymnastics',
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, role, isOnboarded, refreshProfile, signOut } = useAuth();

  // Redirect if already onboarded
  useEffect(() => {
    if (isOnboarded && role) {
      navigate(`/dashboard/${role}`, { replace: true });
    }
  }, [isOnboarded, role, navigate]);

  // Athlete Form State
  const [dateOfBirth, setDateOfBirth] = useState('2008-01-01');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [primarySport, setPrimarySport] = useState('Athletics');
  const [secondarySport, setSecondarySport] = useState('');
  const [heightCm, setHeightCm] = useState('172');
  const [weightKg, setWeightKg] = useState('64');
  const [wingspanCm, setWingspanCm] = useState('');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Academy Form State
  const [academyName, setAcademyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['Athletics', 'Badminton']);

  // Institution Form State
  const [institutionName, setInstitutionName] = useState('');
  const [instType, setInstType] = useState<
    'school' | 'college' | 'university' | 'sports_board' | 'federation'
  >('sports_board');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync email when user loads
  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user, contactEmail]);

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleAthleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const parsedHeight = parseFloat(heightCm);
    const parsedWeight = parseFloat(weightKg);
    const parsedWingspan = wingspanCm ? parseFloat(wingspanCm) : null;

    const validation = athleteOnboardingSchema.safeParse({
      dateOfBirth,
      gender,
      primarySport,
      secondarySport: secondarySport || undefined,
      heightCm: isNaN(parsedHeight) ? undefined : parsedHeight,
      weightKg: isNaN(parsedWeight) ? undefined : parsedWeight,
      wingspanCm: isNaN(parsedWingspan as number) ? null : parsedWingspan,
      state,
      district,
      phoneNumber: phoneNumber || null,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user || !supabase) return;
    setIsSubmitting(true);

    try {
      // 1. Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          state,
          district,
          phone_number: phoneNumber || null,
        })
        .eq('id', user.id);

      if (profileError) {
        setFormError(profileError.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Update athletes record
      const { error: athleteError } = await supabase
        .from('athletes')
        .update({
          date_of_birth: dateOfBirth,
          gender,
          primary_sport: primarySport,
          secondary_sport: secondarySport || null,
          height_cm: parsedHeight,
          weight_kg: parsedWeight,
          wingspan_cm: parsedWingspan,
        })
        .eq('id', user.id);

      if (athleteError) {
        setFormError(athleteError.message);
        setIsSubmitting(false);
        return;
      }

      await refreshProfile();
      navigate('/dashboard/athlete', { replace: true });
    } catch {
      setFormError('Failed to save profile. Please verify database connection.');
      setIsSubmitting(false);
    }
  };

  const handleAcademySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const validation = academyOnboardingSchema.safeParse({
      name: academyName,
      registrationNumber: regNumber || null,
      contactEmail,
      contactPhone: contactPhone || null,
      state,
      district,
      address: address || null,
      sportsOffered: selectedSports,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user || !supabase) return;
    setIsSubmitting(true);

    try {
      // 1. Insert new academy owned by current user
      const { error: academyError } = await supabase.from('academies').insert({
        owner_id: user.id,
        name: academyName,
        registration_number: regNumber || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        state,
        district,
        address: address || null,
        sports_offered: selectedSports,
        verified: false,
      });

      if (academyError) {
        setFormError(academyError.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Update user_profiles with contact info
      await supabase
        .from('user_profiles')
        .update({
          state,
          district,
          phone_number: contactPhone || null,
        })
        .eq('id', user.id);

      await refreshProfile();
      navigate('/dashboard/academy', { replace: true });
    } catch {
      setFormError('Failed to register academy. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const validation = institutionOnboardingSchema.safeParse({
      name: institutionName,
      type: instType,
      contactEmail,
      contactPhone: contactPhone || null,
      state,
      district,
      address: address || null,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user || !supabase) return;
    setIsSubmitting(true);

    try {
      // 1. Insert new institution owned by current user
      const { error: instError } = await supabase.from('institutions').insert({
        owner_id: user.id,
        name: institutionName,
        type: instType,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        state,
        district,
        verified: false,
      });

      if (instError) {
        setFormError(instError.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Update user profile
      await supabase
        .from('user_profiles')
        .update({
          state,
          district,
          phone_number: contactPhone || null,
        })
        .eq('id', user.id);

      await refreshProfile();
      navigate('/dashboard/institution', { replace: true });
    } catch {
      setFormError('Failed to register institution. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Wordmark size="md" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-navy-600 hover:text-navy-900"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign Out
          </Button>
        </div>

        {/* Progress & Welcome Banner */}
        <div className="rounded-xl bg-white border border-navy-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-500">
                Setup Stage
              </span>
              <Badge
                variant={
                  role === 'athlete'
                    ? 'teal'
                    : role === 'academy'
                    ? 'blue'
                    : 'default'
                }
              >
                {role ? role.toUpperCase() : 'USER'}
              </Badge>
            </div>
            <h1 className="text-lg font-bold text-navy-900 mt-1">
              Welcome, {profile?.full_name || user?.email}
            </h1>
            <p className="text-xs text-navy-600">
              Please finalize your profile details to activate your secure portal.
            </p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            {role === 'athlete' && <User className="h-6 w-6" />}
            {role === 'academy' && <Building2 className="h-6 w-6" />}
            {role === 'institution' && <GraduationCap className="h-6 w-6" />}
          </div>
        </div>

        {/* Form Error Alert */}
        {formError && (
          <div
            className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3 text-rose-800 text-xs"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{formError}</div>
          </div>
        )}

        {/* ROLE 1: ATHLETE ONBOARDING */}
        {role === 'athlete' && (
          <Card className="shadow-card border-navy-200/90 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-navy-900">
                Athlete Biometrics & Sports Profile
              </CardTitle>
              <CardDescription className="text-xs text-navy-600">
                Initial physical parameters used for age-standardized benchmarking and talent passport creation.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAthleteSubmit} noValidate>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="athlete-dob"
                    type="date"
                    label="Date of Birth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    error={errors.dateOfBirth}
                    disabled={isSubmitting}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                      disabled={isSubmitting}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                      Primary Sport <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={primarySport}
                      onChange={(e) => setPrimarySport(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {COMMON_SPORTS.map((sp) => (
                        <option key={sp} value={sp}>
                          {sp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="athlete-secondary-sport"
                    type="text"
                    label="Secondary Sport (Optional)"
                    placeholder="e.g. Badminton"
                    value={secondarySport}
                    onChange={(e) => setSecondarySport(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    id="athlete-height"
                    type="number"
                    step="0.5"
                    label="Height (cm)"
                    placeholder="170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    error={errors.heightCm}
                    disabled={isSubmitting}
                    required
                  />

                  <Input
                    id="athlete-weight"
                    type="number"
                    step="0.5"
                    label="Weight (kg)"
                    placeholder="65"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    error={errors.weightKg}
                    disabled={isSubmitting}
                    required
                  />

                  <Input
                    id="athlete-wingspan"
                    type="number"
                    step="0.5"
                    label="Wingspan (cm)"
                    placeholder="175"
                    value={wingspanCm}
                    onChange={(e) => setWingspanCm(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="athlete-district"
                    type="text"
                    label="District"
                    placeholder="e.g. Bengaluru Urban"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    error={errors.district}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <Input
                  id="athlete-phone"
                  type="tel"
                  label="Contact Phone Number"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Save Profile & Enter Athlete Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ROLE 2: ACADEMY ONBOARDING */}
        {role === 'academy' && (
          <Card className="shadow-card border-navy-200/90 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-navy-900">
                Register Your Sports Academy
              </CardTitle>
              <CardDescription className="text-xs text-navy-600">
                Create your verified academy profile to manage athlete cohorts, track assessments, and issue athlete passports.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAcademySubmit} noValidate>
              <CardContent className="space-y-4">
                <Input
                  id="academy-name"
                  type="text"
                  label="Official Academy / Club Name"
                  placeholder="e.g. Apex Sports High Performance Center"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  error={errors.name}
                  disabled={isSubmitting}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="academy-reg"
                    type="text"
                    label="Registration / Trust No. (Optional)"
                    placeholder="e.g. REG-KA-2024-8841"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    disabled={isSubmitting}
                  />

                  <Input
                    id="academy-phone"
                    type="tel"
                    label="Official Phone"
                    placeholder="+91 98765 12345"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    error={errors.contactPhone}
                    disabled={isSubmitting}
                  />
                </div>

                <Input
                  id="academy-email"
                  type="email"
                  label="Contact Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  error={errors.contactEmail}
                  disabled={isSubmitting}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="academy-district"
                    type="text"
                    label="District"
                    placeholder="e.g. Bengaluru Urban"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    error={errors.district}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <Input
                  id="academy-address"
                  type="text"
                  label="Facility Address (Optional)"
                  placeholder="e.g. 42 Stadium Road, Koramangala"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />

                {/* Sports Offered */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                    Sports Disciplines Offered <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {COMMON_SPORTS.map((sport) => {
                      const isSelected = selectedSports.includes(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => toggleSport(sport)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-secondary-600 text-white border-secondary-600 shadow-xs'
                              : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'
                          }`}
                        >
                          {sport}
                        </button>
                      );
                    })}
                  </div>
                  {errors.sportsOffered && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{errors.sportsOffered}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Complete Registration & Open Academy Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ROLE 3: INSTITUTION ONBOARDING */}
        {role === 'institution' && (
          <Card className="shadow-card border-navy-200/90 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-navy-900">
                Register Your Institution
              </CardTitle>
              <CardDescription className="text-xs text-navy-600">
                Educational institutions and sports boards can conduct official talent identification batteries.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleInstitutionSubmit} noValidate>
              <CardContent className="space-y-4">
                <Input
                  id="institution-name"
                  type="text"
                  label="Official Institution / Board Name"
                  placeholder="e.g. Karnataka State Sports Board / National Sports College"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  error={errors.name}
                  disabled={isSubmitting}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                      Institution Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={instType}
                      onChange={(e) =>
                        setInstType(
                          e.target.value as
                            | 'school'
                            | 'college'
                            | 'university'
                            | 'sports_board'
                            | 'federation'
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <option value="school">School / K-12 Academy</option>
                      <option value="college">Undergraduate College</option>
                      <option value="university">University</option>
                      <option value="sports_board">District / State Sports Board</option>
                      <option value="federation">Sports Federation</option>
                    </select>
                  </div>

                  <Input
                    id="institution-phone"
                    type="tel"
                    label="Official Contact Phone"
                    placeholder="+91 80 2345 6789"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <Input
                  id="institution-email"
                  type="email"
                  label="Official Contact Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  error={errors.contactEmail}
                  disabled={isSubmitting}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-navy-700 tracking-wide">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="institution-district"
                    type="text"
                    label="District"
                    placeholder="e.g. Bengaluru Urban"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    error={errors.district}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <Input
                  id="institution-address"
                  type="text"
                  label="Campus / Office Address (Optional)"
                  placeholder="e.g. Sector 5, Directorate of Youth Services"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Register Institution & Open Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
