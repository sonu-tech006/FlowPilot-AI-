import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Layers,
  ShieldAlert,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  BarChart2,
  Copy,
  Check,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectUrlInspection } from '../types';

interface ProjectUrlLagInspectorProps {
  onAttachToCircuitBreaker?: (dep: any) => void;
  onSelectView?: (view: string) => void;
  compact?: boolean;
  activeInspection?: ProjectUrlInspection | null;
  activeInspectedUrl?: string;
  isDiagnosing?: boolean;
  activeAppName?: string;
  onSetActiveApp?: (url: string, name?: string) => void;
}

export const ProjectUrlLagInspector: React.FC<ProjectUrlLagInspectorProps> = ({
  onAttachToCircuitBreaker,
  onSelectView,
  compact = false,
  activeInspection = null,
  activeInspectedUrl = '',
  isDiagnosing = false,
  activeAppName,
  onSetActiveApp,
}) => {
  const [urlInput, setUrlInput] = useState(activeInspectedUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInspection, setCurrentInspection] = useState<ProjectUrlInspection | null>(activeInspection || null);
  const [inspectedHistory, setInspectedHistory] = useState<ProjectUrlInspection[]>([]);
  const [copied, setCopied] = useState(false);
  const [monitorSuccess, setMonitorSuccess] = useState<string | null>(null);

  // Sync when activeInspection or activeInspectedUrl changes from parent (e.g. Header diagnose)
  useEffect(() => {
    if (activeInspection) {
      setCurrentInspection(activeInspection);
      setUrlInput(activeInspection.url);
      setError(null);
    }
  }, [activeInspection]);

  useEffect(() => {
    if (activeInspectedUrl && !activeInspection) {
      setUrlInput(activeInspectedUrl);
    }
  }, [activeInspectedUrl, activeInspection]);

  // Suggested preset URLs
  const samplePresets = [
    {
      name: 'Current Applet (Cloud Run)',
      url: window.location.origin || 'https://ais-dev-agv4zcozzzqfe5l4k7eo2n-653508992034.asia-southeast1.run.app',
      label: 'Live Runtime',
    },
    {
      name: 'E-Commerce Checkout API',
      url: 'https://api.acmestore.internal/checkout/v2',
      label: 'High Latency Lag',
    },
    {
      name: 'Stripe Payment Gateway',
      url: 'https://payment.stripe-bridge.internal/v1/charge',
      label: 'Critical Timeout',
    },
    {
      name: 'Snowflake ETL Pipeline',
      url: 'https://warehouse.snowflake.internal/etl/batch',
      label: 'Batch Sink',
    },
  ];

  // Load inspection history on mount if no active inspection
  useEffect(() => {
    api
      .getInspectedUrls()
      .then((res) => {
        if (res.inspectedProjects && res.inspectedProjects.length > 0) {
          setInspectedHistory(res.inspectedProjects);
          if (!activeInspection) {
            setCurrentInspection(res.inspectedProjects[0]);
            setUrlInput(res.inspectedProjects[0].url);
          }
        }
      })
      .catch(() => null);
  }, []);

  const handleInspect = async (targetUrl?: string) => {
    const raw = targetUrl || urlInput;
    if (!raw.trim()) {
      setError('Please enter a deployed project URL');
      return;
    }

    setError(null);
    setLoading(true);
    setMonitorSuccess(null);

    try {
      const res = await api.inspectUrl(raw.trim());
      if (res.inspection) {
        setCurrentInspection(res.inspection);
        setUrlInput(res.inspection.url);
        // Refresh history
        api.getInspectedUrls().then((h) => {
          if (h.inspectedProjects) setInspectedHistory(h.inspectedProjects);
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to inspect deployed project URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleMonitorInCircuitBreaker = async () => {
    if (!currentInspection) return;
    try {
      const res = await api.monitorInspectedUrl(
        currentInspection.url,
        `Deployed: ${currentInspection.hostname}`
      );
      setMonitorSuccess(`Successfully registered ${currentInspection.hostname} into Circuit Breaker monitor!`);
      if (onAttachToCircuitBreaker && res.dependency) {
        onAttachToCircuitBreaker(res.dependency);
      }
      setTimeout(() => setMonitorSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Could not add to circuit breaker monitor.');
    }
  };

  const copyDiagnosticSummary = () => {
    if (!currentInspection) return;
    const summary = `FlowPilot URL Lag Diagnostic:
URL: ${currentInspection.url}
Status: ${currentInspection.status} ${currentInspection.statusText}
Total Latency: ${currentInspection.totalLatencyMs}ms (Lagging: ${currentInspection.isLagging ? 'YES' : 'NO'})
Lagging Phase: ${currentInspection.laggingPhase} (${currentInspection.laggingSeverity})
TTFB: ${currentInspection.ttfbMs}ms | DNS: ${currentInspection.dnsTimeMs}ms | Handshake: ${currentInspection.tcpTimeMs}ms
Bottleneck: ${currentInspection.bottleneckSummary}
Inspected: ${new Date(currentInspection.inspectedAt).toLocaleString()}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate percentages for waterfall bars
  const total = Math.max(currentInspection?.totalLatencyMs || 100, 1);
  const dnsPct = Math.max(3, Math.min(90, Math.round(((currentInspection?.dnsTimeMs || 0) / total) * 100)));
  const tcpPct = Math.max(4, Math.min(90, Math.round(((currentInspection?.tcpTimeMs || 0) / total) * 100)));
  const ttfbPct = Math.max(10, Math.min(95, Math.round(((currentInspection?.ttfbMs || 0) / total) * 100)));
  const dlPct = Math.max(3, Math.min(90, Math.round(((currentInspection?.downloadTimeMs || 0) / total) * 100)));

  const isCurrentlyLoading = loading || isDiagnosing;

  return (
    <div
      id="workflow-lag-inspector"
      className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100 scroll-mt-20 transition-all duration-300"
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800/80 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Deployed Project URL Search & Workflow Lag Diagnostic
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
                Live Probe
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Directly lookup any deployed URL to profile latency bottlenecks and identify where the workflow pipeline is lagging.
            </p>
          </div>
        </div>

        {currentInspection && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyDiagnosticSummary}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
              title="Copy diagnostic text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>
            <button
              onClick={() => handleInspect()}
              disabled={isCurrentlyLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sky-300 bg-sky-950 hover:bg-sky-900 border border-sky-800 rounded-md transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isCurrentlyLoading ? 'animate-spin' : ''}`} />
              <span>Re-Test</span>
            </button>
          </div>
        )}
      </div>

      {/* Prominent Search Bar Input */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInspect();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste or type deployed project actual URL (e.g. acmestore.internal, or https://...)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 transition-colors shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isCurrentlyLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {isCurrentlyLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Diagnosing Pipeline Lag...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Search & Diagnose Lag</span>
              </>
            )}
          </button>

          {onSetActiveApp && (
            <button
              type="button"
              onClick={() => {
                if (urlInput.trim()) {
                  onSetActiveApp(urlInput.trim());
                  setMonitorSuccess(`Configured ${urlInput.trim()} as current active application. Dashboard is now running for this app!`);
                }
              }}
              disabled={isCurrentlyLoading || !urlInput.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
              title="Set this URL as the active application to run all dashboard workflows on it"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Set as Active App</span>
            </button>
          )}
        </form>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Presets:</span>
          {samplePresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setUrlInput(preset.url);
                handleInspect(preset.url);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>{preset.name}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {preset.label}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {monitorSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{monitorSuccess}</span>
          </div>
        )}
      </div>

      {/* Main Inspection Results View */}
      {currentInspection ? (
        <div className="p-5 space-y-5">
          {/* Executive Verdict Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              currentInspection.laggingSeverity === 'CRITICAL'
                ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                : currentInspection.laggingSeverity === 'WARNING'
                ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  currentInspection.laggingSeverity === 'CRITICAL'
                    ? 'bg-rose-900/60 text-rose-400'
                    : currentInspection.laggingSeverity === 'WARNING'
                    ? 'bg-amber-900/60 text-amber-400'
                    : 'bg-emerald-900/60 text-emerald-400'
                }`}
              >
                {currentInspection.laggingSeverity === 'CRITICAL' ? (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                ) : currentInspection.laggingSeverity === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">
                    {currentInspection.laggingSeverity === 'CRITICAL'
                      ? 'CRITICAL PIPELINE LAG DETECTED'
                      : currentInspection.laggingSeverity === 'WARNING'
                      ? 'MODERATE PIPELINE LAG'
                      : 'OPTIMAL SLA COMPLIANCE'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current">
                    HTTP {currentInspection.status} {currentInspection.statusText}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current">
                    Phase: {currentInspection.laggingPhase}
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-300 font-medium">
                  {currentInspection.bottleneckSummary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Latency</div>
                <div className="text-2xl font-extrabold tracking-tight">
                  {currentInspection.totalLatencyMs}
                  <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Server TTFB</div>
                <div className="text-2xl font-extrabold tracking-tight text-sky-400">
                  {currentInspection.ttfbMs}
                  <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Active App Banner Action */}
          {onSetActiveApp && currentInspection && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/80 rounded-xl text-xs gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-900/60 border border-sky-700 flex items-center justify-center text-sky-400 shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-slate-200">
                    Inspected Application: <strong className="font-mono text-white">{currentInspection.url}</strong>
                    {activeAppName && <span className="ml-2 text-sky-300 font-semibold">({activeAppName})</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Click to switch your entire FlowPilot workspace to run and report on this application URL instead of default e-commerce data.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSetActiveApp(currentInspection.url);
                  setMonitorSuccess(`Set ${currentInspection.url} as active application! Pipelines are now generated for this app.`);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Run Dashboard On This Application URL</span>
              </button>
            </div>
          )}

          {/* Section: Stage-by-Stage Latency Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>1. DNS Lookup</span>
                <span className="font-mono text-[10px]">{dnsPct}% of total</span>
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {currentInspection.dnsTimeMs} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    currentInspection.dnsTimeMs > 120 ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${dnsPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {currentInspection.dnsTimeMs > 120 ? '⚠️ High DNS lag' : '✓ Nominal resolution'}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>2. TCP / TLS Handshake</span>
                <span className="font-mono text-[10px]">{tcpPct}% of total</span>
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {currentInspection.tcpTimeMs} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    currentInspection.tcpTimeMs > 150 ? 'bg-amber-400' : 'bg-indigo-400'
                  }`}
                  style={{ width: `${tcpPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {currentInspection.tcpTimeMs > 150 ? '⚠️ Slow TLS negotiation' : '✓ Standard cipher neg'}
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                currentInspection.ttfbMs > 800
                  ? 'bg-rose-950/20 border-rose-800/60'
                  : currentInspection.ttfbMs > 400
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">3. Server TTFB Execution</span>
                <span className="font-mono text-[10px] font-bold text-sky-400">{ttfbPct}% of total</span>
              </div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  currentInspection.ttfbMs > 800
                    ? 'text-rose-400'
                    : currentInspection.ttfbMs > 400
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {currentInspection.ttfbMs} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    currentInspection.ttfbMs > 800
                      ? 'bg-rose-500 animate-pulse'
                      : currentInspection.ttfbMs > 400
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${ttfbPct}%` }}
                />
              </div>
              <div className="text-[10px] text-rose-400 mt-1 font-mono font-medium">
                {currentInspection.ttfbMs > 600
                  ? '🔥 PRIMARY BOTTLENECK'
                  : '✓ Low backend latency'}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>4. Transfer / Download</span>
                <span className="font-mono text-[10px]">{dlPct}% of total</span>
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {currentInspection.downloadTimeMs} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-teal-400" style={{ width: `${dlPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {(currentInspection.contentLengthBytes / 1024).toFixed(1)} KB payload
              </div>
            </div>
          </div>

          {/* Section: "WHERE IT IS LAGGING" Workflow Pipeline Breakdown */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Project Workflow Breakdown: Where It Is Lagging
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Target SLA: 500ms · Measured: {currentInspection.totalLatencyMs}ms
              </span>
            </div>

            {/* Visual Workflow Steps with Lagging Highlights */}
            <div className="space-y-2 mt-2">
              {/* Step 1 */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono text-[11px] font-bold">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Ingress Gateway & Edge Routing</span>
                    <span className="text-[11px] text-slate-500 block">Cloud Run edge proxy, TLS termination</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{currentInspection.dnsTimeMs + currentInspection.tcpTimeMs}ms</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                    NOMINAL
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono text-[11px] font-bold">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Authentication & Header Validation</span>
                    <span className="text-[11px] text-slate-500 block">Bearer token verification, rate limit check</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">18ms</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                    NOMINAL
                  </span>
                </div>
              </div>

              {/* Step 3 - THE BOTTLENECK / LAGGING STEP */}
              <div
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  currentInspection.isLagging
                    ? 'bg-rose-950/40 border-rose-800/80'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                      currentInspection.isLagging
                        ? 'bg-rose-900 text-rose-200 animate-pulse'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        Downstream Execution & External API Handlers
                      </span>
                      {currentInspection.isLagging && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                          🔥 LAGGING BOTTLENECK
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-300 block mt-0.5">
                      {currentInspection.isLagging
                        ? `Execution lagged by +${Math.max(0, currentInspection.ttfbMs - 200)}ms due to upstream external API delays or un-indexed database lock.`
                        : 'Downstream handler processed requests within normal execution limits.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        currentInspection.isLagging ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {currentInspection.ttfbMs}ms
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {ttfbPct}% total
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded font-bold ${
                      currentInspection.isLagging
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {currentInspection.isLagging ? 'CRITICAL LAG' : 'OPTIMAL'}
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono text-[11px] font-bold">
                    4
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Response Serialization & JSON Serialization</span>
                    <span className="text-[11px] text-slate-500 block">Compression, chunking, and final delivery</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{currentInspection.downloadTimeMs}ms</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                    NOMINAL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              SRE & Reliability Mitigation Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {currentInspection.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-md text-xs text-slate-300 flex items-start gap-2"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspected {new Date(currentInspection.inspectedAt).toLocaleTimeString()}</span>
              <span>·</span>
              <span className="font-mono text-slate-400">{currentInspection.hostname}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMonitorInCircuitBreaker}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Add to Circuit Breaker Monitor</span>
              </button>
              {onSelectView && (
                <button
                  onClick={() => onSelectView('dependencies')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors"
                >
                  <span>View Dependency Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs">
          Paste any deployed project URL above to profile live performance and see where your workflow is lagging.
        </div>
      )}

      {/* History of Past Inspections */}
      {inspectedHistory.length > 1 && (
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-medium text-[11px] text-slate-300">Recent Inspected URLs</span>
            <span className="text-[10px] text-slate-500 font-mono">{inspectedHistory.length} tracked</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {inspectedHistory.slice(0, 5).map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setCurrentInspection(h);
                  setUrlInput(h.url);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono border flex items-center gap-2 transition-colors ${
                  currentInspection?.id === h.id
                    ? 'bg-sky-950 text-sky-200 border-sky-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="truncate max-w-[180px]">{h.hostname}</span>
                <span
                  className={`text-[9px] px-1 rounded ${
                    h.isLagging ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {h.totalLatencyMs}ms
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
