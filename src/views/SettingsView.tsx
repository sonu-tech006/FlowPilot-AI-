import React from 'react';
import { Settings, Database, Cpu, Sparkles, RotateCcw, CheckCircle2, ShieldCheck, Sun, Moon, Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SettingsViewProps {
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetDemo }) => {
  const { theme, setTheme, toggleTheme, isWhite } = useTheme();

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
        <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>MongoDB Document Storage</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
              CONNECTED
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Authoritative persistent data store with Mongoose schemas for workflows, executions, incidents, investigations, and audit logs.
          </p>
          <div className="bg-[#090d16] p-2.5 rounded font-mono text-[11px] text-slate-400 space-y-1">
            <div>Engine: Mongoose Document Engine</div>
            <div>Storage Path: .flowpilot-data/db.json</div>
            <div>Collections: 20 active collections</div>
          </div>
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
