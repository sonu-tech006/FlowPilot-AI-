import React, { useState } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  RotateCcw,
  Copy,
  Terminal,
  Filter,
  Check,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { WorkflowExecution, ExecutionLog, StepExecution } from '../types';

interface ExecutionsViewProps {
  executions: WorkflowExecution[];
  selectedExecution: WorkflowExecution | null;
  logs: ExecutionLog[];
  onSelectExecution: (exec: WorkflowExecution) => void;
  onRetryExecution: (execId: string) => void;
  onSimulateFailure: (execId: string, nodeId: string, failureType: string) => void;
  onSelectView: (view: string) => void;
}

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({
  executions,
  selectedExecution,
  logs,
  onSelectExecution,
  onRetryExecution,
  onSimulateFailure,
  onSelectView,
}) => {
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeExec = selectedExecution || executions[0] || null;

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'ALL') return true;
    return l.level === logFilter;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row bg-[#070b13]">
      {/* Left List of Executions */}
      <div className="w-full lg:w-80 border-r border-slate-800/80 bg-[#090d16] flex flex-col overflow-hidden shrink-0">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">Execution Explorer</span>
          <span className="text-slate-500 font-mono text-[10px]">{executions.length} runs</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {executions.map((ex) => {
            const isSelected = activeExec?.id === ex.id;
            return (
              <div
                key={ex.id}
                onClick={() => onSelectExecution(ex)}
                className={`p-3 text-xs cursor-pointer transition-colors ${
                  isSelected ? 'bg-sky-950/40 border-l-2 border-sky-400' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 truncate">{ex.workflowName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                      ex.status === 'SUCCEEDED'
                        ? 'text-emerald-400 bg-emerald-950/50'
                        : ex.status === 'FAILED'
                        ? 'text-rose-400 bg-rose-950/50'
                        : 'text-sky-400 bg-sky-950/50'
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
                  <span>{ex.id}</span>
                  <span>{ex.durationMs ? `${ex.durationMs}ms` : 'running...'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(ex.startedAt).toLocaleTimeString()} · Source: {ex.triggerSource}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Execution Detail Timeline & Log Viewer */}
      {activeExec ? (
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Header Card */}
          <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-white">{activeExec.workflowName}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                    activeExec.status === 'SUCCEEDED'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                      : activeExec.status === 'FAILED'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                      : 'bg-sky-950/60 text-sky-300 border border-sky-800'
                  }`}
                >
                  {activeExec.status}
                </span>
                <span className="text-slate-500 text-xs font-mono">ID: {activeExec.id}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5">
                <span>Started: {new Date(activeExec.startedAt).toLocaleString()}</span>
                <span>·</span>
                <span>Duration: {activeExec.durationMs ? `${activeExec.durationMs}ms` : 'In Progress'}</span>
                <span>·</span>
                <span>Trigger: {activeExec.triggerSource}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeExec.idempotencyKey && (
                <button
                  onClick={() => handleCopy(activeExec.idempotencyKey!)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 text-xs font-mono hover:bg-slate-800 transition-colors"
                  title="Copy Idempotency Key"
                >
                  {copiedKey === activeExec.idempotencyKey ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Idempotency Key</span>
                </button>
              )}

              {activeExec.status === 'FAILED' && (
                <>
                  <button
                    onClick={() => onSelectView('investigation')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-900/60 hover:bg-sky-900 text-sky-200 border border-sky-800 rounded text-xs font-medium transition-colors"
                  >
                    AI Investigation
                  </button>
                  <button
                    onClick={() => onRetryExecution(activeExec.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resume Execution</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Step Timeline Grid */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">Step Execution Progression (DAG Pipeline)</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {activeExec.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`bg-[#0e1424] border rounded-lg p-3 text-xs flex flex-col justify-between ${
                    step.status === 'SUCCEEDED'
                      ? 'border-emerald-800/50'
                      : step.status === 'FAILED'
                      ? 'border-rose-800/80 bg-rose-950/10'
                      : step.status === 'RUNNING'
                      ? 'border-sky-800/80'
                      : 'border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">Step {idx + 1}</span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                          step.status === 'SUCCEEDED'
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : step.status === 'FAILED'
                            ? 'text-rose-400 bg-rose-950/60'
                            : 'text-slate-400 bg-slate-800'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <div className="font-medium text-slate-200 text-xs mt-1 truncate">{step.nodeName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{step.nodeType}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{step.durationMs ? `${step.durationMs}ms` : '—'}</span>
                    <span>Retries: {step.retryCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Failure Callout if step failed */}
          {activeExec.steps.some((s) => s.status === 'FAILED') && (
            <div className="bg-rose-950/30 border border-rose-900/60 rounded-lg p-4 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Execution Failed at Step "3. Process Payment"</span>
              </div>
              <div className="mt-2 text-slate-300 font-mono text-[11px] bg-black/40 p-2.5 rounded border border-rose-900/40">
                {activeExec.steps.find((s) => s.status === 'FAILED')?.error?.message}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-slate-400 text-[11px]">
                <span>
                  Error Category: <strong className="text-rose-300">Network timeout (HTTP 504)</strong>
                </span>
                <button
                  onClick={() => onSelectView('recovery')}
                  className="text-sky-400 hover:text-sky-300 font-medium"
                >
                  Proceed to Recovery Approval →
                </button>
              </div>
            </div>
          )}

          {/* Structured Execution Log Viewer */}
          <div className="bg-[#090d16] border border-slate-800 rounded-lg flex-1 flex flex-col overflow-hidden min-h-[280px]">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs bg-[#0b0f19]">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Execution Telemetry & Logs</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800 text-[11px]">
                {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      logFilter === lvl ? 'bg-slate-800 text-sky-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 font-mono text-[11px] space-y-1.5 overflow-y-auto flex-1 bg-black/30">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-6">No log entries available for this filter.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <span className="text-slate-600 shrink-0 select-none">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-1 rounded text-[10px] shrink-0 font-bold select-none ${
                        log.level === 'INFO'
                          ? 'text-sky-400 bg-sky-950/40'
                          : log.level === 'WARN'
                          ? 'text-amber-400 bg-amber-950/40'
                          : 'text-rose-400 bg-rose-950/40'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span
                      className={
                        log.level === 'ERROR'
                          ? 'text-rose-300'
                          : log.level === 'WARN'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          Select an execution on the left to view details.
        </div>
      )}
    </div>
  );
};
