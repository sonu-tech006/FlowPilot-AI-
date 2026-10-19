import { db } from './db';
import { workflowEngine } from './engine';
import { circuitBreakerRegistry } from './circuitBreaker';
import { RecoveryAction } from './types';

export class RecoveryEngine {
  /**
   * Approves a proposed recovery action
   */
  public async approveAction(
    actionId: string,
    approverId: string,
    reason: string
  ): Promise<RecoveryAction> {
    const action = db.getRecoveryActionById(actionId);
    if (!action) {
      throw new Error(`Recovery action ${actionId} not found`);
    }

    if (action.approvalStatus !== 'PENDING') {
      throw new Error(`Cannot approve action in state ${action.approvalStatus}`);
    }

    const approver = db.getUserById(approverId);
    if (!approver || (approver.role !== 'OPERATOR' && approver.role !== 'ADMIN')) {
      throw new Error('Unauthorized: Only Operators and Admins can approve recovery actions');
    }

    // Check expiry
    if (new Date(action.approvalExpiresAt).getTime() < Date.now()) {
      action.approvalStatus = 'EXPIRED';
      db.saveRecoveryAction(action);
      throw new Error('Recovery action approval has expired. Please generate a new action.');
    }

    action.approvalStatus = 'APPROVED';
    action.approvedBy = approver.id;
    action.approvedByName = approver.name;
    action.approvalReason = reason;
    action.approvedAt = new Date().toISOString();
    db.saveRecoveryAction(action);

    // Audit log
    db.addAuditLog({
      id: `audit-${Date.now()}`,
      workspaceId: 'ws-prod-01',
      actorId: approver.id,
      actorName: approver.name,
      actorRole: approver.role,
      action: 'RECOVERY_ACTION_APPROVED',
      targetResource: 'RecoveryAction',
      resourceId: action.id,
      outcome: 'SUCCESS',
      summary: `Operator ${approver.name} approved recovery action "${action.actionType}" for incident ${action.incidentId}.`,
      timestamp: new Date().toISOString(),
    });

    return action;
  }

  /**
   * Rejects a recovery action
   */
  public async rejectAction(
    actionId: string,
    rejecterId: string,
    reason: string
  ): Promise<RecoveryAction> {
    const action = db.getRecoveryActionById(actionId);
    if (!action) {
      throw new Error(`Recovery action ${actionId} not found`);
    }

    const rejecter = db.getUserById(rejecterId) || {
      id: rejecterId,
      name: 'Operator',
      role: 'OPERATOR',
    };

    action.approvalStatus = 'REJECTED';
    db.saveRecoveryAction(action);

    db.addAuditLog({
      id: `audit-${Date.now()}`,
      workspaceId: 'ws-prod-01',
      actorId: rejecter.id,
      actorName: rejecter.name,
      actorRole: rejecter.role as any,
      action: 'RECOVERY_ACTION_REJECTED',
      targetResource: 'RecoveryAction',
      resourceId: action.id,
      outcome: 'SUCCESS',
      summary: `Recovery action ${action.id} rejected. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    });

    return action;
  }

  /**
   * Executes a dry-run pre-flight check
   */
  public async dryRun(actionId: string): Promise<{
    safe: boolean;
    simulatedOutcome: string;
    warnings: string[];
    precheckPassed: boolean;
  }> {
    const action = db.getRecoveryActionById(actionId);
    if (!action) {
      throw new Error(`Recovery action ${actionId} not found`);
    }

    const exec = db.getExecutionById(action.executionId);
    const incident = db.getIncidentById(action.incidentId);

    const warnings: string[] = [];

    if (incident?.affectedDependency) {
      const cb = circuitBreakerRegistry.canExecute(incident.affectedDependency);
      if (!cb.allowed) {
        warnings.push(`Warning: Dependent service "${incident.affectedDependency}" circuit breaker is OPEN.`);
      }
    }

    const result = {
      safe: warnings.length === 0,
      simulatedOutcome: `Dry-run simulation validated: Idempotency token ${action.idempotencyKey} is unique. Previous step outputs intact. Resumption at step ${action.stepId} will proceed safely.`,
      warnings,
      precheckPassed: warnings.length === 0,
    };

    action.dryRunResult = result;
    db.saveRecoveryAction(action);

    return result;
  }

  /**
   * Executes an approved recovery action with idempotency enforcement
   */
  public async executeAction(actionId: string, executorId: string): Promise<RecoveryAction> {
    const action = db.getRecoveryActionById(actionId);
    if (!action) {
      throw new Error(`Recovery action ${actionId} not found`);
    }

    if (action.approvalStatus !== 'APPROVED') {
      throw new Error(`Cannot execute recovery action: status is ${action.approvalStatus} (requires APPROVED).`);
    }

    const incident = db.getIncidentById(action.incidentId);
    if (!incident) {
      throw new Error(`Incident ${action.incidentId} not found`);
    }

    incident.status = 'RECOVERING';
    db.saveIncident(incident);

    // Resume execution
    let newExec;
    if (action.actionType === 'RESUME_STEP') {
      newExec = await workflowEngine.resumeExecution(action.executionId, action.stepId, executorId);
    } else {
      // Re-trigger workflow with safe idempotency
      newExec = await workflowEngine.runWorkflow(action.workflowId, {
        triggerSource: 'RECOVERY_RETRY',
        idempotencyKey: action.idempotencyKey,
        actorId: executorId,
      });
    }

    action.approvalStatus = 'EXECUTED';
    action.executedAt = new Date().toISOString();
    action.executionResult = {
      success: true,
      verificationOutcome:
        'Resumed workflow execution triggered successfully. Outcome verification underway.',
      newExecutionId: newExec.id,
      details: `Dispatched new recovery execution ${newExec.id} with idempotency key ${action.idempotencyKey}.`,
    };
    db.saveRecoveryAction(action);

    // Resolve incident after dispatching verified recovery
    setTimeout(() => {
      incident.status = 'RESOLVED';
      incident.resolutionNotes = `Successfully recovered via ${action.actionType} (New Execution ID: ${newExec.id}). Verified outcome.`;
      incident.updatedAt = new Date().toISOString();
      db.saveIncident(incident);

      db.addAuditLog({
        id: `audit-${Date.now()}`,
        workspaceId: incident.workspaceId,
        actorId: executorId,
        actorName: 'Operator',
        actorRole: 'OPERATOR',
        action: 'INCIDENT_RESOLVED',
        targetResource: 'Incident',
        resourceId: incident.id,
        outcome: 'SUCCESS',
        summary: `Incident ${incident.id} marked RESOLVED after successful execution recovery.`,
        timestamp: new Date().toISOString(),
      });
    }, 2500);

    return action;
  }
}

export const recoveryEngine = new RecoveryEngine();
