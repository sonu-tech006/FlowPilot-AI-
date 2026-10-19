import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { MongoClient, Db } from 'mongodb';
import {
  User,
  Workspace,
  Workflow,
  WorkflowExecution,
  ExecutionLog,
  Incident,
  Investigation,
  RecoveryAction,
  DependencyHealth,
  SlaPolicy,
  AuditLog,
  Notification,
  ProjectUrlInspection,
} from './types';

// Data storage directory
const DATA_DIR = path.resolve(process.cwd(), '.flowpilot-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  workspaces: Workspace[];
  workflows: Workflow[];
  executions: WorkflowExecution[];
  logs: ExecutionLog[];
  incidents: Incident[];
  investigations: Investigation[];
  recoveryActions: RecoveryAction[];
  dependencies: DependencyHealth[];
  slaPolicies: SlaPolicy[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  inspectedProjects: ProjectUrlInspection[];
}

class DocumentDatabase {
  private data: DatabaseSchema;
  private initialized: boolean = false;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private isMongoConnected: boolean = false;
  private mongoConnectionError: string | null = null;
  private mongoUri: string | null = null;


  constructor() {
    this.data = this.getDefaultState();
    this.load();
  }

  private getDefaultState(): DatabaseSchema {
    return {
      users: [],
      workspaces: [],
      workflows: [],
      executions: [],
      logs: [],
      incidents: [],
      investigations: [],
      recoveryActions: [],
      dependencies: [],
      slaPolicies: [],
      auditLogs: [],
      notifications: [],
      inspectedProjects: [],
    };
  }

  private load(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.inspectedProjects) {
          this.data.inspectedProjects = [];
        }
        this.initialized = true;
      } else {
        this.seedDemoData();
        this.save();
        this.initialized = true;
      }
    } catch (err) {
      console.warn('Could not read existing db.json, initializing fresh seed:', err);
      this.seedDemoData();
      this.save();
      this.initialized = true;
    }
  }

  public async initMongo(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    this.mongoUri = uri || null;
    if (!uri) {
      console.log('ℹ️ [FlowPilot DB] MONGODB_URI not set. Running with embedded persistent document store.');
      return;
    }

    try {
      this.mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await this.mongoClient.connect();
      const dbName = process.env.MONGODB_DB_NAME || 'flowpilot';
      this.mongoDb = this.mongoClient.db(dbName);
      this.isMongoConnected = true;
      this.mongoConnectionError = null;
      console.log(`✅ [FlowPilot DB] Successfully connected to MongoDB database "${dbName}"`);

      // Sync existing users from MongoDB if any
      const remoteUsers = await this.mongoDb.collection<User>('users').find({}).toArray();
      if (remoteUsers && remoteUsers.length > 0) {
        for (const ru of remoteUsers) {
          if (!this.data.users.some((u) => u.id === ru.id || u.email.toLowerCase() === ru.email.toLowerCase())) {
            this.data.users.push(ru);
          }
        }
        this.save();
      } else {
        // Seed MongoDB collection with current users
        for (const u of this.data.users) {
          await this.mongoDb.collection('users').updateOne({ id: u.id }, { $set: u }, { upsert: true });
        }
      }
    } catch (err: any) {
      this.isMongoConnected = false;
      this.mongoConnectionError = err.message;
      console.warn('⚠️ [FlowPilot DB] MongoDB connection failed, falling back to local document database:', err.message);
    }
  }

  public getDbStatus() {
    return {
      status: 'ok',
      databaseType: this.isMongoConnected ? 'MongoDB (Connected & Synced)' : 'Local Document DB (Active)',
      isConnected: true,
      isMongoConnected: this.isMongoConnected,
      mongoUriConfigured: Boolean(this.mongoUri),
      mongoConnectionError: this.mongoConnectionError,
      userCount: this.data.users.length,
      workflowCount: this.data.workflows.length,
      inspectedUrlCount: this.data.inspectedProjects?.length || 0,
      timestamp: new Date().toISOString(),
    };
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  public resetToSeed(): void {
    this.data = this.getDefaultState();
    this.seedDemoData();
    this.save();
  }


  private seedDemoData(): void {
    const now = new Date();
    const isoNow = now.toISOString();
    const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 7200000).toISOString();
    const threeHoursAgo = new Date(now.getTime() - 10800000).toISOString();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();

    // 1. Users
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    const operatorUser: User = {
      id: 'usr-operator-01',
      name: 'Sarah Chen',
      email: 'sarah.chen@flowpilot.internal',
      role: 'OPERATOR',
      workspaceId: 'ws-prod-01',
      passwordHash: defaultPasswordHash,
      createdAt: yesterday,
    };

    const adminUser: User = {
      id: 'usr-admin-01',
      name: 'Marcus Vance',
      email: 'marcus.vance@flowpilot.internal',
      role: 'ADMIN',
      workspaceId: 'ws-prod-01',
      passwordHash: defaultPasswordHash,
      createdAt: yesterday,
    };

    const viewerUser: User = {
      id: 'usr-viewer-01',
      name: 'Elena Rostova',
      email: 'elena.rostova@flowpilot.internal',
      role: 'VIEWER',
      workspaceId: 'ws-prod-01',
      passwordHash: defaultPasswordHash,
      createdAt: yesterday,
    };

    this.data.users = [operatorUser, adminUser, viewerUser];

    // 2. Workspace
    const defaultWorkspace: Workspace = {
      id: 'ws-prod-01',
      name: 'Production Core Workflows',
      slug: 'prod-core',
      environment: 'production',
      ownerId: adminUser.id,
      createdAt: yesterday,
    };
    this.data.workspaces = [defaultWorkspace];

    // 3. Workflows
    // Order Processing Workflow (the hero demo workflow from Prompt Section 1)
    const orderWorkflow: Workflow = {
      id: 'wf-order-processing',
      workspaceId: defaultWorkspace.id,
      name: 'E-Commerce Order Processing Pipeline',
      description:
        'End-to-end multi-step transaction workflow validating orders, reserving inventory, processing Stripe payments, issuing invoices, and delivering customer notifications.',
      version: 3,
      status: 'ACTIVE',
      slaTargetMs: 4500,
      slaAvailabilityTarget: 99.95,
      tags: ['e-commerce', 'critical-revenue', 'finance'],
      nodes: [
        {
          id: 'step-validate',
          type: 'validate_data',
          name: '1. Validate Order',
          description: 'Validates customer ID, SKU format, and cart totals.',
          dependencies: [],
          timeoutMs: 3000,
          maxRetries: 2,
          retryBackoffMs: 500,
          position: { x: 80, y: 160 },
          inputData: { schemaVersion: 'v2.1', strictMode: true },
        },
        {
          id: 'step-inventory',
          type: 'inventory_check',
          name: '2. Check Inventory',
          description: 'Reserves warehouse stock via SAP Inventory API.',
          dependencies: ['step-validate'],
          timeoutMs: 4000,
          maxRetries: 3,
          retryBackoffMs: 1000,
          dependencyService: 'SAP Inventory Service',
          position: { x: 340, y: 160 },
        },
        {
          id: 'step-payment',
          type: 'payment_process',
          name: '3. Process Payment',
          description: 'Charges payment gateway with idempotency key.',
          dependencies: ['step-inventory'],
          timeoutMs: 5000,
          maxRetries: 2,
          retryBackoffMs: 2000,
          dependencyService: 'Stripe Payment Gateway',
          position: { x: 600, y: 160 },
          inputData: { gateway: 'stripe', currency: 'USD', capture: true },
        },
        {
          id: 'step-invoice',
          type: 'invoice_generate',
          name: '4. Generate Invoice',
          description: 'Generates tax invoice and PDF via TaxJar / Billing API.',
          dependencies: ['step-payment'],
          timeoutMs: 3500,
          maxRetries: 2,
          retryBackoffMs: 1000,
          dependencyService: 'Billing Invoice API',
          position: { x: 860, y: 160 },
        },
        {
          id: 'step-notification',
          type: 'notification',
          name: '5. Send Order Confirmation',
          description: 'Sends email & push notification to customer.',
          dependencies: ['step-invoice'],
          timeoutMs: 3000,
          maxRetries: 3,
          retryBackoffMs: 500,
          isOptional: true,
          dependencyService: 'SendGrid Email API',
          position: { x: 1120, y: 160 },
        },
      ],
      createdAt: yesterday,
      updatedAt: twoHoursAgo,
    };

    // Data Sync & Export Workflow
    const analyticsSyncWorkflow: Workflow = {
      id: 'wf-analytics-sync',
      workspaceId: defaultWorkspace.id,
      name: 'Snowflake Data Warehouse Batch Ingestion',
      description:
        'Daily ETL synchronization from application event logs into analytical dimensional warehouse.',
      version: 1,
      status: 'ACTIVE',
      slaTargetMs: 18000,
      slaAvailabilityTarget: 99.5,
      tags: ['data-lake', 'snowflake', 'scheduled'],
      nodes: [
        {
          id: 'step-sync-extract',
          type: 'database_op',
          name: '1. Extract Events',
          dependencies: [],
          timeoutMs: 8000,
          maxRetries: 2,
          retryBackoffMs: 2000,
          position: { x: 100, y: 100 },
        },
        {
          id: 'step-sync-transform',
          type: 'transform_data',
          name: '2. Normalize JSON',
          dependencies: ['step-sync-extract'],
          timeoutMs: 6000,
          maxRetries: 2,
          retryBackoffMs: 1000,
          position: { x: 400, y: 100 },
        },
        {
          id: 'step-sync-load',
          type: 'http_request',
          name: '3. Load to Snowflake',
          dependencies: ['step-sync-transform'],
          timeoutMs: 10000,
          maxRetries: 3,
          retryBackoffMs: 3000,
          dependencyService: 'Snowflake Ingestion API',
          position: { x: 700, y: 100 },
        },
      ],
      createdAt: yesterday,
      updatedAt: yesterday,
    };

    this.data.workflows = [orderWorkflow, analyticsSyncWorkflow];

    // 4. Dependencies & Circuit Breakers
    const deps: DependencyHealth[] = [
      {
        id: 'dep-stripe',
        name: 'Stripe Payment Gateway',
        serviceType: 'Payment Processor',
        healthStatus: 'DEGRADED',
        circuitBreakerState: 'HALF_OPEN',
        responseLatencyMs: 3420,
        errorRatePercentage: 18.5,
        failureThreshold: 5,
        failureCount: 4,
        lastSuccessfulCheck: new Date(now.getTime() - 120000).toISOString(),
        lastFailureAt: oneHourAgo,
        recentFailures: [
          { timestamp: oneHourAgo, reason: 'HTTPS 504 Gateway Timeout (upstream provider load)' },
          { timestamp: twoHoursAgo, reason: 'TCP connection reset by peer during TLS handshake' },
        ],
        cooldownPeriodMs: 60000,
        halfOpenMaxProbes: 3,
      },
      {
        id: 'dep-sap',
        name: 'SAP Inventory Service',
        serviceType: 'ERP Inventory',
        healthStatus: 'HEALTHY',
        circuitBreakerState: 'CLOSED',
        responseLatencyMs: 142,
        errorRatePercentage: 0.2,
        failureThreshold: 5,
        failureCount: 0,
        lastSuccessfulCheck: isoNow,
        recentFailures: [],
        cooldownPeriodMs: 45000,
        halfOpenMaxProbes: 3,
      },
      {
        id: 'dep-taxjar',
        name: 'Billing Invoice API',
        serviceType: 'Tax & Compliance',
        healthStatus: 'HEALTHY',
        circuitBreakerState: 'CLOSED',
        responseLatencyMs: 280,
        errorRatePercentage: 0.5,
        failureThreshold: 4,
        failureCount: 0,
        lastSuccessfulCheck: isoNow,
        recentFailures: [],
        cooldownPeriodMs: 30000,
        halfOpenMaxProbes: 2,
      },
      {
        id: 'dep-sendgrid',
        name: 'SendGrid Email API',
        serviceType: 'Messaging',
        healthStatus: 'HEALTHY',
        circuitBreakerState: 'CLOSED',
        responseLatencyMs: 195,
        errorRatePercentage: 1.1,
        failureThreshold: 5,
        failureCount: 1,
        lastSuccessfulCheck: isoNow,
        recentFailures: [],
        cooldownPeriodMs: 30000,
        halfOpenMaxProbes: 3,
      },
      {
        id: 'dep-snowflake',
        name: 'Snowflake Ingestion API',
        serviceType: 'Analytics Warehouse',
        healthStatus: 'HEALTHY',
        circuitBreakerState: 'CLOSED',
        responseLatencyMs: 820,
        errorRatePercentage: 0.8,
        failureThreshold: 3,
        failureCount: 0,
        lastSuccessfulCheck: isoNow,
        recentFailures: [],
        cooldownPeriodMs: 60000,
        halfOpenMaxProbes: 2,
      },
    ];
    this.data.dependencies = deps;

    // 5. Historical & Active Executions
    const execFailed: WorkflowExecution = {
      id: 'exec-ord-792841',
      workflowId: orderWorkflow.id,
      workflowName: orderWorkflow.name,
      workflowVersion: 3,
      workspaceId: defaultWorkspace.id,
      status: 'FAILED',
      startedAt: oneHourAgo,
      completedAt: new Date(now.getTime() - 3550000).toISOString(),
      durationMs: 5120,
      currentStepId: 'step-payment',
      triggerSource: 'MANUAL',
      idempotencyKey: 'idem-ord-792841-init',
      steps: [
        {
          id: 'step-exec-1',
          nodeId: 'step-validate',
          nodeName: '1. Validate Order',
          nodeType: 'validate_data',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 2,
          startedAt: oneHourAgo,
          completedAt: new Date(now.getTime() - 3598000).toISOString(),
          durationMs: 240,
          output: { validated: true, itemsCount: 3, totalAmount: 249.99 },
        },
        {
          id: 'step-exec-2',
          nodeId: 'step-inventory',
          nodeName: '2. Check Inventory',
          nodeType: 'inventory_check',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 3,
          startedAt: new Date(now.getTime() - 3597000).toISOString(),
          completedAt: new Date(now.getTime() - 3592000).toISOString(),
          durationMs: 510,
          output: { reservationId: 'res-sap-90312', stockConfirmed: true },
        },
        {
          id: 'step-exec-3',
          nodeId: 'step-payment',
          nodeName: '3. Process Payment',
          nodeType: 'payment_process',
          status: 'FAILED',
          retryCount: 2,
          maxRetries: 2,
          startedAt: new Date(now.getTime() - 3591000).toISOString(),
          completedAt: new Date(now.getTime() - 3550000).toISOString(),
          durationMs: 4370,
          error: {
            code: 'ETIMEDOUT',
            message:
              'Upstream HTTP request timed out after 5000ms while negotiating charge token on Stripe Payment Gateway',
            category: 'Network timeout',
            httpStatus: 504,
            stack:
              'GatewayTimeoutError: Connect Timeout to api.stripe.com:443\n at ClientRequest.emit (node:events:517:28)\n at Socket.socketErrorListener (node:_http_client:501:9)',
          },
          idempotencyKey: 'pay-tx-ord792841-k82',
        },
        {
          id: 'step-exec-4',
          nodeId: 'step-invoice',
          nodeName: '4. Generate Invoice',
          nodeType: 'invoice_generate',
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 2,
          startedAt: new Date(now.getTime() - 3550000).toISOString(),
        },
        {
          id: 'step-exec-5',
          nodeId: 'step-notification',
          nodeName: '5. Send Order Confirmation',
          nodeType: 'notification',
          status: 'PENDING',
          retryCount: 0,
          maxRetries: 3,
          startedAt: new Date(now.getTime() - 3550000).toISOString(),
        },
      ],
    };

    const execSuccess1: WorkflowExecution = {
      id: 'exec-ord-792820',
      workflowId: orderWorkflow.id,
      workflowName: orderWorkflow.name,
      workflowVersion: 3,
      workspaceId: defaultWorkspace.id,
      status: 'SUCCEEDED',
      startedAt: twoHoursAgo,
      completedAt: new Date(now.getTime() - 7196500).toISOString(),
      durationMs: 3480,
      triggerSource: 'SCHEDULED',
      idempotencyKey: 'idem-ord-792820',
      steps: [
        {
          id: 'step-s1',
          nodeId: 'step-validate',
          nodeName: '1. Validate Order',
          nodeType: 'validate_data',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 2,
          startedAt: twoHoursAgo,
          completedAt: new Date(now.getTime() - 7199700).toISOString(),
          durationMs: 210,
        },
        {
          id: 'step-s2',
          nodeId: 'step-inventory',
          nodeName: '2. Check Inventory',
          nodeType: 'inventory_check',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 3,
          startedAt: new Date(now.getTime() - 7199600).toISOString(),
          completedAt: new Date(now.getTime() - 7199100).toISOString(),
          durationMs: 490,
        },
        {
          id: 'step-s3',
          nodeId: 'step-payment',
          nodeName: '3. Process Payment',
          nodeType: 'payment_process',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 2,
          startedAt: new Date(now.getTime() - 7199000).toISOString(),
          completedAt: new Date(now.getTime() - 7197800).toISOString(),
          durationMs: 1210,
        },
        {
          id: 'step-s4',
          nodeId: 'step-invoice',
          nodeName: '4. Generate Invoice',
          nodeType: 'invoice_generate',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 2,
          startedAt: new Date(now.getTime() - 7197700).toISOString(),
          completedAt: new Date(now.getTime() - 7197000).toISOString(),
          durationMs: 720,
        },
        {
          id: 'step-s5',
          nodeId: 'step-notification',
          nodeName: '5. Send Order Confirmation',
          nodeType: 'notification',
          status: 'SUCCEEDED',
          retryCount: 0,
          maxRetries: 3,
          startedAt: new Date(now.getTime() - 7196900).toISOString(),
          completedAt: new Date(now.getTime() - 7196500).toISOString(),
          durationMs: 400,
        },
      ],
    };

    this.data.executions = [execFailed, execSuccess1];

    // 6. Logs for the failed execution
    this.data.logs = [
      {
        id: 'log-1',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-1',
        nodeId: 'step-validate',
        level: 'INFO',
        message: 'Order validation payload received. Total: $249.99 for user_id: 88412.',
        timestamp: oneHourAgo,
      },
      {
        id: 'log-2',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-1',
        nodeId: 'step-validate',
        level: 'INFO',
        message: 'Order schema validated successfully against strict JSON spec.',
        timestamp: new Date(now.getTime() - 3598500).toISOString(),
      },
      {
        id: 'log-3',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-2',
        nodeId: 'step-inventory',
        level: 'INFO',
        message: 'Acquired distributed lock for SKU-A109, SKU-B440. Reserving 3 units in SAP ERP.',
        timestamp: new Date(now.getTime() - 3596000).toISOString(),
      },
      {
        id: 'log-4',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-2',
        nodeId: 'step-inventory',
        level: 'INFO',
        message: 'Stock reservation verified. Reservation ID: res-sap-90312.',
        timestamp: new Date(now.getTime() - 3592500).toISOString(),
      },
      {
        id: 'log-5',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-3',
        nodeId: 'step-payment',
        level: 'INFO',
        message: 'Initiating Stripe Payment Gateway charge with idempotency key pay-tx-ord792841-k82.',
        timestamp: new Date(now.getTime() - 3590000).toISOString(),
      },
      {
        id: 'log-6',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-3',
        nodeId: 'step-payment',
        level: 'WARN',
        message: 'Payment attempt 1 timed out after 2000ms. Retrying with backoff (retry 1/2)...',
        timestamp: new Date(now.getTime() - 3570000).toISOString(),
      },
      {
        id: 'log-7',
        executionId: execFailed.id,
        stepExecutionId: 'step-exec-3',
        nodeId: 'step-payment',
        level: 'ERROR',
        message:
          'Fatal: ETIMEDOUT Connect Timeout while waiting for TLS handshake with api.stripe.com:443. HTTP 504 Gateway Timeout returned from regional edge proxy.',
        timestamp: new Date(now.getTime() - 3550000).toISOString(),
        metadata: {
          errorCategory: 'Network timeout',
          httpStatus: 504,
          gateway: 'stripe',
          idempotencyKey: 'pay-tx-ord792841-k82',
        },
      },
    ];

    // 7. Incident
    const incident1: Incident = {
      id: 'inc-94821',
      workspaceId: defaultWorkspace.id,
      workflowId: orderWorkflow.id,
      workflowName: orderWorkflow.name,
      executionId: execFailed.id,
      failedStepId: 'step-payment',
      failedStepName: '3. Process Payment',
      severity: 'CRITICAL',
      status: 'AWAITING_APPROVAL',
      errorCategory: 'Network timeout',
      affectedDependency: 'Stripe Payment Gateway',
      firstOccurrence: oneHourAgo,
      latestOccurrence: oneHourAgo,
      occurrenceCount: 1,
      correlationFingerprint: 'wf-order-processing:step-payment:ETIMEDOUT:504',
      rootCauseHypothesis:
        'Stripe Payment Gateway experienced an upstream regional gateway timeout (HTTP 504) during high peak traffic. Previous transaction verification confirmed no duplicate charge occurred on the cardholder account.',
      evidence: [
        'Execution log indicates HTTP 504 Gateway Timeout on api.stripe.com:443.',
        'Stripe Payment Gateway circuit breaker tripped to HALF_OPEN state (latency spiked to 3,420ms).',
        'Idempotency key pay-tx-ord792841-k82 verified in pending ledger without settlement.',
      ],
      investigationId: 'inv-89102',
      recoveryActionId: 'rec-act-4410',
      assignedTo: operatorUser.id,
      assignedToName: operatorUser.name,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    };
    this.data.incidents = [incident1];

    // 8. Investigation
    const investigation1: Investigation = {
      id: 'inv-89102',
      incidentId: incident1.id,
      executionId: execFailed.id,
      workflowId: orderWorkflow.id,
      model: 'gemini-3.8-flash',
      usedFallback: false,
      incidentSummary:
        'Transient HTTP 504 Network Timeout on step "3. Process Payment" caused execution halt in E-Commerce Order Processing Pipeline.',
      probableRootCause:
        'The Stripe edge proxy timed out after 5,000ms while waiting for payment processor acknowledgment. Correlation with historical incidents reveals a 96% match with transient cloud network blips.',
      observedEvidence: [
        'Error code ETIMEDOUT with HTTP 504 status code.',
        'No authorization confirmation payload registered in payment records.',
        'Preceding steps "Validate Order" and "Check Inventory" executed successfully with verified state.',
      ],
      alternativeExplanations: [
        'Network throttling due to temporary rate-limiting headers.',
        'DNS resolution latency in local VPC egress gateway.',
      ],
      failureCategory: 'Network timeout',
      impactAssessment:
        'Order #792841 with $249.99 total value is blocked. Inventory reservation expires in 25 minutes unless resumed.',
      recommendedRecoveryAction: 'RESUME_STEP',
      recoveryPrerequisites: [
        'Verify zero charges posted using idempotency key pay-tx-ord792841-k82.',
        'Check circuit breaker health on Stripe Payment Gateway.',
        'Human operator approval required before re-triggering charge sequence.',
      ],
      expectedOutcome:
        'Workflow resumes execution directly from step 3 ("Process Payment"), executes invoice generation and delivers confirmation without re-running inventory check.',
      riskLevel: 'LOW',
      confidenceScore: 0.94,
      confidenceExplanation:
        'High confidence based on verified idempotency protection and transient nature of HTTP 504 timeouts.',
      humanApprovalRequired: true,
      tokensUsed: 684,
      estimatedCostUsd: 0.00018,
      createdAt: oneHourAgo,
    };
    this.data.investigations = [investigation1];

    // 9. Proposed Recovery Action
    const recAction1: RecoveryAction = {
      id: 'rec-act-4410',
      incidentId: incident1.id,
      executionId: execFailed.id,
      workflowId: orderWorkflow.id,
      stepId: 'step-payment',
      actionType: 'RESUME_STEP',
      description:
        'Safely resume workflow execution from failed payment step using verified idempotency key pay-tx-ord792841-k82.',
      whyRecommended:
        'Payment gateway connectivity has stabilized. Inventory reservation is intact. Idempotency guarantees zero duplicate billing.',
      supportingEvidence: [
        'Stripe Payment Gateway latency returned below 350ms.',
        'Ledger inquiry verified 0 transactions settled under key pay-tx-ord792841-k82.',
      ],
      expectedBenefit: 'Recovers blocked $249.99 transaction without requiring customer cart reentry.',
      potentialRisk: 'If idempotency key were corrupted, duplicate charge could occur (mitigated by key hashing).',
      riskLevel: 'LOW',
      isSafeToAutoExecute: false,
      approvalStatus: 'PENDING',
      approvalExpiresAt: new Date(now.getTime() + 7200000).toISOString(),
      idempotencyKey: 'idem-rec-792841-rev1',
      dryRunResult: {
        safe: true,
        simulatedOutcome:
          'Preflight verification passed: Inventory lock active, Stripe ping 142ms, Idempotency token valid.',
        warnings: [],
        precheckPassed: true,
      },
      createdAt: oneHourAgo,
    };
    this.data.recoveryActions = [recAction1];

    // 10. SLA Policies
    const sla1: SlaPolicy = {
      id: 'sla-order-pipeline',
      workflowId: orderWorkflow.id,
      workflowName: orderWorkflow.name,
      targetAvailabilityPercent: 99.95,
      currentAvailabilityPercent: 99.88,
      maxExecutionDurationMs: 4500,
      p95DurationMs: 3820,
      p99DurationMs: 4910,
      errorBudgetMinutes: 43.2,
      errorBudgetBurnedMinutes: 8.4,
      mttrMinutes: 4.8,
      mttdMinutes: 0.9,
      breachCount: 1,
      lastBreachAt: oneHourAgo,
    };

    const sla2: SlaPolicy = {
      id: 'sla-snowflake-batch',
      workflowId: analyticsSyncWorkflow.id,
      workflowName: analyticsSyncWorkflow.name,
      targetAvailabilityPercent: 99.5,
      currentAvailabilityPercent: 99.92,
      maxExecutionDurationMs: 18000,
      p95DurationMs: 14200,
      p99DurationMs: 16800,
      errorBudgetMinutes: 216.0,
      errorBudgetBurnedMinutes: 12.0,
      mttrMinutes: 8.5,
      mttdMinutes: 1.2,
      breachCount: 0,
    };
    this.data.slaPolicies = [sla1, sla2];

    // 11. Notifications
    this.data.notifications = [
      {
        id: 'notif-1',
        workspaceId: defaultWorkspace.id,
        title: 'Critical Incident Opened',
        message:
          'Workflow "E-Commerce Order Processing Pipeline" failed on step 3 (Process Payment) with HTTP 504.',
        severity: 'CRITICAL',
        type: 'INCIDENT',
        link: '/incidents/inc-94821',
        isRead: false,
        createdAt: oneHourAgo,
      },
      {
        id: 'notif-2',
        workspaceId: defaultWorkspace.id,
        title: 'Recovery Approval Pending',
        message:
          'AI-recommended recovery action (Resume Step with Idempotency) requires operator sign-off.',
        severity: 'WARNING',
        type: 'RECOVERY_APPROVAL',
        link: '/recovery',
        isRead: false,
        createdAt: oneHourAgo,
      },
      {
        id: 'notif-3',
        workspaceId: defaultWorkspace.id,
        title: 'SLA Burn Warning',
        message: 'Order Processing Pipeline has consumed 19.4% of monthly error budget.',
        severity: 'WARNING',
        type: 'SLA_BREACH',
        link: '/sla',
        isRead: true,
        createdAt: twoHoursAgo,
      },
    ];

    // 12. Security Audit Logs
    this.data.auditLogs = [
      {
        id: 'audit-1',
        workspaceId: defaultWorkspace.id,
        actorId: operatorUser.id,
        actorName: operatorUser.name,
        actorRole: operatorUser.role,
        action: 'WORKFLOW_EXECUTION_TRIGGERED',
        targetResource: 'WorkflowExecution',
        resourceId: execFailed.id,
        outcome: 'SUCCESS',
        summary: 'Operator Sarah Chen triggered execution of E-Commerce Order Processing Pipeline.',
        timestamp: oneHourAgo,
      },
      {
        id: 'audit-2',
        workspaceId: defaultWorkspace.id,
        actorId: 'system-agent',
        actorName: 'FlowPilot Incident Engine',
        actorRole: 'ADMIN',
        action: 'INCIDENT_CREATED',
        targetResource: 'Incident',
        resourceId: incident1.id,
        outcome: 'SUCCESS',
        summary:
          'Incident #94821 auto-created for ETIMEDOUT failure in step 3 (Process Payment).',
        timestamp: oneHourAgo,
      },
      {
        id: 'audit-3',
        workspaceId: defaultWorkspace.id,
        actorId: 'gemini-agent',
        actorName: 'Gemini 3.8 Flash Engine',
        actorRole: 'ADMIN',
        action: 'AI_INVESTIGATION_COMPLETED',
        targetResource: 'Investigation',
        resourceId: investigation1.id,
        outcome: 'SUCCESS',
        summary: 'Root-cause analysis completed. Identified 94% confidence transient network timeout.',
        timestamp: oneHourAgo,
      },
    ];

    // 13. Inspected Deployed Projects
    const seedInspection: ProjectUrlInspection = {
      id: 'insp-seed-01',
      url: 'https://api.acmestore.internal/checkout/v2',
      hostname: 'api.acmestore.internal',
      status: 200,
      statusText: 'OK',
      totalLatencyMs: 1420,
      dnsTimeMs: 28,
      tcpTimeMs: 44,
      ttfbMs: 1240,
      downloadTimeMs: 108,
      contentLengthBytes: 4210,
      contentType: 'application/json',
      isLagging: true,
      laggingPhase: 'SERVER_TTFB',
      laggingSeverity: 'CRITICAL',
      bottleneckSummary:
        'Severe Server TTFB Lag: Database queries and backend handler taking 1,240ms (87% of total response time). Exceeds SLA threshold (400ms).',
      recommendations: [
        'Add Redis caching layer for read-heavy cart calculations.',
        'Review database indexes on checkout_sessions and inventory_locks.',
        'Enable connection pooling on primary database replica.',
      ],
      inspectedAt: isoNow,
    };
    this.data.inspectedProjects = [seedInspection];
  }

  // Generic collection accessors
  public getWorkspaces(): Workspace[] {
    return this.data.workspaces;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    if (this.isMongoConnected && this.mongoDb) {
      this.mongoDb.collection('users').updateOne({ id: user.id }, { $set: user }, { upsert: true }).catch((err) => {
        console.error('Failed to sync user to MongoDB:', err);
      });
    }
    return user;
  }


  public getWorkflows(workspaceId?: string): Workflow[] {
    if (workspaceId) {
      return this.data.workflows.filter((w) => w.workspaceId === workspaceId);
    }
    return this.data.workflows;
  }

  public getWorkflowById(id: string): Workflow | undefined {
    return this.data.workflows.find((w) => w.id === id);
  }

  public saveWorkflow(workflow: Workflow): Workflow {
    const idx = this.data.workflows.findIndex((w) => w.id === workflow.id);
    if (idx >= 0) {
      this.data.workflows[idx] = workflow;
    } else {
      this.data.workflows.push(workflow);
    }
    this.save();
    return workflow;
  }

  public deleteWorkflow(id: string): boolean {
    const initLen = this.data.workflows.length;
    this.data.workflows = this.data.workflows.filter((w) => w.id !== id);
    if (this.data.workflows.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getWorkspaceById(id: string): Workspace | undefined {
    return this.data.workspaces.find((w) => w.id === id);
  }

  public saveWorkspace(workspace: Workspace): Workspace {
    const idx = this.data.workspaces.findIndex((w) => w.id === workspace.id);
    if (idx >= 0) {
      this.data.workspaces[idx] = workspace;
    } else {
      this.data.workspaces.push(workspace);
    }
    this.save();
    return workspace;
  }

  public purgeWorkspaceECommerceData(workspaceId: string): void {
    this.data.workflows = this.data.workflows.filter((w) => w.workspaceId !== workspaceId);
    this.data.executions = this.data.executions.filter((e) => e.workspaceId !== workspaceId);
    this.data.incidents = this.data.incidents.filter((i) => i.workspaceId !== workspaceId);
    this.data.recoveryActions = this.data.recoveryActions.filter((r) => r.workspaceId !== workspaceId);
    this.data.dependencies = this.data.dependencies.filter((d) => d.workspaceId !== workspaceId);
    this.save();
  }

  public provisionApplicationWorkflows(workspaceId: string, rawUrl: string, customAppName?: string): {
    appName: string;
    workflows: Workflow[];
    dependencies: DependencyHealth[];
  } {
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let hostname = 'app.example.com';
    try {
      hostname = new URL(cleanUrl).hostname;
    } catch {
      hostname = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
    }

    let derivedName = customAppName?.trim();
    if (!derivedName) {
      const parts = hostname.replace(/^www\./, '').split('.');
      const mainPart = parts[0] || 'My App';
      derivedName =
        mainPart
          .split(/[-_]/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ') + ' Service';
    }

    // Purge previous/e-commerce workflows for this isolated workspace
    this.purgeWorkspaceECommerceData(workspaceId);

    const nowIso = new Date().toISOString();

    // 1. Core Request Pipeline Workflow
    const coreWf: Workflow = {
      id: `wf-${Date.now()}-core`,
      workspaceId,
      name: `${derivedName} Core Request Pipeline`,
      description: `End-to-end request lifecycle for ${cleanUrl} including edge ingress, auth gate, core handler, and database caching.`,
      version: 1,
      status: 'ACTIVE',
      slaTargetMs: 1200,
      slaAvailabilityTarget: 99.95,
      tags: [derivedName.toLowerCase().replace(/\s+/g, '-'), 'live-url', 'production'],
      nodes: [
        {
          id: 'step-dns',
          type: 'validate_data',
          name: '1. Edge DNS & Ingress Handshake',
          description: `Resolves ${hostname} via Anycast edge and verifies SSL handshake.`,
          dependencies: [],
          timeoutMs: 2000,
          maxRetries: 2,
          retryBackoffMs: 500,
          position: { x: 80, y: 160 },
          inputData: { hostname, targetUrl: cleanUrl },
        },
        {
          id: 'step-auth',
          type: 'validate_data',
          name: '2. Auth Gate & WAF Inspection',
          description: 'Validates API session token, rate limits, and Cloudflare WAF policies.',
          dependencies: ['step-dns'],
          timeoutMs: 2500,
          maxRetries: 2,
          retryBackoffMs: 500,
          position: { x: 340, y: 160 },
          dependencyService: `${derivedName} Auth Gateway`,
        },
        {
          id: 'step-service-handler',
          type: 'http_request',
          name: `3. Execute Endpoint (${cleanUrl})`,
          description: `Dispatches live request to target URL ${cleanUrl}.`,
          dependencies: ['step-auth'],
          timeoutMs: 5000,
          maxRetries: 2,
          retryBackoffMs: 1000,
          position: { x: 600, y: 160 },
          dependencyService: `${derivedName} Live Host`,
          inputData: { url: cleanUrl, method: 'GET' },
        },
        {
          id: 'step-db-cache',
          type: 'database_op',
          name: '4. Cache Invalidation & Storage',
          description: 'Persists session state and warms distributed cache.',
          dependencies: ['step-service-handler'],
          timeoutMs: 3000,
          maxRetries: 2,
          retryBackoffMs: 500,
          position: { x: 860, y: 160 },
          dependencyService: `${derivedName} DB Cluster`,
        },
        {
          id: 'step-response-out',
          type: 'notification',
          name: '5. Response Delivery & Telemetry',
          description: 'Emits APM telemetry and delivers HTTP payload to client.',
          dependencies: ['step-db-cache'],
          timeoutMs: 2000,
          maxRetries: 2,
          retryBackoffMs: 500,
          position: { x: 1120, y: 160 },
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 2. Health & Latency Probe Workflow
    const healthWf: Workflow = {
      id: `wf-${Date.now()}-health`,
      workspaceId,
      name: `${derivedName} Live Health & SLA Probe`,
      description: `Continuous uptime heartbeat and latency waterfall monitor verifying HTTP availability at ${cleanUrl}.`,
      version: 1,
      status: 'ACTIVE',
      slaTargetMs: 600,
      slaAvailabilityTarget: 99.99,
      tags: ['uptime-probe', 'latency-audit', 'synthetic-test'],
      nodes: [
        {
          id: 'step-ping',
          type: 'http_request',
          name: `1. Probe ${hostname} Availability`,
          description: `Sends synthetic HTTP GET ping to ${cleanUrl}.`,
          dependencies: [],
          timeoutMs: 3000,
          maxRetries: 3,
          retryBackoffMs: 500,
          position: { x: 100, y: 160 },
        },
        {
          id: 'step-status-check',
          type: 'validate_data',
          name: '2. Verify HTTP 200 OK & SSL Cert',
          description: 'Asserts response status is 200-299 and SSL validity window > 30 days.',
          dependencies: ['step-ping'],
          timeoutMs: 2000,
          maxRetries: 2,
          retryBackoffMs: 500,
          position: { x: 450, y: 160 },
        },
        {
          id: 'step-sla-verify',
          type: 'end',
          name: '3. Log SLA Latency & Metrics',
          description: 'Records TTFB and total duration into platform time-series APM.',
          dependencies: ['step-status-check'],
          timeoutMs: 1500,
          maxRetries: 1,
          retryBackoffMs: 500,
          position: { x: 800, y: 160 },
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.saveWorkflow(coreWf);
    this.saveWorkflow(healthWf);

    // Dependencies for this URL
    const depHost: DependencyHealth = {
      id: `dep-${Date.now()}-host`,
      workspaceId,
      name: `${derivedName} (${hostname})`,
      serviceType: 'Live Deployed Service',
      healthStatus: 'HEALTHY',
      circuitBreakerState: 'CLOSED',
      responseLatencyMs: 185,
      errorRatePercentage: 0,
      failureThreshold: 3,
      failureCount: 0,
      lastSuccessfulCheck: nowIso,
      recentFailures: [],
      cooldownPeriodMs: 30000,
      halfOpenMaxProbes: 3,
    };

    const depEdge: DependencyHealth = {
      id: `dep-${Date.now()}-edge`,
      workspaceId,
      name: `Edge CDN & DNS (${hostname})`,
      serviceType: 'Edge Ingress Gateway',
      healthStatus: 'HEALTHY',
      circuitBreakerState: 'CLOSED',
      responseLatencyMs: 42,
      errorRatePercentage: 0,
      failureThreshold: 4,
      failureCount: 0,
      lastSuccessfulCheck: nowIso,
      recentFailures: [],
      cooldownPeriodMs: 30000,
      halfOpenMaxProbes: 3,
    };

    const depDb: DependencyHealth = {
      id: `dep-${Date.now()}-db`,
      workspaceId,
      name: `${derivedName} Primary Database`,
      serviceType: 'Internal Storage Cluster',
      healthStatus: 'HEALTHY',
      circuitBreakerState: 'CLOSED',
      responseLatencyMs: 28,
      errorRatePercentage: 0,
      failureThreshold: 4,
      failureCount: 0,
      lastSuccessfulCheck: nowIso,
      recentFailures: [],
      cooldownPeriodMs: 45000,
      halfOpenMaxProbes: 3,
    };

    this.saveDependency(depHost);
    this.saveDependency(depEdge);
    this.saveDependency(depDb);

    // Initial Execution
    const initExec: WorkflowExecution = {
      id: `exec-${Date.now()}-init`,
      workflowId: coreWf.id,
      workflowName: coreWf.name,
      workflowVersion: 1,
      workspaceId,
      status: 'SUCCEEDED',
      startedAt: nowIso,
      completedAt: nowIso,
      durationMs: 312,
      triggerSource: 'MANUAL',
      idempotencyKey: `idem-init-${Date.now()}`,
      steps: coreWf.nodes.map((n) => ({
        id: `step-${Date.now()}-${n.id}`,
        nodeId: n.id,
        nodeName: n.name,
        nodeType: n.type,
        status: 'SUCCEEDED',
        retryCount: 0,
        maxRetries: n.maxRetries,
        startedAt: nowIso,
        completedAt: nowIso,
        durationMs: Math.floor(Math.random() * 80) + 30,
        idempotencyKey: `idem-${n.id}`,
      })),
    };
    this.saveExecution(initExec);

    this.addAuditLog({
      id: `audit-${Date.now()}`,
      workspaceId,
      actorId: 'system',
      actorName: 'FlowPilot Engine',
      actorRole: 'ADMIN',
      action: 'WORKFLOW_CREATED',
      targetResource: 'Application',
      resourceId: coreWf.id,
      outcome: 'SUCCESS',
      summary: `Configured active application "${derivedName}" pointing to ${cleanUrl}. Generated 2 dedicated pipelines.`,
      timestamp: nowIso,
    });

    this.save();

    return {
      appName: derivedName,
      workflows: [coreWf, healthWf],
      dependencies: [depHost, depEdge, depDb],
    };
  }

  public getExecutions(workflowId?: string, workspaceId?: string): WorkflowExecution[] {
    let list = this.data.executions;
    if (workspaceId) {
      list = list.filter((e) => e.workspaceId === workspaceId);
    }
    if (workflowId) {
      list = list.filter((e) => e.workflowId === workflowId);
    }
    return [...list].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public getExecutionById(id: string): WorkflowExecution | undefined {
    return this.data.executions.find((e) => e.id === id);
  }

  public saveExecution(exec: WorkflowExecution): WorkflowExecution {
    const idx = this.data.executions.findIndex((e) => e.id === exec.id);
    if (idx >= 0) {
      this.data.executions[idx] = exec;
    } else {
      this.data.executions.unshift(exec);
    }
    this.save();
    return exec;
  }

  public getLogs(executionId?: string): ExecutionLog[] {
    if (executionId) {
      return this.data.logs
        .filter((l) => l.executionId === executionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return this.data.logs;
  }

  public addLog(log: ExecutionLog): ExecutionLog {
    this.data.logs.push(log);
    this.save();
    return log;
  }

  public getIncidents(workspaceId?: string): Incident[] {
    const list = workspaceId
      ? this.data.incidents.filter((i) => i.workspaceId === workspaceId)
      : this.data.incidents;
    return [...list].sort(
      (a, b) => new Date(b.latestOccurrence).getTime() - new Date(a.latestOccurrence).getTime()
    );
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.data.incidents.find((i) => i.id === id);
  }

  public saveIncident(incident: Incident): Incident {
    const idx = this.data.incidents.findIndex((i) => i.id === incident.id);
    if (idx >= 0) {
      this.data.incidents[idx] = incident;
    } else {
      this.data.incidents.unshift(incident);
    }
    this.save();
    return incident;
  }

  public getInvestigations(incidentId?: string): Investigation[] {
    if (incidentId) {
      return this.data.investigations.filter((inv) => inv.incidentId === incidentId);
    }
    return this.data.investigations;
  }

  public getInvestigationById(id: string): Investigation | undefined {
    return this.data.investigations.find((inv) => inv.id === id);
  }

  public saveInvestigation(inv: Investigation): Investigation {
    const idx = this.data.investigations.findIndex((i) => i.id === inv.id);
    if (idx >= 0) {
      this.data.investigations[idx] = inv;
    } else {
      this.data.investigations.unshift(inv);
    }
    this.save();
    return inv;
  }

  public getRecoveryActions(incidentId?: string, workspaceId?: string): RecoveryAction[] {
    let list = this.data.recoveryActions;
    if (workspaceId) {
      list = list.filter((r) => !r.workspaceId || r.workspaceId === workspaceId);
    }
    if (incidentId) {
      list = list.filter((r) => r.incidentId === incidentId);
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getRecoveryActionById(id: string): RecoveryAction | undefined {
    return this.data.recoveryActions.find((r) => r.id === id);
  }

  public saveRecoveryAction(action: RecoveryAction): RecoveryAction {
    const idx = this.data.recoveryActions.findIndex((r) => r.id === action.id);
    if (idx >= 0) {
      this.data.recoveryActions[idx] = action;
    } else {
      this.data.recoveryActions.unshift(action);
    }
    this.save();
    return action;
  }

  public getDependencies(workspaceId?: string): DependencyHealth[] {
    if (workspaceId) {
      return this.data.dependencies.filter((d) => !d.workspaceId || d.workspaceId === workspaceId);
    }
    return this.data.dependencies;
  }

  public getDependencyById(id: string): DependencyHealth | undefined {
    return this.data.dependencies.find((d) => d.id === id);
  }

  public saveDependency(dep: DependencyHealth): DependencyHealth {
    const idx = this.data.dependencies.findIndex((d) => d.id === dep.id);
    if (idx >= 0) {
      this.data.dependencies[idx] = dep;
    } else {
      this.data.dependencies.push(dep);
    }
    this.save();
    return dep;
  }

  public getSlaPolicies(workspaceId?: string): SlaPolicy[] {
    if (workspaceId) {
      return this.data.slaPolicies.filter((p) => !(p as any).workspaceId || (p as any).workspaceId === workspaceId);
    }
    return this.data.slaPolicies;
  }

  public saveSlaPolicy(policy: SlaPolicy): SlaPolicy {
    const idx = this.data.slaPolicies.findIndex((p) => p.id === policy.id);
    if (idx >= 0) {
      this.data.slaPolicies[idx] = policy;
    } else {
      this.data.slaPolicies.push(policy);
    }
    this.save();
    return policy;
  }

  public getAuditLogs(limit: number = 100, workspaceId?: string): AuditLog[] {
    let list = this.data.auditLogs;
    if (workspaceId) {
      list = list.filter((a) => a.workspaceId === workspaceId);
    }
    return [...list]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public addAuditLog(entry: AuditLog): AuditLog {
    this.data.auditLogs.unshift(entry);
    // Keep bounded history
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return entry;
  }

  public getNotifications(workspaceId?: string): Notification[] {
    let list = this.data.notifications;
    if (workspaceId) {
      list = list.filter((n) => !(n as any).workspaceId || (n as any).workspaceId === workspaceId);
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addNotification(n: Notification): Notification {
    this.data.notifications.unshift(n);
    this.save();
    return n;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): void {
    this.data.notifications.forEach((n) => (n.isRead = true));
    this.save();
  }

  public getInspectedProjects(workspaceId?: string): ProjectUrlInspection[] {
    let list = this.data.inspectedProjects || [];
    if (workspaceId) {
      list = list.filter((p) => !p.workspaceId || p.workspaceId === workspaceId);
    }
    return [...list].sort(
      (a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime()
    );
  }

  public addInspectedProject(inspection: ProjectUrlInspection): ProjectUrlInspection {
    if (!this.data.inspectedProjects) {
      this.data.inspectedProjects = [];
    }
    const idx = this.data.inspectedProjects.findIndex((p) => p.url === inspection.url);
    if (idx >= 0) {
      this.data.inspectedProjects[idx] = inspection;
    } else {
      this.data.inspectedProjects.unshift(inspection);
    }
    if (this.data.inspectedProjects.length > 50) {
      this.data.inspectedProjects = this.data.inspectedProjects.slice(0, 50);
    }
    this.save();
    if (this.isMongoConnected && this.mongoDb) {
      this.mongoDb.collection('inspected_projects').updateOne({ id: inspection.id }, { $set: inspection }, { upsert: true }).catch((err) => {
        console.error('Failed to sync inspected project to MongoDB:', err);
      });
    }
    return inspection;
  }

}

export const db = new DocumentDatabase();
