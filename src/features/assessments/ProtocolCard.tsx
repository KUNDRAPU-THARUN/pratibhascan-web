/**
 * PratibhaScan Protocol Card Component
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProtocolSpecification } from './assessmentCalculations';
import { Play, ChevronDown, ChevronUp, Shield, Wrench, Info } from 'lucide-react';

interface ProtocolCardProps {
  protocol: ProtocolSpecification;
  canConduct?: boolean;
  onSelectForAssessment?: (protocol: ProtocolSpecification) => void;
}

export const ProtocolCard: React.FC<ProtocolCardProps> = ({
  protocol,
  canConduct = false,
  onSelectForAssessment,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col justify-between border-navy-200/90 hover:border-primary-400 hover:shadow-card transition-all duration-200 bg-white">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="teal" className="text-[10px] font-semibold">
            {protocol.categoryLabel}
          </Badge>
          <span className="text-xs font-mono font-bold bg-navy-100/80 text-navy-800 px-2 py-0.5 rounded">
            {protocol.unit}
          </span>
        </div>

        <div>
          <CardTitle className="text-base font-bold text-navy-950 leading-snug">
            {protocol.name}
          </CardTitle>
          <p className="text-[11px] font-mono text-navy-400 mt-0.5">
            Code: {protocol.code}
          </p>
        </div>

        <CardDescription className="text-xs text-navy-600 line-clamp-2 leading-relaxed">
          {protocol.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Specification Metrics */}
        <div className="grid grid-cols-2 gap-2 text-[11px] py-2 px-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Scoring Rule
            </span>
            <span className={`font-semibold ${protocol.lowerIsBetter ? 'text-amber-800' : 'text-primary-800'}`}>
              {protocol.lowerIsBetter ? 'Lower is Better' : 'Higher is Better'}
            </span>
          </div>
          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Allowable Range
            </span>
            <span className="font-mono font-semibold text-navy-800">
              {protocol.validRange.min} – {protocol.validRange.max} {protocol.unit}
            </span>
          </div>
          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Attempts Allowed
            </span>
            <span className="font-semibold text-navy-800">
              Up to {protocol.maxAttempts} {protocol.maxAttempts === 1 ? 'Trial' : 'Trials'}
            </span>
          </div>
          <div>
            <span className="text-navy-400 block text-[10px] uppercase font-bold tracking-wider">
              Reference
            </span>
            <span className="font-medium text-navy-700 truncate block" title={protocol.normsReference}>
              SAI Guidelines
            </span>
          </div>
        </div>

        {/* Collapsible Methodology & Equipment Details */}
        {expanded && (
          <div className="space-y-2.5 text-xs text-navy-700 p-3 rounded-lg bg-white border border-navy-200/80 animate-in fade-in duration-150">
            <div>
              <p className="font-bold text-navy-900 flex items-center gap-1.5 mb-1 text-[11px]">
                <Shield className="h-3.5 w-3.5 text-primary-600" />
                Standard Procedure:
              </p>
              <p className="text-[11px] leading-relaxed text-navy-600 pl-5">
                {protocol.methodology}
              </p>
            </div>

            <div>
              <p className="font-bold text-navy-900 flex items-center gap-1.5 mb-1 text-[11px]">
                <Wrench className="h-3.5 w-3.5 text-primary-600" />
                Required Equipment:
              </p>
              <ul className="list-disc pl-9 text-[11px] space-y-0.5 text-navy-600">
                {protocol.equipmentRequired.map((eq, i) => (
                  <li key={i}>{eq}</li>
                ))}
              </ul>
            </div>

            <div className="p-2 rounded bg-amber-50/60 border border-amber-200/60 text-[10px] text-amber-900 flex items-start gap-1.5">
              <Info className="h-3 w-3 text-amber-700 shrink-0 mt-0.5" />
              <span>{protocol.selectionRuleDescription}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-navy-100 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] text-navy-500 hover:text-navy-900 px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Methodology
              </>
            )}
          </Button>

          {canConduct && onSelectForAssessment && (
            <Button
              variant="primary"
              size="sm"
              className="h-8 text-xs px-3 shadow-xs font-semibold"
              onClick={() => onSelectForAssessment(protocol)}
            >
              <Play className="h-3 w-3 mr-1 fill-current" />
              Conduct Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
