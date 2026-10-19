import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Table,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Incident, SlaPolicy } from '../types';
import {
  exportReliabilityMetricsCSV,
  exportIncidentsCSV,
  exportExecutiveReliabilityPDF,
} from '../utils/reportExport';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: any;
  incidents: Incident[];
  slaPolicies: SlaPolicy[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  incidents,
  slaPolicies,
}) => {
  const [reportType, setReportType] = useState<'EXECUTIVE' | 'INCIDENTS' | 'METRICS_RAW'>('EXECUTIVE');
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (format === 'PDF') {
        exportExecutiveReliabilityPDF(metrics, incidents, slaPolicies);
      } else {
        if (reportType === 'INCIDENTS') {
          exportIncidentsCSV(incidents);
        } else {
          exportReliabilityMetricsCSV(metrics, slaPolicies);
        }
      }
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#0b101d] border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 text-xs text-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-400" />
              <span>Export Reliability & Incident Reports</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generate formatted executive summary reports for SRE audits, compliance, or spreadsheet analytics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Scope Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-300 block">Report Content Scope</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setReportType('EXECUTIVE')}
              className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                reportType === 'EXECUTIVE'
                  ? 'bg-sky-950/40 border-sky-500/80 text-white'
                  : 'bg-[#0e1424] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs">Executive Reliability & SLA Summary</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Combines high-level operational KPIs, SLA availability compliance, and active incident hypotheses.
                </div>
              </div>
            </button>

            <button
              onClick={() => setReportType('INCIDENTS')}
              className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                reportType === 'INCIDENTS'
                  ? 'bg-sky-950/40 border-sky-500/80 text-white'
                  : 'bg-[#0e1424] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <Table className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs">Incident Audit & Root-Cause Register</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Full historical table of incidents, ML failure classifications, and resolution notes ({incidents.length} records).
                </div>
              </div>
            </button>

            <button
              onClick={() => setReportType('METRICS_RAW')}
              className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                reportType === 'METRICS_RAW'
                  ? 'bg-sky-950/40 border-sky-500/80 text-white'
                  : 'bg-[#0e1424] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs">Operational Metrics Raw Dataset</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Key performance numbers (MTTR, MTTD, success rates, P95/P99 latency values, and SLA budgets).
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-300 block">Export Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('PDF')}
              className={`p-3 rounded-lg border text-center transition-colors flex flex-col items-center gap-1.5 ${
                format === 'PDF'
                  ? 'bg-sky-950/50 border-sky-500 text-white font-medium'
                  : 'bg-[#0e1424] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>PDF Executive Document (.pdf)</span>
              <span className="text-[10px] text-slate-500">Printable A4 with header & tables</span>
            </button>

            <button
              onClick={() => setFormat('CSV')}
              className={`p-3 rounded-lg border text-center transition-colors flex flex-col items-center gap-1.5 ${
                format === 'CSV'
                  ? 'bg-sky-950/50 border-sky-500 text-white font-medium'
                  : 'bg-[#0e1424] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <span>CSV Spreadsheet (.csv)</span>
              <span className="text-[10px] text-slate-500">Excel / Google Sheets compatible</span>
            </button>
          </div>
        </div>

        {/* Data summary preview */}
        <div className="bg-[#090d16] p-3 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-1">
          <div className="text-slate-300 font-semibold">Included Dataset:</div>
          <div>• Operational Metrics: MTTR ({metrics?.mttrMinutes || 4.8}m), MTTD ({metrics?.mttdMinutes || 1.1}m), SLA ({metrics?.slaCompliance || 99.88}%)</div>
          <div>• Incidents Included: {incidents.length} recorded incidents</div>
          <div>• SLA Policies: {slaPolicies.length} monitored workflows</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium shadow-xs transition-colors disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Downloaded Successfully</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate & Download {format}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
