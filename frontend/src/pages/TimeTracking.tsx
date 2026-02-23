import { useEffect, useState } from 'react';
import { Clock, Plus, Filter } from 'lucide-react';
import { getTimeEntries, getProjects, getConsultants, createTimeEntry } from '@/lib/api';
import type { TimeEntry, Project, Consultant, CreateTimeEntryData } from '@/lib/api';

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [projectFilter, setProjectFilter] = useState('');
  const [consultantFilter, setConsultantFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const emptyForm: CreateTimeEntryData = {
    project_id: 0,
    consultant_id: 0,
    date: new Date().toISOString().split('T')[0],
    hours: 1,
    description: '',
    is_billable: true,
  };

  const [form, setForm] = useState<CreateTimeEntryData>(emptyForm);

  const loadEntries = async () => {
    try {
      const params: Record<string, string> = {};
      if (projectFilter) params.project_id = projectFilter;
      if (consultantFilter) params.consultant_id = consultantFilter;
      if (dateFrom) params.start_date = dateFrom;
      if (dateTo) params.end_date = dateTo;
      const data = await getTimeEntries(params);
      setEntries(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    getProjects().then(setProjects).catch(() => {});
    getConsultants().then(setConsultants).catch(() => {});
  }, []);

  useEffect(() => {
    loadEntries();
  }, [projectFilter, consultantFilter, dateFrom, dateTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTimeEntry(form);
      setShowForm(false);
      setForm(emptyForm);
      loadEntries();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const billableHours = entries.filter((e) => e.is_billable).reduce((sum, e) => sum + Number(e.hours), 0);
  const nonBillableHours = totalHours - billableHours;
  const billablePercent = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
  const hasActiveFilters = projectFilter || consultantFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title tracking-tight">Time Tracking</h1>
          <p className="page-subtitle">Log and track billable hours across projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Log Time
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours */}
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Hours</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{totalHours.toFixed(1)}</p>
          </div>
        </div>

        {/* Billable Hours */}
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #10b981' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Billable Hours</p>
            <p className="text-2xl font-extrabold tracking-tight text-emerald-600">{billableHours.toFixed(1)}</p>
          </div>
        </div>

        {/* Non-Billable */}
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Non-Billable</p>
            <p className="text-2xl font-extrabold tracking-tight text-amber-600">{nonBillableHours.toFixed(1)}</p>
          </div>
        </div>

        {/* Entries Count */}
        <div className="card stat-card p-5 flex items-center gap-4" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="icon-box icon-box-md rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
            <Filter size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entries</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{entries.length}</p>
            <p className="text-[11px] font-semibold text-slate-400">{billablePercent}% billable</p>
          </div>
        </div>
      </div>

      {/* Billable ratio progress bar */}
      {entries.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Billable Ratio
            </span>
            <span className="text-sm font-extrabold text-indigo-600">{billablePercent}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${billablePercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] font-semibold text-emerald-500">
              {billableHours.toFixed(1)}h billable
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {nonBillableHours.toFixed(1)}h non-billable
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2 shrink-0">
            <div className="icon-box icon-box-sm rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
              <Filter size={14} className="text-slate-500" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Filters
            </span>
          </div>
          <select
            className="input w-auto"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={consultantFilter}
            onChange={(e) => setConsultantFilter(e.target.value)}
          >
            <option value="">All Consultants</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input w-auto"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="input w-auto"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
          />
          {hasActiveFilters && (
            <button
              className="btn btn-ghost text-xs"
              onClick={() => {
                setProjectFilter('');
                setConsultantFilter('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Time Entries Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card empty-state animate-fade-in">
          <div className="empty-state-icon">
            <Clock size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No time entries found</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {hasActiveFilters
              ? 'No entries match the current filters. Try adjusting your criteria.'
              : 'Log your first time entry to start tracking your hours.'}
          </p>
          {!hasActiveFilters && (
            <button
              className="btn btn-primary mt-5"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Log Time
            </button>
          )}
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th className="hide-mobile">Consultant</th>
                <th>Hours</th>
                <th>Description</th>
                <th className="hide-mobile">Billable</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <span className="font-semibold text-slate-700">{entry.date}</span>
                  </td>
                  <td>
                    <span className="font-bold text-slate-900">{entry.project_name}</span>
                  </td>
                  <td className="hide-mobile">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">
                          {(entry.consultant_name ?? '')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="text-slate-600">{entry.consultant_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-extrabold text-slate-900">{Number(entry.hours)}h</span>
                  </td>
                  <td>
                    <span className="text-slate-500 max-w-xs truncate block">{entry.description}</span>
                  </td>
                  <td className="hide-mobile">
                    <span className={`badge ${entry.is_billable ? 'badge-active' : 'badge-draft'}`}>
                      {entry.is_billable ? 'Billable' : 'Non-billable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Time Modal */}
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
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    Log Time Entry
                  </h2>
                  <p className="text-sm text-slate-400">Record your work hours below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Project *</label>
                  <select
                    className="input"
                    required
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}
                  >
                    <option value={0}>Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.client_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Consultant *</label>
                  <select
                    className="input"
                    required
                    value={form.consultant_id}
                    onChange={(e) =>
                      setForm({ ...form, consultant_id: Number(e.target.value) })
                    }
                  >
                    <option value={0}>Select a consultant</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date *</label>
                    <input
                      className="input"
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Hours *</label>
                    <input
                      className="input"
                      type="number"
                      min="0.25"
                      max="24"
                      step="0.25"
                      required
                      value={form.hours}
                      onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Description *</label>
                  <textarea
                    className="input"
                    rows={3}
                    required
                    placeholder="What did you work on?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_billable}
                      onChange={(e) => setForm({ ...form, is_billable: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-700 block">Billable Time</span>
                      <span className="text-[11px] text-slate-400">
                        Mark this entry as billable to the client
                      </span>
                    </div>
                  </label>
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
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <div className="spinner-sm spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Log Time
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
