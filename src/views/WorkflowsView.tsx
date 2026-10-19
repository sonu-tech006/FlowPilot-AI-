import React, { useState } from 'react';
import {
  Workflow as WorkflowIcon,
  Play,
  Pause,
  Copy,
  Download,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Workflow } from '../types';

interface WorkflowsViewProps {
  workflows: Workflow[];
  onSelectWorkflow: (wf: Workflow) => void;
  onRunWorkflow: (workflowId: string, injectedFailure?: any) => void;
  onPauseWorkflow: (workflowId: string) => void;
  onResumeWorkflow: (workflowId: string) => void;
  onCreateWorkflow: () => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  workflows,
  onSelectWorkflow,
  onRunWorkflow,
  onPauseWorkflow,
  onResumeWorkflow,
  onCreateWorkflow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Workflows Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Production workflow pipelines with version-aware DAG dependencies, retry limits, and SLA targets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateWorkflow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#0e1424] border border-slate-800 p-2.5 rounded-lg text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#090d16] px-3 py-1.5 rounded border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search workflows by name or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none text-xs"
          />
        </div>
        <div className="text-slate-500 font-mono text-[11px]">{filtered.length} total pipelines</div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((wf) => (
          <div
            key={wf.id}
            className="bg-[#0e1424] border border-slate-800/90 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm">{wf.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    v{wf.version}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                    wf.status === 'ACTIVE'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                  }`}
                >
                  {wf.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{wf.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                  {wf.nodes.length} Steps
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                  SLA: {wf.slaTargetMs}ms
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                  Target: {wf.slaAvailabilityTarget}%
                </span>
                {wf.tags.map((tag) => (
                  <span key={tag} className="text-slate-500 font-mono text-[10px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                onClick={() => onSelectWorkflow(wf)}
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                Open in Graph Builder →
              </button>

              <div className="flex items-center gap-2">
                {wf.status === 'ACTIVE' ? (
                  <button
                    onClick={() => onPauseWorkflow(wf.id)}
                    className="p-1.5 text-slate-400 hover:text-amber-300 bg-slate-900 border border-slate-800 rounded transition-colors"
                    title="Pause Workflow"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onResumeWorkflow(wf.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-300 bg-slate-900 border border-slate-800 rounded transition-colors"
                    title="Resume Workflow"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => onRunWorkflow(wf.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
