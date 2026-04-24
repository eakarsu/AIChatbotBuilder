import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function AIOutput({ content, model, usage, title = 'AI Response' }) {
  if (!content) return null;

  return (
    <div className="ai-output">
      <div className="ai-output-header">
        <i className="fa-solid fa-sparkles"></i>
        <span>{title}</span>
      </div>
      <div className="ai-output-body">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {(model || usage) && (
        <div className="ai-output-meta">
          {model && <span><i className="fa-solid fa-microchip"></i> {model}</span>}
          {usage?.prompt_tokens && <span><i className="fa-solid fa-arrow-up"></i> {usage.prompt_tokens} tokens in</span>}
          {usage?.completion_tokens && <span><i className="fa-solid fa-arrow-down"></i> {usage.completion_tokens} tokens out</span>}
          {usage?.total_tokens && <span><i className="fa-solid fa-calculator"></i> {usage.total_tokens} total</span>}
        </div>
      )}
    </div>
  );
}
