import React from 'react';
import FlowNodeGraph from '../components/FlowNodeGraph';
import IntentConfidenceHeatmap from '../components/IntentConfidenceHeatmap';
import ConfigExportPDF from '../components/ConfigExportPDF';
import IntentTrainingRulesEditor from '../components/IntentTrainingRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>
          <i className="fa-solid fa-eye" /> Bot Views
        </h1>
        <p style={{ color: 'var(--text-light)', marginTop: 4 }}>
          Custom synthesized views: conversation flow graph, intent confidence heatmap, config export, and training rules editor.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 18 }}>
        <FlowNodeGraph />
        <IntentConfidenceHeatmap />
        <ConfigExportPDF />
        <IntentTrainingRulesEditor />
      </div>
    </div>
  );
}
