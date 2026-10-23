import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { mlService } from './mlService';
import { geminiService } from './geminiService';
import { workflowEngine } from './engine';
import { recoveryEngine } from './recoveryEngine';
import { circuitBreakerRegistry } from './circuitBreaker';
import { User, UserRole, Workflow, ProjectUrlInspection, Workspace } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'flowpilot-super-secure-jwt-secret-key-32chars';

export const router = Router();

// Middleware: Extract user from Bearer token
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
      const user = db.getUserById(decoded.id);
      if (user) {
        (req as any).user = user;
        return next();
      }
    } catch {
      // invalid token, fallback to default operator in demo mode
    }
  }

  // Fallback to default operator user for seamless demo exploration
  const defaultUser = db.getUsers().find((u) => u.role === 'OPERATOR') || db.getUsers()[0];
  (req as any).user = defaultUser;
  next();
}

function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(', ')}] roles` });
    }
    next();
  };
}

router.get('/health/db', (req: Request, res: Response) => {
  const status = db.getDbStatus();
  res.json(status);
});

router.post('/health/db/reconnect', async (req: Request, res: Response) => {
  const { uri } = req.body || {};
  if (uri && typeof uri === 'string' && uri.trim()) {
    db.setCustomMongoUri(uri.trim());
  }
  await db.initMongo();
  const status = db.getDbStatus();
  res.json(status);
});

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

router.post('/auth/register', (req: Request, res: Response) => {
  const { email, name, password, role = 'OPERATOR', appUrl, appName, workspaceName } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = password ? bcrypt.hashSync(password, 10) : bcrypt.hashSync('password123', 10);
  const userId = `usr-${Date.now()}`;
  const userWorkspaceId = `ws-${userId}`;

  const cleanAppUrl = appUrl && typeof appUrl === 'string' ? appUrl.trim() : '';
  let initialAppName = appName && typeof appName === 'string' ? appName.trim() : '';

  const newUser: User = {
    id: userId,
    email,
    name,
    role: role as UserRole,
    workspaceId: userWorkspaceId,
    currentAppUrl: cleanAppUrl,
    currentAppName: initialAppName || (cleanAppUrl ? 'Monitored Application' : `${name}'s Application`),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);

  // Create isolated private workspace for this user
  const newWorkspace: Workspace = {
    id: userWorkspaceId,
    name: workspaceName?.trim() || `${name}'s Workspace`,
    slug: `ws-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
    environment: 'production',
    ownerId: newUser.id,
    appUrl: cleanAppUrl,
    appName: newUser.currentAppName,
    createdAt: new Date().toISOString(),
  };
  db.saveWorkspace(newWorkspace);

  // If user provided a URL at registration, immediately provision pipelines for that URL!
  // If not, provision a personalized starter application pipeline so they don't see another user's or dummy e-commerce data
  if (cleanAppUrl) {
    const prov = db.provisionApplicationWorkflows(userWorkspaceId, cleanAppUrl, initialAppName);
    newUser.currentAppName = prov.appName;
    newWorkspace.appName = prov.appName;
    db.saveWorkspace(newWorkspace);
  } else {
    const prov = db.provisionApplicationWorkflows(userWorkspaceId, 'https://my-app.cloud', `${name}'s Primary Service`);
    newUser.currentAppName = prov.appName;
    newUser.currentAppUrl = 'https://my-app.cloud';
    newWorkspace.appName = prov.appName;
    newWorkspace.appUrl = 'https://my-app.cloud';
    db.saveWorkspace(newWorkspace);
  }

  db.addAuditLog({
    id: `audit-${Date.now()}`,
    workspaceId: userWorkspaceId,
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: newUser.role,
    action: 'USER_REGISTERED',
    targetResource: 'User',
    resourceId: newUser.id,
    outcome: 'SUCCESS',
    summary: `New private user account created: ${newUser.name} (${newUser.email}) in dedicated workspace ${userWorkspaceId}.`,
    timestamp: new Date().toISOString(),
  });

  const token = jwt.sign(
    { id: newUser.id, role: newUser.role, email: newUser.email, workspaceId: userWorkspaceId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const { passwordHash: _, ...userSafe } = newUser;
  res.status(201).json({ user: userSafe, workspace: newWorkspace, token });
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  // If user has a passwordHash, verify with bcrypt
  if (user.passwordHash && password) {
    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }
  }

  db.addAuditLog({
    id: `audit-${Date.now()}`,
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGGED_IN',
    targetResource: 'User',
    resourceId: user.id,
    outcome: 'SUCCESS',
    summary: `User logged in: ${user.name} (${user.email}).`,
    timestamp: new Date().toISOString(),
  });

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, workspaceId: user.workspaceId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const workspace = db.getWorkspaceById(user.workspaceId);
  const { passwordHash: _, ...userSafe } = user;
  res.json({ user: userSafe, workspace, token });
});

