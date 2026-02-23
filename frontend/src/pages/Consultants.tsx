import { useEffect, useState } from 'react';
import { Plus, Search, UserCog, Briefcase, DollarSign } from 'lucide-react';
import { getConsultants, createConsultant } from '@/lib/api';
import type { Consultant, CreateConsultantData } from '@/lib/api';

export default function Consultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm: CreateConsultantData = {
    name: '', email: '', expertise: '', seniority: 'mid', hourly_rate: 0, is_active: true,
  };
  const [form, setForm] = useState<CreateConsultantData>(emptyForm);

  const loadConsultants = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const data = await getConsultants(params);
      setConsultants(data);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadConsultants(); }, []);
  useEffect(() => { loadConsultants(); }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createConsultant(form);
      setShowForm(false);
      setForm(emptyForm);
      loadConsultants();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Consultants</h1>
          <p className="page-subtitle">Manage your consulting team</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Consultant</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search consultants..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : consultants.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><UserCog size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No consultants found</h3>
          <p className="text-sm text-gray-400">Add your first team member to get started.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}><Plus size={16} /> Add Consultant</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultants.map((c) => {
            const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">{initials}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${c.is_active ? 'badge-active' : 'badge-draft'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="space-y-2 mt-4">
                  {c.expertise && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase size={14} className="text-gray-400" /> {c.expertise}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={14} className="text-gray-400" /> ${c.hourly_rate}/hr
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Consultant</h2>
              <p className="text-sm text-gray-500 mb-6">Enter the consultant's information</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Expertise</label>
                    <input className="input" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="Strategy, Technology..." />
                  </div>
                  <div>
                    <label className="label">Seniority</label>
                    <select className="input" value={form.seniority} onChange={(e) => setForm({ ...form, seniority: e.target.value })}>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="principal">Principal</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Hourly Rate ($)</label>
                  <input className="input" type="number" min="0" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
                </div>
                <div className="divider" />
                <div className="flex justify-end gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner spinner-sm" /> Adding...</> : <><Plus size={16} /> Add Consultant</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
