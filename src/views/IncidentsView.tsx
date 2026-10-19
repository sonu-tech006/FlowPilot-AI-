import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  Sparkles,
  LifeBuoy,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Incident, IncidentStatus, IncidentSeverity } from '../types';

interface IncidentsViewProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onResolveIncident: (id: string, notes: string) => void;
  onEscalateIncident: (id: string) => void;
  onSelectView: (view: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onSelectIncident,
  onResolveIncident,
  onEscalateIncident,
  onSelectView,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = incidents.filter((inc) => {
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (
      searchTerm &&
      !inc.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !inc.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !inc.errorCategory.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Incident Management & Correlation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated correlation by workflow dependency, error fingerprint, and historical failure clustering.
          </p>
        </div>
      </div>

      {/* Filter and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e1424] border border-slate-800 p-2.5 rounded-lg text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'OPEN', 'INVESTIGATING', 'AWAITING_APPROVAL', 'RECOVERING', 'RESOLVED', 'ESCALATED'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-sky-950/70 text-sky-300 border border-sky-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#090d16] px-3 py-1.5 rounded border border-slate-800 max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID, workflow, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Incident ID</th>
                <th className="px-4 py-3">Workflow & Failed Step</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Error Category</th>
                <th className="px-4 py-3">Dependency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No incidents matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-sky-400 font-semibold">{inc.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{inc.workflowName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Step: {inc.failedStepName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                            : inc.severity === 'HIGH'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{inc.errorCategory}</td>
                    <td className="px-4 py-3 text-slate-400">{inc.affectedDependency || 'Internal'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          inc.status === 'RESOLVED'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : inc.status === 'AWAITING_APPROVAL'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            : inc.status === 'INVESTIGATING'
                            ? 'bg-sky-950/60 text-sky-300 border border-sky-800'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{inc.assignedToName || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            onSelectIncident(inc);
                            onSelectView('investigation');
                          }}
                          className="px-2 py-1 bg-sky-950/80 hover:bg-sky-900/80 text-sky-300 border border-sky-800 rounded text-[11px] font-medium transition-colors"
                        >
                          AI Deep-Dive
                        </button>
                        {inc.status !== 'RESOLVED' && (
                          <button
                            onClick={() => {
                              onSelectIncident(inc);
                              onSelectView('recovery');
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium transition-colors"
                          >
                            Recovery
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
