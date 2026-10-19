import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, ShieldAlert, TrendingDown } from 'lucide-react';
import { SlaPolicy } from '../types';

interface SlaViewProps {
  slaPolicies: SlaPolicy[];
}

export const SlaView: React.FC<SlaViewProps> = ({ slaPolicies }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">SLA & Reliability Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Error-budget burn velocity, availability compliance, and automated deadline risk warnings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slaPolicies.map((policy) => {
          const burnPercent = Math.round(
            (policy.errorBudgetBurnedMinutes / policy.errorBudgetMinutes) * 100
          );
          const isAtRisk = burnPercent > 15;

          return (
            <div key={policy.id} className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-bold text-slate-100 text-sm">{policy.workflowName}</span>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Policy: {policy.id}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-500">AVAILABILITY</div>
                  <div
                    className={`text-sm font-bold ${
                      policy.currentAvailabilityPercent >= policy.targetAvailabilityPercent
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {policy.currentAvailabilityPercent}% / {policy.targetAvailabilityPercent}%
                  </div>
                </div>
              </div>

              {/* Error Budget Burn Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-400">Error Budget Burn Down</span>
                  <span className={burnPercent > 25 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {policy.errorBudgetBurnedMinutes}m / {policy.errorBudgetMinutes}m ({burnPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      burnPercent > 25 ? 'bg-rose-500' : burnPercent > 15 ? 'bg-amber-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, burnPercent)}%` }}
                  />
                </div>
              </div>

              {/* Latency & MTTR Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">P95 Latency</span>
                  <span className="font-bold text-slate-200">{policy.p95DurationMs}ms</span>
                </div>
                <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">MTTD</span>
                  <span className="font-bold text-sky-400">{policy.mttdMinutes}m</span>
                </div>
                <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">MTTR</span>
                  <span className="font-bold text-emerald-400">{policy.mttrMinutes}m</span>
                </div>
              </div>

              {policy.lastBreachAt && (
                <div className="text-[11px] text-rose-300 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Breach logged: HTTP 504 timeout exceeded SLA target ({policy.maxExecutionDurationMs}ms) at{' '}
                    {new Date(policy.lastBreachAt).toLocaleTimeString()}.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
