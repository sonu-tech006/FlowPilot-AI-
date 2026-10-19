import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Sparkles,
  Globe,
} from 'lucide-react';
import { api } from '../api/client';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [workspaceName, setWorkspaceName] = useState('Production Workflows');
  const [appUrl, setAppUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      api.getDbHealth().then(setDbStatus).catch(() => null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email) throw new Error('Please enter your email address');
        const res = await api.login(email.trim(), password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter a valid email address');
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const res = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          workspaceName: workspaceName.trim(),
          appUrl: appUrl.trim(),
          appName: appName.trim(),
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string = 'password123') => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPassword);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0e1424] border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">FlowPilot AI Authentication</h2>
              <p className="text-[11px] text-slate-400">Reliability Observability & Incident Response</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-md transition-all ${
              mode === 'login'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-md transition-all ${
              mode === 'signup'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 mb-3 p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-5 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Password {mode === 'signup' && <span className="text-slate-500">(min 6 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Your Application URL to Monitor <span className="text-slate-500">(Optional / Can set later)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="e.g. https://my-saas-platform.com or api.myapp.dev"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Application Name <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. My SaaS Platform"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/60 text-[11px] text-sky-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-semibold text-white">Private Account Isolation:</span> Your details, application URL, and workflow metrics will only be visible in your account.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Workspace Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['OPERATOR', 'ADMIN', 'VIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-2 rounded border text-[11px] font-medium text-center transition-all ${
                        role === r
                          ? 'border-sky-500 bg-sky-950/60 text-sky-300 shadow-xs'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>{r}</div>
                      <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                        {r === 'OPERATOR' ? 'Run & Approve' : r === 'ADMIN' ? 'Full Control' : 'Read-Only'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to FlowPilot' : 'Complete Registration'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Demo Logins */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              1-Click Demo Profiles
            </span>
            <span className="text-[10px] text-slate-500">Instant test login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('sarah.chen@flowpilot.internal')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <div className="text-[11px] font-semibold text-slate-200 truncate">Sarah Chen</div>
              <div className="text-[10px] text-sky-400 font-mono">OPERATOR</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('marcus.vance@flowpilot.internal')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <div className="text-[11px] font-semibold text-slate-200 truncate">Marcus Vance</div>
              <div className="text-[10px] text-indigo-400 font-mono">ADMIN</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('elena.rostova@flowpilot.internal')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <div className="text-[11px] font-semibold text-slate-200 truncate">Elena Rostova</div>
              <div className="text-[10px] text-emerald-400 font-mono">VIEWER</div>
            </button>
          </div>
        </div>

        {/* MongoDB Status Footer */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Database:</span>
            <span className="text-slate-400 font-mono text-[10px]">
              {dbStatus?.databaseType || 'MongoDB Atlas / Local (Synchronized)'}
            </span>
          </div>
          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
};
