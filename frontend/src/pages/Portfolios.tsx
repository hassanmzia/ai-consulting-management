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

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  sent: 'bg-blue-100 text-blue-700',
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Portfolio Preview</h2>
          <button onClick={() => setPreview(null)} className="btn-secondary">Back to List</button>
        </div>
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden max-w-4xl mx-auto">
          {/* Header */}
          <div className="p-8 text-white" style={{ background: preview.brand_color || '#1E3A8A' }}>
            <h1 className="text-3xl font-bold">{preview.title}</h1>
            <p className="mt-2 opacity-90">Prepared for {preview.client_name || 'Client'}</p>
            {preview.brand_name && <p className="mt-1 text-sm opacity-75">By {preview.brand_name}</p>}
          </div>
          <div className="p-8 space-y-8">
            {preview.executive_summary && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b-2" style={{ borderColor: preview.brand_color || '#1E3A8A' }}>Executive Summary</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{preview.executive_summary}</p>
              </section>
            )}
            {preview.strategic_opportunities && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b-2" style={{ borderColor: preview.brand_color || '#1E3A8A' }}>Strategic Opportunities</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{preview.strategic_opportunities}</p>
              </section>
            )}
            {preview.risk_assessment && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b-2" style={{ borderColor: preview.brand_color || '#1E3A8A' }}>Risk Assessment</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{preview.risk_assessment}</p>
              </section>
            )}
            {preview.professional_insights && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b-2" style={{ borderColor: preview.brand_color || '#1E3A8A' }}>Professional Insights</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{preview.professional_insights}</p>
              </section>
            )}
            {preview.case_study && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b-2" style={{ borderColor: preview.brand_color || '#1E3A8A' }}>Case Study</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{preview.case_study}</p>
              </section>
            )}
          </div>
          <div className="p-6 bg-slate-50 text-center text-sm text-slate-500">
            Generated by ConsultPro | {new Date(preview.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Consulting Portfolios</h2>
          <p className="text-slate-500 mt-1">Build and manage client-ready consulting portfolios</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Portfolio
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 m-4">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit' : 'Create'} Portfolio</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
                    <option value="draft">Draft</option><option value="review">Review</option>
                    <option value="approved">Approved</option><option value="sent">Sent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                  <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="input">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                  <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="input">
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Branding */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-800 mb-3">Brand Identity</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
                    <input value={form.brand_name} onChange={e => setForm({...form, brand_name: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Brand Color</label>
                    <input type="color" value={form.brand_color} onChange={e => setForm({...form, brand_color: e.target.value})} className="h-10 w-full rounded-lg cursor-pointer" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Theme</label>
                    <select value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="input">
                      <option value="light">Light</option><option value="dark">Dark</option>
                    </select></div>
                </div>
              </div>
              {/* Content sections */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-slate-800">Content Sections</h4>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Executive Summary</label>
                  <textarea rows={3} value={form.executive_summary} onChange={e => setForm({...form, executive_summary: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Strategic Opportunities</label>
                  <textarea rows={3} value={form.strategic_opportunities} onChange={e => setForm({...form, strategic_opportunities: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Risk Assessment</label>
                  <textarea rows={3} value={form.risk_assessment} onChange={e => setForm({...form, risk_assessment: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Professional Insights</label>
                  <textarea rows={3} value={form.professional_insights} onChange={e => setForm({...form, professional_insights: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Case Study</label>
                  <textarea rows={3} value={form.case_study} onChange={e => setForm({...form, case_study: e.target.value})} className="input" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} Portfolio</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map(p => (
          <div key={p.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.brand_color || '#1E3A8A' }}>
                <FileText size={20} className="text-white" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] || STATUS_STYLES.draft}`}>
                {p.status}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{p.title}</h3>
            {p.client_name && <p className="text-sm text-slate-500 mb-1">Client: {p.client_name}</p>}
            {p.project_name && <p className="text-sm text-slate-500 mb-1">Project: {p.project_name}</p>}
            {p.brand_name && <p className="text-sm text-slate-400">By {p.brand_name}</p>}
            <p className="text-xs text-slate-400 mt-2">Updated {new Date(p.updated_at).toLocaleDateString()}</p>
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button onClick={() => setPreview(p)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Eye size={14} /> Preview</button>
              <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"><Edit3 size={14} /> Edit</button>
              <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
        {portfolios.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>No portfolios yet. Create your first consulting portfolio.</p>
          </div>
        )}
      </div>
    </div>
  );
}
