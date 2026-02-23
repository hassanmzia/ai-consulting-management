import { useEffect, useState } from 'react';
import { FileText, Plus, Eye, Edit3, Trash2, Send } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface Portfolio {
  id: number;
  title: string;
  status: string;
  client_name?: string;
  project_name?: string;
  brand_name?: string;
  brand_color?: string;
  theme?: string;
  executive_summary?: string;
  strategic_opportunities?: string;
  risk_assessment?: string;
  scenario_analysis?: unknown;
  professional_insights?: string;
  case_study?: string;
  created_at: string;
  updated_at: string;
}

interface Client { id: number; name: string; }
interface Project { id: number; name: string; client_id: number; }

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  sent: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
};

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [preview, setPreview] = useState<Portfolio | null>(null);

  const [form, setForm] = useState({
    title: '', client_id: '', project_id: '', status: 'draft',
    brand_name: '', brand_color: '#1E3A8A', font_choice: 'Helvetica', theme: 'light',
    executive_summary: '', strategic_opportunities: '', risk_assessment: '',
    professional_insights: '', case_study: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [p, c, pr] = await Promise.all([
        fetchApi<Portfolio[]>('/api/portfolios'), fetchApi<Client[]>('/api/clients'), fetchApi<Project[]>('/api/projects')
      ]);
      setPortfolios(p); setClients(c); setProjects(pr);
    } catch { /* handled */ } finally { setLoading(false); }
  }

  function openEdit(p: Portfolio) {
    setEditing(p);
    setForm({
      title: p.title, client_id: String(p.client_name ? clients.find(c => c.name === p.client_name)?.id || '' : ''),
      project_id: String(p.project_name ? projects.find(pr => pr.name === p.project_name)?.id || '' : ''),
      status: p.status, brand_name: p.brand_name || '', brand_color: p.brand_color || '#1E3A8A',
      font_choice: 'Helvetica', theme: p.theme || 'light',
      executive_summary: p.executive_summary || '', strategic_opportunities: p.strategic_opportunities || '',
      risk_assessment: p.risk_assessment || '', professional_insights: p.professional_insights || '',
      case_study: p.case_study || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = { ...form, client_id: form.client_id || null, project_id: form.project_id || null };
      if (editing) {
        await fetchApi(`/api/portfolios/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await fetchApi('/api/portfolios', { method: 'POST', body: JSON.stringify(body) });
      }
      setShowForm(false); setEditing(null);
      setForm({ title: '', client_id: '', project_id: '', status: 'draft', brand_name: '', brand_color: '#1E3A8A', font_choice: 'Helvetica', theme: 'light', executive_summary: '', strategic_opportunities: '', risk_assessment: '', professional_insights: '', case_study: '' });
      loadData();
    } catch { /* handled */ }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this portfolio?')) return;
    await fetchApi(`/api/portfolios/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  // Preview mode
  if (preview) {
    const brandColor = preview.brand_color || '#6366f1';
    const sections = [
      { title: 'Executive Summary', content: preview.executive_summary },
      { title: 'Strategic Opportunities', content: preview.strategic_opportunities },
      { title: 'Risk Assessment', content: preview.risk_assessment },
      { title: 'Professional Insights', content: preview.professional_insights },
      { title: 'Case Study', content: preview.case_study },
    ].filter(s => s.content);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title tracking-tight">Portfolio Preview</h1>
            <p className="page-subtitle mt-1">Review your portfolio before sharing</p>
          </div>
          <button onClick={() => setPreview(null)} className="btn btn-secondary shrink-0">
            Back to List
          </button>
        </div>

        <div className="card overflow-hidden max-w-4xl mx-auto shadow-xl animate-slide-up">
          {/* Gradient Header */}
          <div
            className="relative p-6 sm:p-10 text-white overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd, ${brandColor}bb)`,
            }}
          >
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)',
            }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
                {preview.brand_name && (
                  <span className="text-sm font-semibold text-white/80">{preview.brand_name}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{preview.title}</h1>
              <p className="mt-2 text-white/80 font-medium">
                Prepared for {preview.client_name || 'Client'}
              </p>
              {preview.project_name && (
                <p className="mt-1 text-sm text-white/60">Project: {preview.project_name}</p>
              )}
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 sm:p-10 space-y-8">
            {sections.map((section, idx) => (
              <section key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{section.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-slate-100">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md"
                  style={{ backgroundColor: brandColor }}
                />
                <span className="text-sm font-semibold text-slate-500">
                  {preview.brand_name || 'ConsultPro'}
                </span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {new Date(preview.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title tracking-tight">Portfolios</h1>
          <p className="page-subtitle mt-1">Build and manage client-ready consulting portfolios</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', client_id: '', project_id: '', status: 'draft', brand_name: '', brand_color: '#1E3A8A', font_choice: 'Helvetica', theme: 'light', executive_summary: '', strategic_opportunities: '', risk_assessment: '', professional_insights: '', case_study: '' }); }}
          className="btn btn-primary shrink-0 gap-2"
        >
          <Plus size={16} />
          New Portfolio
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay !items-start pt-4 sm:pt-10 overflow-y-auto">
          <div className="modal-content w-full max-w-3xl p-0 m-2 sm:m-4 !max-w-3xl !rounded-xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-500 to-indigo-600">
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                {editing ? 'Edit' : 'Create'} Portfolio
              </h3>
              <p className="text-indigo-200 text-sm mt-0.5">
                {editing ? 'Update your portfolio details and content' : 'Set up a new consulting portfolio'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Basic Info */}
              <div>
                <h4 className="section-title text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Title *</label>
                    <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" placeholder="Portfolio title..." />
                  </div>
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                      <option value="sent">Sent</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Client</label>
                    <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="input">
                      <option value="">Select client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Project</label>
                    <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="input">
                      <option value="">Select project...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Brand Identity */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="section-title text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Brand Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Brand Name</label>
                    <input value={form.brand_name} onChange={e => setForm({...form, brand_name: e.target.value})} className="input" placeholder="Company name..." />
                  </div>
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.brand_color}
                        onChange={e => setForm({...form, brand_color: e.target.value})}
                        className="h-10 w-14 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-400">{form.brand_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Theme</label>
                    <select value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="input">
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <h4 className="section-title text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Content Sections
                </h4>
                {[
                  { key: 'executive_summary' as const, label: 'Executive Summary', placeholder: 'Provide a high-level overview of findings and recommendations...' },
                  { key: 'strategic_opportunities' as const, label: 'Strategic Opportunities', placeholder: 'Outline key strategic opportunities identified...' },
                  { key: 'risk_assessment' as const, label: 'Risk Assessment', placeholder: 'Detail potential risks and mitigation strategies...' },
                  { key: 'professional_insights' as const, label: 'Professional Insights', placeholder: 'Share expert analysis and professional guidance...' },
                  { key: 'case_study' as const, label: 'Case Study', placeholder: 'Include relevant case studies and examples...' },
                ].map(section => (
                  <div key={section.key}>
                    <label className="label text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">{section.label}</label>
                    <textarea
                      rows={3}
                      value={form[section.key]}
                      onChange={e => setForm({...form, [section.key]: e.target.value})}
                      className="input"
                      placeholder={section.placeholder}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="submit" className="btn btn-primary gap-2">
                  <Send size={14} />
                  {editing ? 'Update' : 'Create'} Portfolio
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio grid */}
      {portfolios.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-4 tracking-tight">No portfolios yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Create your first consulting portfolio to showcase your work and deliver insights to clients.
          </p>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="btn btn-primary mt-5 gap-2"
          >
            <Plus size={16} />
            Create Portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-up">
          {portfolios.map(p => {
            const statusStyle = STATUS_STYLES[p.status] || STATUS_STYLES.draft;
            return (
              <div key={p.id} className="card card-interactive overflow-hidden group">
                {/* Colored top strip */}
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${p.brand_color || '#6366f1'}, ${p.brand_color || '#6366f1'}88)`,
                  }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="icon-box icon-box-md rounded-xl text-white shadow-lg"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${p.brand_color || '#6366f1'}, ${p.brand_color || '#6366f1'}cc)`,
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <span className={`badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                    {p.title}
                  </h3>

                  <div className="space-y-1 mb-3">
                    {p.client_name && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">CLIENT</span>
                        <span className="text-slate-300">|</span>
                        {p.client_name}
                      </p>
                    )}
                    {p.project_name && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">PROJECT</span>
                        <span className="text-slate-300">|</span>
                        {p.project_name}
                      </p>
                    )}
                    {p.brand_name && (
                      <p className="text-sm text-slate-400 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">BRAND</span>
                        <span className="text-slate-300">|</span>
                        {p.brand_name}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Updated {new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-1 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setPreview(p)}
                      className="btn btn-ghost text-sm gap-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="btn btn-ghost text-sm gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-ghost text-sm gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
