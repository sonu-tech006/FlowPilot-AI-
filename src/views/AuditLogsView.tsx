import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = auditLogs.filter(
    (a) =>
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Security & Operation Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Append-only immutable record of workflow executions, operator approvals, and recovery operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            Audit Trail: Tamper Evident
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-[#0e1424] border border-slate-800 p-2.5 rounded-lg text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#090d16] px-3 py-1.5 rounded border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by action, actor, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none text-xs"
          />
        </div>
        <span className="text-slate-500 font-mono text-[11px]">{filtered.length} audit records</span>
      </div>

      <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-slate-800 text-slate-400 font-medium font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Resource</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Audit Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-sans font-medium">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3 text-sky-400 font-bold whitespace-nowrap">{log.action}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.targetResource} <span className="text-slate-500">({log.resourceId.slice(0, 12)}...)</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.outcome === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans text-xs max-w-md">{log.summary}</td>
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
