import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Calendar, DollarSign } from 'lucide-react';
import { getProjects, getClients, createProject } from '@/lib/api';
import type { Project, Client, CreateProjectData } from '@/lib/api';

const STATUSES = ['planning', 'discovery', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
const priorityLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm: CreateProjectData = {
    name: '',
    client_id: 0,
    status: 'planning',
    priority: 'medium',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: 0,
    description: '',
  };

  const [form, setForm] = useState<CreateProjectData>(emptyForm);

  const loadProjects = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;
      const data = await getProjects(params);
      setProjects(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    getClients().then(setClients).catch(() => {});
  }, [statusFilter, priorityFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProject(form);
      setShowForm(false);
      setForm(emptyForm);
      loadProjects();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const getBudgetPercent = (project: Project) => {
    if (!project.budget || project.budget === 0) return 0;
    return Math.min((project.spent / project.budget) * 100, 100);
  };

  const getBudgetColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getBudgetTextColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title tracking-tight">Projects</h1>
          <p className="page-subtitle">Track and manage all consulting engagements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card p-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search projects by name or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="flex gap-3">
            <select
              className="input w-auto min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <select
              className="input w-auto min-w-[140px]"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Project Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        /* ── Empty State ── */
        <div className="card animate-fade-in">
          <div className="empty-state py-16">
            <div className="empty-state-icon" style={{ width: '5rem', height: '5rem' }}>
              <FolderKanban size={32} className="text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-700 tracking-tight">No projects found</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Create your first project to start tracking budgets, timelines, and deliverables.
            </p>
            <button
              className="btn btn-primary mt-5"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project, idx) => {
            const budgetPct = getBudgetPercent(project);
            const budgetBarColor = getBudgetColor(budgetPct);
            const budgetTxtColor = getBudgetTextColor(budgetPct);

            return (
              <div
                key={project.id}
                className="card card-interactive p-0 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Colored top strip based on priority */}
                <div
                  className="h-1"
                  style={{
                    background:
                      project.priority === 'critical' || project.priority === 'high'
                        ? 'linear-gradient(90deg, #ef4444, #f87171)'
                        : project.priority === 'medium'
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #10b981, #34d399)',
                  }}
                />

                <div className="p-5">
                  {/* Top row: icon + name + priority badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="icon-box icon-box-md rounded-xl shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                      }}
                    >
                      <FolderKanban size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 tracking-tight truncate leading-tight">
                        {project.name}
                      </h3>
                      <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                        {project.client_name}
                      </p>
                    </div>
                    <span className={`badge badge-${project.priority} shrink-0`}>
                      {project.priority}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="mb-3">
                    <span className={`badge badge-${project.status}`}>
                      {statusLabel(project.status)}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-[13px] text-slate-500 mb-4">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>{project.start_date}</span>
                    {project.end_date && (
                      <>
                        <span className="text-slate-300 mx-0.5">&rarr;</span>
                        <span>{project.end_date}</span>
                      </>
                    )}
                  </div>

                  <div className="divider !my-0 mb-4" />

                  {/* Budget section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <DollarSign size={11} />
                        Budget
                      </span>
                      <span className={`text-[11px] font-bold ${budgetTxtColor}`}>
                        {budgetPct.toFixed(0)}% used
                      </span>
                    </div>
                    <div className="progress-bar progress-bar-sm">
                      <div
                        className={`progress-bar-fill ${budgetBarColor}`}
                        style={{
                          width: `${budgetPct}%`,
                          background: undefined,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[12px] text-slate-500">
                        ${(project.spent ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[12px] font-semibold text-slate-700">
                        ${(project.budget ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Project Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-content p-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="icon-box icon-box-md rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  }}
                >
                  <FolderKanban size={18} className="text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    New Project
                  </h2>
                  <p className="text-[13px] text-slate-500">
                    Set up a new consulting engagement
                  </p>
                </div>
              </div>
            </div>

            <div className="divider !my-0" />

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Project Name */}
              <div>
                <label className="label">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Digital Transformation Phase 2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Client */}
              <div>
                <label className="label">
                  Client <span className="text-red-400">*</span>
                </label>
                <select
                  className="input"
                  required
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{priorityLabel(p)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="label">Budget ($)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Brief description of the project scope..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="divider !mb-0" />
              <div className="flex justify-end gap-3 pt-1">
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
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
