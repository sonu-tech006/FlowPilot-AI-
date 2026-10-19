import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LifeBuoy,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Incident, Investigation, WorkflowExecution } from '../types';

interface InvestigationViewProps {
  selectedIncident: Incident | null;
  investigation: Investigation | null;
  execution: WorkflowExecution | null;
  onTriggerInvestigation: (incidentId: string) => void;
  onSelectView: (view: string) => void;
  isLoading?: boolean;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  selectedIncident,
  investigation,
  execution,
  onTriggerInvestigation,
  onSelectView,
  isLoading = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!selectedIncident) return;
    setIsRefreshing(true);
    await onTriggerInvestigation(selectedIncident.id);
    setIsRefreshing(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">AI Root-Cause Investigation</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/70 text-indigo-300 border border-indigo-800">
              Gemini 3.8 Flash
            </span>
            {investigation?.usedFallback && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/70 text-amber-300 border border-amber-800">
                Offline SRE Rule Engine Fallback
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated cognitive incident synthesis, structured evidence verification, and safety-gated recovery recommendations.
          </p>
        </div>

        {selectedIncident && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Regenerate Analysis</span>
            </button>
            <button
              onClick={() => onSelectView('recovery')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Review Recovery Action</span>
            </button>
          </div>
        )}
      </div>

      {selectedIncident && investigation ? (
        <div className="space-y-5">
          {/* Top Synthesis Overview Banner */}
          <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 font-mono">INCIDENT: {selectedIncident.id}</span>
                <h2 className="text-base font-bold text-white mt-0.5">{investigation.incidentSummary}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">CONFIDENCE SCORE</div>
                  <div className="text-base font-bold text-sky-400 font-mono">
                    {(investigation.confidenceScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right pl-3 border-l border-slate-800">
                  <div className="text-[10px] text-slate-500 font-mono">RISK PROFILE</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">{investigation.riskLevel}</div>
                </div>
              </div>
            </div>

            {/* Probable Root Cause Analysis */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-300">Probable Root Cause (Facts vs Hypotheses)</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-[#090d16] p-3.5 rounded border border-slate-800/80">
                {investigation.probableRootCause}
              </p>
            </div>
          </div>

          {/* Observed Evidence vs Alternative Explanations (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Observed Evidence */}
            <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg p-4 text-xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Observed Telemetry Evidence</span>
              </div>
              <ul className="mt-3 space-y-2">
                {investigation.observedEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400 font-mono font-bold select-none">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternative Explanations */}
            <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg p-4 text-xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 font-semibold text-slate-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Alternative Hypotheses Evaluated</span>
              </div>
              <ul className="mt-3 space-y-2">
                {investigation.alternativeExplanations.map((alt, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-400">
                    <span className="text-amber-400 font-mono font-bold select-none">•</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Recovery Strategy Card */}
          <div className="bg-[#0b1324] border border-sky-900/60 rounded-lg p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sky-900/40">
              <div className="flex items-center gap-2 font-bold text-sky-200 text-sm">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Recommended Recovery Action: {investigation.recommendedRecoveryAction}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                {investigation.humanApprovalRequired ? 'Operator Sign-off Enforced' : 'Auto-Recovery Permitted'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Expected Outcome</span>
                <p className="text-slate-200 mt-1">{investigation.expectedOutcome}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Impact Assessment</span>
                <p className="text-slate-200 mt-1">{investigation.impactAssessment}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-900/40">
              <span className="text-[11px] font-semibold text-slate-400">Mandatory Safety Prerequisites</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {investigation.recoveryPrerequisites.map((prereq, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded text-slate-300 font-mono text-[11px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>{prereq}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model Telemetry & Audit Metadata */}
          <div className="bg-[#090d16] border border-slate-800/80 rounded-lg p-3.5 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Model: {investigation.model}</span>
              <span>·</span>
              <span>Tokens: {investigation.tokensUsed || 640}</span>
              <span>·</span>
              <span>Est Cost: ${investigation.estimatedCostUsd || 0.00018}</span>
            </div>
            <div>Generated: {new Date(investigation.createdAt).toLocaleTimeString()}</div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 text-xs bg-[#0e1424] border border-slate-800 rounded-lg">
          No active incident selected for AI investigation. Select an incident from the Incidents list.
        </div>
      )}
    </div>
  );
};
