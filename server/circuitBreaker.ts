import { db } from './db';
import { CircuitBreakerState, DependencyHealth } from './types';

export class CircuitBreakerRegistry {
  public getDependency(nameOrId: string): DependencyHealth | undefined {
    const deps = db.getDependencies();
    return deps.find((d) => d.id === nameOrId || d.name.toLowerCase() === nameOrId.toLowerCase());
  }

  public recordSuccess(dependencyId: string, latencyMs: number): void {
    const dep = db.getDependencyById(dependencyId);
    if (!dep) return;

    dep.lastSuccessfulCheck = new Date().toISOString();
    dep.failureCount = Math.max(0, dep.failureCount - 1);
    dep.responseLatencyMs = Math.round(dep.responseLatencyMs * 0.8 + latencyMs * 0.2);

    if (dep.circuitBreakerState === 'HALF_OPEN') {
      // Probes succeeded, close circuit breaker
      dep.circuitBreakerState = 'CLOSED';
      dep.healthStatus = 'HEALTHY';
    } else if (dep.healthStatus === 'DEGRADED' && dep.failureCount === 0) {
      dep.healthStatus = 'HEALTHY';
    }

    db.saveDependency(dep);
  }

  public recordFailure(dependencyId: string, reason: string): void {
    const dep = db.getDependencyById(dependencyId);
    if (!dep) return;

    const now = new Date();
    dep.lastFailureAt = now.toISOString();
    dep.failureCount += 1;
    dep.errorRatePercentage = Math.min(100, Math.round(dep.errorRatePercentage * 0.8 + 20));
    dep.recentFailures.unshift({ timestamp: now.toISOString(), reason });
    if (dep.recentFailures.length > 5) {
      dep.recentFailures = dep.recentFailures.slice(0, 5);
    }

    if (dep.failureCount >= dep.failureThreshold) {
      dep.circuitBreakerState = 'OPEN';
      dep.healthStatus = 'UNHEALTHY';

      // Record in audit log & notification
      db.addNotification({
        id: `notif-cb-${Date.now()}`,
        workspaceId: 'ws-prod-01',
        title: `Circuit Breaker Tripped: ${dep.name}`,
        message: `Failure threshold reached (${dep.failureCount}/${dep.failureThreshold}). Circuit breaker is now OPEN.`,
        severity: 'CRITICAL',
        type: 'DEPENDENCY',
        link: '/dependencies',
        isRead: false,
        createdAt: now.toISOString(),
      });
    } else if (dep.failureCount >= Math.floor(dep.failureThreshold / 2)) {
      dep.healthStatus = 'DEGRADED';
    }

    db.saveDependency(dep);
  }

  public canExecute(dependencyName?: string): { allowed: boolean; reason?: string } {
    if (!dependencyName) return { allowed: true };
    const dep = this.getDependency(dependencyName);
    if (!dep) return { allowed: true };

    if (dep.circuitBreakerState === 'OPEN') {
      const now = Date.now();
      const lastFail = dep.lastFailureAt ? new Date(dep.lastFailureAt).getTime() : 0;
      if (now - lastFail > dep.cooldownPeriodMs) {
        // Cooldown passed, transition to HALF_OPEN for controlled probe
        dep.circuitBreakerState = 'HALF_OPEN';
        dep.healthStatus = 'DEGRADED';
        db.saveDependency(dep);
        return { allowed: true, reason: 'Circuit is HALF_OPEN (probe request allowed)' };
      }
      return {
        allowed: false,
        reason: `Circuit breaker is OPEN for ${dep.name}. Cooldown expires in ${Math.round(
          (dep.cooldownPeriodMs - (now - lastFail)) / 1000
        )}s.`,
      };
    }

    return { allowed: true };
  }

  public tripCircuitBreaker(id: string): DependencyHealth | undefined {
    const dep = db.getDependencyById(id);
    if (!dep) return undefined;
    dep.circuitBreakerState = 'OPEN';
    dep.healthStatus = 'UNHEALTHY';
    dep.failureCount = dep.failureThreshold;
    dep.lastFailureAt = new Date().toISOString();
    return db.saveDependency(dep);
  }

  public resetCircuitBreaker(id: string): DependencyHealth | undefined {
    const dep = db.getDependencyById(id);
    if (!dep) return undefined;
    dep.circuitBreakerState = 'CLOSED';
    dep.healthStatus = 'HEALTHY';
    dep.failureCount = 0;
    dep.errorRatePercentage = 0;
    return db.saveDependency(dep);
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();
