import React from 'react';
import {
  Network,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ZapOff,
  Zap,
} from 'lucide-react';
import { DependencyHealth } from '../types';

interface DependenciesViewProps {
  dependencies: DependencyHealth[];
  onTripDependency: (id: string) => void;
  onResetDependency: (id: string) => void;
}

export const DependenciesView: React.FC<DependenciesViewProps> = ({
  dependencies,
  onTripDependency,
  onResetDependency,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Dependency Map & Circuit Breakers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, failure counters, and circuit breaker governors preventing cascading workflow outages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono bg-sky-950/80 text-sky-300 border border-sky-800">
            Governor: Active Probing
          </span>
        </div>
      </div>

      {/* Dependencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dependencies.map((dep) => {
          const isOpen = dep.circuitBreakerState === 'OPEN';
          const isHalfOpen = dep.circuitBreakerState === 'HALF_OPEN';

          return (
            <div
              key={dep.id}
              className={`bg-[#0e1424] border rounded-lg p-5 flex flex-col justify-between ${
                isOpen
                  ? 'border-rose-800/80 bg-rose-950/10'
                  : isHalfOpen
                  ? 'border-amber-800/80 bg-amber-950/10'
                  : 'border-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-100 text-sm">{dep.name}</span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{dep.serviceType}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      dep.circuitBreakerState === 'CLOSED'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                        : isOpen
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                        : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {dep.circuitBreakerState}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                  <div className="bg-[#090d16] p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Latency (P95)</span>
                    <span className={`text-xs font-bold ${dep.responseLatencyMs > 2000 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {dep.responseLatencyMs}ms
                    </span>
                  </div>
                  <div className="bg-[#090d16] p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Error Rate</span>
                    <span className={`text-xs font-bold ${dep.errorRatePercentage > 5 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {dep.errorRatePercentage}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Failures / Threshold:</span>
                    <span>
                      {dep.failureCount} / {dep.failureThreshold}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cooldown Window:</span>
                    <span>{dep.cooldownPeriodMs / 1000}s</span>
                  </div>
                </div>

                {dep.recentFailures.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px]">
                    <span className="text-rose-400 font-medium block">Recent Failure Signature:</span>
                    <p className="text-slate-400 mt-0.5 truncate">{dep.recentFailures[0].reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                {isOpen || isHalfOpen ? (
                  <button
                    onClick={() => onResetDependency(dep.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset / Probe Circuit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onTripDependency(dep.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 rounded font-medium transition-colors"
                  >
                    <ZapOff className="w-3.5 h-3.5" />
                    <span>Simulate Outage (Trip Breaker)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
