import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/states';
import { tokens } from '@/styles/tokens';
import { Palette, Layers, Box } from 'lucide-react';

export function DesignSystemView() {
  const [modalDemoOpen, setModalDemoOpen] = useState(false);

  const copyToClipboard = (_tokenName: string, value: string) => {
    navigator.clipboard?.writeText(value);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
            PratibhaScan UI Design System
          </h1>
          <Badge variant="teal">Living Tokens &amp; Components</Badge>
        </div>
        <p className="text-xs sm:text-sm text-navy-500 mt-1 max-w-2xl">
          Specification of design tokens, accessible reusable UI primitives, and application states engineered for KAARYAN LABS sports technology.
        </p>
      </div>

      {/* 1. COLOR TOKENS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-navy-900">1. Color Palette Tokens</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary Teal Accent */}
          <Card className="p-4 border-navy-200">
            <h3 className="text-sm font-bold text-navy-900 mb-2">Primary Accent (Teal)</h3>
            <div className="space-y-1.5">
              {[
                { name: 'primary-50', hex: tokens.colors.primary[50], light: true },
                { name: 'primary-200', hex: tokens.colors.primary[200], light: true },
                { name: 'primary-500', hex: tokens.colors.primary[500], light: false },
                { name: 'primary-600', hex: tokens.colors.primary[600], light: false, key: 'Key Primary' },
                { name: 'primary-800', hex: tokens.colors.primary[800], light: false },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => copyToClipboard(c.name, c.hex)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: c.hex, color: c.light ? '#0F172A' : '#FFFFFF' }}
                >
                  <span className="text-xs font-semibold">{c.name} {c.key && `(${c.key})`}</span>
                  <span className="text-[10px] font-mono opacity-80">{c.hex}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Secondary Blue Accent */}
          <Card className="p-4 border-navy-200">
            <h3 className="text-sm font-bold text-navy-900 mb-2">Secondary Accent (Blue)</h3>
            <div className="space-y-1.5">
              {[
                { name: 'secondary-50', hex: tokens.colors.secondary[50], light: true },
                { name: 'secondary-200', hex: tokens.colors.secondary[200], light: true },
                { name: 'secondary-500', hex: tokens.colors.secondary[500], light: false },
                { name: 'secondary-600', hex: tokens.colors.secondary[600], light: false, key: 'Key Secondary' },
                { name: 'secondary-800', hex: tokens.colors.secondary[800], light: false },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => copyToClipboard(c.name, c.hex)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: c.hex, color: c.light ? '#0F172A' : '#FFFFFF' }}
                >
                  <span className="text-xs font-semibold">{c.name} {c.key && `(${c.key})`}</span>
                  <span className="text-[10px] font-mono opacity-80">{c.hex}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Deep Navy Neutrals */}
          <Card className="p-4 border-navy-200">
            <h3 className="text-sm font-bold text-navy-900 mb-2">Neutrals &amp; Deep Navy</h3>
            <div className="space-y-1.5">
              {[
                { name: 'navy-50', hex: tokens.colors.navy[50], light: true, key: 'App Background' },
                { name: 'navy-200', hex: tokens.colors.navy[200], light: true, key: 'Card Border' },
                { name: 'navy-500', hex: tokens.colors.navy[500], light: false },
                { name: 'navy-800', hex: tokens.colors.navy[800], light: false },
                { name: 'navy-900', hex: tokens.colors.navy[900], light: false, key: 'Deep Navy Text' },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => copyToClipboard(c.name, c.hex)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: c.hex, color: c.light ? '#0F172A' : '#FFFFFF' }}
                >
                  <span className="text-xs font-semibold">{c.name} {c.key && `(${c.key})`}</span>
                  <span className="text-[10px] font-mono opacity-80">{c.hex}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* 2. REUSABLE BUTTON PRIMITIVES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-navy-900">2. Button Variants &amp; Sizes</h2>
        </div>

        <Card className="p-6 border-navy-200 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-3">Variants</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary (Teal)</Button>
              <Button variant="secondary">Secondary (Navy)</Button>
              <Button variant="accent">Accent (Blue)</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Text Link</Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-3">Sizes &amp; States</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (h-8)</Button>
              <Button size="md">Medium (h-10)</Button>
              <Button size="lg">Large (h-12)</Button>
              <Button isLoading size="md">Loading State</Button>
              <Button disabled size="md">Disabled State</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. BADGES & FORM INPUTS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-navy-900">3. Badges, FormField &amp; Modal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-navy-200 space-y-4">
            <h3 className="text-sm font-bold text-navy-900">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="teal">Teal / Brand</Badge>
              <Badge variant="blue">Blue / Secondary</Badge>
              <Badge variant="default">Neutral Navy</Badge>
              <Badge variant="success">Success State</Badge>
              <Badge variant="warning">Warning State</Badge>
              <Badge variant="danger">Danger State</Badge>
              <Badge variant="outline">Outline Only</Badge>
            </div>

            <div className="pt-4 border-t border-navy-100">
              <h3 className="text-sm font-bold text-navy-900 mb-2">Interactive Modal Trigger</h3>
              <Button variant="primary" size="sm" onClick={() => setModalDemoOpen(true)}>
                Open Accessible Modal Preview
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-navy-200 space-y-3">
            <h3 className="text-sm font-bold text-navy-900">FormField &amp; Input</h3>
            <FormField label="Standard Form Field" helperText="Helpful explanatory context goes here" required>
              <Input placeholder="Enter metric value..." />
            </FormField>

            <FormField label="Form Field with Error State" error="This field requires a valid numerical score">
              <Input defaultValue="Invalid text" error="Validation failed" />
            </FormField>
          </Card>
        </div>
      </section>

      {/* 4. APPLICATION STATE FEEDBACK */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900">4. Loading, Empty, and Error States</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingState
            message="Evaluating Biometrics..."
            description="Calculating normalized percentile benchmarks against SAI national table norms."
          />

          <EmptyState
            title="No Assessments Recorded"
            description="No field testing trials recorded for this cohort. Launch a standardized test to record scores."
            actionLabel="Start Evaluation"
            onAction={() => alert('Empty state action triggered')}
          />

          <ErrorState
            title="Biometric Sync Halted"
            message="Calibration offset exceeded allowable variance. Please verify stopwatch or sensor gates."
            onRetry={() => alert('Retry triggered')}
          />
        </div>
      </section>

      {/* Modal Preview */}
      <Modal
        isOpen={modalDemoOpen}
        onClose={() => setModalDemoOpen(false)}
        title="Accessible Modal Component"
        description="WAI-ARIA compliant dialog with keyboard ESC and focus management"
        footerActions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalDemoOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalDemoOpen(false)}>
              Confirm Action
            </Button>
          </div>
        }
      >
        <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
          This modal adheres to accessibility guidelines: it traps focus, listens for the Escape key, disables background document scrolling, and restores focus upon dismissal.
        </p>
      </Modal>
    </div>
  );
}
