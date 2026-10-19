import React from 'react';
import { CheckCircle2, ChevronRight, Play, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DemoWalkthroughBarProps {
  currentStep: number;
  onAdvanceStep: () => void;
  onJumpToStep: (step: number) => void;
  onSelectView: (view: string) => void;
  isExecuting?: boolean;
}

export const DEMO_STEPS = [
  {
    step: 1,
    title: 'Operator Signed In',
    description: 'Operating as Sarah Chen (Operator role) with recovery approval authority.',
    view: 'overview',
  },
  {
    step: 2,
    title: 'Order Processing Pipeline',
    description: 'Inspect the 5-step transaction workflow graph (Validation, Inventory, Payment, Invoice, Notification).',
    view: 'builder',
  },
  {
    step: 3,
    title: 'Simulate Payment Timeout',
    description: 'Trigger execution and inject an upstream HTTP 504 timeout into Stripe Payment Gateway step.',
    view: 'executions',
  },
  {
    step: 4,
    title: 'Inspect Step Logs',
    description: 'Review structured execution logs, socket timeout stack trace, and incident trigger.',
    view: 'executions',
  },
  {
    step: 5,
    title: 'ML Classification',
    description: 'TF-IDF vectorizer & calibrated classifier identifies "Network timeout" with 94% confidence.',
    view: 'ml-analytics',
  },
  {
    step: 6,
    title: 'Dependency Health Map',
    description: 'Inspect Stripe circuit breaker (tripped to HALF_OPEN state with 3,420ms latency).',
    view: 'dependencies',
  },
  {
    step: 7,
    title: 'Gemini Root-Cause Investigation',
    description: 'Backend Gemini analysis distinguishes facts from hypotheses and proposes safe RESUME_STEP.',
    view: 'investigation',
  },
  {
    step: 8,
    title: 'Preflight Dry-Run Check',
    description: 'Verify idempotency key, ledger state (zero duplicate charges), and inventory reservation.',
    view: 'recovery',
  },
  {
    step: 9,
    title: 'Operator Approval',
    description: 'Operator approves recovery plan with reason and auditable sign-off.',
    view: 'recovery',
  },
  {
    step: 10,
    title: 'Execute Safe Resumption',
    description: 'Resumes directly from payment step; verifies invoice generation & customer notification.',
    view: 'recovery',
  },
  {
    step: 11,
    title: 'Audit Log & SLA Verification',
    description: 'Verify immutable security audit trail, updated MTTR metrics, and error budget compliance.',
    view: 'audit-logs',
  },
];

export const DemoWalkthroughBar: React.FC<DemoWalkthroughBarProps> = ({
  currentStep,
  onAdvanceStep,
  onJumpToStep,
  onSelectView,
  isExecuting = false,
}) => {
  const { isWhite } = useTheme();
  const currentStepData = DEMO_STEPS[currentStep - 1] || DEMO_STEPS[0];

  return (
    <div className={`border-b px-6 py-2.5 flex items-center justify-between gap-4 text-xs select-none transition-colors duration-200 ${
      isWhite
        ? 'bg-sky-50/60 border-sky-100 text-slate-800'
        : 'bg-[#0b101d] border-sky-900/40 text-slate-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${
          isWhite
            ? 'bg-sky-100/80 border-sky-200 text-sky-800'
            : 'bg-sky-950/80 border-sky-800 text-sky-300'
        }`}>
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>E2E DEMO TOUR · STEP {currentStep}/{DEMO_STEPS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isWhite ? 'text-slate-900' : 'text-slate-200'}`}>{currentStepData.title}:</span>
          <span className={`hidden md:inline ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>{currentStepData.description}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onSelectView(currentStepData.view)}
          className={`px-2.5 py-1 rounded transition-colors text-[11px] border ${
            isWhite
              ? 'text-slate-700 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
          }`}
        >
          View {currentStepData.view.replace('-', ' ')}
        </button>

        <button
          onClick={onAdvanceStep}
          disabled={isExecuting}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded font-medium shadow-xs transition-all text-[11px] disabled:opacity-50"
        >
          <span>{currentStep === DEMO_STEPS.length ? 'Restart Tour' : 'Next Action'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
