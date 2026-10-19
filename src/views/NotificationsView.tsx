import React, { useState } from 'react';
import { Bell, CheckCheck, CheckCircle2, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'CRITICAL') return n.severity === 'CRITICAL';
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">System Notification Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time critical failure dispatches, recovery approval requests, and SLA error-budget warnings.
          </p>
        </div>
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs font-medium transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 p-1 bg-[#0e1424] border border-slate-800 rounded-lg text-xs w-fit">
        {(['ALL', 'UNREAD', 'CRITICAL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
              filter === tab ? 'bg-sky-950/70 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-[#0e1424] border border-slate-800 rounded-lg">
            No notifications matching this filter.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`p-4 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-3.5 ${
                n.isRead
                  ? 'bg-[#090d16] border-slate-850 opacity-70'
                  : 'bg-[#0e1424] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {n.severity === 'CRITICAL' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : n.severity === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : n.severity === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">{n.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
