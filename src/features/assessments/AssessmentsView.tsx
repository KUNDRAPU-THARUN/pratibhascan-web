import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { STANDARD_PROTOCOLS } from '@/lib/constants';
import { AssessmentProtocol } from '@/types';
import {
  Play,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function AssessmentsView() {
  const [activeProtocol, setActiveProtocol] = useState<AssessmentProtocol | null>(null);
  const [athleteName, setAthleteName] = useState('Pooja Nair');
  const [trial1, setTrial1] = useState('');
  const [trial2, setTrial2] = useState('');
  const [trial3, setTrial3] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastRecordedScore, setLastRecordedScore] = useState<number | null>(null);

  const handleStartTest = (p: AssessmentProtocol) => {
    setActiveProtocol(p);
    setTrial1('');
    setTrial2('');
    setTrial3('');
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProtocol) return;

    const t1 = parseFloat(trial1) || 0;
    const t2 = parseFloat(trial2) || 0;
    const t3 = parseFloat(trial3) || 0;
    const validScores = [t1, t2, t3].filter((s) => s > 0);

    if (validScores.length === 0) return;

    const best = activeProtocol.lowerIsBetter
      ? Math.min(...validScores)
      : Math.max(...validScores);

    setLastRecordedScore(best);
    setSuccessModalOpen(true);
  };

  const resetForm = () => {
    setActiveProtocol(null);
    setTrial1('');
    setTrial2('');
    setTrial3('');
    setSuccessModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
              Standardized Assessment Suite
            </h1>
            <Badge variant="teal">SAI Reference Norms</Badge>
          </div>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Conduct multi-trial standardized physical evaluations, calibrate measurement tools, and calculate verified scores.
          </p>
        </div>
      </div>

      {/* Protocol Runner or Library List */}
      {activeProtocol ? (
        <Card className="max-w-2xl mx-auto border-primary-300 ring-2 ring-primary-500/10 shadow-card">
          <CardHeader className="border-b border-navy-100 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveProtocol(null)}
                className="text-navy-500 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to All Protocols
              </Button>
              <span className="text-xs font-mono font-bold bg-navy-100 text-navy-700 px-2 py-0.5 rounded">
                Unit: {activeProtocol.unit}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200 inline-block">
                {activeProtocol.categoryLabel}
              </span>
              <CardTitle className="text-xl">{activeProtocol.name}</CardTitle>
              <CardDescription>{activeProtocol.description}</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSaveEvaluation}>
            <CardContent className="space-y-5 pt-5">
              <div className="p-3.5 rounded-xl bg-navy-50 border border-navy-200/80 text-xs text-navy-700 space-y-1.5">
                <p className="font-bold text-navy-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary-600" />
                  Standard Protocol Rule:
                </p>
                <p className="leading-relaxed text-navy-600">{activeProtocol.methodology}</p>
              </div>

              <FormField label="Athlete Name for Evaluation" required>
                <Input
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="Enter athlete's full name"
                  required
                />
              </FormField>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-navy-700">
                  Multi-Trial Recording ({activeProtocol.unit})
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Trial 1"
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={trial1}
                    onChange={(e) => setTrial1(e.target.value)}
                    required
                  />
                  <Input
                    label="Trial 2"
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={trial2}
                    onChange={(e) => setTrial2(e.target.value)}
                  />
                  <Input
                    label="Trial 3"
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={trial3}
                    onChange={(e) => setTrial3(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-navy-400">
                  {activeProtocol.lowerIsBetter
                    ? 'Lowest valid time is automatically selected as the benchmark score.'
                    : 'Highest valid mark is automatically selected as the benchmark score.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setActiveProtocol(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" className="shadow-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Validate &amp; Compute Score
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STANDARD_PROTOCOLS.map((protocol) => (
            <Card
              key={protocol.code}
              className="flex flex-col justify-between border-navy-200/90 hover:border-primary-400 hover:shadow-card transition-all"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="teal" className="text-[10px]">
                    {protocol.categoryLabel}
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-navy-500">
                    {protocol.unit}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-navy-900 leading-snug">
                  {protocol.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                  {protocol.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="pt-3 border-t border-navy-100 flex items-center justify-between">
                  <span className="text-[11px] text-navy-400">
                    {protocol.lowerIsBetter ? 'Lower mark = Better' : 'Higher mark = Better'}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => handleStartTest(protocol)}
                  >
                    <Play className="h-3 w-3 mr-1 fill-current" />
                    Run Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Success Modal */}
      <Modal
        isOpen={successModalOpen}
        onClose={resetForm}
        title="Assessment Trial Computed"
        description="Biometric Test Scored &amp; Verified"
        footerActions={
          <Button variant="primary" size="sm" onClick={resetForm}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Best Valid Score Computed</p>
              <p className="text-2xl font-extrabold text-navy-950 font-mono mt-0.5">
                {lastRecordedScore} {activeProtocol?.unit}
              </p>
              <p className="text-xs text-emerald-800 mt-1">
                Recorded for athlete: <span className="font-bold">{athleteName}</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-navy-50 border border-navy-200 text-xs text-navy-600 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              In Phase 1, score calculations occur on the client engine using SAI benchmark formulas. In Phase 2, this score will be written directly to Supabase PostgreSQL with RLS and digital signature.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
