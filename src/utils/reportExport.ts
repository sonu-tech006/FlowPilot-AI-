import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident, SlaPolicy } from '../types';

export function exportReliabilityMetricsCSV(metrics: any, slaPolicies: SlaPolicy[]): void {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toISOString().split('T')[0];

  const lines: string[] = [];
  lines.push('FlowPilot AI — System Reliability & Operational Metrics Report');
  lines.push(`Generated At,${timestamp}`);
  lines.push(`Workspace,Production Core Workflows (ws-prod-01)`);
  lines.push('');

  // Section 1: Key Operational Metrics
  lines.push('=== KEY OPERATIONAL METRICS ===');
  lines.push('Metric,Value,Unit / Status');
  lines.push(`Total Workflows,${metrics?.totalWorkflows ?? 0},pipelines`);
  lines.push(`Active Workflows,${metrics?.activeWorkflows ?? 0},active`);
  lines.push(`Executions Today,${metrics?.executionsToday ?? 0},runs`);
  lines.push(`Successful Executions,${metrics?.successfulExecutions ?? 0},runs`);
  lines.push(`Failed Executions,${metrics?.failedExecutions ?? 0},runs`);
  lines.push(`Success Rate,${metrics?.successRate ?? 100},%`);
  lines.push(`Active Incidents,${metrics?.activeIncidents ?? 0},open`);
  lines.push(`Critical Incidents,${metrics?.criticalIncidents ?? 0},critical`);
  lines.push(`Pending Recovery Approvals,${metrics?.pendingApprovals ?? 0},pending`);
  lines.push(`Mean Time to Detect (MTTD),${metrics?.mttdMinutes ?? 1.1},minutes`);
  lines.push(`Mean Time to Recover (MTTR),${metrics?.mttrMinutes ?? 4.8},minutes`);
  lines.push(`Average Execution Duration,${metrics?.avgExecutionDurationMs ?? 3820},ms`);
  lines.push(`Recovery Success Rate,${metrics?.recoverySuccessRate ?? 100},%`);
  lines.push(`Overall SLA Compliance,${metrics?.slaCompliance ?? 99.88},%`);
  lines.push('');

  // Section 2: SLA Policy Details
  lines.push('=== SLA POLICIES & ERROR BUDGETS ===');
  lines.push('Workflow,Target Availability (%),Current Availability (%),P95 Duration (ms),Error Budget (min),Burned Budget (min),Breach Count');
  slaPolicies.forEach((sla) => {
    lines.push(
      `"${sla.workflowName}",${sla.targetAvailabilityPercent},${sla.currentAvailabilityPercent},${sla.p95DurationMs},${sla.errorBudgetMinutes},${sla.errorBudgetBurnedMinutes},${sla.breachCount}`
    );
  });

  const csvContent = lines.join('\n');
  downloadBlob(csvContent, `flowpilot-reliability-metrics-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportIncidentsCSV(incidents: Incident[]): void {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toISOString().split('T')[0];

  const lines: string[] = [];
  lines.push('FlowPilot AI — Incident Summary & Root-Cause Audit Report');
  lines.push(`Generated At,${timestamp}`);
  lines.push(`Total Incidents,${incidents.length}`);
  lines.push('');

  lines.push('Incident ID,Workflow Name,Failed Step,Severity,Error Category,Dependency,Status,Occurrences,Created At,Root Cause Hypothesis,Resolution Notes');

  incidents.forEach((inc) => {
    const cleanHypothesis = (inc.rootCauseHypothesis || '').replace(/"/g, '""');
    const cleanNotes = (inc.resolutionNotes || '').replace(/"/g, '""');
    lines.push(
      `"${inc.id}","${inc.workflowName}","${inc.failedStepName}","${inc.severity}","${inc.errorCategory}","${inc.affectedDependency || 'Internal'}","${inc.status}",${inc.occurrenceCount},"${inc.createdAt}","${cleanHypothesis}","${cleanNotes}"`
    );
  });

  const csvContent = lines.join('\n');
  downloadBlob(csvContent, `flowpilot-incident-summary-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportExecutiveReliabilityPDF(
  metrics: any,
  incidents: Incident[],
  slaPolicies: SlaPolicy[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const generatedTime = new Date().toLocaleString();

  // Header Banner
  doc.setFillColor(11, 16, 29); // Dark navy
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FLOWPILOT AI', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('Executive Reliability & Incident Summary Report', 14, 21);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedTime} | Workspace: Production Core`, 130, 21);

  let currentY = 38;

  // Section 1: Executive KPI Matrix
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Operational Health & Reliability Metrics', 14, currentY);
  currentY += 4;

  const kpiData = [
    ['Total Workflows', `${metrics?.totalWorkflows ?? 0} pipelines`, 'Success Rate', `${metrics?.successRate ?? 100}%`],
    ['Active Workflows', `${metrics?.activeWorkflows ?? 0} active`, 'Avg Execution Duration', `${metrics?.avgExecutionDurationMs ?? 3820} ms`],
    ['Executions Today', `${metrics?.executionsToday ?? 0} runs`, 'SLA Compliance Target', `${metrics?.slaCompliance ?? 99.88}%`],
    ['Active Incidents', `${incidents.filter((i) => i.status !== 'RESOLVED').length} open`, 'Mean Time to Detect (MTTD)', `${metrics?.mttdMinutes ?? 1.1} min`],
    ['Critical Incidents', `${metrics?.criticalIncidents ?? 0} critical`, 'Mean Time to Recover (MTTR)', `${metrics?.mttrMinutes ?? 4.8} min`],
    ['Pending Approvals', `${metrics?.pendingApprovals ?? 0} pending`, 'Recovery Success Rate', `${metrics?.recoverySuccessRate ?? 100}%`],
  ];

  autoTable(doc, {
    startY: currentY,
    body: kpiData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 50 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 40 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 50 },
      3: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 40 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Section 2: SLA Policies & Error Budgets
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. SLA Availability & Error Budget Burn Down', 14, currentY);
  currentY += 4;

  const slaRows = slaPolicies.map((s) => [
    s.workflowName,
    `${s.targetAvailabilityPercent}%`,
    `${s.currentAvailabilityPercent}%`,
    `${s.p95DurationMs} ms`,
    `${s.errorBudgetBurnedMinutes} / ${s.errorBudgetMinutes} min`,
    `${s.breachCount}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Workflow Pipeline', 'Target', 'Current', 'P95 Latency', 'Error Budget (Burn/Max)', 'Breaches']],
    body: slaRows,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check page break for Section 3
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // Section 3: Recent Incident Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Incident Audit & AI Root-Cause Summary', 14, currentY);
  currentY += 4;

  const incidentRows = incidents.map((inc) => [
    inc.id,
    inc.workflowName,
    inc.severity,
    inc.errorCategory,
    inc.status,
    (inc.rootCauseHypothesis || 'Analyzing').slice(0, 75) + '...',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Workflow', 'Severity', 'Category', 'Status', 'Root Cause Hypothesis']],
    body: incidentRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 38 },
      2: { cellWidth: 18 },
      3: { cellWidth: 32 },
      4: { cellWidth: 24 },
      5: { cellWidth: 50 },
    },
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FlowPilot AI Security & Reliability Platform — Confidential Enterprise Audit — Page ${i} of ${pageCount}`,
      14,
      290
    );
  }

  doc.save(`flowpilot-executive-report-${dateStr}.pdf`);
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
