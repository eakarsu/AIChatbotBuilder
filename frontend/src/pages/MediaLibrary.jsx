import React, { useState, useEffect } from 'react';
import api from '../api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const typeIcons = { image: 'fa-image', video: 'fa-video', audio: 'fa-music', document: 'fa-file-pdf' };
const typeColors = { image: '#3B82F6', video: '#8B5CF6', audio: '#F59E0B', document: '#EF4444' };

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterFolder, setFilterFolder] = useState('');
  const [form, setForm] = useState({ name: '', file_type: 'image', mime_type: '', file_size: 0, url: '', folder: 'general' });

  const load = () => { setLoading(true); api.getAll('media').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (editing) await api.update('media', editing.id, form);
    else await api.create('media', form);
    setShowForm(false); setEditing(null); load();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, file_type: item.file_type, mime_type: item.mime_type || '', file_size: item.file_size, url: item.url || '', folder: item.folder || 'general' });
    setEditing(item); setSelected(null); setShowForm(true);
  };

  const handleDelete = async (item) => { if (!confirm('Delete this file?')) return; await api.remove('media', item.id); setSelected(null); load(); };

  const folders = [...new Set(items.map(i => i.folder).filter(Boolean))];
  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchFolder = !filterFolder || i.folder === filterFolder;
    return matchSearch && matchFolder;
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Media Library</h2><p>Manage images, videos, and documents</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', file_type: 'image', mime_type: '', file_size: 0, url: '', folder: 'general' }); setEditing(null); setShowForm(true); }}>
          <i className="fa-solid fa-plus"></i> Upload Media
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="fa-solid fa-search"></i><input placeholder="Search media..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="toolbar-actions">
          <select className="form-select" style={{ width: '140px', padding: '8px 12px' }} value={filterFolder} onChange={e => setFilterFolder(e.target.value)}>
            <option value="">All Folders</option>
            {folders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div> Loading...</div> : (
        <div className="card-grid">
          {filtered.map(item => (
            <div key={item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-icon" style={{ background: typeColors[item.file_type] || '#6B7280' }}>
                  <i className={`fa-solid ${typeIcons[item.file_type] || 'fa-file'}`}></i>
                </div>
                <span className="tag">{item.folder}</span>
              </div>
              <div className="card-title">{item.name}</div>
              <div className="card-subtitle">{item.mime_type}</div>
              <div className="card-meta">
                <span><i className="fa-solid fa-weight-hanging"></i> {formatSize(item.file_size)}</span>
                <span><i className="fa-solid fa-clock"></i> {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal title={selected.name} onClose={() => setSelected(null)} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected)}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '16px', background: typeColors[selected.file_type] || '#6B7280', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto' }}>
              <i className={`fa-solid ${typeIcons[selected.file_type] || 'fa-file'}`}></i>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-section"><h4>Type</h4><span className="tag" style={{ background: (typeColors[selected.file_type] || '#6B7280') + '20', color: typeColors[selected.file_type] }}>{selected.file_type}</span></div>
            <div className="detail-section"><h4>MIME Type</h4><div className="detail-value">{selected.mime_type}</div></div>
            <div className="detail-section"><h4>File Size</h4><div className="detail-value">{formatSize(selected.file_size)}</div></div>
            <div className="detail-section"><h4>Folder</h4><span className="tag">{selected.folder}</span></div>
            <div className="detail-section"><h4>Uploaded By</h4><div className="detail-value">{selected.uploaded_by || '-'}</div></div>
            <div className="detail-section"><h4>Created</h4><div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div></div>
          </div>
          <div className="detail-section"><h4>URL</h4><div className="detail-value" style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>{selected.url || 'No URL'}</div></div>
        </DetailModal>
      )}

      {showForm && (
        <FormModal title={editing ? 'Edit Media' : 'Upload Media'} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-row">
            <div className="form-group"><label>File Type</label><select className="form-select" value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })}><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="document">Document</option></select></div>
            <div className="form-group"><label>MIME Type</label><input className="form-input" value={form.mime_type} onChange={e => setForm({ ...form, mime_type: e.target.value })} placeholder="e.g. image/png" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>File Size (bytes)</label><input className="form-input" type="number" value={form.file_size} onChange={e => setForm({ ...form, file_size: parseInt(e.target.value) || 0 })} /></div>
            <div className="form-group"><label>Folder</label><input className="form-input" value={form.folder} onChange={e => setForm({ ...form, folder: e.target.value })} placeholder="e.g. branding, docs" /></div>
          </div>
          <div className="form-group"><label>URL</label><input className="form-input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="File URL..." /></div>
        </FormModal>
      )}
    </div>
  );
}
