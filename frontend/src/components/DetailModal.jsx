import React from 'react';

export default function DetailModal({ title, children, onClose, onEdit, onDelete, showActions = true }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {showActions && (
          <div className="modal-footer">
            {onDelete && <button className="btn btn-danger btn-sm" onClick={onDelete}><i className="fa-solid fa-trash"></i> Delete</button>}
            {onEdit && <button className="btn btn-primary btn-sm" onClick={onEdit}><i className="fa-solid fa-pen"></i> Edit</button>}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
