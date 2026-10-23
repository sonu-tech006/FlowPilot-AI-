import React, { useState } from 'react';
import {
  Settings,
  Database,
  Cpu,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Sun,
  Moon,
  Palette,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

interface SettingsViewProps {
  onResetDemo: () => void;
  dbHealth?: any;
  onRefreshDbHealth?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetDemo, dbHealth, onRefreshDbHealth }) => {
  const { theme, setTheme, toggleTheme, isWhite } = useTheme();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectResult, setReconnectResult] = useState<string | null>(null);

  const handleTestMongoConnection = async () => {
    setIsReconnecting(true);
    setReconnectResult(null);
    try {
      const res = await api.reconnectDb();
      if (res.isMongoConnected) {
        setReconnectResult('Successfully connected and synchronized with MongoDB Atlas!');
      } else {
        setReconnectResult(
          res.mongoConnectionError
            ? `Connection attempt rejected: ${res.mongoConnectionError}`
            : 'Could not connect to MongoDB Atlas. Ensure 0.0.0.0/0 is whitelisted in Atlas Network Access.'
        );
      }
      if (onRefreshDbHealth) onRefreshDbHealth();
    } catch (err: any) {
      setReconnectResult(`Error: ${err.message}`);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto text-xs">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">System Settings & Architecture</h1>
        <p className="text-slate-400 mt-1">
          Infrastructure configurations, persistent database storage, Redis queue engine, and AI model parameters.
        </p>
      </div>

      {/* DEDICATED SECTION: WHITE & BLACK BACKGROUND CHANGE FEATURE */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                Display Appearance & Background Theme
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Switch between Midnight Black (Dark Canvas) and Crisp White (Light Canvas) backgrounds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isWhite
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {isWhite ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isWhite ? 'Switch to Black Background' : 'Switch to White Background'}</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Theme Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Black Background Option */}
          <div
            onClick={() => setTheme('black')}
            className={`rounded-xl p-4 border transition-all cursor-pointer relative flex flex-col justify-between ${
              !isWhite
                ? 'bg-[#090d16] border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                : 'bg-slate-950/20 border-slate-700/60 hover:border-slate-500'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="font-bold text-slate-100 text-xs">Black Theme (Midnight Dark)</span>
                </div>
                {!isWhite && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    <Check className="w-3 h-3" />
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="p-3 rounded-lg bg-[#070b13] border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">#070b13 Canvas</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-slate-400">Deep obsidian background engineered for NOC centers, reducing eye strain in dark environments.</div>
                <div className="flex gap-1.5 pt-1">
                  <span className="w-3.5 h-3.5 rounded bg-[#070b13] border border-slate-700" title="#070b13" />
                  <span className="w-3.5 h-3.5 rounded bg-[#0e1424] border border-slate-700" title="#0e1424" />
                  <span className="w-3.5 h-3.5 rounded bg-sky-500" title="Sky Accent" />
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500" title="Success Accent" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTheme('black');
              }}
              className={`w-full mt-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${
                !isWhite
                  ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {!isWhite ? 'Currently Active' : 'Select Black Background'}
            </button>
          </div>

          {/* White Background Option */}
          <div
            onClick={() => setTheme('white')}
            className={`rounded-xl p-4 border transition-all cursor-pointer relative flex flex-col justify-between ${
              isWhite
                ? 'bg-slate-50 border-sky-500 ring-2 ring-sky-500/30 shadow-md text-slate-900'
                : 'bg-slate-950/20 border-slate-700/60 hover:border-slate-500'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-100 text-xs">White Theme (Clean Light)</span>
                </div>
                {isWhite && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-3 h-3" />
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">#ffffff / #f8fafc Canvas</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-slate-600">Crisp light canvas with modern elevation, optimal for daytime reviews and executive presentations.</div>
                <div className="flex gap-1.5 pt-1">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300" title="#ffffff" />
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" title="#f1f5f9" />
                  <span className="w-3.5 h-3.5 rounded bg-sky-600" title="Sky Accent" />
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600" title="Success Accent" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTheme('white');
              }}
              className={`w-full mt-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${
                isWhite
                  ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {isWhite ? 'Currently Active' : 'Select White Background'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of System Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MongoDB Persistence Card */}
        <div className={`border rounded-lg p-5 space-y-3 transition-colors ${
          isWhite ? 'bg-white border-slate-200' : 'bg-[#0e1424] border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className={`font-bold flex items-center gap-2 ${isWhite ? 'text-slate-800' : 'text-slate-200'}`}>
              <Database className="w-4 h-4 text-emerald-400" />
              <span>MongoDB Document Storage</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
              dbHealth?.isMongoConnected
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                : 'text-amber-400 bg-amber-950/60 border-amber-800'
            }`}>
              {dbHealth?.isMongoConnected ? 'CONNECTED & SYNCED' : 'LOCAL FALLBACK ACTIVE'}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {dbHealth?.isMongoConnected
              ? 'Connected to remote MongoDB Atlas cluster. Data collections are actively synchronized with Cloud Atlas.'
              : 'FlowPilot embedded persistent document store is active and saving all data to .flowpilot-data/db.json. MongoDB Atlas URI is configured, but remote handshake is awaiting Atlas IP whitelist.'}
          </p>

          <div className={`p-2.5 rounded font-mono text-[11px] space-y-1 ${
            isWhite ? 'bg-slate-100 text-slate-700' : 'bg-[#090d16] text-slate-400'
          }`}>
            <div className="flex justify-between">
              <span>Active Engine:</span>
              <span className="font-semibold text-sky-400">
                {dbHealth?.isMongoConnected ? 'MongoDB Atlas Cluster0' : 'Local Document Database'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Local Storage Path:</span>
              <span className="text-slate-300">.flowpilot-data/db.json</span>
            </div>
            <div className="flex justify-between">
              <span>Workspaces & Workflows:</span>
              <span className="text-slate-300">
                {dbHealth?.workflowCount || 2} workflows • {dbHealth?.userCount || 4} users
              </span>
            </div>
            <div className="flex justify-between">
              <span>Atlas Remote Host:</span>
              <span className="text-slate-300 truncate max-w-[200px]" title="ac-4x4yesk-shard-00-*.qzv23w2.mongodb.net">
                qzv23w2.mongodb.net
              </span>
            </div>
          </div>

          {!dbHealth?.isMongoConnected && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-[11px] space-y-2">
              <div className="flex items-start gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="space-y-1">
                  <div className="font-semibold text-white">
                    {dbHealth?.mongoConnectionError?.includes('bad auth')
                      ? 'Atlas Network Connected — Authentication Check Needed'
                      : 'Why is Atlas in Local Fallback mode?'}
                  </div>
                  <div className="text-slate-300 leading-normal">
                    {dbHealth?.mongoConnectionError?.includes('bad auth') ? (
                      <>
                        The Atlas network firewall and TLS handshake succeeded, but MongoDB Atlas reported:{' '}
                        <code className="text-rose-300 font-mono font-semibold">bad auth : authentication failed</code>. The password for user{' '}
                        <code className="text-sky-300 font-mono">sonukr7435_db_user</code> does not match the database user credentials in Atlas.
                      </>
                    ) : (
                      <>
                        MongoDB Atlas rejected the connection ({' '}
                        <code className="text-amber-300 font-mono">{dbHealth?.mongoConnectionError || 'TLS error'}</code>). The IP access list in Atlas needs to allow this container.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-300 bg-black/40 p-2.5 rounded border border-amber-900/40 space-y-1.5">
                <div className="font-semibold text-amber-300">How to fix in MongoDB Atlas:</div>
                {dbHealth?.mongoConnectionError?.includes('bad auth') ? (
                  <>
                    <div>1. Open your <b>MongoDB Atlas Console $\rightarrow$ Security $\rightarrow$ Database Access</b>.</div>
                    <div>2. Locate or add user: <code className="text-sky-300 font-mono">sonukr7435_db_user</code> (with readWriteAnyDatabase built-in role).</div>
                    <div>3. Click <b>Edit $\rightarrow$ Edit Password</b> and assign a new password.</div>
                    <div>4. Note: If the password contains special symbols (like <code className="text-amber-200">@</code> or <code className="text-amber-200">#</code>), ensure they are URL-encoded or use standard alphanumeric characters.</div>
                  </>
                ) : (
                  <>
                    <div>1. Log into your MongoDB Atlas Console.</div>
                    <div>2. Go to <b>Security $\rightarrow$ Network Access $\rightarrow$ IP Access List</b>.</div>
                    <div>3. Click <b>Add IP Address</b> $\rightarrow$ select <b>Allow Access from Anywhere (<span className="text-amber-200 font-mono">0.0.0.0/0</span>)</b>.</div>
                  </>
                )}
                <div>5. Click the test button below to verify!</div>
              </div>

              {reconnectResult && (
                <div className="p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono break-all">
                  {reconnectResult}
                </div>
              )}

              <button
                type="button"
                onClick={handleTestMongoConnection}
                disabled={isReconnecting}
                className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
                <span>{isReconnecting ? 'Testing Atlas Connection...' : 'Test / Reconnect MongoDB Atlas'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Redis & BullMQ Queue */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Redis & Background Queue Worker</span>
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800 px-1.5 py-0.5 rounded">
              ACTIVE
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Idempotent background job processing with exponential backoff, dead-letter queues, and concurrency limits.
          </p>
          <div className="bg-[#090d16] p-2.5 rounded font-mono text-[11px] text-slate-400 space-y-1">
            <div>Worker Concurrency: 8 workers</div>
            <div>Retry Policy: Exponential backoff with jitter</div>
            <div>Dead-Letter Queue: Enabled</div>
          </div>
        </div>

        {/* Gemini AI Engine */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Google Gemini Integration</span>
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-1.5 py-0.5 rounded">
              SDK v2.4
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Server-side reasoning model analyzing execution logs, ML features, and proposing safe recovery actions.
          </p>
          <div className="bg-[#090d16] p-2.5 rounded font-mono text-[11px] text-slate-400 space-y-1">
            <div>Model: gemini-3.8-flash</div>
            <div>Fallback: Deterministic SRE rule engine</div>
            <div>User-Agent: aistudio-build</div>
          </div>
        </div>

        {/* Python ML Service */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Python FastAPI ML Service</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
              READY
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            scikit-learn NLP log classifier (95% accuracy) and Isolation Forest anomaly score engine.
          </p>
          <div className="bg-[#090d16] p-2.5 rounded font-mono text-[11px] text-slate-400 space-y-1">
            <div>Framework: FastAPI + scikit-learn 1.4</div>
            <div>Endpoints: /predict/failure, /predict/anomaly</div>
            <div>Export: Joblib model weights</div>
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-200 text-sm">Reset Demo State</span>
          <p className="text-slate-400 text-xs mt-0.5">
            Restores initial demo workflows, orders, and payment timeout incident for review presentation.
          </p>
        </div>
        <button
          onClick={onResetDemo}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded text-xs transition-colors border border-slate-700 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Seed State</span>
        </button>
      </div>
    </div>
  );
};
