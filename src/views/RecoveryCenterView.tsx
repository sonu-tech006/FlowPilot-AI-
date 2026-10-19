import React, { useState } from 'react';
import {
  LifeBuoy,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Eye,
  Key,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { RecoveryAction, User } from '../types';

interface RecoveryCenterViewProps {
  recoveryActions: RecoveryAction[];
  currentUser: User | null;
  onApproveAction: (actionId: string, reason: string) => Promise<void>;
  onRejectAction: (actionId: string, reason: string) => Promise<void>;
  onDryRunAction: (actionId: string) => Promise<any>;
  onExecuteAction: (actionId: string) => Promise<void>;
  onSelectView: (view: string) => void;
}

export const RecoveryCenterView: React.FC<RecoveryCenterViewProps> = ({
  recoveryActions,
  currentUser,
  onApproveAction,
  onRejectAction,
  onDryRunAction,
  onExecuteAction,
  onSelectView,
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(
    recoveryActions[0]?.id || null
  );
  const [approvalReason, setApprovalReason] = useState(
    'Verified zero duplicate charges posted via Stripe idempotency key. Safe to resume execution.'
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [dryRunOutput, setDryRunOutput] = useState<any | null>(null);

  const selectedAction =
    recoveryActions.find((a) => a.id === selectedActionId) || recoveryActions[0] || null;

  const handleDryRun = async () => {
    if (!selectedAction) return;
    const res = await onDryRunAction(selectedAction.id);
    setDryRunOutput(res);
  };

  const handleApprove = async () => {
    if (!selectedAction) return;
    setIsApproving(true);
    await onApproveAction(selectedAction.id, approvalReason);
    setIsApproving(false);
  };

  const handleExecute = async () => {
    if (!selectedAction) return;
    setIsExecuting(true);
    await onExecuteAction(selectedAction.id);
    setIsExecuting(false);
  };

  const isOperator = currentUser?.role === 'OPERATOR' || currentUser?.role === 'ADMIN';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Autonomous Recovery Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Safety-gated workflow recovery engine enforcing human approval policies, circuit breaker checks, and cryptographic idempotency.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono bg-sky-950/80 text-sky-300 border border-sky-800">
            Safety Policy: Strict Operator Sign-off
          </span>
        </div>
      </div>

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Proposed Actions Queue */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Recovery Approval Queue</span>
            <span className="text-slate-500 font-mono text-[11px]">{recoveryActions.length} actions</span>
          </div>

          <div className="space-y-2">
            {recoveryActions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-[#0e1424] border border-slate-800 rounded-lg">
                No recovery actions in queue.
              </div>
            ) : (
              recoveryActions.map((action) => {
                const isSelected = selectedAction?.id === action.id;
                return (
                  <div
                    key={action.id}
                    onClick={() => {
                      setSelectedActionId(action.id);
                      setDryRunOutput(null);
                    }}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#10172a] border-sky-500/80 shadow-md'
                        : 'bg-[#0e1424] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{action.actionType}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                          action.approvalStatus === 'APPROVED'
                            ? 'bg-sky-950/70 text-sky-300 border border-sky-800'
                            : action.approvalStatus === 'EXECUTED'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                            : action.approvalStatus === 'REJECTED'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {action.approvalStatus}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{action.description}</p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Risk: {action.riskLevel}</span>
                      <span>Incident: {action.incidentId}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Action Detail & Operator Decision Panel */}
        {selectedAction ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg p-5 text-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">ACTION ID: {selectedAction.id}</div>
                  <h2 className="text-base font-bold text-white mt-0.5">{selectedAction.description}</h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">STATUS</div>
                  <div className="text-xs font-bold text-sky-400 font-mono">{selectedAction.approvalStatus}</div>
                </div>
              </div>

              {/* Action Evaluation Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#090d16] p-3 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block text-[11px]">Why Recommended</span>
                  <p className="text-slate-400 mt-1">{selectedAction.whyRecommended}</p>
                </div>
                <div className="bg-[#090d16] p-3 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block text-[11px]">Expected Benefit</span>
                  <p className="text-slate-400 mt-1">{selectedAction.expectedBenefit}</p>
                </div>
                <div className="bg-[#090d16] p-3 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block text-[11px]">Potential Risk Analysis</span>
                  <p className="text-slate-400 mt-1">{selectedAction.potentialRisk}</p>
                </div>
                <div className="bg-[#090d16] p-3 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block text-[11px]">Idempotency Protection</span>
                  <p className="text-sky-300 font-mono text-[11px] mt-1 break-all">
                    {selectedAction.idempotencyKey}
                  </p>
                </div>
              </div>

              {/* Dry-Run Preflight Simulation Card */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">Preflight Dry-Run Check</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Simulates dependency connectivity, ledger balance, and locks before execution.
                    </p>
                  </div>
                  <button
                    onClick={handleDryRun}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Run Dry-Run Check</span>
                  </button>
                </div>

                {(dryRunOutput || selectedAction.dryRunResult) && (
                  <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-900/40 rounded text-emerald-300 font-mono text-[11px] space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Dry-Run Precheck PASSED</span>
                    </div>
                    <div>
                      {dryRunOutput?.simulatedOutcome || selectedAction.dryRunResult?.simulatedOutcome}
                    </div>
                  </div>
                )}
              </div>

              {/* Operator Decision Action Block */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Operator Action Gate</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Signed in as: <strong className="text-sky-300">{currentUser?.name}</strong> ({currentUser?.role})
                  </span>
                </div>

                {selectedAction.approvalStatus === 'PENDING' ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Approval Sign-off Justification</label>
                      <input
                        type="text"
                        value={approvalReason}
                        onChange={(e) => setApprovalReason(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[#090d16] border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => onRejectAction(selectedAction.id, 'Declined by operator')}
                        disabled={!isOperator}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-slate-800 rounded font-medium transition-colors disabled:opacity-50"
                      >
                        Reject Action
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={!isOperator || isApproving}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors shadow-xs disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Approve Recovery Plan</span>
                      </button>
                    </div>
                  </div>
                ) : selectedAction.approvalStatus === 'APPROVED' ? (
                  <div className="mt-3 bg-sky-950/20 border border-sky-900/40 rounded p-4 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sky-300">Action Approved by {selectedAction.approvedByName}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Approval reason: "{selectedAction.approvalReason || 'Verified safe'}"
                      </p>
                    </div>
                    <button
                      onClick={handleExecute}
                      disabled={isExecuting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors shadow-xs"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Execute Safe Recovery</span>
                    </button>
                  </div>
                ) : selectedAction.approvalStatus === 'EXECUTED' ? (
                  <div className="mt-3 bg-emerald-950/30 border border-emerald-900/60 rounded p-4 text-emerald-300">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recovery Successfully Dispatched & Verified</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {selectedAction.executionResult?.details}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => onSelectView('executions')}
                        className="px-3 py-1 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-200 rounded border border-emerald-800 font-medium"
                      >
                        Inspect Resumed Execution →
                      </button>
                      <button
                        onClick={() => onSelectView('audit-logs')}
                        className="text-sky-400 hover:underline"
                      >
                        View Audit Log Trail
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-slate-500 text-center py-2">
                    Action status: {selectedAction.approvalStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 text-xs bg-[#0e1424] border border-slate-800 rounded-lg">
            No action selected.
          </div>
        )}
      </div>
    </div>
  );
};
