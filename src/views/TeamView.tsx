import React from 'react';
import { Users, Shield, CheckCircle2, UserCheck, Plus } from 'lucide-react';
import { User, UserRole } from '../types';

interface TeamViewProps {
  currentUser: User | null;
  onSwitchUser: (role: UserRole) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ currentUser, onSwitchUser }) => {
  const teamMembers: User[] = [
    {
      id: 'usr-operator-01',
      name: 'Sarah Chen',
      email: 'sarah.chen@flowpilot.internal',
      role: 'OPERATOR',
      workspaceId: 'ws-prod-01',
      createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'usr-admin-01',
      name: 'Marcus Vance',
      email: 'marcus.vance@flowpilot.internal',
      role: 'ADMIN',
      workspaceId: 'ws-prod-01',
      createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'usr-viewer-01',
      name: 'Elena Rostova',
      email: 'elena.rostova@flowpilot.internal',
      role: 'VIEWER',
      workspaceId: 'ws-prod-01',
      createdAt: '2026-10-10T10:00:00Z',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Team & Access Control (RBAC)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Role-based governance ensuring that only verified Operators and Admins can approve recovery actions and modify workflows.
        </p>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 text-xs space-y-3">
        <span className="font-bold text-slate-200">Role Permission Governance Matrix</span>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">View Dashboards</th>
                <th className="py-2 px-3">Trigger Workflows</th>
                <th className="py-2 px-3">Approve Recovery</th>
                <th className="py-2 px-3">Manage Workspaces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2.5 px-3 font-bold text-sky-400 font-sans">ADMIN</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-400 font-sans">OPERATOR</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-slate-600">DENIED</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-400 font-sans">VIEWER</td>
                <td className="py-2.5 px-3 text-emerald-400">ALLOWED</td>
                <td className="py-2.5 px-3 text-slate-600">DENIED</td>
                <td className="py-2.5 px-3 text-slate-600">DENIED</td>
                <td className="py-2.5 px-3 text-slate-600">DENIED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 space-y-3 text-xs">
        <span className="font-bold text-slate-200">Active Workspace Members</span>
        <div className="divide-y divide-slate-800/60">
          {teamMembers.map((member) => {
            const isCurrent = currentUser?.id === member.id;
            return (
              <div key={member.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{member.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {member.role}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800 px-1 rounded">
                        Active Simulation User
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{member.email}</div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => onSwitchUser(member.role)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs font-medium transition-colors"
                  >
                    Switch to {member.role}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
