import { useEffect, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { getTimeEntries, getProjects, getConsultants, createTimeEntry } from '@/lib/api';
import type { TimeEntry, Project, Consultant, CreateTimeEntryData } from '@/lib/api';

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [consultantFilter, setConsultantFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const emptyForm: CreateTimeEntryData = {
    project_id: 0, consultant_id: 0, date: new Date().toISOString().split('T')[0],
    hours: 1, description: '', is_billable: true,
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
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => {
    loadEntries();
    getProjects().then(setProjects).catch(() => {});
    getConsultants().then(setConsultants).catch(() => {});
  }, []);
  useEffect(() => { loadEntries(); }, [projectFilter, consultantFilter, dateFrom, dateTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTimeEntry(form);
      setShowForm(false);
      setForm(emptyForm);
      loadEntries();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
  const billableHours = entries.filter((e) => e.is_billable).reduce((s, e) => s + Number(e.hours), 0);
  const billablePercent = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
  const hasFilters = projectFilter || consultantFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Tracking</h1>
          <p className="page-subtitle">Log and track billable hours</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Log Time</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Billable Hours</p>
          <p className="text-2xl font-bold text-green-600">{billableHours.toFixed(1)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Billable Rate</p>
          <p className="text-2xl font-bold text-blue-600">{billablePercent}%</p>
          <div className="progress-bar mt-2">
            <div className="progress-bar-fill bg-blue-600" style={{ width: `${billablePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input w-auto" value={consultantFilter} onChange={(e) => setConsultantFilter(e.target.value)}>
            <option value="">All Consultants</option>
            {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" className="input w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {hasFilters && (
            <button className="btn btn-ghost text-xs" onClick={() => { setProjectFilter(''); setConsultantFilter(''); setDateFrom(''); setDateTo(''); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><Clock size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No time entries</h3>
          <p className="text-sm text-gray-400">{hasFilters ? 'Adjust your filters.' : 'Log your first time entry.'}</p>
          {!hasFilters && <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}><Plus size={16} /> Log Time</button>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Project</th><th className="hide-mobile">Consultant</th><th>Hours</th><th>Description</th><th className="hide-mobile">Billable</th></tr></thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td><span className="font-medium text-gray-700">{entry.date}</span></td>
                  <td><span className="font-medium text-gray-900">{entry.project_name}</span></td>
                  <td className="hide-mobile"><span className="text-gray-600">{entry.consultant_name}</span></td>
                  <td><span className="font-semibold text-gray-900">{Number(entry.hours)}h</span></td>
                  <td><span className="text-gray-600 max-w-xs truncate block">{entry.description}</span></td>
                  <td className="hide-mobile"><span className={`badge ${entry.is_billable ? 'badge-active' : 'badge-draft'}`}>{entry.is_billable ? 'Billable' : 'Non-billable'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Log Time Entry</h2>
              <p className="text-sm text-gray-500 mb-6">Record your work hours</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Project *</label>
                  <select className="input" required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}>
                    <option value={0}>Select a project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.client_name})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Consultant *</label>
                  <select className="input" required value={form.consultant_id} onChange={(e) => setForm({ ...form, consultant_id: Number(e.target.value) })}>
                    <option value={0}>Select a consultant</option>
                    {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date *</label>
                    <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Hours *</label>
                    <input className="input" type="number" min="0.25" max="24" step="0.25" required value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="label">Description *</label>
                  <textarea className="input" rows={3} required placeholder="What did you work on?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.is_billable} onChange={(e) => setForm({ ...form, is_billable: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Billable Time</span>
                    <span className="block text-xs text-gray-400">Mark as billable to the client</span>
                  </div>
                </label>
                <div className="divider" />
                <div className="flex justify-end gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner spinner-sm" /> Saving...</> : <><Plus size={16} /> Log Time</>}
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
