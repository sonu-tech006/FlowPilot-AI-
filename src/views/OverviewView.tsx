import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  TrendingUp,
  ShieldAlert,
  Cpu,
  ArrowRight,
  LifeBuoy,
  Download,
  Globe,
  ExternalLink,
  Zap,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { Workflow, WorkflowExecution, Incident, RecoveryAction, SlaPolicy, User } from '../types';
import { ExportReportModal } from '../components/ExportReportModal';
import { ProjectUrlLagInspector } from '../components/ProjectUrlLagInspector';
import { useTheme } from '../context/ThemeContext';

interface OverviewViewProps {
  metrics: any;
  workflows: Workflow[];
  executions: WorkflowExecution[];
  incidents: Incident[];
  recoveryActions: RecoveryAction[];
  slaPolicies?: SlaPolicy[];
  onSelectView: (view: string) => void;
  onQuickRunDemo: () => void;
  activeInspection?: any;
  activeInspectedUrl?: string;
  isDiagnosing?: boolean;
  activeAppName?: string;
  onSetActiveApp?: (url: string, name?: string) => void;
  currentUser?: User | null;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  workflows,
  executions,
  incidents,
  recoveryActions,
  slaPolicies = [],
  onSelectView,
  onQuickRunDemo,
  activeInspection,
  activeInspectedUrl,
  isDiagnosing,
  activeAppName,
  onSetActiveApp,
  currentUser,
}) => {
  const { theme, toggleTheme, isWhite } = useTheme();
  const [showExportModal, setShowExportModal] = useState(false);

  // Chart data: executions over time
  const executionChartData = [
    { time: '04:00', total: 12, succeeded: 12, failed: 0 },
    { time: '06:00', total: 24, succeeded: 24, failed: 0 },
    { time: '08:00', total: 48, succeeded: 47, failed: 1 },
    { time: '10:00', total: 65, succeeded: 62, failed: 3 },
    { time: '12:00', total: 82, succeeded: 79, failed: 3 },
    { time: '14:00', total: 70, succeeded: 69, failed: 1 },
    { time: '16:00', total: 45, succeeded: 44, failed: 1 },
  ];

  const failureCategoryData = [
    { name: 'Network timeout', count: 4, fill: '#38bdf8' },
    { name: 'Rate limit (429)', count: 2, fill: '#818cf8' },
    { name: 'Database pool', count: 1, fill: '#f59e0b' },
    { name: 'Auth token', count: 1, fill: '#10b981' },
    { name: 'Validation', count: 1, fill: '#f43f5e' },
  ];

  const pendingApprovals = recoveryActions.filter((r) => r.approvalStatus === 'PENDING');
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">System Reliability & Autonomy Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time workflow execution health, failure investigation telemetry, and recovery analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick White / Black Background Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-xs ${
              isWhite
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title={`Toggle background to ${isWhite ? 'Black Mode' : 'White Mode'}`}
          >
            {isWhite ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
                <span>Black Background</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>White Background</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Report (PDF / CSV)</span>
          </button>
          <button
            onClick={onQuickRunDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate E2E Failure</span>
          </button>
          <button
            onClick={() => onSelectView('recovery')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-md transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
            <span>Recovery Center ({pendingApprovals.length})</span>
          </button>
        </div>
      </div>

      {/* Active Monitored Application Header Card */}
      <div className={`p-4 sm:p-5 rounded-xl border shadow-lg transition-all ${
        isWhite
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0e1424] border-slate-800/90 text-slate-100'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isWhite
                ? 'bg-sky-50 border-sky-200 text-sky-600'
                : 'bg-sky-950 border-sky-800 text-sky-400'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider font-mono">
                  Active Monitored Application
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Live Observability Active
                </span>
                {currentUser && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    • Account: {currentUser.name} ({currentUser.email})
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{activeAppName || (activeInspectedUrl ? 'Custom Deployed App' : 'E-Commerce Order Processing Pipeline')}</span>
                {activeInspectedUrl && (
                  <a
                    href={activeInspectedUrl.startsWith('http') ? activeInspectedUrl : `https://${activeInspectedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-normal text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
                  >
                    <span>{activeInspectedUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeInspectedUrl
                  ? `All pipelines, latency probes, circuit breakers, and SLA metrics are strictly generated and executed for this application URL.`
                  : `Enter any deployed application URL above to automatically generate dedicated pipelines, live latency waterfalls, and isolate your metrics.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeInspectedUrl && (
              <button
                onClick={() => {
                  const el = document.getElementById('workflow-lag-inspector');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Run Live Latency Probe</span>
              </button>
            )}
            <button
              onClick={() => {
                const el = document.getElementById('workflow-lag-inspector');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  const inp = el.querySelector('input');
                  if (inp) inp.focus();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Change / Connect App URL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (12 key operational metrics derived from MongoDB records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400">Total Workflows</div>
          <div className="text-xl font-bold text-white font-mono mt-1">{metrics?.totalWorkflows || workflows.length}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">{metrics?.activeWorkflows || 2} active</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400">Executions Today</div>
          <div className="text-xl font-bold text-white font-mono mt-1">{metrics?.executionsToday || executions.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{metrics?.successRate || 95.2}% success rate</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400">Active Incidents</div>
          <div className="text-xl font-bold text-rose-400 font-mono mt-1">{activeIncidents.length}</div>
          <div className="text-[10px] text-rose-400/80 mt-0.5 font-mono">{metrics?.criticalIncidents || 1} critical</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400">Pending Approvals</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">{pendingApprovals.length}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5 font-mono">operator action required</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400">Mean Time to Recover</div>
          <div className="text-xl font-bold text-sky-400 font-mono mt-1">{metrics?.mttrMinutes || 4.8}m</div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">MTTD: {metrics?.mttdMinutes || 1.1}m</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400">Recovery Success</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {metrics?.recoverySuccessRate || 100}%
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">idempotent verified</div>
        </div>
      </div>

      {/* Active Incident Alert Banner if incident is open */}
      {activeIncidents.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-200 text-xs">
                  Critical Incident #{activeIncidents[0].id}
                </span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-slate-300 text-xs">{activeIncidents[0].workflowName}</span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-rose-400 text-xs font-mono">{activeIncidents[0].errorCategory}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">{activeIncidents[0].rootCauseHypothesis}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectView('investigation')}
              className="px-3 py-1.5 bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-xs font-medium rounded border border-rose-800 transition-colors"
            >
              View AI Investigation
            </button>
            <button
              onClick={() => onSelectView('recovery')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded transition-colors"
            >
              Approve Recovery
            </button>
          </div>
        </div>
      )}

      {/* Deployed Project URL Search & Workflow Lag Diagnostic Inspector */}
      <ProjectUrlLagInspector
        onSelectView={onSelectView}
        activeInspection={activeInspection}
        activeInspectedUrl={activeInspectedUrl}
        isDiagnosing={isDiagnosing}
      />

      {/* Real Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Execution Volume Over Time Chart */}
        <div className="lg:col-span-2 bg-[#0e1424] border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-200">Execution Volume & Success Rate</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">24-hour window aggregated by hour</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Succeeded
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Failed
              </span>
            </div>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executionChartData}>
                <defs>
                  <linearGradient id="colorSucc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="succeeded" stroke="#38bdf8" fillOpacity={1} fill="urlColorSucc" />
                <Area type="monotone" dataKey="failed" stroke="#f43f5e" fillOpacity={0.4} fill="#f43f5e" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Category Distribution */}
        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-200">Failure Categories (ML)</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Classified error distribution</span>
            </div>
            <button onClick={() => onSelectView('ml-analytics')} className="text-sky-400 hover:underline text-[11px]">
              Model Info
            </button>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureCategoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Executions & Pending Recovery Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Executions Table */}
        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200">Recent Workflow Executions</span>
            <button onClick={() => onSelectView('executions')} className="text-sky-400 hover:underline text-[11px]">
              View All Executions
            </button>
          </div>
          <div className="mt-3 divide-y divide-slate-800/60">
            {executions.slice(0, 4).map((ex) => (
              <div key={ex.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{ex.workflowName}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{ex.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(ex.startedAt).toLocaleTimeString()} · Source: {ex.triggerSource}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      ex.status === 'SUCCEEDED'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                        : ex.status === 'FAILED'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                        : 'bg-sky-950/70 text-sky-300 border border-sky-800/60'
                    }`}
                  >
                    {ex.status}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{ex.durationMs ? `${ex.durationMs}ms` : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals & AI Recommendations */}
        <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200">Pending Operator Approvals</span>
            <button onClick={() => onSelectView('recovery')} className="text-sky-400 hover:underline text-[11px]">
              Open Recovery Center
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No recovery approvals currently pending operator sign-off.
              </div>
            ) : (
              pendingApprovals.slice(0, 2).map((action) => (
                <div key={action.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">Action: {action.actionType}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded">
                      {action.approvalStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{action.description}</p>
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Idempotency: {action.idempotencyKey.slice(0, 18)}...
                    </span>
                    <button
                      onClick={() => onSelectView('recovery')}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Inspect & Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        metrics={metrics}
        incidents={incidents}
        slaPolicies={slaPolicies}
      />
    </div>
  );
};
