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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mt-1">Log and track billable hours across projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Log Time
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Hours</p>
            <p className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Clock size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Billable Hours</p>
            <p className="text-xl font-bold text-slate-900">{billableHours.toFixed(1)}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <Filter size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Entries</p>
            <p className="text-xl font-bold text-slate-900">{entries.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="input w-auto"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={consultantFilter}
            onChange={(e) => setConsultantFilter(e.target.value)}
          >
            <option value="">All Consultants</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
        </div>
      </div>

      {/* Time Entries Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-medium">No time entries found</p>
          <p className="text-slate-400 text-sm mt-1">Log your first time entry to get started</p>
        </div>
      ) : (
        <div className="table-container">
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
                  <td className="text-slate-700">{entry.date}</td>
                  <td className="font-medium text-slate-900">{entry.project_name}</td>
                  <td className="hide-mobile text-slate-600">{entry.consultant_name}</td>
                  <td className="font-semibold text-slate-900">{Number(entry.hours)}h</td>
                  <td className="text-slate-600 max-w-xs truncate">{entry.description}</td>
                  <td className="hide-mobile">
                    <span className={`badge ${entry.is_billable ? 'badge-active' : 'badge-draft'}`}>
                      {entry.is_billable ? 'Yes' : 'No'}
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
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Log Time Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project *</label>
                <select
                  className="input"
                  required
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.client_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultant *</label>
                <select
                  className="input"
                  required
                  value={form.consultant_id}
                  onChange={(e) => setForm({ ...form, consultant_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a consultant</option>
                  {consultants.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  className="input"
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_billable}
                    onChange={(e) => setForm({ ...form, is_billable: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Billable</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Log Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
