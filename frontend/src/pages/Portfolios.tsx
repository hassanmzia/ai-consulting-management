import { useEffect, useState } from 'react';
import { FileText, Plus, Eye, Edit3, Trash2, Send, ArrowLeft } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface Portfolio {
  id: number; title: string; status: string;
  client_name?: string; project_name?: string;
  brand_name?: string; brand_color?: string; theme?: string;
  executive_summary?: string; strategic_opportunities?: string;
  risk_assessment?: string; professional_insights?: string; case_study?: string;
  created_at: string; updated_at: string;
  scenario_analysis?: unknown;
}
interface Client { id: number; name: string; }
interface Project { id: number; name: string; client_id: number; }

const STATUS_STYLES: Record<string, string> = {
  draft: 'badge-draft', review: 'badge-pending', approved: 'badge-active', sent: 'badge-sent',
};

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [preview, setPreview] = useState<Portfolio | null>(null);

  const defaultForm = {
    title: '', client_id: '', project_id: '', status: 'draft',
    brand_name: '', brand_color: '#2563eb', font_choice: 'Helvetica', theme: 'light',
    executive_summary: '', strategic_opportunities: '', risk_assessment: '',
    professional_insights: '', case_study: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [p, c, pr] = await Promise.all([
        fetchApi<Portfolio[]>('/api/portfolios'),
        fetchApi<Client[]>('/api/clients'),
        fetchApi<Project[]>('/api/projects'),
      ]);
      setPortfolios(p); setClients(c); setProjects(pr);
    } catch { /* */ } finally { setLoading(false); }
  }

  function openEdit(p: Portfolio) {
    setEditing(p);
    setForm({
      title: p.title,
      client_id: String(p.client_name ? clients.find(c => c.name === p.client_name)?.id || '' : ''),
      project_id: String(p.project_name ? projects.find(pr => pr.name === p.project_name)?.id || '' : ''),
      status: p.status, brand_name: p.brand_name || '', brand_color: p.brand_color || '#2563eb',
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
      setShowForm(false); setEditing(null); setForm(defaultForm); loadData();
    } catch { /* */ }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this portfolio?')) return;
    await fetchApi(`/api/portfolios/${id}`, { method: 'DELETE' });
    loadData();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  // Preview
  if (preview) {
    const brandColor = preview.brand_color || '#2563eb';
    const sections = [
      { title: 'Executive Summary', content: preview.executive_summary },
      { title: 'Strategic Opportunities', content: preview.strategic_opportunities },
      { title: 'Risk Assessment', content: preview.risk_assessment },
      { title: 'Professional Insights', content: preview.professional_insights },
      { title: 'Case Study', content: preview.case_study },
    ].filter(s => s.content);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button onClick={() => setPreview(null)} className="btn btn-ghost text-sm"><ArrowLeft size={15} /> Back</button>
        </div>
        <div className="card overflow-hidden max-w-4xl mx-auto">
          <div className="p-8 text-white" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}>
            {preview.brand_name && <p className="text-sm opacity-80 mb-1">{preview.brand_name}</p>}
            <h1 className="text-2xl font-bold">{preview.title}</h1>
            <p className="mt-2 opacity-75">Prepared for {preview.client_name || 'Client'}</p>
          </div>
          <div className="p-8 space-y-8">
            {sections.map((s, i) => (
              <section key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
                  <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                </div>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-gray-100">{s.content}</p>
              </section>
            ))}
          </div>
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">{preview.brand_name || 'ConsultPro'}</span>
            <span className="text-xs text-gray-400">{new Date(preview.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolios</h1>
          <p className="page-subtitle">Build client-ready consulting portfolios</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }} className="btn btn-primary">
          <Plus size={16} /> New Portfolio
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay !items-start pt-4 sm:pt-10 overflow-y-auto">
          <div className="modal-content w-full !max-w-3xl m-4 overflow-hidden">
            <div className="p-5 bg-blue-600">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'Create'} Portfolio</h3>
              <p className="text-blue-200 text-sm mt-0.5">{editing ? 'Update details' : 'Set up a new portfolio'}</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" /></div>
                <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input"><option value="draft">Draft</option><option value="review">Review</option><option value="approved">Approved</option><option value="sent">Sent</option></select></div>
                <div><label className="label">Client</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="input"><option value="">Select...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="label">Project</label><select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="input"><option value="">Select...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Brand</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="label">Brand Name</label><input value={form.brand_name} onChange={e => setForm({...form, brand_name: e.target.value})} className="input" /></div>
                  <div><label className="label">Color</label><div className="flex items-center gap-2"><input type="color" value={form.brand_color} onChange={e => setForm({...form, brand_color: e.target.value})} className="h-9 w-12 rounded border border-gray-200 cursor-pointer" /><span className="text-xs text-gray-400 font-mono">{form.brand_color}</span></div></div>
                  <div><label className="label">Theme</label><select value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="input"><option value="light">Light</option><option value="dark">Dark</option></select></div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Content</h4>
                {[
                  { key: 'executive_summary' as const, label: 'Executive Summary' },
                  { key: 'strategic_opportunities' as const, label: 'Strategic Opportunities' },
                  { key: 'risk_assessment' as const, label: 'Risk Assessment' },
                  { key: 'professional_insights' as const, label: 'Professional Insights' },
                  { key: 'case_study' as const, label: 'Case Study' },
                ].map(s => (
                  <div key={s.key}><label className="label">{s.label}</label><textarea rows={3} value={form[s.key]} onChange={e => setForm({...form, [s.key]: e.target.value})} className="input" /></div>
                ))}
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button type="submit" className="btn btn-primary"><Send size={14} /> {editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {portfolios.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><FileText size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No portfolios yet</h3>
          <p className="text-sm text-gray-400">Create your first portfolio to showcase your work.</p>
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="btn btn-primary mt-4"><Plus size={16} /> Create Portfolio</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map(p => (
            <div key={p.id} className="card overflow-hidden group">
              <div className="h-1" style={{ background: p.brand_color || '#2563eb' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: p.brand_color || '#2563eb' }}>
                    <FileText size={18} />
                  </div>
                  <span className={`badge ${STATUS_STYLES[p.status] || 'badge-draft'}`}>{p.status}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{p.title}</h3>
                {p.client_name && <p className="text-xs text-gray-500 mb-1">{p.client_name}</p>}
                {p.project_name && <p className="text-xs text-gray-400 mb-3">{p.project_name}</p>}
                <p className="text-xs text-gray-400">Updated {new Date(p.updated_at).toLocaleDateString()}</p>
                <div className="flex gap-1 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => setPreview(p)} className="btn btn-ghost text-xs text-blue-600 hover:bg-blue-50"><Eye size={13} /> Preview</button>
                  <button onClick={() => openEdit(p)} className="btn btn-ghost text-xs"><Edit3 size={13} /> Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-ghost text-xs text-red-500 hover:bg-red-50 ml-auto"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
