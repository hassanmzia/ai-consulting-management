import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Calendar, DollarSign } from 'lucide-react';
import { getProjects, getClients, createProject } from '@/lib/api';
import type { Project, Client, CreateProjectData } from '@/lib/api';

const STATUSES = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm: CreateProjectData = {
    name: '', client_id: 0, description: '', status: 'planning',
    priority: 'medium', start_date: new Date().toISOString().split('T')[0],
    end_date: '', budget: 0,
  };
  const [form, setForm] = useState<CreateProjectData>(emptyForm);

  const loadData = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const [p, c] = await Promise.all([getProjects(params), getClients()]);
      setProjects(p); setClients(c);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(); }, [statusFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProject(form);
      setShowForm(false);
      setForm(emptyForm);
      loadData();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Track and manage consulting engagements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Project</button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Project Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><FolderKanban size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No projects found</h3>
          <p className="text-sm text-gray-400 max-w-sm">{search || statusFilter ? 'Try adjusting your search or filters.' : 'Create your first project to get started.'}</p>
          {!search && !statusFilter && (
            <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}><Plus size={16} /> New Project</button>
          )}
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th className="hide-mobile">Client</th>
                <th>Status</th>
                <th>Priority</th>
                <th className="hide-mobile">Budget</th>
                <th className="hide-mobile">Dates</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FolderKanban size={14} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{project.name}</span>
                    </div>
                  </td>
                  <td className="hide-mobile"><span className="text-gray-600">{project.client_name}</span></td>
                  <td><span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span></td>
                  <td><span className={`badge badge-${project.priority}`}>{project.priority}</span></td>
                  <td className="hide-mobile">
                    <span className="font-semibold text-gray-900">${(project.budget ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="hide-mobile">
                    <span className="text-xs text-gray-500">{project.start_date} - {project.end_date || 'Ongoing'}</span>
                  </td>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-1">New Project</h2>
              <p className="text-sm text-gray-500 mb-6">Fill in the project details</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Project Name *</label>
                  <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Client *</label>
                    <select className="input" required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}>
                      <option value={0}>Select client</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Budget ($)</label>
                    <input className="input" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Date *</label>
                    <input className="input" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input className="input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="divider" />
                <div className="flex justify-end gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner spinner-sm" /> Creating...</> : <><Plus size={16} /> Create Project</>}
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
