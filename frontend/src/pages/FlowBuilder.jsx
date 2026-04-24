import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../api';
import AIOutput from '../components/AIOutput';

const nodeColors = { start: '#10B981', message: '#3B82F6', condition: '#F59E0B', action: '#8B5CF6', end: '#EF4444' };

const defaultNodes = [
  { id: '1', type: 'default', position: { x: 250, y: 0 }, data: { label: 'Start' }, style: { background: nodeColors.start, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 } },
  { id: '2', type: 'default', position: { x: 250, y: 120 }, data: { label: 'Send Greeting' }, style: { background: nodeColors.message, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 } },
  { id: '3', type: 'default', position: { x: 250, y: 240 }, data: { label: 'Check Intent' }, style: { background: nodeColors.condition, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 } },
  { id: '4', type: 'default', position: { x: 50, y: 370 }, data: { label: 'Handle FAQ' }, style: { background: nodeColors.action, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 } },
  { id: '5', type: 'default', position: { x: 450, y: 370 }, data: { label: 'Escalate' }, style: { background: nodeColors.action, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 } },
  { id: '6', type: 'default', position: { x: 250, y: 500 }, data: { label: 'End' }, style: { background: nodeColors.end, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 } },
];

const defaultEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#4F46E5' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#4F46E5' } },
  { id: 'e3-4', source: '3', target: '4', label: 'FAQ', style: { stroke: '#10B981' } },
  { id: 'e3-5', source: '3', target: '5', label: 'Complex', style: { stroke: '#EF4444' } },
  { id: 'e4-6', source: '4', target: '6', style: { stroke: '#4F46E5' } },
  { id: 'e5-6', source: '5', target: '6', style: { stroke: '#4F46E5' } },
];

export default function FlowBuilder() {
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [nodeCount, setNodeCount] = useState(7);

  useEffect(() => {
    api.getAll('flows').then(data => {
      setFlows(data);
      if (data.length > 0 && !selectedFlow) {
        loadFlow(data[0]);
      }
    }).catch(() => {});
  }, []);

  const loadFlow = (flow) => {
    setSelectedFlow(flow);
    if (flow.nodes && flow.nodes.length > 0) {
      const styled = flow.nodes.map(n => ({
        ...n,
        type: 'default',
        data: { label: n.data?.label || n.label || n.type },
        style: {
          background: nodeColors[n.type] || nodeColors.action,
          color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600,
        },
      }));
      setNodes(styled);
      setEdges((flow.edges || []).map(e => ({ ...e, style: { stroke: '#4F46E5' } })));
      setNodeCount(flow.nodes.length + 1);
    }
  };

  const onConnect = useCallback((params) => setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#4F46E5' } }, eds)), [setEdges]);

  const addNode = (type) => {
    const id = String(nodeCount);
    const newNode = {
      id,
      type: 'default',
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 100 },
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${id}` },
      style: { background: nodeColors[type] || nodeColors.action, color: 'white', borderRadius: '12px', border: 'none', padding: '12px 24px', fontWeight: 600 },
    };
    setNodes(nds => [...nds, newNode]);
    setNodeCount(c => c + 1);
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;
    await api.update('flows', selectedFlow.id, { ...selectedFlow, nodes, edges });
    alert('Flow saved!');
  };

  const generateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const data = await api.aiGenerateFlow({ description: aiPrompt });
      setAiResult(data);
    } catch (err) {
      setAiResult({ suggestion: 'Error: ' + err.message });
    }
    setAiLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Flow Builder</h2><p>Design conversation flows with drag-and-drop</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="form-select" style={{ width: '200px' }} value={selectedFlow?.id || ''} onChange={e => {
            const f = flows.find(fl => fl.id === parseInt(e.target.value));
            if (f) loadFlow(f);
          }}>
            {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={saveFlow}><i className="fa-solid fa-save"></i> Save</button>
        </div>
      </div>

      <div className="flow-canvas">
        <div className="flow-toolbar">
          <button className="btn btn-sm btn-success" onClick={() => addNode('start')}><i className="fa-solid fa-play"></i> Start</button>
          <button className="btn btn-sm" style={{ background: '#3B82F6', color: 'white' }} onClick={() => addNode('message')}><i className="fa-solid fa-message"></i> Message</button>
          <button className="btn btn-sm btn-warning" onClick={() => addNode('condition')}><i className="fa-solid fa-code-branch"></i> Condition</button>
          <button className="btn btn-sm" style={{ background: '#8B5CF6', color: 'white' }} onClick={() => addNode('action')}><i className="fa-solid fa-bolt"></i> Action</button>
          <button className="btn btn-sm btn-danger" onClick={() => addNode('end')}><i className="fa-solid fa-stop"></i> End</button>
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="form-input" style={{ width: '260px', padding: '6px 12px' }} placeholder="Describe flow for AI..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAI()} />
            <button className="btn btn-sm btn-primary" onClick={generateAI} disabled={aiLoading}>{aiLoading ? <><div className="spinner" style={{ width: 16, height: 16, margin: 0 }}></div></> : <><i className="fa-solid fa-sparkles"></i> AI Generate</>}</button>
          </div>
        </div>
        <div style={{ height: 'calc(100% - 52px)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background color="#E2E8F0" gap={20} />
            <Controls />
            <MiniMap style={{ background: '#F8FAFC' }} />
          </ReactFlow>
        </div>
      </div>

      {aiResult && <AIOutput content={aiResult.suggestion} model={aiResult.model} usage={aiResult.usage} title="AI Flow Suggestion" />}
    </div>
  );
}
