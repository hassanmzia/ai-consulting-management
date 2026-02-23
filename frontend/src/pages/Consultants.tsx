import { useEffect, useState } from 'react';
import { Plus, Search, UserCog, Briefcase, DollarSign } from 'lucide-react';
import { getConsultants, createConsultant } from '@/lib/api';
import type { Consultant, CreateConsultantData } from '@/lib/api';

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'principal', 'director'];
const EXPERTISE_AREAS = [
  'Strategy', 'Operations', 'Technology', 'Finance', 'Marketing',
  'HR', 'Supply Chain', 'Data Analytics', 'Digital Transformation', 'Change Management',
];

const emptyForm: CreateConsultantData = {
  name: '',
  email: '',
  expertise: 'Strategy',
  seniority: 'mid',
  hourly_rate: 150,
  is_active: true,
};

export default function Consultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateConsultantData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadConsultants = async () => {
    try {
      const params: Record<string, string> = {};
      if (activeFilter) params.is_active = activeFilter;
      if (search) params.search = search;
      const data = await getConsultants(params);
      setConsultants(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultants();
  }, [activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadConsultants();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createConsultant(form);
      setShowForm(false);
      setForm(emptyForm);
      loadConsultants();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const getUtilizationColor = (util: number) => {
    if (util >= 85) return '#ef4444';
    if (util >= 70) return '#10b981';
    if (util >= 50) return '#f59e0b';
    return '#94a3b8';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mt-1">Manage your consulting team and track utilization</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Consultant
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search consultants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <select
            className="input w-auto"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Consultant Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : consultants.length === 0 ? (
        <div className="card p-12 text-center">
          <UserCog size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-medium">No consultants found</p>
          <p className="text-slate-400 text-sm mt-1">Add your first consultant to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {consultants.map((consultant) => {
            const utilColor = getUtilizationColor(consultant.utilization ?? 0);
            return (
              <div key={consultant.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">
                      {consultant.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{consultant.name}</h3>
                        <p className="text-sm text-slate-500">{consultant.email}</p>
                      </div>
                      <span className={`badge ${consultant.is_active ? 'badge-active' : 'badge-on_hold'}`}>
                        {consultant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="text-slate-600">{consultant.expertise}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserCog size={14} className="text-slate-400" />
                    <span className="text-slate-600 capitalize">{consultant.seniority}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={14} className="text-slate-400" />
                    <span className="text-slate-600">${consultant.hourly_rate}/hr</span>
                  </div>
                </div>

                {/* Utilization bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-500">Utilization</span>
                    <span className="font-semibold" style={{ color: utilColor }}>
                      {(consultant.utilization ?? 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(consultant.utilization ?? 0, 100)}%`,
                        backgroundColor: utilColor,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{consultant.billable_hours ?? 0}h billable</span>
                    <span>{consultant.total_hours ?? 0}h total</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Consultant Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New Consultant</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expertise</label>
                  <select
                    className="input"
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  >
                    {EXPERTISE_AREAS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seniority</label>
                  <select
                    className="input"
                    value={form.seniority}
                    onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                  >
                    {SENIORITY_LEVELS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="10"
                    value={form.hourly_rate}
                    onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Add Consultant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
