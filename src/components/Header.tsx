import React, { useState, useEffect } from 'react';
import {
  Bell,
  RotateCcw,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Search,
  LogIn,
  UserPlus,
  LogOut,
  Database,
  Globe,
  Zap,
  Sun,
  Moon,
  Loader2,
  X,
} from 'lucide-react';
import { Notification, User, UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentUser: User | null;
  onSwitchUser: (role: 'OPERATOR' | 'ADMIN' | 'VIEWER') => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onResetDemo: () => void;
  onQuickRunDemo: () => void;
  currentView: string;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onSearchProjectUrl: (url: string) => void;
  onSignOut?: () => void;
  dbType?: string;
  isDiagnosing?: boolean;
  activeInspectedUrl?: string;
  activeAppName?: string;
  onSetActiveApp?: (url: string, name?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onResetDemo,
  onQuickRunDemo,
  currentView,
  onOpenAuth,
  onSearchProjectUrl,
  onSignOut,
  dbType,
  isDiagnosing = false,
  activeInspectedUrl = '',
  activeAppName = '',
  onSetActiveApp,
}) => {
  const { theme, toggleTheme, isWhite } = useTheme();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [headerSearchUrl, setHeaderSearchUrl] = useState('');

  // Sync with searched URL from parent when it changes
  useEffect(() => {
    if (activeInspectedUrl) {
      setHeaderSearchUrl(activeInspectedUrl);
    }
  }, [activeInspectedUrl]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = headerSearchUrl.trim();
    if (query) {
      onSearchProjectUrl(query);
    }
  };

  return (
    <header className={`flex items-center justify-between gap-3 px-4 lg:px-6 py-2.5 border-b sticky top-0 z-40 select-none transition-colors duration-200 ${
      isWhite
        ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
        : 'bg-[#0b0f19] border-slate-800/80 text-slate-100'
    }`}>
      {/* Zone 1: Wordmark & Environment */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#" className="flex items-center gap-2.5 text-base font-bold tracking-tight whitespace-nowrap">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <span className={isWhite ? 'text-slate-900 font-extrabold' : 'text-white'}>FlowPilot AI</span>
        </a>
        <span className={isWhite ? 'text-slate-400 text-xs hidden lg:inline' : 'text-slate-600 text-xs hidden lg:inline'}>/</span>
        <span className={`text-xs font-mono tracking-wide hidden lg:inline ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
          {activeAppName ? 'Monitored Service' : 'prod-core-v2'}
        </span>

        {/* Active Monitored Application Pill */}
        {activeAppName && (
          <div
            title={`Active Monitored Application: ${activeAppName} (${activeInspectedUrl || 'Deployed URL'})`}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono border ${
              isWhite
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-sky-950/70 border-sky-800 text-sky-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="font-semibold truncate max-w-[150px]">{activeAppName}</span>
          </div>
        )}

        {/* Database connectivity badge */}
        <div
          title={dbType || 'MongoDB Atlas / Local Synchronized Document Store'}
          className={`hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
            isWhite
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
          }`}
        >
          <Database className="w-3 h-3 text-emerald-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>{dbType ? dbType.split(' ')[0] : 'MongoDB'}</span>
        </div>
      </div>

      {/* Zone 2: Direct Search Bar for Deployed Project Actual URL */}
      <div className="flex-1 max-w-xl mx-2 hidden sm:block">
        <form onSubmit={handleHeaderSearch} className="relative flex items-center">
          <Globe className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${isWhite ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={headerSearchUrl}
            onChange={(e) => setHeaderSearchUrl(e.target.value)}
            placeholder="Enter any deployed URL to monitor & diagnose (e.g. https://my-app.com or api.myapp.dev)..."
            className={`w-full pl-9 pr-52 py-1.5 rounded-lg text-xs font-mono transition-colors shadow-inner focus:outline-hidden ${
              isWhite
                ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white'
                : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-sky-500'
            }`}
          />
          {headerSearchUrl && (
            <button
              type="button"
              onClick={() => setHeaderSearchUrl('')}
              className={`absolute right-44 p-0.5 rounded hover:bg-slate-700/30 ${isWhite ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {headerSearchUrl.trim() && onSetActiveApp && (
            <button
              type="button"
              onClick={() => onSetActiveApp(headerSearchUrl.trim())}
              disabled={isDiagnosing}
              className="absolute right-24 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="Set as current active application to run dashboard on this URL"
            >
              <span>+ Set App</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isDiagnosing || !headerSearchUrl.trim()}
            className="absolute right-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="Diagnose deployed URL and find workflow bottlenecks"
          >
            {isDiagnosing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                <span>Diagnose</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Mobile Search Toggle */}
      <button
        onClick={() => setShowMobileSearch(!showMobileSearch)}
        className={`sm:hidden p-2 rounded-md border ${
          isWhite
            ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
        }`}
        title="Toggle URL Diagnose Search"
      >
        <Search className="w-4 h-4 text-sky-400" />
      </button>

      {/* Zone 3: Primary Action Controls, Theme Toggle & User Auth */}
      <div className="flex items-center gap-2 shrink-0">
        {/* WHITE / BLACK BACKGROUND CHANGE FEATURE BUTTON */}
        <button
          onClick={toggleTheme}
          title={`Switch background to ${isWhite ? 'Black (Midnight Dark)' : 'White (Clean Light)'}`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs ${
            isWhite
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 hover:border-slate-400'
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
          }`}
          aria-label="Toggle White and Black Background Theme"
        >
          {isWhite ? (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
              <span className="font-semibold text-slate-700 hidden md:inline">Black Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="font-semibold text-slate-200 hidden md:inline">White Mode</span>
            </>
          )}
        </button>

        {/* Quick Demo Run */}
        <button
          onClick={onQuickRunDemo}
          title="Run Order Processing workflow with simulated payment timeout"
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
            isWhite
              ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
              : 'bg-sky-950/60 text-sky-300 border-sky-800/80 hover:bg-sky-900/60'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Incident</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={onResetDemo}
          title="Reset database to initial demo state"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            isWhite
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Reset</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className={`relative p-2 rounded-md border transition-colors ${
              isWhite
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-2xl p-3 z-50 border ${
              isWhite ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0e1424] border-slate-800 text-slate-100'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-semibold">System Notifications</span>
                <span className="text-slate-500 font-mono">{unreadCount} unread</span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-2 rounded text-xs cursor-pointer border ${
                        n.isRead
                          ? isWhite
                            ? 'border-slate-200 bg-slate-50 opacity-60'
                            : 'border-slate-800/40 bg-slate-950/40 opacity-70'
                          : isWhite
                            ? 'border-sky-200 bg-sky-50/50'
                            : 'border-slate-700 bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Sign In / Sign Up Trigger */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                isWhite
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-sky-900 border border-sky-700 flex items-center justify-center text-[10px] font-bold text-sky-200">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-medium max-w-[100px] truncate">{currentUser.name || 'User'}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${
                isWhite ? 'bg-sky-100 text-sky-800' : 'bg-slate-800 text-sky-400'
              }`}>
                {currentUser.role || 'OPERATOR'}
              </span>
            </button>

            {showUserMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-2xl p-2 z-50 text-xs border ${
                isWhite ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0e1424] border-slate-800 text-slate-100'
              }`}>
                <div className={`px-3 py-2 border-b ${isWhite ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <div className="font-semibold truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-slate-500">· MongoDB Synced</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-2 py-1 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                    Quick Role Simulation
                  </div>
                  <button
                    onClick={() => {
                      onSwitchUser('OPERATOR');
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                      currentUser.role === 'OPERATOR'
                        ? isWhite ? 'bg-sky-50 text-sky-800' : 'bg-sky-950/50 text-sky-300'
                        : isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Sarah Chen</div>
                      <div className="text-[10px] text-slate-500">Operator (Approve & Recover)</div>
                    </div>
                    {currentUser.role === 'OPERATOR' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUser('ADMIN');
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                      currentUser.role === 'ADMIN'
                        ? isWhite ? 'bg-sky-50 text-sky-800' : 'bg-sky-950/50 text-sky-300'
                        : isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Marcus Vance</div>
                      <div className="text-[10px] text-slate-500">Admin (Full Control)</div>
                    </div>
                    {currentUser.role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUser('VIEWER');
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                      currentUser.role === 'VIEWER'
                        ? isWhite ? 'bg-sky-50 text-sky-800' : 'bg-sky-950/50 text-sky-300'
                        : isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Elena Rostova</div>
                      <div className="text-[10px] text-slate-500">Viewer (Read-Only)</div>
                    </div>
                    {currentUser.role === 'VIEWER' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                </div>

                <div className={`pt-1 border-t space-y-1 ${isWhite ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  {/* Theme Switcher in User Menu */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                      isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isWhite ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{isWhite ? 'Switch to Black Mode' : 'Switch to White Mode'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isWhite ? 'White' : 'Black'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth('login');
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors ${
                      isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-sky-400" />
                    <span>Switch / Sign In Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth('signup');
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors ${
                      isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Create New FlowPilot Account</span>
                  </button>

                  {onSignOut && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenAuth('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isWhite
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile search bar expansion */}
      {showMobileSearch && (
        <div className="absolute top-full left-0 right-0 p-3 bg-[#0b0f19] border-b border-slate-800 sm:hidden z-50">
          <form onSubmit={handleHeaderSearch} className="flex gap-2">
            <input
              type="text"
              value={headerSearchUrl}
              onChange={(e) => setHeaderSearchUrl(e.target.value)}
              placeholder="Deployed URL to diagnose..."
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Diagnose</span>
            </button>
          </form>
        </div>
      )}
    </header>
  );
};
