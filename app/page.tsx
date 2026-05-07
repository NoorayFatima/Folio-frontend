"use client";
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

export default function Home() {
  const ReactQuill = useMemo(() => dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="quill-loading" />
  }), []);

  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', url: '', description: '', tags: [] });
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const userData = JSON.parse(userStr);
      setUser({ ...userData, token });
      fetchResources(token);
    }
  }, []);

  const fetchResources = async (token) => {
    const response = await fetch('http://localhost:5000/api/resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setResources(Array.isArray(data) ? data : []);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const payload = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password };
    const response = await fetch(`http://localhost:5000/api/auth/${authMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      fetchResources(data.token);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(
      editingId ? `http://localhost:5000/api/resources/${editingId}` : 'http://localhost:5000/api/resources',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(formData),
      }
    );
    if (response.ok) {
      setFormData({ title: '', url: '', description: '', tags: [] });
      setEditingId(null);
      setShowAddModal(false);
      fetchResources(user.token);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this note from your vault?")) return;
    await fetch(`http://localhost:5000/api/resources/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    setResources(resources.filter(item => item._id !== id));
  };

  const allTags = [...new Set(resources.flatMap(r => r.tags || []))];

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !activeTag || item.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  // ─── AUTH SCREEN ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="auth-root">
        <div className="auth-bg-texture" />
        <div className="auth-panel">
          <div className="auth-logo-block">
            <span className="auth-logo-eyebrow">Your creative</span>
            <h1 className="auth-logo-title">Folio</h1>
            <div className="auth-logo-rule" />
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === 'register' && (
              <div className="field-group">
                <label className="field-label">Name</label>
                <input
                  type="text"
                  placeholder="Ada Lovelace"
                  className="field-input"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                type="email"
                placeholder="hello@example.com"
                className="field-input"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="field-input"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              {authMode === 'login' ? 'Enter Folio' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'New here? Create an account →' : '← Back to sign in'}
          </p>
        </div>

        <style jsx>{`
          .auth-root {
            min-height: 100vh;
            background: #f5f0e8;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
            overflow: hidden;
          }
          .auth-bg-texture {
            position: absolute;
            inset: 0;
            background-image:
              radial-gradient(circle at 20% 80%, rgba(139,109,56,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139,109,56,0.06) 0%, transparent 50%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M0 30 L60 30 M30 0 L30 60' stroke='%23c4b99a' stroke-width='0.3' stroke-dasharray='2,18'/%3E%3C/svg%3E");
            pointer-events: none;
          }
          .auth-panel {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 400px;
            background: #fefcf7;
            border: 1px solid rgba(139,109,56,0.18);
            border-radius: 4px;
            padding: 3rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.06);
          }
          .auth-logo-block { text-align: center; margin-bottom: 2.5rem; }
          .auth-logo-eyebrow {
            display: block;
            font-family: 'Georgia', serif;
            font-style: italic;
            font-size: 13px;
            letter-spacing: 0.04em;
            color: #8b6d38;
            margin-bottom: 0.25rem;
          }
          .auth-logo-title {
            font-family: 'Georgia', serif;
            font-size: 3.5rem;
            font-weight: 400;
            letter-spacing: -0.02em;
            color: #1a1208;
            margin: 0;
            line-height: 1;
          }
          .auth-logo-rule {
            width: 40px;
            height: 1px;
            background: linear-gradient(to right, transparent, #8b6d38, transparent);
            margin: 1rem auto 0;
          }
          .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
          .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
          .field-label {
            font-family: 'Georgia', serif;
            font-style: italic;
            font-size: 12px;
            color: #8b6d38;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          .field-input {
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(139,109,56,0.3);
            padding: 0.6rem 0;
            font-size: 15px;
            color: #1a1208;
            outline: none;
            transition: border-color 0.2s;
            font-family: inherit;
          }
          .field-input::placeholder { color: rgba(139,109,56,0.35); }
          .field-input:focus { border-bottom-color: #8b6d38; }
          .btn-primary {
            margin-top: 0.5rem;
            background: #1a1208;
            color: #f5f0e8;
            border: none;
            padding: 1rem 2rem;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 2px;
            transition: background 0.2s, transform 0.1s;
          }
          .btn-primary:hover { background: #2d2010; }
          .btn-primary:active { transform: scale(0.99); }
          .auth-switch {
            margin-top: 1.5rem;
            text-align: center;
            font-size: 12px;
            color: #8b6d38;
            cursor: pointer;
            font-style: italic;
            font-family: 'Georgia', serif;
            transition: color 0.2s;
          }
          .auth-switch:hover { color: #1a1208; }
        `}</style>
      </main>
    );
  }

  // ─── MAIN APP ────────────────────────────────────────────────────────────────
  return (
    <main className="app-root">
      <div className="app-bg-texture" />

      {/* ── Masthead ── */}
      <header className="masthead">
        <div className="masthead-inner">
          <div className="masthead-brand">
            <span className="brand-eyebrow">Personal collection of</span>
            <h1 className="brand-title">Folio</h1>
          </div>

          <div className="masthead-center">
            <div className="search-wrap">
              <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M14 14l3.5 3.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search notes, tags…"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="masthead-actions">
            <span className="user-name">{user.username}</span>
            <button onClick={() => setShowAddModal(true)} className="btn-new">
              <span>+</span> New Note
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="btn-ghost"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tag ribbon */}
        {allTags.length > 0 && (
          <div className="tag-ribbon">
            <div className="tag-ribbon-inner">
              <button
                className={`ribbon-tag ${!activeTag ? 'ribbon-tag--active' : ''}`}
                onClick={() => setActiveTag(null)}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`ribbon-tag ${activeTag === tag ? 'ribbon-tag--active' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Count line ── */}
      <div className="count-bar">
        <div className="count-bar-inner">
          <span className="count-label">
            {filteredResources.length === 0
              ? 'No notes found'
              : `${filteredResources.length} note${filteredResources.length !== 1 ? 's' : ''}`
            }
          </span>
          <div className="count-rule" />
        </div>
      </div>

      {/* ── Card Grid ── */}
      <div className="grid-wrap">
        {filteredResources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p className="empty-text">Your vault is empty.<br />Begin collecting what matters.</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary-sm">
              Add First Note
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {filteredResources.map((item, i) => (
              <article key={item._id} className="note-card" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="card-inner">
                  {item.tags?.length > 0 && (
                    <div className="card-tags">
                      {item.tags.map(tag => (
                        <span key={tag} className="card-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <h2 className="card-title">{item.title}</h2>

                  {item.description && (
                    <div
                      className="card-body"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  )}

                  <div className="card-footer">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="card-link">
                        Open source
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                          <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    )}
                    <div className="card-controls">
                      <button
                        onClick={() => { setEditingId(item._id); setFormData(item); setShowAddModal(true); }}
                        className="card-btn"
                      >
                        Edit
                      </button>
                      <span className="card-divider">·</span>
                      <button onClick={() => handleDelete(item._id)} className="card-btn card-btn--danger">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-corner-mark" />
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-panel">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">{editingId ? 'Editing' : 'New entry'}</span>
                <h2 className="modal-title">{editingId ? 'Update Note' : 'Add to Folio'}</h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setEditingId(null); setFormData({ title: '', url: '', description: '', tags: [] }); }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="mfield-group">
                  <label className="mfield-label">Title</label>
                  <input
                    type="text"
                    className="mfield-input mfield-input--lg"
                    placeholder="What is this about?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mfield-group">
                  <label className="mfield-label">Source URL</label>
                  <input
                    type="url"
                    className="mfield-input"
                    placeholder="https://…"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>

                <div className="mfield-group">
                  <label className="mfield-label">Tags</label>
                  <div className="tags-field">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag-pill">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Type & press Enter"
                      className="tag-text-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagInput.trim()) {
                            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                            setTagInput('');
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mfield-group">
                  <label className="mfield-label">Notes</label>
                  <div className="quill-wrap">
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(val) => setFormData({ ...formData, description: val })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit">
                  {editingId ? 'Save Changes' : 'Add to Folio'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* ── Fonts & Reset ── */
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f5f0e8;
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #1a1208;
        }

        /* ── Root layout ── */
        .app-root {
          min-height: 100vh;
          background: #f5f0e8;
          position: relative;
        }
        .app-bg-texture {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(ellipse at 10% 100%, rgba(139,109,56,0.07) 0%, transparent 60%),
            radial-gradient(ellipse at 90% 0%, rgba(139,109,56,0.05) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='0.6' fill='%23c4b99a' opacity='0.5'/%3E%3C/svg%3E");
          z-index: 0;
        }

        /* ── Masthead ── */
        .masthead {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(245,240,232,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(139,109,56,0.15);
        }
        .masthead-inner {
          max-width: 1320px;
          margin: 0 auto;
          padding: 1.2rem 3rem;
          display: grid;
          grid-template-columns: 200px 1fr auto;
          align-items: center;
          gap: 2rem;
        }

        .masthead-brand { display: flex; flex-direction: column; }
        .brand-eyebrow {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #8b6d38;
          text-transform: uppercase;
        }
        .brand-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          color: #1a1208;
          line-height: 1;
        }

        .masthead-center { display: flex; justify-content: center; }
        .search-wrap {
          position: relative;
          width: 100%;
          max-width: 480px;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: rgba(139,109,56,0.5);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(139,109,56,0.2);
          border-radius: 100px;
          padding: 0.65rem 1.2rem 0.65rem 2.8rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1a1208;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .search-input::placeholder { color: rgba(139,109,56,0.4); }
        .search-input:focus { border-color: rgba(139,109,56,0.5); background: rgba(255,255,255,0.9); }

        .masthead-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .user-name {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          color: #8b6d38;
        }
        .btn-new {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #1a1208;
          color: #f5f0e8;
          border: none;
          padding: 0.6rem 1.2rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-new span { font-size: 16px; line-height: 1; font-weight: 300; }
        .btn-new:hover { background: #2d2010; }
        .btn-new:active { transform: scale(0.98); }

        .btn-ghost {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #8b6d38;
          cursor: pointer;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.2s;
          padding: 0.5rem 0;
        }
        .btn-ghost:hover { color: #1a1208; }

        /* ── Tag ribbon ── */
        .tag-ribbon {
          border-top: 1px solid rgba(139,109,56,0.1);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tag-ribbon::-webkit-scrollbar { display: none; }
        .tag-ribbon-inner {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0.5rem 3rem;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .ribbon-tag {
          background: none;
          border: 1px solid rgba(139,109,56,0.2);
          border-radius: 100px;
          padding: 0.3rem 0.9rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8b6d38;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .ribbon-tag:hover { background: rgba(139,109,56,0.08); }
        .ribbon-tag--active {
          background: #1a1208;
          border-color: #1a1208;
          color: #f5f0e8;
        }

        /* ── Count bar ── */
        .count-bar {
          position: relative;
          z-index: 1;
          max-width: 1320px;
          margin: 0 auto;
          padding: 2rem 3rem 0.75rem;
        }
        .count-bar-inner {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .count-label {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          color: #8b6d38;
          white-space: nowrap;
        }
        .count-rule {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(139,109,56,0.25), transparent);
        }

        /* ── Card Grid ── */
        .grid-wrap {
          position: relative;
          z-index: 1;
          max-width: 1320px;
          margin: 0 auto;
          padding: 1rem 3rem 5rem;
        }

        .card-grid {
          columns: 3;
          column-gap: 1.5rem;
        }
        @media (max-width: 1100px) { .card-grid { columns: 2; } }
        @media (max-width: 680px) { .card-grid { columns: 1; } }

        /* ── Note card ── */
        .note-card {
          break-inside: avoid;
          margin-bottom: 1.5rem;
          position: relative;
          opacity: 0;
          animation: cardReveal 0.4s ease forwards;
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-inner {
          background: #fefcf7;
          border: 1px solid rgba(139,109,56,0.12);
          border-radius: 3px;
          padding: 1.6rem 1.8rem 1.4rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.3s, transform 0.2s;
        }
        .note-card:hover .card-inner {
          border-color: rgba(139,109,56,0.3);
          box-shadow: 0 8px 32px rgba(26,18,8,0.08), 0 2px 8px rgba(26,18,8,0.04);
          transform: translateY(-2px);
        }
        /* Top decorative rule */
        .card-inner::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, rgba(139,109,56,0.4), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .note-card:hover .card-inner::before { opacity: 1; }

        .card-corner-mark {
          position: absolute;
          bottom: 0; right: 0;
          width: 0; height: 0;
          border-style: solid;
          border-width: 0 0 18px 18px;
          border-color: transparent transparent rgba(139,109,56,0.1) transparent;
          transition: border-color 0.2s;
          pointer-events: none;
        }
        .note-card:hover .card-corner-mark {
          border-color: transparent transparent rgba(139,109,56,0.2) transparent;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-bottom: 0.75rem;
        }
        .card-tag {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8b6d38;
          background: rgba(139,109,56,0.08);
          border: 1px solid rgba(139,109,56,0.15);
          border-radius: 1px;
          padding: 0.2rem 0.5rem;
        }

        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 500;
          line-height: 1.35;
          color: #1a1208;
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }

        .card-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          line-height: 1.7;
          color: rgba(26,18,8,0.6);
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .card-body p { margin-bottom: 0.5em; }
        .card-body p:last-child { margin-bottom: 0; }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.9rem;
          border-top: 1px dashed rgba(139,109,56,0.18);
        }

        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #8b6d38;
          text-decoration: none;
          transition: color 0.15s;
        }
        .card-link:hover { color: #1a1208; }

        .card-controls {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .note-card:hover .card-controls { opacity: 1; }
        .card-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(26,18,8,0.4);
          cursor: pointer;
          transition: color 0.15s;
          padding: 0.2rem 0;
        }
        .card-btn:hover { color: #1a1208; }
        .card-btn--danger:hover { color: #c0392b; }
        .card-divider { color: rgba(139,109,56,0.3); font-size: 14px; }

        /* ── Empty state ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          gap: 1.25rem;
        }
        .empty-icon {
          font-size: 2.5rem;
          color: rgba(139,109,56,0.3);
          line-height: 1;
        }
        .empty-text {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 1.1rem;
          color: rgba(26,18,8,0.4);
          line-height: 1.6;
        }
        .btn-primary-sm {
          background: #1a1208;
          color: #f5f0e8;
          border: none;
          padding: 0.7rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary-sm:hover { background: #2d2010; }

        /* ── Modal ── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(26,18,8,0.5);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .modal-panel {
          background: #fefcf7;
          border: 1px solid rgba(139,109,56,0.15);
          border-radius: 3px;
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(26,18,8,0.18);
          animation: modalIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem 2.5rem 1.5rem;
          border-bottom: 1px solid rgba(139,109,56,0.12);
          flex-shrink: 0;
        }
        .modal-eyebrow {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8b6d38;
          margin-bottom: 0.2rem;
        }
        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.7rem;
          font-weight: 400;
          color: #1a1208;
          letter-spacing: -0.01em;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: rgba(139,109,56,0.5);
          cursor: pointer;
          line-height: 1;
          padding: 0.25rem;
          transition: color 0.15s;
          margin-top: -0.25rem;
        }
        .modal-close:hover { color: #1a1208; }

        .modal-body { flex: 1; overflow-y: auto; padding: 2rem 2.5rem 2.5rem; }
        .modal-form { display: flex; flex-direction: column; gap: 1.75rem; }

        .mfield-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .mfield-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8b6d38;
        }
        .mfield-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(139,109,56,0.25);
          padding: 0.5rem 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1a1208;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .mfield-input::placeholder { color: rgba(139,109,56,0.3); }
        .mfield-input:focus { border-bottom-color: #8b6d38; }
        .mfield-input--lg {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
        }

        /* Tags field */
        .tags-field {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(139,109,56,0.25);
          min-height: 42px;
          transition: border-color 0.2s;
        }
        .tags-field:focus-within { border-bottom-color: #8b6d38; }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8b6d38;
          background: rgba(139,109,56,0.08);
          border: 1px solid rgba(139,109,56,0.2);
          border-radius: 1px;
          padding: 0.25rem 0.6rem;
        }
        .tag-remove {
          background: none;
          border: none;
          color: rgba(139,109,56,0.5);
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          padding: 0;
          transition: color 0.15s;
        }
        .tag-remove:hover { color: #1a1208; }
        .tag-text-input {
          background: none;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #1a1208;
          flex: 1;
          min-width: 100px;
        }
        .tag-text-input::placeholder { color: rgba(139,109,56,0.3); }

        /* Quill wrapper */
        .quill-loading {
          height: 200px;
          background: rgba(139,109,56,0.04);
          border-radius: 2px;
        }
        .quill-wrap {
          border: 1px solid rgba(139,109,56,0.2);
          border-radius: 2px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .quill-wrap:focus-within { border-color: rgba(139,109,56,0.45); }

        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid rgba(139,109,56,0.12) !important;
          background: rgba(139,109,56,0.025);
          padding: 0.6rem 1rem !important;
          font-family: 'DM Sans', sans-serif !important;
        }
        .ql-container.ql-snow {
          border: none !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
        }
        .ql-editor {
          min-height: 180px !important;
          color: #1a1208 !important;
          padding: 1.2rem 1.25rem !important;
          line-height: 1.75 !important;
        }
        .ql-editor.ql-blank::before {
          color: rgba(139,109,56,0.35) !important;
          font-style: italic !important;
          font-family: 'Playfair Display', serif !important;
        }
        .ql-snow .ql-stroke { stroke: #8b6d38 !important; }
        .ql-snow .ql-fill { fill: #8b6d38 !important; }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke { stroke: #1a1208 !important; }

        /* Submit button */
        .btn-submit {
          background: #1a1208;
          color: #f5f0e8;
          border: none;
          padding: 1rem 2rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          width: 100%;
        }
        .btn-submit:hover { background: #2d2010; }
        .btn-submit:active { transform: scale(0.99); }

        /* Responsive */
        @media (max-width: 900px) {
          .masthead-inner {
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
          }
          .masthead-center { grid-column: 1 / -1; grid-row: 2; }
          .masthead-actions { justify-content: flex-end; }
          .grid-wrap { padding: 0.75rem 1.5rem 4rem; }
          .count-bar { padding: 1.5rem 1.5rem 0.5rem; }
          .tag-ribbon-inner { padding: 0.4rem 1.5rem; }
          .modal-header { padding: 1.5rem 1.5rem 1.25rem; }
          .modal-body { padding: 1.5rem 1.5rem 2rem; }
        }
      `}</style>
    </main>
  );
}