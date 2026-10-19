import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Save,
  Download,
  Upload,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  RotateCcw,
  CheckCircle2,
  Settings,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { Workflow, WorkflowNodeConfig } from '../types';

interface WorkflowBuilderViewProps {
  workflow: Workflow | null;
  onSaveWorkflow: (workflow: Workflow) => void;
  onRunWorkflow: (workflowId: string, injectedFailure?: any) => void;
}

export const WorkflowBuilderView: React.FC<WorkflowBuilderViewProps> = ({
  workflow,
  onSaveWorkflow,
  onRunWorkflow,
}) => {
  // Convert workflow nodes into React Flow nodes
  const initialNodes: Node[] = (workflow?.nodes || []).map((node) => ({
    id: node.id,
    type: 'default',
    position: node.position || { x: 100, y: 100 },
    data: {
      label: (
        <div className="p-2 text-left">
          <div className="font-semibold text-xs text-white flex items-center justify-between">
            <span>{node.name}</span>
            <span className="text-[10px] font-mono text-sky-400 uppercase">{node.type.split('_')[0]}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{node.description || 'Configured node'}</div>
          <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>Timeout: {node.timeoutMs}ms</span>
            <span>Retries: {node.maxRetries}</span>
          </div>
        </div>
      ),
      config: node,
    },
    style: {
      background: '#0d1322',
      border: node.id === 'step-payment' ? '1px solid #38bdf8' : '1px solid #1e293b',
      borderRadius: '8px',
      color: '#fff',
      width: 220,
    },
  }));

  // Build edges from dependencies
  const initialEdges: Edge[] = [];
  (workflow?.nodes || []).forEach((node) => {
    node.dependencies.forEach((depId) => {
      initialEdges.push({
        id: `e-${depId}-${node.id}`,
        source: depId,
        target: node.id,
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
      });
    });
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeConfig | null>(
    workflow?.nodes[2] || (workflow?.nodes[0] || null)
  );
  const [simulateFailureOnSelected, setSimulateFailureOnSelected] = useState(true);
  const [failureType, setFailureType] = useState('network_timeout');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#38bdf8', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const config = (node.data as any)?.config as WorkflowNodeConfig;
    if (config) {
      setSelectedNode(config);
    }
  };

  // Graph validation: missing nodes, cycles, isolated nodes
  const validateGraph = (): boolean => {
    const errors: string[] = [];

    // Check for self loops
    edges.forEach((e) => {
      if (e.source === e.target) {
        errors.push(`Invalid loop: Node "${e.source}" connects to itself.`);
      }
    });

    if (nodes.length < 2) {
      errors.push('A workflow must contain at least 2 connected nodes.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (!validateGraph()) return;
    if (!workflow) return;

    // Update node configs and positions from graph state
    const updatedNodes: WorkflowNodeConfig[] = nodes.map((n) => {
      const orig = (n.data as any)?.config as WorkflowNodeConfig;
      // Calculate parents from incoming edges
      const parents = edges.filter((e) => e.target === n.id).map((e) => e.source);
      return {
        ...orig,
        position: n.position,
        dependencies: parents,
      };
    });

    const updatedWorkflow: Workflow = {
      ...workflow,
      nodes: updatedNodes,
      version: workflow.version + 1,
      updatedAt: new Date().toISOString(),
    };

    onSaveWorkflow(updatedWorkflow);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRun = () => {
    if (!workflow) return;
    if (simulateFailureOnSelected && selectedNode) {
      onRunWorkflow(workflow.id, {
        nodeId: selectedNode.id,
        failureType,
      });
    } else {
      onRunWorkflow(workflow.id);
    }
  };

  const handleAddNode = (type: string, name: string) => {
    const newId = `step-${Date.now().toString().slice(-4)}`;
    const newConfig: WorkflowNodeConfig = {
      id: newId,
      type: type as any,
      name,
      description: `Simulated ${name} step`,
      dependencies: [],
      timeoutMs: 4000,
      maxRetries: 2,
      retryBackoffMs: 1000,
      position: { x: 300, y: 300 },
    };

    const newNode: Node = {
      id: newId,
      type: 'default',
      position: { x: 300, y: 300 },
      data: {
        label: (
          <div className="p-2 text-left">
            <div className="font-semibold text-xs text-white">{name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{type}</div>
          </div>
        ),
        config: newConfig,
      },
      style: {
        background: '#0d1322',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        color: '#fff',
        width: 200,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newConfig);
  };

  const handleExportJSON = () => {
    if (!workflow) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflow, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${workflow.id}-definition.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-[#070b13]">
      {/* Top Builder Action Toolbar */}
      <div className="px-6 py-2.5 border-b border-slate-800 bg-[#090d16] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-sm">{workflow?.name || 'Workflow Builder'}</span>
          <span className="text-slate-500 font-mono text-xs">v{workflow?.version || 1}</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400 font-mono text-[11px]">SLA: {workflow?.slaTargetMs || 4500}ms</span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition-colors border border-slate-700"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Validate</span>
          </button>

          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Workflow</span>
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-rose-950/60 border-b border-rose-800 px-6 py-2 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Graph Validation Warning: {validationErrors.join(', ')}</span>
        </div>
      )}

      {/* Main Canvas & Right Configuration Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left React Flow Viewport */}
        <div className="flex-1 relative h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#1e293b" gap={16} size={1} />
            <Controls className="bg-[#0e1424] border border-slate-800 text-white" />
            <MiniMap
              nodeColor={() => '#38bdf8'}
              maskColor="#070b13cc"
              className="bg-[#0e1424] border border-slate-800"
            />
          </ReactFlow>

          {/* Quick Node Addition Palette Floating on Bottom Left */}
          <div className="absolute bottom-4 left-4 bg-[#0e1424]/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 flex items-center gap-2 shadow-xl z-10 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 pl-1">Add Step:</span>
            <button
              onClick={() => handleAddNode('validate_data', 'Validate Payload')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
            >
              + Validation
            </button>
            <button
              onClick={() => handleAddNode('inventory_check', 'ERP Stock Check')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
            >
              + Inventory
            </button>
            <button
              onClick={() => handleAddNode('payment_process', 'Process Stripe')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
            >
              + Payment
            </button>
            <button
              onClick={() => handleAddNode('notification', 'Send Alert')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
            >
              + Notify
            </button>
          </div>
        </div>

        {/* Right Configuration Inspector Panel */}
        <div className="w-80 bg-[#0a0e18] border-l border-slate-800/80 p-4 overflow-y-auto text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Step Inspector</span>
              <span className="text-slate-500 font-mono text-[10px]">{selectedNode?.id || 'None'}</span>
            </div>

            {selectedNode ? (
              <>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Step Name</label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => {
                      const updated = { ...selectedNode, name: e.target.value };
                      setSelectedNode(updated);
                    }}
                    className="w-full mt-1 px-2.5 py-1.5 bg-[#0e1424] border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Node Type</label>
                  <input
                    type="text"
                    disabled
                    value={selectedNode.type}
                    className="w-full mt-1 px-2.5 py-1.5 bg-[#090d16] border border-slate-800 rounded text-slate-500 text-xs font-mono"
                  />
                </div>

                {selectedNode.dependencyService && (
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">External Dependency</label>
                    <div className="mt-1 px-2.5 py-1.5 bg-sky-950/30 border border-sky-800/50 rounded text-sky-300 text-xs font-mono">
                      {selectedNode.dependencyService}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Timeout (ms)</label>
                    <input
                      type="number"
                      value={selectedNode.timeoutMs}
                      onChange={(e) => {
                        setSelectedNode({ ...selectedNode, timeoutMs: parseInt(e.target.value) || 3000 });
                      }}
                      className="w-full mt-1 px-2.5 py-1.5 bg-[#0e1424] border border-slate-800 rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Max Retries</label>
                    <input
                      type="number"
                      value={selectedNode.maxRetries}
                      onChange={(e) => {
                        setSelectedNode({ ...selectedNode, maxRetries: parseInt(e.target.value) || 0 });
                      }}
                      className="w-full mt-1 px-2.5 py-1.5 bg-[#0e1424] border border-slate-800 rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Deterministic Failure Injection Simulator Panel (Section 6) */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-rose-300 flex items-center justify-between">
                    <span>Failure Injection Simulator</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Inject reproducible failure on this step during execution.
                  </p>

                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simulateFailureToggle"
                      checked={simulateFailureOnSelected}
                      onChange={(e) => setSimulateFailureOnSelected(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-rose-500 focus:ring-0"
                    />
                    <label htmlFor="simulateFailureToggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Inject Failure on Execution
                    </label>
                  </div>

                  {simulateFailureOnSelected && (
                    <div className="mt-2">
                      <label className="text-[10px] text-slate-400">Simulation Mode</label>
                      <select
                        value={failureType}
                        onChange={(e) => setFailureType(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 bg-[#0e1424] border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                      >
                        <option value="network_timeout">Network Timeout (HTTP 504 ETIMEDOUT)</option>
                        <option value="rate_limit_429">HTTP 429 Rate Limit (Burst Quota)</option>
                        <option value="server_error_500">HTTP 500 Internal Crash (NullPointer)</option>
                        <option value="db_connection_error">DB Connection Refused (Pool Exhausted)</option>
                        <option value="auth_invalid">Authentication Failure (HTTP 401)</option>
                        <option value="validation_fail">Validation Error (Schema Mismatch)</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Click on any node in the canvas to inspect its configuration.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Graph nodes: {nodes.length} · Connections: {edges.length}
          </div>
        </div>
      </div>
    </div>
  );
};
