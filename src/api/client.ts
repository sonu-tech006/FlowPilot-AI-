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
} from '../types';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('flowpilot_jwt') || null;
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('flowpilot_jwt', token);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth
  public getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  public async login(email: string, password?: string) {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async register(payload: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    workspaceName?: string;
    appUrl?: string;
    appName?: string;
  }) {
    const res = await this.request<{ user: User; workspace: import('../types').Workspace; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public logout() {
    this.token = null;
    localStorage.removeItem('flowpilot_jwt');
  }

  // Deployed Project URL Inspection & Lagging Analysis
  public inspectUrl(url: string, setActive: boolean = false, name?: string) {
    return this.request<{
      inspection: import('../types').ProjectUrlInspection;
      provisionedWorkflows?: Workflow[];
    }>('/inspect-url', {
      method: 'POST',
      body: JSON.stringify({ url, setActive, name }),
    });
  }

  public setActiveApplication(url: string, name?: string) {
    return this.request<{
      message: string;
      workspace: import('../types').Workspace;
      appName: string;
      appUrl: string;
      workflows: Workflow[];
      dependencies: DependencyHealth[];
      inspection: import('../types').ProjectUrlInspection;
    }>('/application/set-active', {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    });
  }

  public getActiveApplication() {
    return this.request<{
      appUrl: string;
      appName: string;
      workspace: import('../types').Workspace;
      workflows: Workflow[];
      dependencies: DependencyHealth[];
      latestInspection: import('../types').ProjectUrlInspection | null;
    }>('/application/active');
  }

  public getInspectedUrls() {
    return this.request<{ inspectedProjects: import('../types').ProjectUrlInspection[] }>('/inspected-urls');
  }

  public monitorInspectedUrl(url: string, name?: string) {
    return this.request<{ dependency: DependencyHealth; message: string }>('/inspected-urls/monitor', {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    });
  }

  public getDbHealth() {
    return this.request<{
      status: string;
      databaseType: string;
      isConnected: boolean;
      isMongoConnected: boolean;
      mongoUriConfigured: boolean;
      mongoConnectionError: string | null;
      userCount: number;
      workflowCount: number;
      inspectedUrlCount: number;
      timestamp: string;
    }>('/health/db');
  }

  public reconnectDb() {
    return this.request<{
      status: string;
      databaseType: string;
      isConnected: boolean;
      isMongoConnected: boolean;
      mongoUriConfigured: boolean;
      mongoConnectionError: string | null;
      userCount: number;
      workflowCount: number;
    }>('/health/db/reconnect', { method: 'POST' });
  }


  // Overview metrics
  public getOverviewMetrics() {
    return this.request<{
      metrics: {
        totalWorkflows: number;
        activeWorkflows: number;
        executionsToday: number;
        successfulExecutions: number;
        failedExecutions: number;
        successRate: number;
        activeIncidents: number;
        criticalIncidents: number;
        pendingApprovals: number;
        mttdMinutes: number;
        mttrMinutes: number;
        avgExecutionDurationMs: number;
        recoverySuccessRate: number;
        slaCompliance: number;
        aiInvestigationsPerformed: number;
        estimatedAiCostUsd: number;
      };
    }>('/analytics/overview');
  }

  public getFailureAnalytics() {
    return this.request<{ failureCategories: Array<{ category: string; count: number }> }>(
      '/analytics/failures'
    );
  }

  public getRecoveryAnalytics() {
    return this.request<{
      recoveryStats: Array<{ actionType: string; total: number; successful: number; successRate: number }>;
    }>('/analytics/recovery');
  }

  // Workflows
  public getWorkflows() {
    return this.request<{ workflows: Workflow[] }>('/workflows');
  }

  public getWorkflow(id: string) {
    return this.request<{ workflow: Workflow }>(`/workflows/${id}`);
  }

  public createWorkflow(data: Partial<Workflow>) {
    return this.request<{ workflow: Workflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public updateWorkflow(id: string, data: Partial<Workflow>) {
    return this.request<{ workflow: Workflow }>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public runWorkflow(id: string, injectedFailure?: any) {
    return this.request<{ execution: WorkflowExecution }>(`/workflows/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ injectedFailure }),
    });
  }

  public pauseWorkflow(id: string) {
    return this.request<{ workflow: Workflow }>(`/workflows/${id}/pause`, { method: 'POST' });
  }

  public resumeWorkflow(id: string) {
    return this.request<{ workflow: Workflow }>(`/workflows/${id}/resume`, { method: 'POST' });
  }

  // Executions
  public getExecutions(workflowId?: string) {
    const q = workflowId ? `?workflowId=${workflowId}` : '';
    return this.request<{ executions: WorkflowExecution[] }>(`/executions${q}`);
  }

  public getExecution(id: string) {
    return this.request<{ execution: WorkflowExecution }>(`/executions/${id}`);
  }

  public getExecutionLogs(id: string) {
    return this.request<{ logs: any[] }>(`/executions/${id}/logs`);
  }

  public retryExecution(id: string) {
    return this.request<{ execution: WorkflowExecution }>(`/executions/${id}/retry`, {
      method: 'POST',
    });
  }

  public simulateFailure(executionId: string, nodeId: string, failureType: string) {
    return this.request<{ execution: WorkflowExecution }>(`/executions/${executionId}/simulate-failure`, {
      method: 'POST',
      body: JSON.stringify({ nodeId, failureType }),
    });
  }

  // Incidents
  public getIncidents() {
    return this.request<{ incidents: Incident[] }>('/incidents');
  }

  public getIncident(id: string) {
    return this.request<{
      incident: Incident;
      execution: WorkflowExecution;
      investigation?: Investigation;
      recoveryAction?: RecoveryAction;
      logs: any[];
    }>(`/incidents/${id}`);
  }

  public triggerInvestigation(incidentId: string) {
    return this.request<{ investigation: Investigation }>(`/incidents/${incidentId}/investigate`, {
      method: 'POST',
    });
  }

  public resolveIncident(id: string, notes: string) {
    return this.request<{ incident: Incident }>(`/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public escalateIncident(id: string) {
    return this.request<{ incident: Incident }>(`/incidents/${id}/escalate`, { method: 'POST' });
  }

  // Recovery
  public getRecoveryActions() {
    return this.request<{ actions: RecoveryAction[] }>('/recovery/actions');
  }

  public approveRecoveryAction(id: string, reason?: string) {
    return this.request<{ action: RecoveryAction }>(`/recovery/actions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public rejectRecoveryAction(id: string, reason?: string) {
    return this.request<{ action: RecoveryAction }>(`/recovery/actions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public dryRunRecoveryAction(id: string) {
    return this.request<{ dryRun: any }>(`/recovery/actions/${id}/dry-run`, { method: 'POST' });
  }

  public executeRecoveryAction(id: string) {
    return this.request<{ action: RecoveryAction }>(`/recovery/actions/${id}/execute`, {
      method: 'POST',
    });
  }

  // ML
  public getModelInfo() {
    return this.request<{ info: any; metrics: any }>('/analytics/models');
  }

  public predictFailure(logMessage: string, httpStatus?: number, latencyMs?: number) {
    return this.request<any>('/ml/predict/failure', {
      method: 'POST',
      body: JSON.stringify({ logMessage, httpStatus, latencyMs }),
    });
  }

  public detectAnomaly(data: any) {
    return this.request<any>('/ml/predict/anomaly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public predictRisk(data: any) {
    return this.request<any>('/ml/predict/risk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dependencies
  public getDependencies() {
    return this.request<{ dependencies: DependencyHealth[] }>('/dependencies');
  }

  public tripDependency(id: string) {
    return this.request<{ dependency: DependencyHealth }>(`/dependencies/${id}/trip`, { method: 'POST' });
  }

  public resetDependency(id: string) {
    return this.request<{ dependency: DependencyHealth }>(`/dependencies/${id}/reset`, { method: 'POST' });
  }

  // SLA
  public getSlaPolicies() {
    return this.request<{ slaPolicies: SlaPolicy[] }>('/analytics/sla');
  }

  // Notifications & Audit
  public getNotifications() {
    return this.request<{ notifications: Notification[] }>('/notifications');
  }

  public markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  public markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', { method: 'POST' });
  }

  public getAuditLogs() {
    return this.request<{ auditLogs: AuditLog[] }>('/audit-logs');
  }

  // Reset Demo
  public resetDemo() {
    return this.request<{ success: boolean }>('/demo/reset', { method: 'POST' });
  }
}

export const api = new ApiClient();
