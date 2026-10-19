import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Workflow,
  PlayCircle,
  AlertOctagon,
  Sparkles,
  LifeBuoy,
  Cpu,
  Network,
  Activity,
  Bell,
  ShieldCheck,
  Users,
  Settings,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  counts?: {
    activeIncidents?: number;
    pendingApprovals?: number;
    unreadNotifications?: number;
  };
  activeAppName?: string;
  activeInspectedUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  counts = {},
  activeAppName,
  activeInspectedUrl,
}) => {
  const { isWhite } = useTheme();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'builder', label: 'Workflow Builder', icon: GitBranch },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'executions', label: 'Executions', icon: PlayCircle },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertOctagon,
      badge: counts.activeIncidents ? String(counts.activeIncidents) : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    { id: 'investigation', label: 'AI Investigation', icon: Sparkles },
    {
      id: 'recovery',
      label: 'Recovery Center',
      icon: LifeBuoy,
      badge: counts.pendingApprovals ? String(counts.pendingApprovals) : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    { id: 'ml-analytics', label: 'ML Analytics', icon: Cpu },
    { id: 'dependencies', label: 'Dependency Map', icon: Network },
    { id: 'sla', label: 'SLA & Reliability', icon: Activity },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: counts.unreadNotifications ? String(counts.unreadNotifications) : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'team', label: 'Team & Access', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 shrink-0 border-r flex flex-col justify-between select-none transition-colors duration-200 ${
      isWhite
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-[#070b13] border-slate-800/80 text-slate-100'
    }`}>
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className={`px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold ${
          isWhite ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Core Platform
        </div>
        {navItems.slice(0, 7).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? isWhite
                    ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs font-semibold'
                    : 'bg-sky-950/70 text-sky-300 border border-sky-800/60 shadow-xs'
                  : isWhite
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500' : isWhite ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className={`px-3 pt-4 pb-2 text-[10px] uppercase tracking-wider font-semibold ${
          isWhite ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Intelligence & Operations
        </div>
        {navItems.slice(7).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? isWhite
                    ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs font-semibold'
                    : 'bg-sky-950/70 text-sky-300 border border-sky-800/60 shadow-xs'
                  : isWhite
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500' : isWhite ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Monitored App Card */}
      {activeAppName && (
        <div className={`mx-3 mb-2 p-2.5 rounded-lg border text-xs ${
          isWhite ? 'bg-sky-50/80 border-sky-200 text-slate-800' : 'bg-sky-950/40 border-sky-800/60 text-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-sky-500 font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Target Application</span>
          </div>
          <div className="font-bold truncate text-xs">{activeAppName}</div>
          {activeInspectedUrl && (
            <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={activeInspectedUrl}>
              {activeInspectedUrl}
            </div>
          )}
        </div>
      )}

      {/* Footer System Status */}
      <div className={`p-3 border-t text-[11px] ${
        isWhite
          ? 'border-slate-200 bg-slate-50 text-slate-600'
          : 'border-slate-800/70 bg-[#090d16]/90 text-slate-400'
      }`}>
        <div className="flex items-center justify-between">
          <span className={isWhite ? 'text-slate-500' : 'text-slate-500'}>Autonomous Mode</span>
          <span className="text-sky-500 font-mono text-[10px] font-semibold">Active</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={isWhite ? 'text-slate-500' : 'text-slate-500'}>Cluster Heartbeat</span>
          <span className={`font-mono text-[10px] ${isWhite ? 'text-slate-700' : 'text-slate-400'}`}>healthy</span>
        </div>
      </div>
    </aside>
  );
};
