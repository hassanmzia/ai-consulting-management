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

const SENIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  junior: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  mid: { bg: 'bg-sky-50', text: 'text-sky-600' },
  senior: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  principal: { bg: 'bg-violet-50', text: 'text-violet-600' },
  director: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-rose-500 to-pink-400',
  'from-amber-500 to-orange-400',
  'from-violet-500 to-fuchsia-400',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

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

  const getUtilizationLabel = (util: number) => {
    if (util >= 85) return 'Over-utilized';
    if (util >= 70) return 'Optimal';
    if (util >= 50) return 'Moderate';
    return 'Under-utilized';
  };

  const activeCount = consultants.filter((c) => c.is_active).length;
  const avgRate =
    consultants.length > 0
      ? Math.round(consultants.reduce((s, c) => s + c.hourly_rate, 0) / consultants.length)
      : 0;
  const avgUtil =
    consultants.length > 0
      ? Math.round(
          consultants.reduce((s, c) => s + (c.utilization ?? 0), 0) / consultants.length
        )
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title tracking-tight">Consultants</h1>
          <p className="page-subtitle">Manage your consulting team and track utilization</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Consultant
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
            <UserCog size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Members</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{activeCount}</p>
          </div>
        </div>
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #10b981' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Hourly Rate</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">${avgRate}</p>
          </div>
        </div>
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Utilization</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{avgUtil}%</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by name, email, or expertise..."
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
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-flex items-center whitespace-nowrap">
            {consultants.length} result{consultants.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Consultant Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : consultants.length === 0 ? (
        <div className="card empty-state animate-fade-in">
          <div className="empty-state-icon">
            <UserCog size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No consultants found</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {search || activeFilter
              ? 'Try adjusting your search or filters to find what you are looking for.'
              : 'Add your first consultant to start building your team.'}
          </p>
          {!search && !activeFilter && (
            <button
              className="btn btn-primary mt-5"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Add Consultant
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {consultants.map((consultant) => {
            const utilValue = consultant.utilization ?? 0;
            const utilColor = getUtilizationColor(utilValue);
            const utilLabel = getUtilizationLabel(utilValue);
            const initials = consultant.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const gradient = getAvatarGradient(consultant.name);
            const seniorityStyle =
              SENIORITY_COLORS[consultant.seniority] ?? SENIORITY_COLORS.mid;

            return (
              <div
                key={consultant.id}
                className="card card-interactive p-0 overflow-hidden animate-fade-in"
              >
                {/* Colored top strip */}
                <div
                  className="h-1 w-full"
                  style={{
                    background: consultant.is_active
                      ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                      : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                  }}
                />

                <div className="p-5">
                  {/* Top row: Avatar + Name + Badge */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <span className="text-white font-bold text-sm tracking-tight">
                        {initials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{consultant.name}</h3>
                          <p className="text-sm text-slate-400 truncate">{consultant.email}</p>
                        </div>
                        <span
                          className={`badge ${consultant.is_active ? 'badge-active' : 'badge-on_hold'} shrink-0`}
                        >
                          {consultant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="divider" style={{ margin: '0.875rem 0' }} />

                  {/* Info row with icon boxes */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="icon-box icon-box-sm rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
                        <Briefcase size={14} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Expertise
                        </p>
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">
                          {consultant.expertise}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div
                        className={`icon-box icon-box-sm rounded-xl ${seniorityStyle.bg}`}
                      >
                        <UserCog size={14} className={seniorityStyle.text} />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Seniority
                        </p>
                        <p className="text-xs font-bold text-slate-700 capitalize">
                          {consultant.seniority}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="icon-box icon-box-sm rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <DollarSign size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Rate
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          ${consultant.hourly_rate}/hr
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divider" style={{ margin: '0.875rem 0' }} />

                  {/* Utilization */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Utilization
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: utilColor }}
                        >
                          {utilLabel}
                        </span>
                        <span className="text-sm font-extrabold" style={{ color: utilColor }}>
                          {utilValue.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(utilValue, 100)}%`,
                          background: `linear-gradient(90deg, ${utilColor}, ${utilColor}cc)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {consultant.billable_hours ?? 0}h billable
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {consultant.total_hours ?? 0}h total
                      </span>
                    </div>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal header with gradient strip */}
            <div
              className="h-1.5 w-full rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)' }}
            />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    Add New Consultant
                  </h2>
                  <p className="text-sm text-slate-400">Fill in the details below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    required
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    className="input"
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Expertise</label>
                    <select
                      className="input"
                      value={form.expertise}
                      onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                    >
                      {EXPERTISE_AREAS.map((ea) => (
                        <option key={ea} value={ea}>
                          {ea}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Seniority</label>
                    <select
                      className="input"
                      value={form.seniority}
                      onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                    >
                      {SENIORITY_LEVELS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Hourly Rate ($)</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="10"
                      value={form.hourly_rate}
                      onChange={(e) =>
                        setForm({ ...form, hourly_rate: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) =>
                          setForm({ ...form, is_active: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="divider" />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner-sm spinner" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add Consultant
                      </>
                    )}
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
