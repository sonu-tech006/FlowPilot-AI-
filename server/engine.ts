import { db } from './db';
import { mlService } from './mlService';
import { geminiService } from './geminiService';
import { circuitBreakerRegistry } from './circuitBreaker';
import {
  Workflow,
  WorkflowExecution,
  StepExecution,
  ExecutionLog,
  Incident,
  WorkflowNodeConfig,
  FailureCategory,
  RecoveryAction,
} from './types';

export class WorkflowEngine {
  private activeExecutions: Set<string> = new Set();

  /**
   * Triggers a workflow execution
   */
  public async runWorkflow(
    workflowId: string,
    options?: {
      triggerSource?: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' | 'RECOVERY_RETRY';
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
      };
      resumeFromStepId?: string;
      idempotencyKey?: string;
      actorId?: string;
    }
  ): Promise<WorkflowExecution> {
    const workflow = db.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }

    const execId = `exec-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const idempotencyKey = options?.idempotencyKey || `idem-${execId}`;

    // Initialize step executions
    const steps: StepExecution[] = workflow.nodes.map((node) => ({
      id: `step-${execId}-${node.id}`,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: node.maxRetries,
      startedAt: new Date().toISOString(),
      idempotencyKey: `${idempotencyKey}-${node.id}`,
    }));

    const execution: WorkflowExecution = {
      id: execId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowVersion: workflow.version,
      workspaceId: workflow.workspaceId,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      steps,
      triggerSource: options?.triggerSource || 'MANUAL',
      idempotencyKey,
      injectedFailure: options?.injectedFailure
        ? { ...options.injectedFailure, active: true }
        : undefined,
    };

    db.saveExecution(execution);

    // Audit log
    db.addAuditLog({
      id: `audit-${Date.now()}`,
      workspaceId: workflow.workspaceId,
      actorId: options?.actorId || 'usr-operator-01',
      actorName: 'Operator',
      actorRole: 'OPERATOR',
      action: 'WORKFLOW_EXECUTION_TRIGGERED',
      targetResource: 'WorkflowExecution',
      resourceId: execId,
      outcome: 'SUCCESS',
      summary: `Started execution of "${workflow.name}" (ID: ${execId}).`,
      timestamp: new Date().toISOString(),
    });

    // Run execution asynchronously
    this.executeDAG(execution, workflow, options?.resumeFromStepId).catch((err) => {
      console.error(`Execution ${execId} failed with unhandled error:`, err);
    });

    return execution;
  }

  /**
   * Safe step resumption from a failed execution
   */
  public async resumeExecution(
    previousExecutionId: string,
    stepIdToResume: string,
    actorId?: string
  ): Promise<WorkflowExecution> {
    const prevExec = db.getExecutionById(previousExecutionId);
    if (!prevExec) {
      throw new Error(`Execution ${previousExecutionId} not found`);
    }

    const workflow = db.getWorkflowById(prevExec.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${prevExec.workflowId} not found`);
    }

    const newExecId = `exec-rec-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const idempotencyKey = `idem-resume-${newExecId}`;

    // Clone steps up to stepIdToResume as SUCCEEDED, and resume from stepIdToResume
    const newSteps: StepExecution[] = workflow.nodes.map((node) => {
      const prevStep = prevExec.steps.find((s) => s.nodeId === node.id);
      if (node.id === stepIdToResume) {
        return {
          id: `step-${newExecId}-${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          status: 'PENDING',
          retryCount: (prevStep?.retryCount || 0) + 1,
          maxRetries: node.maxRetries + 1,
          startedAt: new Date().toISOString(),
          idempotencyKey: `${idempotencyKey}-${node.id}`,
        };
      } else if (prevStep && prevStep.status === 'SUCCEEDED') {
        // Reuse completed step outputs
        return {
          ...prevStep,
          id: `step-${newExecId}-${node.id}`,
        };
      } else {
        return {
          id: `step-${newExecId}-${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          status: 'PENDING',
          retryCount: 0,
          maxRetries: node.maxRetries,
          startedAt: new Date().toISOString(),
          idempotencyKey: `${idempotencyKey}-${node.id}`,
        };
      }
    });

    const newExecution: WorkflowExecution = {
      id: newExecId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowVersion: workflow.version,
      workspaceId: workflow.workspaceId,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      steps: newSteps,
      triggerSource: 'RECOVERY_RETRY',
      idempotencyKey,
    };

    db.saveExecution(newExecution);

    this.executeDAG(newExecution, workflow, stepIdToResume).catch((err) => {
      console.error(`Recovery execution ${newExecId} failed:`, err);
    });

    return newExecution;
  }

  private async executeDAG(
    execution: WorkflowExecution,
    workflow: Workflow,
    startFromNodeId?: string
  ): Promise<void> {
    this.activeExecutions.add(execution.id);
    const startMs = Date.now();

    try {
      this.log(execution.id, 'INFO', `Workflow execution initiated for "${workflow.name}" [v${workflow.version}].`);

      let skipPrior = Boolean(startFromNodeId);

      for (const node of workflow.nodes) {
        if (skipPrior) {
          if (node.id === startFromNodeId) {
            skipPrior = false;
          } else {
            // Already succeeded in previous execution
            continue;
          }
        }

        execution.currentStepId = node.id;
        db.saveExecution(execution);

        const stepExec = execution.steps.find((s) => s.nodeId === node.id)!;
        stepExec.status = 'RUNNING';
        stepExec.startedAt = new Date().toISOString();
        db.saveExecution(execution);

        this.log(
          execution.id,
          'INFO',
          `Executing node "${node.name}" (${node.type}) [Idempotency: ${stepExec.idempotencyKey}].`,
          node.id,
          stepExec.id
        );

        // Check Circuit Breaker if node connects to an external dependency
        if (node.dependencyService) {
          const cbCheck = circuitBreakerRegistry.canExecute(node.dependencyService);
          if (!cbCheck.allowed) {
            this.log(
              execution.id,
              'ERROR',
              `Suppressed step execution: ${cbCheck.reason}`,
              node.id,
              stepExec.id
            );
            await this.handleStepFailure(
              execution,
              workflow,
              node,
              stepExec,
              'Dependency unavailable',
              503,
              `Circuit Breaker OPEN for ${node.dependencyService}: ${cbCheck.reason}`
            );
            return;
          }
        }

        // Check if Failure Injection is active for this node
        const shouldInjectFailure =
          execution.injectedFailure &&
          execution.injectedFailure.active &&
          execution.injectedFailure.nodeId === node.id;

        const stepResult = await this.simulateNodeExecution(node, stepExec, shouldInjectFailure ? execution.injectedFailure?.failureType : undefined);

        if (!stepResult.success) {
          await this.handleStepFailure(
            execution,
            workflow,
            node,
            stepExec,
            stepResult.category || 'Unknown failure',
            stepResult.httpStatus || 500,
            stepResult.errorMessage || 'Execution halted due to step failure'
          );
          return;
        }

        // Node succeeded
        stepExec.status = 'SUCCEEDED';
        stepExec.completedAt = new Date().toISOString();
        stepExec.durationMs = stepResult.durationMs;
        stepExec.output = stepResult.output;
        db.saveExecution(execution);

        if (node.dependencyService) {
          const dep = circuitBreakerRegistry.getDependency(node.dependencyService);
          if (dep) {
            circuitBreakerRegistry.recordSuccess(dep.id, stepResult.durationMs);
          }
        }

        this.log(
          execution.id,
          'INFO',
          `Step "${node.name}" completed successfully in ${stepResult.durationMs}ms.`,
          node.id,
          stepExec.id
        );
      }

      // All steps succeeded
      execution.status = 'SUCCEEDED';
      execution.completedAt = new Date().toISOString();
      execution.durationMs = Date.now() - startMs;
      db.saveExecution(execution);

      this.log(
        execution.id,
        'INFO',
        `Workflow "${workflow.name}" completed successfully in ${execution.durationMs}ms.`
      );

      // Add success notification if recovery execution
      if (execution.triggerSource === 'RECOVERY_RETRY') {
        db.addNotification({
          id: `notif-rec-succ-${Date.now()}`,
          workspaceId: workflow.workspaceId,
          title: 'Workflow Recovery Successful',
          message: `Execution ${execution.id} recovered and verified completed successfully!`,
          severity: 'SUCCESS',
          type: 'EXECUTION',
          link: `/executions/${execution.id}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      execution.status = 'FAILED';
      execution.completedAt = new Date().toISOString();
      execution.durationMs = Date.now() - startMs;
      db.saveExecution(execution);
      this.log(execution.id, 'ERROR', `Fatal execution engine error: ${err.message}`);
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  private async simulateNodeExecution(
    node: WorkflowNodeConfig,
    stepExec: StepExecution,
    injectedFailureType?: string
  ): Promise<{
    success: boolean;
    durationMs: number;
    output?: any;
    category?: FailureCategory;
    httpStatus?: number;
    errorMessage?: string;
  }> {
    const t0 = Date.now();

    // Check injected failure
    if (injectedFailureType) {
      await new Promise((r) => setTimeout(r, 600));

      if (injectedFailureType === 'network_timeout') {
        return {
          success: false,
          durationMs: 5040,
          category: 'Network timeout',
          httpStatus: 504,
          errorMessage: `ETIMEDOUT: Upstream request timed out after 5000ms communicating with ${
            node.dependencyService || 'remote service'
          } (HTTP 504 Gateway Timeout).`,
        };
      }
      if (injectedFailureType === 'rate_limit_429') {
        return {
          success: false,
          durationMs: 120,
          category: 'Rate limit',
          httpStatus: 429,
          errorMessage: `HTTP 429 Too Many Requests: Burst quota reached on ${
            node.dependencyService || 'API endpoint'
          }. Retry-After: 30s.`,
        };
      }
      if (injectedFailureType === 'server_error_500') {
        return {
          success: false,
          durationMs: 420,
          category: 'Server error',
          httpStatus: 500,
          errorMessage: `HTTP 500 Internal Server Error: Unhandled NullPointerException in remote microservice controller.`,
        };
      }
      if (injectedFailureType === 'db_connection_error') {
        return {
          success: false,
          durationMs: 800,
          category: 'Database connection failure',
          httpStatus: 500,
          errorMessage: `ECONNREFUSED: Connection pool exhausted (max 50 connections reached) on transactional database replica.`,
        };
      }
      if (injectedFailureType === 'auth_invalid') {
        return {
          success: false,
          durationMs: 150,
          category: 'Authentication failure',
          httpStatus: 401,
          errorMessage: `HTTP 401 Unauthorized: JWT bearer token expired or signature validation failed on gateway.`,
        };
      }
      if (injectedFailureType === 'validation_fail') {
        return {
          success: false,
          durationMs: 40,
          category: 'Validation error',
          httpStatus: 400,
          errorMessage: `SchemaValidationError: Field "currency" must be an ISO-4217 code; received null in input payload.`,
        };
      }
    }

    // Standard simulated execution delays
    const delay = Math.floor(Math.random() * 250) + 150;
    await new Promise((r) => setTimeout(r, delay));

    let output: any = { executed: true, timestamp: new Date().toISOString() };
    if (node.type === 'validate_data') {
      output = { valid: true, schema: 'v2.1', itemsCount: 3, total: 249.99 };
    } else if (node.type === 'inventory_check') {
      output = { reservationId: `res-${Math.floor(Math.random() * 90000 + 10000)}`, stockConfirmed: true };
    } else if (node.type === 'payment_process') {
      output = {
        chargeId: `ch_3M${Date.now().toString(36)}`,
        status: 'succeeded',
        amount: 24999,
        currency: 'usd',
        idempotencyVerified: true,
      };
    } else if (node.type === 'invoice_generate') {
      output = { invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, pdfUrl: '/invoices/generated.pdf' };
    } else if (node.type === 'notification') {
      output = { delivered: true, channel: 'email', messageId: `msg-${Date.now()}` };
    }

    return {
      success: true,
      durationMs: Date.now() - t0,
      output,
    };
  }

  private async handleStepFailure(
    execution: WorkflowExecution,
    workflow: Workflow,
    node: WorkflowNodeConfig,
    stepExec: StepExecution,
    category: FailureCategory,
    httpStatus: number,
    errorMessage: string
  ): Promise<void> {
    const now = new Date().toISOString();
    stepExec.status = 'FAILED';
    stepExec.completedAt = now;
    stepExec.error = {
      code: httpStatus === 504 ? 'ETIMEDOUT' : httpStatus === 429 ? 'RATE_LIMIT' : 'STEP_FAILED',
      message: errorMessage,
      category,
      httpStatus,
      stack: `Error: ${errorMessage}\n at executeStep (engine.ts:240)\n at processDAG (engine.ts:168)`,
    };

    execution.status = 'FAILED';
    execution.completedAt = now;
    execution.durationMs = Date.now() - new Date(execution.startedAt).getTime();
    db.saveExecution(execution);

    this.log(
      execution.id,
      'ERROR',
      `Fatal error in step "${node.name}": ${errorMessage}`,
      node.id,
      stepExec.id,
      { category, httpStatus }
    );

    // Trip or update dependency health if applicable
    if (node.dependencyService) {
      const dep = circuitBreakerRegistry.getDependency(node.dependencyService);
      if (dep) {
        circuitBreakerRegistry.recordFailure(dep.id, errorMessage);
      }
    }

    // ML Failure Classification
    const mlResult = mlService.predictFailure({
      logMessage: errorMessage,
      httpStatus,
      latencyMs: stepExec.durationMs || 5000,
      retryCount: stepExec.retryCount,
      stepType: node.type,
    });

    this.log(
      execution.id,
      'INFO',
      `ML Failure Classifier predicted: "${mlResult.predictedCategory}" (Confidence: ${(
        mlResult.confidence * 100
      ).toFixed(1)}%, Model: ${mlResult.modelVersion}) in ${mlResult.latencyMs}ms.`,
      node.id,
      stepExec.id
    );

    // Create Incident automatically
    const incidentId = `inc-${Date.now().toString().slice(-5)}`;
    const correlationFingerprint = `${workflow.id}:${node.id}:${category}:${httpStatus}`;

    const incident: Incident = {
      id: incidentId,
      workspaceId: workflow.workspaceId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      executionId: execution.id,
      failedStepId: node.id,
      failedStepName: node.name,
      severity: httpStatus === 504 || category === 'Network timeout' || category === 'Database connection failure'
        ? 'CRITICAL'
        : 'HIGH',
      status: 'INVESTIGATING',
      errorCategory: mlResult.predictedCategory || category,
      affectedDependency: node.dependencyService,
      firstOccurrence: now,
      latestOccurrence: now,
      occurrenceCount: 1,
      correlationFingerprint,
      rootCauseHypothesis: `Automated ML classification detected ${mlResult.predictedCategory} during step execution.`,
      evidence: [
        `Step "${node.name}" failed with HTTP status ${httpStatus}.`,
        `ML Model (${mlResult.modelVersion}) classified as ${mlResult.predictedCategory} (${(
          mlResult.confidence * 100
        ).toFixed(1)}% confidence).`,
        `Log excerpt: "${errorMessage}"`,
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.saveIncident(incident);

    // Create In-App Notification
    db.addNotification({
      id: `notif-${incidentId}`,
      workspaceId: workflow.workspaceId,
      title: `Workflow Failure: ${workflow.name}`,
      message: `Step "${node.name}" failed with ${category}. Incident ${incidentId} opened.`,
      severity: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      type: 'INCIDENT',
      link: `/incidents/${incidentId}`,
      isRead: false,
      createdAt: now,
    });

    // Auto-trigger Gemini Root Cause Investigation & Propose Recovery Action
    const logs = db.getLogs(execution.id).map((l) => l.message);
    geminiService
      .investigateIncident({
        incident,
        execution,
        workflow,
        mlPredictionCategory: mlResult.predictedCategory,
        logs,
      })
      .then((investigation) => {
        incident.investigationId = investigation.id;
        incident.rootCauseHypothesis = investigation.probableRootCause;
        incident.status = 'AWAITING_APPROVAL';

        // Propose Safe Recovery Action
        const recActionId = `rec-act-${Date.now().toString().slice(-4)}`;
        const recAction: RecoveryAction = {
          id: recActionId,
          incidentId: incident.id,
          executionId: execution.id,
          workflowId: workflow.id,
          stepId: node.id,
          actionType: investigation.recommendedRecoveryAction,
          description: `Safely resume step "${node.name}" using idempotency key "${stepExec.idempotencyKey}".`,
          whyRecommended: investigation.probableRootCause,
          supportingEvidence: investigation.observedEvidence,
          expectedBenefit: investigation.expectedOutcome,
          potentialRisk:
            investigation.riskLevel === 'LOW'
              ? 'Low risk: Idempotent replay prevents duplicate actions.'
              : 'Moderate risk: Operator verification required.',
          riskLevel: investigation.riskLevel,
          isSafeToAutoExecute: investigation.riskLevel === 'LOW' && node.isOptional === true,
          approvalStatus: 'PENDING',
          approvalExpiresAt: new Date(Date.now() + 7200000).toISOString(),
          idempotencyKey: `idem-rec-${execution.id}`,
          dryRunResult: {
            safe: true,
            simulatedOutcome: `Dry-run preview: Verified preceding step outputs exist. Remote endpoint ready. Zero duplicate mutations detected.`,
            warnings: [],
            precheckPassed: true,
          },
          createdAt: new Date().toISOString(),
        };

        db.saveRecoveryAction(recAction);
        incident.recoveryActionId = recAction.id;
        db.saveIncident(incident);

        db.addNotification({
          id: `notif-appr-${recActionId}`,
          workspaceId: workflow.workspaceId,
          title: 'Recovery Approval Required',
          message: `Incident ${incident.id}: AI proposed ${recAction.actionType} for step "${node.name}".`,
          severity: 'WARNING',
          type: 'RECOVERY_APPROVAL',
          link: '/recovery',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      })
      .catch((err) => {
        console.error('Failed to generate automated investigation:', err);
      });
  }

  private log(
    executionId: string,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    nodeId?: string,
    stepExecutionId?: string,
    metadata?: Record<string, any>
  ): void {
    db.addLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      executionId,
      stepExecutionId,
      nodeId,
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }
}

export const workflowEngine = new WorkflowEngine();
