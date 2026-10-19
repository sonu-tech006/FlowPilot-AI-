import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DemoWalkthroughBar } from './components/DemoWalkthroughBar';
import { OverviewView } from './views/OverviewView';
import { WorkflowBuilderView } from './views/WorkflowBuilderView';
import { WorkflowsView } from './views/WorkflowsView';
import { ExecutionsView } from './views/ExecutionsView';
import { IncidentsView } from './views/IncidentsView';
import { InvestigationView } from './views/InvestigationView';
import { RecoveryCenterView } from './views/RecoveryCenterView';
import { MLAnalyticsView } from './views/MLAnalyticsView';
import { DependenciesView } from './views/DependenciesView';
import { SlaView } from './views/SlaView';
import { NotificationsView } from './views/NotificationsView';
import { AuditLogsView } from './views/AuditLogsView';
import { TeamView } from './views/TeamView';
import { SettingsView } from './views/SettingsView';
import { AuthModal } from './components/AuthModal';
import {
  Workflow,
  WorkflowExecution,
  Incident,
  Investigation,
  RecoveryAction,
  DependencyHealth,
  SlaPolicy,
  AuditLog,
  Notification,
  User,
  UserRole,
  ProjectUrlInspection,
} from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { isWhite } = useTheme();
  const [currentView, setCurrentView] = useState('overview');
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr-operator-01',
    name: 'Sarah Chen',
    email: 'sarah.chen@flowpilot.internal',
    role: 'OPERATOR',
    workspaceId: 'ws-prod-01',
    createdAt: new Date().toISOString(),
  });

  const [demoStep, setDemoStep] = useState(1);
  const [isExecutingDemo, setIsExecutingDemo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [dbHealth, setDbHealth] = useState<any>(null);

  // Deployed Project URL Diagnostic States
  const [activeInspection, setActiveInspection] = useState<ProjectUrlInspection | null>(null);
  const [activeInspectedUrl, setActiveInspectedUrl] = useState<string>('');
  const [activeAppName, setActiveAppName] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Core Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [dependencies, setDependencies] = useState<DependencyHealth[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load Initial Data
  const refreshAllData = async () => {
    try {
      const [
        meRes,
        activeAppRes,
        overviewRes,
        wfRes,
        execRes,
        incRes,
        recRes,
        depRes,
        slaRes,
        notifRes,
        auditRes,
        dbHealthRes,
      ] = await Promise.all([
        api.getMe().catch(() => null),
        api.getActiveApplication().catch(() => null),
        api.getOverviewMetrics().catch(() => null),
        api.getWorkflows().catch(() => ({ workflows: [] })),
        api.getExecutions().catch(() => ({ executions: [] })),
        api.getIncidents().catch(() => ({ incidents: [] })),
        api.getRecoveryActions().catch(() => ({ actions: [] })),
        api.getDependencies().catch(() => ({ dependencies: [] })),
        api.getSlaPolicies().catch(() => ({ slaPolicies: [] })),
        api.getNotifications().catch(() => ({ notifications: [] })),
        api.getAuditLogs().catch(() => ({ auditLogs: [] })),
        api.getDbHealth().catch(() => null),
      ]);

      if (dbHealthRes) setDbHealth(dbHealthRes);

      if (meRes?.user) {
        setCurrentUser(meRes.user);
        if (meRes.user.currentAppName) setActiveAppName(meRes.user.currentAppName);
        if (meRes.user.currentAppUrl) setActiveInspectedUrl(meRes.user.currentAppUrl);
      }
      if (activeAppRes) {
        if (activeAppRes.appName) setActiveAppName(activeAppRes.appName);
        if (activeAppRes.appUrl) setActiveInspectedUrl(activeAppRes.appUrl);
      }

      if (overviewRes?.metrics) setMetrics(overviewRes.metrics);
      if (wfRes?.workflows) {
        setWorkflows(wfRes.workflows);
        if (wfRes.workflows.length > 0) {
          setSelectedWorkflow((prev) => prev && wfRes.workflows.some((w) => w.id === prev.id) ? prev : wfRes.workflows[0]);
        }
      }
      if (execRes?.executions) {
        setExecutions(execRes.executions);
        if (execRes.executions.length > 0) {
          setSelectedExecution((prev) => prev && execRes.executions.some((e) => e.id === prev.id) ? prev : execRes.executions[0]);
          const targetExec = execRes.executions[0];
          api.getExecutionLogs(targetExec.id).then((lRes) => {
            if (lRes?.logs) setExecutionLogs(lRes.logs);
          });
        }
      }
      if (incRes?.incidents) {
        setIncidents(incRes.incidents);
        if (incRes.incidents.length > 0) {
          const inc = incRes.incidents[0];
          setSelectedIncident((prev) => prev && incRes.incidents.some((i) => i.id === prev.id) ? prev : inc);
          if (inc.investigationId) {
            api.getIncident(inc.id).then((fullInc) => {
              if (fullInc.investigation) setInvestigation(fullInc.investigation);
            });
          }
        }
      }
      if (recRes?.actions) setRecoveryActions(recRes.actions);
      if (depRes?.dependencies) setDependencies(depRes.dependencies);
      if (slaRes?.slaPolicies) setSlaPolicies(slaRes.slaPolicies);
      if (notifRes?.notifications) setNotifications(notifRes.notifications);
      if (auditRes?.auditLogs) setAuditLogs(auditRes.auditLogs);
    } catch (err) {
      console.error('Error refreshing platform data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handler: select specific execution
  const handleSelectExecution = async (exec: WorkflowExecution) => {
    setSelectedExecution(exec);
    try {
      const logRes = await api.getExecutionLogs(exec.id);
      if (logRes?.logs) setExecutionLogs(logRes.logs);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: select specific incident
  const handleSelectIncident = async (inc: Incident) => {
    setSelectedIncident(inc);
    try {
      const full = await api.getIncident(inc.id);
      if (full.investigation) setInvestigation(full.investigation);
      if (full.execution) {
        setSelectedExecution(full.execution);
        setExecutionLogs(full.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: run workflow
  const handleRunWorkflow = async (workflowId: string, injectedFailure?: any) => {
    try {
      const res = await api.runWorkflow(workflowId, injectedFailure);
      if (res.execution) {
        setSelectedExecution(res.execution);
        setCurrentView('executions');
        setTimeout(() => refreshAllData(), 1200);
      }
    } catch (err) {
      console.error('Error running workflow:', err);
    }
  };

  // Handler: retry / resume execution
  const handleRetryExecution = async (execId: string) => {
    try {
      const res = await api.retryExecution(execId);
      if (res.execution) {
        setSelectedExecution(res.execution);
        setTimeout(() => refreshAllData(), 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: trigger investigation
  const handleTriggerInvestigation = async (incidentId: string) => {
    try {
      const res = await api.triggerInvestigation(incidentId);
      if (res.investigation) {
        setInvestigation(res.investigation);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: approve recovery action
  const handleApproveAction = async (actionId: string, reason: string) => {
    try {
      await api.approveRecoveryAction(actionId, reason);
      await refreshAllData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  // Handler: reject recovery action
  const handleRejectAction = async (actionId: string, reason: string) => {
    try {
      await api.rejectRecoveryAction(actionId, reason);
      await refreshAllData();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  // Handler: dry run recovery action
  const handleDryRunAction = async (actionId: string) => {
    const res = await api.dryRunRecoveryAction(actionId);
    await refreshAllData();
    return res.dryRun;
  };

  // Handler: execute recovery action
  const handleExecuteAction = async (actionId: string) => {
    try {
      await api.executeRecoveryAction(actionId);
      await refreshAllData();
      setTimeout(() => refreshAllData(), 1800);
    } catch (err: any) {
      alert(`Execution error: ${err.message}`);
    }
  };

  // Handler: switch user role
  const handleSwitchUser = (role: UserRole) => {
    if (role === 'ADMIN') {
      setCurrentUser({
        id: 'usr-admin-01',
        name: 'Marcus Vance',
        email: 'marcus.vance@flowpilot.internal',
        role: 'ADMIN',
        workspaceId: 'ws-prod-01',
        createdAt: new Date().toISOString(),
      });
    } else if (role === 'VIEWER') {
      setCurrentUser({
        id: 'usr-viewer-01',
        name: 'Elena Rostova',
        email: 'elena.rostova@flowpilot.internal',
        role: 'VIEWER',
        workspaceId: 'ws-prod-01',
        createdAt: new Date().toISOString(),
      });
    } else {
      setCurrentUser({
        id: 'usr-operator-01',
        name: 'Sarah Chen',
        email: 'sarah.chen@flowpilot.internal',
        role: 'OPERATOR',
        workspaceId: 'ws-prod-01',
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Auth & Deployed Project URL handlers
  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.currentAppName) setActiveAppName(user.currentAppName);
    if (user.currentAppUrl) setActiveInspectedUrl(user.currentAppUrl);
    setShowAuthModal(false);
    refreshAllData();
  };

  const handleSignOut = () => {
    api.logout();
    setCurrentUser(null);
    setActiveAppName('');
    setActiveInspectedUrl('');
    setActiveInspection(null);
    refreshAllData();
  };

  // Handler: set active application URL & name
  const handleSetActiveApp = async (url: string, name?: string) => {
    if (!url || !url.trim()) return;
    setIsDiagnosing(true);
    try {
      const res = await api.setActiveApplication(url.trim(), name);
      if (res.appName) setActiveAppName(res.appName);
      if (res.appUrl) setActiveInspectedUrl(res.appUrl);
      if (res.inspection) setActiveInspection(res.inspection);
      if (res.workflows && res.workflows.length > 0) {
        setWorkflows(res.workflows);
        setSelectedWorkflow(res.workflows[0]);
      }
      if (res.dependencies) setDependencies(res.dependencies);
      await refreshAllData();
    } catch (err: any) {
      console.error('Failed to set active application:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSearchProjectUrl = async (url: string) => {
    if (!url || !url.trim()) return;
    const trimmed = url.trim();
    setActiveInspectedUrl(trimmed);
    setIsDiagnosing(true);
    setCurrentView('overview');

    try {
      // Direct search activates the deployed application so all workflows run against it
      const res = await api.inspectUrl(trimmed, true);
      if (res.inspection) {
        setActiveInspection(res.inspection);
        setActiveInspectedUrl(res.inspection.url);
      }
      if (res.provisionedWorkflows && res.provisionedWorkflows.length > 0) {
        setWorkflows(res.provisionedWorkflows);
        setSelectedWorkflow(res.provisionedWorkflows[0]);
      }
      // Derive readable application name
      try {
        const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const parts = u.hostname.replace(/^www\./, '').split('.');
        const hostBase = parts[0];
        const autoName = hostBase.charAt(0).toUpperCase() + hostBase.slice(1) + ' Service';
        setActiveAppName(autoName);
      } catch {
        setActiveAppName('Monitored Application');
      }

      await refreshAllData();

      // Smoothly scroll down to the workflow lag inspector section
      setTimeout(() => {
        const el = document.getElementById('workflow-lag-inspector');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('ring-2', 'ring-sky-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-sky-500'), 2500);
        }
      }, 200);
    } catch (err) {
      console.error('Inspection failed:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Handler: Quick Demo Run (Simulate failure on the active application's workflow)
  const handleQuickRunDemo = async () => {
    const targetWf = workflows[0];
    if (!targetWf) return;

    // Pick a sensible node to inject failure into
    const nodeToFail =
      targetWf.nodes.find((n) => n.id === 'step-payment' || n.id === 'step-service-handler' || n.id === 'step-ping') ||
      targetWf.nodes[Math.min(1, targetWf.nodes.length - 1)];

    if (!nodeToFail) return;

    await handleRunWorkflow(targetWf.id, {
      nodeId: nodeToFail.id,
      failureType: 'network_timeout',
    });
    setDemoStep(3);
  };

  // Handler: Reset Demo
  const handleResetDemo = async () => {
    await api.resetDemo();
    setDemoStep(1);
    await refreshAllData();
  };

  // Guided Tour Step Advancer
  const handleAdvanceTourStep = async () => {
    setIsExecutingDemo(true);
    try {
      if (demoStep === 1) {
        setCurrentView('builder');
        setDemoStep(2);
      } else if (demoStep === 2) {
        await handleQuickRunDemo();
        setDemoStep(3);
      } else if (demoStep === 3) {
        setCurrentView('executions');
        setDemoStep(4);
      } else if (demoStep === 4) {
        setCurrentView('ml-analytics');
        setDemoStep(5);
      } else if (demoStep === 5) {
        setCurrentView('dependencies');
        setDemoStep(6);
      } else if (demoStep === 6) {
        setCurrentView('investigation');
        setDemoStep(7);
      } else if (demoStep === 7) {
        setCurrentView('recovery');
        if (recoveryActions[0]) {
          await handleDryRunAction(recoveryActions[0].id);
        }
        setDemoStep(8);
      } else if (demoStep === 8) {
        setCurrentView('recovery');
        if (recoveryActions[0] && recoveryActions[0].approvalStatus === 'PENDING') {
          await handleApproveAction(
            recoveryActions[0].id,
            'Verified zero duplicate charges posted via Stripe idempotency key. Safe to resume.'
          );
        }
        setDemoStep(9);
      } else if (demoStep === 9) {
        setCurrentView('recovery');
        const approved = recoveryActions.find((a) => a.approvalStatus === 'APPROVED') || recoveryActions[0];
        if (approved) {
          await handleExecuteAction(approved.id);
        }
        setDemoStep(10);
      } else if (demoStep === 10) {
        setCurrentView('audit-logs');
        setDemoStep(11);
      } else {
        setDemoStep(1);
        setCurrentView('overview');
      }
    } finally {
      setIsExecutingDemo(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isWhite ? 'bg-[#f8fafc] text-slate-900 theme-white' : 'bg-[#070b13] text-slate-100 theme-black'
    }`}>
      {/* 3-Zone Header with Deployed URL Search, White/Black Theme Switch, and Auth */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onMarkNotificationRead={(id) => api.markNotificationRead(id).then(refreshAllData)}
        onResetDemo={handleResetDemo}
        onQuickRunDemo={handleQuickRunDemo}
        currentView={currentView}
        onOpenAuth={handleOpenAuth}
        onSearchProjectUrl={handleSearchProjectUrl}
        onSignOut={handleSignOut}
        dbType={dbHealth?.databaseType}
        isDiagnosing={isDiagnosing}
        activeInspectedUrl={activeInspectedUrl}
        activeAppName={activeAppName}
        onSetActiveApp={handleSetActiveApp}
      />

      {/* Guided Interactive E2E Demo Walkthrough Bar */}
      <DemoWalkthroughBar
        currentStep={demoStep}
        onAdvanceStep={handleAdvanceTourStep}
        onJumpToStep={(s) => setDemoStep(s)}
        onSelectView={(v) => setCurrentView(v)}
        isExecuting={isExecutingDemo}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          counts={{
            activeIncidents: incidents.filter((i) => i.status !== 'RESOLVED').length,
            pendingApprovals: recoveryActions.filter((r) => r.approvalStatus === 'PENDING').length,
            unreadNotifications: notifications.filter((n) => !n.isRead).length,
          }}
          activeAppName={activeAppName}
          activeInspectedUrl={activeInspectedUrl}
        />

        {/* Viewport Canvas */}
        <main className={`flex-1 overflow-y-auto transition-colors duration-200 ${
          isWhite ? 'bg-[#f8fafc]' : 'bg-[#070b13]'
        }`}>
          {currentView === 'overview' && (
            <OverviewView
              metrics={metrics}
              workflows={workflows}
              executions={executions}
              incidents={incidents}
              recoveryActions={recoveryActions}
              slaPolicies={slaPolicies}
              onSelectView={setCurrentView}
              onQuickRunDemo={handleQuickRunDemo}
              activeInspection={activeInspection}
              activeInspectedUrl={activeInspectedUrl}
              isDiagnosing={isDiagnosing}
              activeAppName={activeAppName}
              onSetActiveApp={handleSetActiveApp}
              currentUser={currentUser}
            />
          )}

          {currentView === 'builder' && (
            <WorkflowBuilderView
              workflow={selectedWorkflow}
              onSaveWorkflow={async (wf) => {
                await api.updateWorkflow(wf.id, wf);
                refreshAllData();
              }}
              onRunWorkflow={handleRunWorkflow}
            />
          )}

          {currentView === 'workflows' && (
            <WorkflowsView
              workflows={workflows}
              onSelectWorkflow={(wf) => {
                setSelectedWorkflow(wf);
                setCurrentView('builder');
              }}
              onRunWorkflow={handleRunWorkflow}
              onPauseWorkflow={async (id) => {
                await api.pauseWorkflow(id);
                refreshAllData();
              }}
              onResumeWorkflow={async (id) => {
                await api.resumeWorkflow(id);
                refreshAllData();
              }}
              onCreateWorkflow={() => {
                setSelectedWorkflow(null);
                setCurrentView('builder');
              }}
            />
          )}

          {currentView === 'executions' && (
            <ExecutionsView
              executions={executions}
              selectedExecution={selectedExecution}
              logs={executionLogs}
              onSelectExecution={handleSelectExecution}
              onRetryExecution={handleRetryExecution}
              onSimulateFailure={(execId, nodeId, failureType) =>
                api.simulateFailure(execId, nodeId, failureType).then(() => refreshAllData())
              }
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onResolveIncident={async (id, notes) => {
                await api.resolveIncident(id, notes);
                refreshAllData();
              }}
              onEscalateIncident={async (id) => {
                await api.escalateIncident(id);
                refreshAllData();
              }}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'investigation' && (
            <InvestigationView
              selectedIncident={selectedIncident}
              investigation={investigation}
              execution={selectedExecution}
              onTriggerInvestigation={handleTriggerInvestigation}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'recovery' && (
            <RecoveryCenterView
              recoveryActions={recoveryActions}
              currentUser={currentUser}
              onApproveAction={handleApproveAction}
              onRejectAction={handleRejectAction}
              onDryRunAction={handleDryRunAction}
              onExecuteAction={handleExecuteAction}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'ml-analytics' && (
            <MLAnalyticsView
              metrics={metrics}
              incidents={incidents}
              slaPolicies={slaPolicies}
            />
          )}

          {currentView === 'dependencies' && (
            <DependenciesView
              dependencies={dependencies}
              onTripDependency={async (id) => {
                await api.tripDependency(id);
                refreshAllData();
              }}
              onResetDependency={async (id) => {
                await api.resetDependency(id);
                refreshAllData();
              }}
            />
          )}

          {currentView === 'sla' && <SlaView slaPolicies={slaPolicies} />}

          {currentView === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkRead={async (id) => {
                await api.markNotificationRead(id);
                refreshAllData();
              }}
              onMarkAllRead={async () => {
                await api.markAllNotificationsRead();
                refreshAllData();
              }}
            />
          )}

          {currentView === 'audit-logs' && <AuditLogsView auditLogs={auditLogs} />}

          {currentView === 'team' && <TeamView currentUser={currentUser} onSwitchUser={handleSwitchUser} />}

          {currentView === 'settings' && <SettingsView onResetDemo={handleResetDemo} />}
        </main>
      </div>

      {/* Sign In & Sign Up Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;


