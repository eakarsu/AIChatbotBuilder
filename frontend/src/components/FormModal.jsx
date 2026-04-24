import React from 'react';

export default function FormModal({ title, children, onClose, onSubmit, submitLabel = 'Save' }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm"><i className="fa-solid fa-check"></i> {submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