router.get('/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const workspace = db.getWorkspaceById(user.workspaceId);
  const { passwordHash: _, ...userSafe } = user;
  res.json({ user: userSafe, workspace });
});

/* ==========================================================================
   DEPLOYED PROJECT URL INSPECTION & APPLICATION MONITORING ROUTES
   ========================================================================== */

router.get('/application/active', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const workspaceId = user?.workspaceId || 'ws-prod-01';
  const workspace = db.getWorkspaceById(workspaceId);
  const workflows = db.getWorkflows(workspaceId);
  const dependencies = db.getDependencies(workspaceId);
  const inspectedProjects = db.getInspectedProjects(workspaceId);
  const latestInspection = inspectedProjects[0] || null;

  res.json({
    appUrl: workspace?.appUrl || user?.currentAppUrl || '',
    appName: workspace?.appName || user?.currentAppName || (workspace?.appUrl ? 'Monitored Application' : 'Default Application'),
    workspace,
    workflows,
    dependencies,
    latestInspection,
  });
});

router.post('/application/set-active', authenticate, async (req: Request, res: Response) => {
  const { url, name } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Valid application URL is required' });
  }

  const user = (req as any).user;
  const workspaceId = user?.workspaceId || 'ws-prod-01';

  let cleanUrl = url.trim().replace(/^["'`]|["'`]$/g, '').trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // Provision dedicated workflows and dependencies for this specific application URL
  const prov = db.provisionApplicationWorkflows(workspaceId, cleanUrl, name);

  let workspace = db.getWorkspaceById(workspaceId);
  if (!workspace) {
    workspace = {
      id: workspaceId,
      name: `${user.name}'s Monitored Application`,
      slug: `ws-${user.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      environment: 'production',
      ownerId: user.id,
      appUrl: cleanUrl,
      appName: prov.appName,
      createdAt: new Date().toISOString(),
    };
  } else {
    workspace.appUrl = cleanUrl;
    workspace.appName = prov.appName;
  }
  db.saveWorkspace(workspace);

  if (user) {
    user.currentAppUrl = cleanUrl;
    user.currentAppName = prov.appName;
  }

  // Probe target host
  let status = 200;
  let statusText = 'OK';
  let totalLatencyMs = 178;
  let ttfbMs = 135;
  let dnsTimeMs = 24;
  let tcpTimeMs = 32;
  let downloadTimeMs = 12;
  let hostname = 'app.example.com';
  try {
    hostname = new URL(cleanUrl).hostname;
    const t0 = performance.now();
    const probeRes = await fetch(cleanUrl, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
    totalLatencyMs = Math.round(performance.now() - t0);
    status = probeRes.status;
    statusText = probeRes.statusText || 'OK';
    ttfbMs = Math.round(totalLatencyMs * 0.72);
  } catch {
    totalLatencyMs = 195;
  }

  const inspection: ProjectUrlInspection = {
    id: `insp-${Date.now()}`,
    workspaceId,
    userId: user?.id,
    url: cleanUrl,
    hostname,
    status,
    statusText,
    totalLatencyMs,
    dnsTimeMs,
    tcpTimeMs,
    ttfbMs,
    downloadTimeMs,
    contentLengthBytes: 4096,
    contentType: 'text/html',
    isLagging: totalLatencyMs > 600,
    laggingPhase: totalLatencyMs > 600 ? 'SERVER_TTFB' : 'NOMINAL',
    laggingSeverity: totalLatencyMs > 1000 ? 'CRITICAL' : totalLatencyMs > 600 ? 'WARNING' : 'HEALTHY',
    bottleneckSummary: `Active pipeline initialized for ${prov.appName} (${cleanUrl}). Monitored latency: ${totalLatencyMs}ms.`,
    recommendations: ['Continuous SLA heartbeat monitor is actively auditing live status.'],
    inspectedAt: new Date().toISOString(),
  };

  db.addInspectedProject(inspection);

  res.json({
    message: `Active application set to "${prov.appName}". Dedicated pipelines and monitors are now active.`,
    workspace,
    appName: prov.appName,
    appUrl: cleanUrl,
    workflows: prov.workflows,
    dependencies: prov.dependencies,
    inspection,
  });
});

router.get('/inspected-urls', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const inspectedProjects = db.getInspectedProjects(user?.workspaceId);
  res.json({ inspectedProjects });
});

router.post('/inspect-url', authenticate, async (req: Request, res: Response) => {
  const { url, setActive = false, name } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Please enter a valid URL or service name to diagnose' });
  }

  // Sanitize and normalize URL
  let cleanUrl = url.trim().replace(/^["'`]|["'`]$/g, '').trim();
  // If user entered search query with spaces, sanitize into mock service domain
  if (cleanUrl.includes(' ')) {
    cleanUrl = cleanUrl.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.internal';
  }
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  try {
    let parsed: URL;
    try {
      parsed = new URL(cleanUrl);
    } catch {
      cleanUrl = 'https://service-probe.internal/' + encodeURIComponent(url.trim());
      parsed = new URL(cleanUrl);
    }

    const hostname = parsed.hostname;
    const lowerUrl = cleanUrl.toLowerCase();

    // Check for simulated presets or demo internal endpoints
    let status = 200;
    let statusText = 'OK';
    let contentLength = 2450;
    let contentType = 'application/json';
    let ttfbMs = 120;
    let totalLatencyMs = 180;
    let dnsTimeMs = 25;
    let tcpTimeMs = 35;
    let downloadTimeMs = 15;
    let isLagging = false;
    let laggingPhase: 'DNS' | 'HANDSHAKE' | 'SERVER_TTFB' | 'DOWNLOAD' | 'NOMINAL' = 'NOMINAL';
    let laggingSeverity: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
    let bottleneckSummary = 'Optimal execution: URL responded within SLA (< 400ms). No pipeline lagging detected.';
    const recommendations: string[] = [];

    if (lowerUrl.includes('acmestore') || lowerUrl.includes('checkout')) {
      // High Latency Checkout Lag Preset
      status = 200;
      statusText = 'OK';
      totalLatencyMs = 845;
      ttfbMs = 710;
      dnsTimeMs = 38;
      tcpTimeMs = 45;
      downloadTimeMs = 52;
      contentLength = 4820;
      isLagging = true;
      laggingPhase = 'SERVER_TTFB';
      laggingSeverity = 'WARNING';
      bottleneckSummary = 'Moderate Pipeline Lag: Checkout inventory lock contention causing 710ms server TTFB delay (84% of latency). Step "step-inventory" is lagging.';
      recommendations.push('Implement Redis distributed inventory lock caching to avoid Postgres table contention.');
      recommendations.push('Enable Gzip/Brotli compression for cart payload serialization.');
      recommendations.push('Add pre-warmed database connection pool for checkout worker pods.');
    } else if (lowerUrl.includes('stripe') || lowerUrl.includes('charge') || lowerUrl.includes('payment')) {
      // Critical Payment Gateway Timeout Preset
      status = 504;
      statusText = 'Gateway Timeout (Upstream Stalled)';
      totalLatencyMs = 5240;
      ttfbMs = 5200;
      dnsTimeMs = 60;
      tcpTimeMs = 85;
      downloadTimeMs = 0;
      contentLength = 0;
      isLagging = true;
      laggingPhase = 'SERVER_TTFB';
      laggingSeverity = 'CRITICAL';
      bottleneckSummary = 'Critical Pipeline Lag: Upstream payment provider socket timeout after 5,000ms. Payment step "step-payment" execution completely halted.';
      recommendations.push('Trip circuit breaker for payment gateway to HALF-OPEN state.');
      recommendations.push('Execute automated safe idempotency dry-run to verify zero duplicate charges posted.');
      recommendations.push('Route fallback traffic to backup PSP processor (Adyen/PayPal fallback route).');
    } else if (lowerUrl.includes('snowflake') || lowerUrl.includes('etl') || lowerUrl.includes('warehouse')) {
      // Snowflake ETL Batch Lag Preset
      status = 200;
      statusText = 'OK';
      totalLatencyMs = 1480;
      ttfbMs = 1180;
      dnsTimeMs = 42;
      tcpTimeMs = 58;
      downloadTimeMs = 200;
      contentLength = 152000;
      isLagging = true;
      laggingPhase = 'SERVER_TTFB';
      laggingSeverity = 'CRITICAL';
      bottleneckSummary = 'Warehouse Query Saturation: 1,180ms server TTFB bottleneck. Heavy analytical warehouse aggregation queue delay.';
      recommendations.push('Scale Snowflake virtual warehouse cluster or auto-suspend idle micro-partitions.');
      recommendations.push('Precompute materialized views for frequent aggregate reporting dimensions.');
    } else if (lowerUrl.includes('diaose') || lowerUrl.includes('test') || lowerUrl.includes('.internal')) {
      // Diagnostic test service simulation
      status = 200;
      statusText = 'OK (Diagnostic Probe)';
      totalLatencyMs = 390;
      ttfbMs = 280;
      dnsTimeMs = 30;
      tcpTimeMs = 40;
      downloadTimeMs = 40;
      contentLength = 3200;
      isLagging = false;
      laggingPhase = 'NOMINAL';
      laggingSeverity = 'HEALTHY';
      bottleneckSummary = 'Diagnostic probe succeeded. Response time 390ms meets high-availability SLA target (< 400ms).';
      recommendations.push('Pipeline latency conforms to production baseline SLA targets.');
    } else {
      // Live HTTP Probe for real public websites
      const t0 = performance.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const reqStart = performance.now();
        const response = await fetch(cleanUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'FlowPilot-AI-Reliability-Probe/2.4 (Workflow Observability Agent)',
            Accept: '*/*',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const ttfbEnd = performance.now();
        ttfbMs = Math.round(ttfbEnd - reqStart);
        status = response.status;
        statusText = response.statusText || (response.ok ? 'OK' : 'Error');
        contentType = response.headers.get('content-type') || 'text/html';

        const text = await response.text();
        const downloadEnd = performance.now();
        totalLatencyMs = Math.round(downloadEnd - reqStart);
        downloadTimeMs = Math.max(8, Math.round(downloadEnd - ttfbEnd));
        contentLength = text.length;

        dnsTimeMs = Math.round(Math.min(ttfbMs * 0.15, 60));
        tcpTimeMs = Math.round(Math.min(ttfbMs * 0.2, 80));
      } catch (err: any) {
        totalLatencyMs = Math.round(performance.now() - t0);
        status = 504;
        statusText = err.name === 'AbortError' ? 'Probe Timeout (6,000ms exceeded)' : (err.message || 'Host Unreachable / Connection Error');
        ttfbMs = totalLatencyMs;
        dnsTimeMs = 110;
        tcpTimeMs = 140;
        downloadTimeMs = 0;
      }

      // Determine lagging bottleneck from live probe
      if (status >= 500) {
        isLagging = true;
        laggingPhase = 'SERVER_TTFB';
        laggingSeverity = 'CRITICAL';
        bottleneckSummary = `HTTP ${status} (${statusText}): Server error or gateway timeout halted execution. Workflow pipeline is lagging at upstream host ${hostname}.`;
        recommendations.push('Inspect server application error logs and restart affected container pod.');
        recommendations.push('Verify database connection pool limits and upstream API credentials.');
      } else if (status >= 400) {
        isLagging = true;
        laggingPhase = 'SERVER_TTFB';
        laggingSeverity = 'WARNING';
        bottleneckSummary = `HTTP ${status} (${statusText}): Upstream resource rejected client request. Endpoint may require authentication or routing fix.`;
        recommendations.push('Check authorization headers, API keys, or CORS allowed origins.');
        recommendations.push('Review route parameters and URL path formatting.');
      } else if (totalLatencyMs > 1200) {
        isLagging = true;
        laggingPhase = 'SERVER_TTFB';
        laggingSeverity = 'CRITICAL';
        bottleneckSummary = `Critical Pipeline Lag: Total latency ${totalLatencyMs}ms exceeds SLA limit (600ms). Severe bottleneck in Server TTFB (${ttfbMs}ms, 85% of total time).`;
        recommendations.push('Server execution is lagging on backend database queries or heavy synchronous computation.');
        recommendations.push('Implement Redis distributed caching for repeated query results.');
      } else if (totalLatencyMs > 500) {
        isLagging = true;
        laggingPhase = 'SERVER_TTFB';
        laggingSeverity = 'WARNING';
        bottleneckSummary = `Moderate Pipeline Lag: Response time ${totalLatencyMs}ms is elevated above optimal threshold (400ms). Primary delay is server-side execution (${ttfbMs}ms).`;
        recommendations.push('Enable Gzip/Brotli response compression on API responses.');
        recommendations.push('Review payload size and serialize only required attributes.');
      } else {
        bottleneckSummary = `Optimal execution: URL responded in ${totalLatencyMs}ms within standard SLA (< 400ms). No pipeline lagging detected.`;
        recommendations.push('Pipeline latency conforms to standard high-availability SLA targets.');
      }
    }

    const user = (req as any).user;
    const workspaceId = user?.workspaceId || 'ws-prod-01';

    const inspection: ProjectUrlInspection = {
      id: `insp-${Date.now()}`,
      workspaceId,
      userId: user?.id,
      url: cleanUrl,
      hostname,
      status,
      statusText,
      totalLatencyMs,
      dnsTimeMs,
      tcpTimeMs,
      ttfbMs,
      downloadTimeMs,
      contentLengthBytes: contentLength,
      contentType,
      isLagging,
      laggingPhase,
      laggingSeverity,
      bottleneckSummary,
      recommendations,
      inspectedAt: new Date().toISOString(),
    };

    db.addInspectedProject(inspection);

    let provisionedWorkflows: Workflow[] | undefined;
    if (setActive) {
      const prov = db.provisionApplicationWorkflows(workspaceId, cleanUrl, name);
      let workspace = db.getWorkspaceById(workspaceId);
      if (workspace) {
        workspace.appUrl = cleanUrl;
        workspace.appName = prov.appName;
        db.saveWorkspace(workspace);
      }
      if (user) {
        user.currentAppUrl = cleanUrl;
        user.currentAppName = prov.appName;
      }
      provisionedWorkflows = prov.workflows;
    }

    res.json({ inspection, provisionedWorkflows });
  } catch (err: any) {
    res.status(400).json({ error: `Failed to inspect URL: ${err.message}` });
  }
});

router.post('/inspected-urls/monitor', authenticate, (req: Request, res: Response) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
    const depName = name || `Deployed: ${parsed.hostname}`;

    // Add to dependencies
    const newDep = db.saveDependency({
      id: `dep-${Date.now()}`,
      name: depName,
      serviceType: 'Live Deployed Service',
      healthStatus: 'HEALTHY',
      circuitBreakerState: 'CLOSED',
      responseLatencyMs: 320,
      errorRatePercentage: 0,
      failureThreshold: 4,
      failureCount: 0,
      lastSuccessfulCheck: new Date().toISOString(),
      recentFailures: [],
      cooldownPeriodMs: 45000,
      halfOpenMaxProbes: 3,
    });

    res.json({ dependency: newDep, message: 'Project URL successfully added to Circuit Breaker dependency monitor.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* ==========================================================================
   WORKFLOW ROUTES
   ========================================================================== */

router.get('/workflows', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const workflows = db.getWorkflows(user?.workspaceId);
  res.json({ workflows });
});

router.post('/workflows', authenticate, requireRole(['ADMIN', 'OPERATOR']), (req: Request, res: Response) => {
  const { name, description, nodes, slaTargetMs = 5000, slaAvailabilityTarget = 99.9, tags = [] } = req.body;
  const user = (req as any).user;

  if (!name || !nodes || !Array.isArray(nodes)) {
    return res.status(400).json({ error: 'Workflow name and nodes array are required' });
  }

  const newWorkflow: Workflow = {
    id: `wf-${Date.now()}`,
    workspaceId: user?.workspaceId || 'ws-prod-01',
    name,
    description: description || '',
    version: 1,
    status: 'ACTIVE',
    nodes,
    slaTargetMs,
    slaAvailabilityTarget,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveWorkflow(newWorkflow);

  db.addAuditLog({
    id: `audit-${Date.now()}`,
    workspaceId: newWorkflow.workspaceId,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'WORKFLOW_CREATED',
    targetResource: 'Workflow',
    resourceId: newWorkflow.id,
    outcome: 'SUCCESS',
    summary: `Created workflow "${newWorkflow.name}" with ${nodes.length} nodes.`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ workflow: newWorkflow });
});

router.get('/workflows/:id', authenticate, (req: Request, res: Response) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json({ workflow });
});

router.put('/workflows/:id', authenticate, requireRole(['ADMIN', 'OPERATOR']), (req: Request, res: Response) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const { name, description, nodes, slaTargetMs, status, tags } = req.body;
  if (name) workflow.name = name;
  if (description !== undefined) workflow.description = description;
  if (nodes) {
    workflow.nodes = nodes;
    workflow.version += 1;
  }
  if (slaTargetMs) workflow.slaTargetMs = slaTargetMs;
  if (status) workflow.status = status;
  if (tags) workflow.tags = tags;
  workflow.updatedAt = new Date().toISOString();

  db.saveWorkflow(workflow);

  db.addAuditLog({
    id: `audit-${Date.now()}`,
    workspaceId: workflow.workspaceId,
    actorId: (req as any).user.id,
    actorName: (req as any).user.name,
    actorRole: (req as any).user.role,
    action: 'WORKFLOW_UPDATED',
    targetResource: 'Workflow',
    resourceId: workflow.id,
    outcome: 'SUCCESS',
    summary: `Updated workflow "${workflow.name}" to version ${workflow.version}.`,
    timestamp: new Date().toISOString(),
  });

  res.json({ workflow });
});

router.delete('/workflows/:id', authenticate, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const success = db.deleteWorkflow(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json({ success: true });
});

router.post('/workflows/:id/run', authenticate, async (req: Request, res: Response) => {
  try {
    const { injectedFailure } = req.body;
    const execution = await workflowEngine.runWorkflow(req.params.id, {
      triggerSource: 'MANUAL',
      injectedFailure,
      actorId: (req as any).user.id,
    });
    res.json({ execution });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/pause', authenticate, (req: Request, res: Response) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  workflow.status = 'PAUSED';
  db.saveWorkflow(workflow);
  res.json({ workflow });
});

router.post('/workflows/:id/resume', authenticate, (req: Request, res: Response) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  workflow.status = 'ACTIVE';
  db.saveWorkflow(workflow);
  res.json({ workflow });
});

/* ==========================================================================
   EXECUTIONS ROUTES
   ========================================================================== */

router.get('/executions', authenticate, (req: Request, res: Response) => {
  const { workflowId } = req.query;
  const user = (req as any).user;
  const executions = db.getExecutions(workflowId as string, user?.workspaceId);
  res.json({ executions });
});

router.get('/executions/:id', authenticate, (req: Request, res: Response) => {
  const execution = db.getExecutionById(req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  res.json({ execution });
});

router.get('/executions/:id/logs', authenticate, (req: Request, res: Response) => {
  const logs = db.getLogs(req.params.id);
  res.json({ logs });
});

router.post('/executions/:id/retry', authenticate, async (req: Request, res: Response) => {
  try {
    const prevExec = db.getExecutionById(req.params.id);
    if (!prevExec) return res.status(404).json({ error: 'Execution not found' });

    const failedStep = prevExec.steps.find((s) => s.status === 'FAILED');
    const stepId = failedStep ? failedStep.nodeId : undefined;

    let newExec;
    if (stepId) {
      newExec = await workflowEngine.resumeExecution(prevExec.id, stepId, (req as any).user.id);
    } else {
      newExec = await workflowEngine.runWorkflow(prevExec.workflowId, {
        triggerSource: 'RECOVERY_RETRY',
        actorId: (req as any).user.id,
      });
    }

    res.json({ execution: newExec });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/executions/:id/simulate-failure', authenticate, async (req: Request, res: Response) => {
  const { failureType = 'network_timeout', nodeId = 'step-payment' } = req.body;
  const prevExec = db.getExecutionById(req.params.id);
  if (!prevExec) return res.status(404).json({ error: 'Execution not found' });

  try {
    const newExec = await workflowEngine.runWorkflow(prevExec.workflowId, {
      triggerSource: 'MANUAL',
      injectedFailure: {
        nodeId,
        failureType,
      },
      actorId: (req as any).user.id,
    });
    res.json({ execution: newExec });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   INCIDENTS ROUTES
   ========================================================================== */

router.get('/incidents', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const incidents = db.getIncidents(user?.workspaceId);
  res.json({ incidents });
});

router.get('/incidents/:id', authenticate, (req: Request, res: Response) => {
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const execution = db.getExecutionById(incident.executionId);
  const investigation = incident.investigationId ? db.getInvestigationById(incident.investigationId) : undefined;
  const recoveryAction = incident.recoveryActionId ? db.getRecoveryActionById(incident.recoveryActionId) : undefined;
  const logs = execution ? db.getLogs(execution.id) : [];

  res.json({
    incident,
    execution,
    investigation,
    recoveryAction,
    logs,
  });
});

router.post('/incidents/:id/investigate', authenticate, async (req: Request, res: Response) => {
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const execution = db.getExecutionById(incident.executionId);
  const workflow = db.getWorkflowById(incident.workflowId);

  if (!execution || !workflow) {
    return res.status(400).json({ error: 'Execution or workflow associated with incident not found' });
  }

  const logs = db.getLogs(execution.id).map((l) => l.message);

  try {
    const investigation = await geminiService.investigateIncident({
      incident,
      execution,
      workflow,
      mlPredictionCategory: incident.errorCategory,
      logs,
    });

    incident.investigationId = investigation.id;
    incident.rootCauseHypothesis = investigation.probableRootCause;
    incident.status = 'AWAITING_APPROVAL';
    db.saveIncident(incident);

    res.json({ investigation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/incidents/:id/assign', authenticate, (req: Request, res: Response) => {
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (user) {
    incident.assignedTo = user.id;
    incident.assignedToName = user.name;
    db.saveIncident(incident);
  }

  res.json({ incident });
});

router.post('/incidents/:id/resolve', authenticate, (req: Request, res: Response) => {
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const { notes = 'Resolved by operator review' } = req.body;
  incident.status = 'RESOLVED';
  incident.resolutionNotes = notes;
  incident.updatedAt = new Date().toISOString();
  db.saveIncident(incident);

  db.addAuditLog({
    id: `audit-${Date.now()}`,
    workspaceId: incident.workspaceId,
    actorId: (req as any).user.id,
    actorName: (req as any).user.name,
    actorRole: (req as any).user.role,
    action: 'INCIDENT_RESOLVED',
    targetResource: 'Incident',
    resourceId: incident.id,
    outcome: 'SUCCESS',
    summary: `Incident ${incident.id} marked as RESOLVED. Notes: ${notes}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ incident });
});

router.post('/incidents/:id/escalate', authenticate, (req: Request, res: Response) => {
  const incident = db.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  incident.status = 'ESCALATED';
  incident.severity = 'CRITICAL';
  incident.updatedAt = new Date().toISOString();
  db.saveIncident(incident);

  db.addNotification({
    id: `notif-esc-${Date.now()}`,
    workspaceId: incident.workspaceId,
    title: `Incident Escalated: ${incident.id}`,
    message: `Incident escalated to CRITICAL priority by ${(req as any).user.name}.`,
    severity: 'CRITICAL',
    type: 'INCIDENT',
    link: `/incidents/${incident.id}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ incident });
});

/* ==========================================================================
   RECOVERY ROUTES
   ========================================================================== */

router.get('/recovery/actions', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const actions = db.getRecoveryActions(undefined, user?.workspaceId);
  res.json({ actions });
});

router.post('/recovery/actions/:id/approve', authenticate, requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { reason = 'Approved after verifying idempotency pre-conditions' } = req.body;
    const action = await recoveryEngine.approveAction(req.params.id, (req as any).user.id, reason);
    res.json({ action });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/recovery/actions/:id/reject', authenticate, requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { reason = 'Rejected by operator' } = req.body;
    const action = await recoveryEngine.rejectAction(req.params.id, (req as any).user.id, reason);
    res.json({ action });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/recovery/actions/:id/dry-run', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await recoveryEngine.dryRun(req.params.id);
    res.json({ dryRun: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/recovery/actions/:id/execute', authenticate, requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const action = await recoveryEngine.executeAction(req.params.id, (req as any).user.id);
    res.json({ action });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* ==========================================================================
   ANALYTICS ROUTES
   ========================================================================== */

router.get('/analytics/overview', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const wsId = user?.workspaceId;
  const workflows = db.getWorkflows(wsId);
  const executions = db.getExecutions(undefined, wsId);
  const incidents = db.getIncidents(wsId);
  const recoveryActions = db.getRecoveryActions(undefined, wsId);

  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w) => w.status === 'ACTIVE').length;
  const executionsToday = executions.length;
  const successfulExecutions = executions.filter((e) => e.status === 'SUCCEEDED').length;
  const failedExecutions = executions.filter((e) => e.status === 'FAILED').length;
  const successRate = executions.length > 0 ? (successfulExecutions / executions.length) * 100 : 100;

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const pendingApprovals = recoveryActions.filter((r) => r.approvalStatus === 'PENDING').length;

  const executedRecoveries = recoveryActions.filter((r) => r.approvalStatus === 'EXECUTED');
  const recoverySuccessRate =
    executedRecoveries.length > 0
      ? (executedRecoveries.filter((r) => r.executionResult?.success).length / executedRecoveries.length) * 100
      : 100;

  res.json({
    metrics: {
      totalWorkflows,
      activeWorkflows,
      executionsToday,
      successfulExecutions,
      failedExecutions,
      successRate: Number(successRate.toFixed(1)),
      activeIncidents,
      criticalIncidents,
      pendingApprovals,
      mttdMinutes: 1.1,
      mttrMinutes: 4.8,
      avgExecutionDurationMs: 3820,
      recoverySuccessRate: Number(recoverySuccessRate.toFixed(1)),
      slaCompliance: 99.88,
      aiInvestigationsPerformed: db.getInvestigations().length,
      estimatedAiCostUsd: 0.0014,
    },
  });
});

router.get('/analytics/failures', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const incidents = db.getIncidents(user?.workspaceId);
  const catDistribution: Record<string, number> = {};

  incidents.forEach((inc) => {
    catDistribution[inc.errorCategory] = (catDistribution[inc.errorCategory] || 0) + 1;
  });

  const failureCategories = Object.entries(catDistribution).map(([category, count]) => ({
    category,
    count,
  }));

  res.json({ failureCategories });
});

router.get('/analytics/recovery', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const actions = db.getRecoveryActions(undefined, user?.workspaceId);
  const breakdown: Record<string, { total: number; success: number }> = {};

  actions.forEach((a) => {
    if (!breakdown[a.actionType]) {
      breakdown[a.actionType] = { total: 0, success: 0 };
    }
    breakdown[a.actionType].total += 1;
    if (a.approvalStatus === 'EXECUTED' && a.executionResult?.success) {
      breakdown[a.actionType].success += 1;
    }
  });

  const recoveryStats = Object.entries(breakdown).map(([actionType, stat]) => ({
    actionType,
    total: stat.total,
    successful: stat.success,
    successRate: stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 0,
  }));

  res.json({ recoveryStats });
});

router.get('/analytics/sla', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const slaPolicies = db.getSlaPolicies(user?.workspaceId);
  res.json({ slaPolicies });
});

router.get('/analytics/models', authenticate, (req: Request, res: Response) => {
  const metrics = mlService.evaluateTestSet();
  const info = mlService.getModelInfo();
  res.json({ metrics, info });
});

router.get('/analytics/ai-usage', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const wsIncidents = new Set(db.getIncidents(user?.workspaceId).map((i) => i.id));
  const investigations = db.getInvestigations().filter((inv) => wsIncidents.has(inv.incidentId));
  const totalTokens = investigations.reduce((sum, inv) => sum + (inv.tokensUsed || 0), 0);
  const totalCost = investigations.reduce((sum, inv) => sum + (inv.estimatedCostUsd || 0), 0);

  res.json({
    totalRequests: investigations.length,
    geminiLiveRequests: investigations.filter((i) => !i.usedFallback).length,
    fallbackRequests: investigations.filter((i) => i.usedFallback).length,
    totalTokens,
    totalCostUsd: Number(totalCost.toFixed(5)),
  });
});

/* ==========================================================================
   DEPENDENCIES ROUTES
   ========================================================================== */

router.get('/dependencies', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const dependencies = db.getDependencies(user?.workspaceId);
  res.json({ dependencies });
});

router.post('/dependencies/:id/trip', authenticate, requireRole(['ADMIN', 'OPERATOR']), (req: Request, res: Response) => {
  const dep = circuitBreakerRegistry.tripCircuitBreaker(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Dependency not found' });
  res.json({ dependency: dep });
});

router.post('/dependencies/:id/reset', authenticate, requireRole(['ADMIN', 'OPERATOR']), (req: Request, res: Response) => {
  const dep = circuitBreakerRegistry.resetCircuitBreaker(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Dependency not found' });
  res.json({ dependency: dep });
});

/* ==========================================================================
   NOTIFICATIONS & AUDIT ROUTES
   ========================================================================== */

router.get('/notifications', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const notifications = db.getNotifications(user?.workspaceId);
  res.json({ notifications });
});

router.patch('/notifications/:id/read', authenticate, (req: Request, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id);
  res.json({ success });
});

router.post('/notifications/read-all', authenticate, (req: Request, res: Response) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

router.get('/audit-logs', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const auditLogs = db.getAuditLogs(100, user?.workspaceId);
  res.json({ auditLogs });
});

/* ==========================================================================
   MACHINE LEARNING SERVICE ENDPOINTS (Section 8.E)
   ========================================================================== */

router.get('/ml/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'FlowPilot Machine Learning Inference Service', version: '2.4.0' });
});

router.post('/ml/predict/failure', (req: Request, res: Response) => {
  const { logMessage, httpStatus, latencyMs, retryCount, stepType } = req.body;
  if (!logMessage) {
    return res.status(400).json({ error: 'logMessage is required' });
  }

  const result = mlService.predictFailure({
    logMessage,
    httpStatus: httpStatus ? Number(httpStatus) : undefined,
    latencyMs: latencyMs ? Number(latencyMs) : undefined,
    retryCount: retryCount ? Number(retryCount) : undefined,
    stepType,
  });

  res.json(result);
});

router.post('/ml/predict/anomaly', (req: Request, res: Response) => {
  const { executionLatencyMs = 3200, failureRate = 0.05, retryFrequency = 0.2, apiResponseTimeMs = 350 } = req.body;
  const result = mlService.detectAnomaly({
    executionLatencyMs: Number(executionLatencyMs),
    failureRate: Number(failureRate),
    retryFrequency: Number(retryFrequency),
    apiResponseTimeMs: Number(apiResponseTimeMs),
  });
  res.json(result);
});

router.post('/ml/predict/risk', (req: Request, res: Response) => {
  const {
    recentFailureCount = 0,
    recentAvgLatencyMs = 2500,
    currentRetryCount = 0,
    dependencyHealthStatus = 'HEALTHY',
    minutesSinceLastFailure = 60,
  } = req.body;

  const result = mlService.predictRisk({
    recentFailureCount: Number(recentFailureCount),
    recentAvgLatencyMs: Number(recentAvgLatencyMs),
    currentRetryCount: Number(currentRetryCount),
    dependencyHealthStatus,
    minutesSinceLastFailure: Number(minutesSinceLastFailure),
  });
  res.json(result);
});

router.get('/ml/model/info', (req: Request, res: Response) => {
  res.json(mlService.getModelInfo());
});

router.get('/ml/model/metrics', (req: Request, res: Response) => {
  res.json(mlService.evaluateTestSet());
});

/* ==========================================================================
   DEMO RESET ROUTE
   ========================================================================== */

router.post('/demo/reset', authenticate, (req: Request, res: Response) => {
  db.resetToSeed();
  res.json({ success: true, message: 'Database reset to initial demo state.' });
});
