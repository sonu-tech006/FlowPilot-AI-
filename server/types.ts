export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'PAUSED'
  | 'CANCELLED'
  | 'TIMED_OUT';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'AWAITING_APPROVAL'
  | 'RECOVERING'
  | 'RESOLVED'
  | 'ESCALATED';

export type RecoveryActionType =
  | 'RETRY_TRANSIENT'
  | 'RETRY_WITH_DELAY'
  | 'RESUME_STEP'
  | 'RECHECK_DEPENDENCY'
  | 'REFRESH_CONFIG'
  | 'SKIP_OPTIONAL_STEP'
  | 'ESCALATE_HUMAN'
  | 'ROLLBACK_COMPENSATING';

export type RecoveryApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXECUTED';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export type FailureCategory =
  | 'Network timeout'
  | 'Rate limit'
  | 'Authentication failure'
  | 'Database connection failure'
  | 'Validation error'
  | 'Server error'
  | 'Dependency unavailable'
  | 'Unknown failure';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
  currentAppUrl?: string;
  currentAppName?: string;
  passwordHash?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ProjectUrlInspection {
  id: string;
  workspaceId?: string;
  userId?: string;
  url: string;
  hostname: string;
  status: number;
  statusText: string;
  totalLatencyMs: number;
  dnsTimeMs: number;
  tcpTimeMs: number;
  ttfbMs: number;
  downloadTimeMs: number;
  contentLengthBytes: number;
  contentType: string;
  isLagging: boolean;
  laggingPhase: 'DNS' | 'HANDSHAKE' | 'SERVER_TTFB' | 'DOWNLOAD' | 'NOMINAL';
  laggingSeverity: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  bottleneckSummary: string;
  recommendations: string[];
  inspectedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  environment: 'production' | 'staging' | 'development';
  ownerId: string;
  appUrl?: string;
  appName?: string;
  appType?: string;
  createdAt: string;
}

export interface WorkflowNodeConfig {
  id: string;
  type:
    | 'start'
    | 'end'
    | 'validate_data'
    | 'transform_data'
    | 'http_request'
    | 'inventory_check'
    | 'payment_process'
    | 'invoice_generate'
    | 'notification'
    | 'conditional_branch'
    | 'delay'
    | 'database_op'
    | 'human_approval';
  name: string;
  description?: string;
  dependencies: string[]; // parent node IDs
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;
  isOptional?: boolean;
  dependencyService?: string; // e.g., 'Payment Gateway', 'Inventory API'
  inputData?: Record<string, any>;
  position: { x: number; y: number };
}

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  version: number;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  nodes: WorkflowNodeConfig[];
  slaTargetMs: number;
  slaAvailabilityTarget: number; // e.g. 99.9
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StepExecution {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: ExecutionStatus;
  retryCount: number;
  maxRetries: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
    category?: FailureCategory;
    httpStatus?: number;
    details?: any;
  };
  input?: any;
  output?: any;
  idempotencyKey?: string;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  stepExecutionId?: string;
  nodeId?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  workspaceId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  steps: StepExecution[];
  currentStepId?: string;
  injectedFailure?: {
    nodeId: string;
    failureType:
      | 'network_timeout'
      | 'rate_limit_429'
      | 'server_error_500'
      | 'db_connection_error'
      | 'auth_invalid'
      | 'validation_fail'
      | 'slow_dependency';
    active: boolean;
  };
  triggerSource: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' | 'RECOVERY_RETRY';
  idempotencyKey?: string;
}

export interface Incident {
  id: string;
  workspaceId: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  failedStepId: string;
  failedStepName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  errorCategory: FailureCategory;
  affectedDependency?: string;
  firstOccurrence: string;
  latestOccurrence: string;
  occurrenceCount: number;
  rootCauseHypothesis?: string;
  evidence: string[];
  investigationId?: string;
  recoveryActionId?: string;
  assignedTo?: string;
  assignedToName?: string;
  resolutionNotes?: string;
  correlationFingerprint: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investigation {
  id: string;
  incidentId: string;
  executionId: string;
  workflowId: string;
  model: string;
  usedFallback: boolean;
  incidentSummary: string;
  probableRootCause: string;
  observedEvidence: string[];
  alternativeExplanations: string[];
  failureCategory: FailureCategory;
  impactAssessment: string;
  recommendedRecoveryAction: RecoveryActionType;
  recoveryPrerequisites: string[];
  expectedOutcome: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  confidenceExplanation: string;
  humanApprovalRequired: boolean;
  tokensUsed?: number;
  estimatedCostUsd?: number;
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  workspaceId?: string;
  incidentId: string;
  executionId: string;
  workflowId: string;
  stepId: string;
  actionType: RecoveryActionType;
  description: string;
  whyRecommended: string;
  supportingEvidence: string[];
  expectedBenefit: string;
  potentialRisk: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isSafeToAutoExecute: boolean;
  approvalStatus: RecoveryApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvalReason?: string;
  approvedAt?: string;
  approvalExpiresAt: string;
  idempotencyKey: string;
  dryRunResult?: {
    safe: boolean;
    simulatedOutcome: string;
    warnings: string[];
    precheckPassed: boolean;
  };
  executedAt?: string;
  executionResult?: {
    success: boolean;
    verificationOutcome: string;
    newExecutionId?: string;
    details: string;
  };
  createdAt: string;
}

export interface DependencyHealth {
  id: string;
  workspaceId?: string;
  name: string;
  serviceType: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  circuitBreakerState: CircuitBreakerState;
  responseLatencyMs: number;
  errorRatePercentage: number;
  failureThreshold: number;
  failureCount: number;
  lastSuccessfulCheck: string;
  lastFailureAt?: string;
  recentFailures: Array<{ timestamp: string; reason: string }>;
  cooldownPeriodMs: number;
  halfOpenMaxProbes: number;
}

export interface SlaPolicy {
  id: string;
  workflowId: string;
  workflowName: string;
  targetAvailabilityPercent: number; // e.g. 99.9
  currentAvailabilityPercent: number;
  maxExecutionDurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  errorBudgetMinutes: number;
  errorBudgetBurnedMinutes: number;
  mttrMinutes: number;
  mttdMinutes: number;
  breachCount: number;
  lastBreachAt?: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  resourceId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  summary: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  userId?: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  type: 'INCIDENT' | 'RECOVERY_APPROVAL' | 'SLA_BREACH' | 'DEPENDENCY' | 'EXECUTION';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProjectUrlInspection {
  id: string;
  url: string;
  hostname: string;
  status: number;
  statusText: string;
  totalLatencyMs: number;
  dnsTimeMs: number;
  tcpTimeMs: number;
  ttfbMs: number;
  downloadTimeMs: number;
  contentLengthBytes: number;
  contentType: string;
  isLagging: boolean;
  laggingPhase: 'DNS' | 'HANDSHAKE' | 'SERVER_TTFB' | 'DOWNLOAD' | 'NOMINAL';
  laggingSeverity: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  bottleneckSummary: string;
  recommendations: string[];
  inspectedAt: string;
}

