import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  DollarSign,
  Clock,
  Users,
  FileText,
  Receipt,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getProject } from '@/lib/api';
import type { ProjectDetail as ProjectDetailType } from '@/lib/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProject(id!);
        setProject(data);
      } catch {
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card animate-fade-in">
        <div className="empty-state py-16">
          <div className="empty-state-icon" style={{ width: '5rem', height: '5rem' }}>
            <FolderKanban size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-700 tracking-tight">Project not found</p>
          <p className="text-sm text-slate-400 mt-1">
            The project you are looking for does not exist or has been removed.
          </p>
          <button className="btn btn-secondary mt-5" onClick={() => navigate('/projects')}>
            <ArrowLeft size={16} />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const budgetPct = project.budget > 0 ? Math.min((project.spent / project.budget) * 100, 100) : 0;
  const budgetColor = budgetPct >= 90 ? 'text-red-600' : budgetPct >= 70 ? 'text-amber-600' : 'text-emerald-600';
  const budgetBarClass = budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const totalHours = project.time_entries?.reduce((sum, t) => sum + Number(t.hours), 0) ?? 0;
  const remaining = Math.max((project.budget ?? 0) - (project.spent ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Back Navigation ── */}
      <button
        onClick={() => navigate('/projects')}
        className="btn btn-ghost !px-2 !py-1.5 text-[13px] text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} />
        Back to Projects
      </button>

      {/* ── Project Header Card ── */}
      <div
        className="card p-0 overflow-hidden animate-fade-in"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #eef2ff 100%)' }}
      >
        {/* Gradient top accent */}
        <div
          className="h-1.5"
          style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)' }}
        />

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Icon */}
            <div
              className="icon-box icon-box-lg rounded-xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              }}
            >
              <FolderKanban size={24} className="text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                    {project.name}
                  </h1>
                  <p className="text-[14px] text-slate-500 mt-1">{project.client_name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                  <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed max-w-2xl">
                  {project.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-5 mt-4">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <Calendar size={14} className="text-slate-400" />
                  {project.start_date}
                  <span className="text-slate-300 mx-0.5">&rarr;</span>
                  {project.end_date || 'Ongoing'}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <Users size={14} className="text-slate-400" />
                  {project.consultants?.length ?? 0} consultant{(project.consultants?.length ?? 0) !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <Clock size={14} className="text-slate-400" />
                  {totalHours.toFixed(1)} hours logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '60ms' }}>
        {/* Budget */}
        <div className="card stat-card p-5" style={{ borderTop: '3px solid #10b981' }}>
          <div className="flex items-center gap-3">
            <div
              className="icon-box icon-box-md rounded-xl"
              style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}
            >
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Budget</p>
              <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                ${(project.budget ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Spent */}
        <div className="card stat-card p-5" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="flex items-center gap-3">
            <div
              className="icon-box icon-box-md rounded-xl"
              style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}
            >
              <TrendingUp size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Spent</p>
              <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                ${(project.spent ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="card stat-card p-5" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="flex items-center gap-3">
            <div
              className="icon-box icon-box-md rounded-xl"
              style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
            >
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Hours</p>
              <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                {totalHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="card stat-card p-5" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="flex items-center gap-3">
            <div
              className="icon-box icon-box-md rounded-xl"
              style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' }}
            >
              <DollarSign size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Remaining</p>
              <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                ${remaining.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget Utilization ── */}
      <div className="card p-5 animate-fade-in" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Budget Utilization</h3>
          <span className={`text-sm font-bold ${budgetColor}`}>
            {budgetPct.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div
            className={`progress-bar-fill ${budgetBarClass}`}
            style={{ width: `${budgetPct}%`, background: undefined }}
          />
        </div>
        <div className="flex items-center justify-between mt-2.5 text-[13px]">
          <span className="text-slate-500">
            ${(project.spent ?? 0).toLocaleString()} spent
          </span>
          <span className="font-semibold text-slate-700">
            ${(project.budget ?? 0).toLocaleString()} total budget
          </span>
        </div>
      </div>

      {/* ── Time Entries ── */}
      <div className="card p-5 animate-fade-in" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="icon-box icon-box-sm rounded-lg"
            style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
          >
            <Clock size={14} className="text-amber-600" />
          </div>
          <h3 className="section-title">Time Entries</h3>
          {project.time_entries?.length ? (
            <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
              {project.time_entries.length}
            </span>
          ) : null}
        </div>

        {project.time_entries?.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="hide-mobile">Consultant</th>
                  <th>Hours</th>
                  <th>Description</th>
                  <th className="hide-mobile">Billable</th>
                </tr>
              </thead>
              <tbody>
                {project.time_entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className="font-medium text-slate-700">{entry.date}</span>
                    </td>
                    <td className="hide-mobile">
                      <span className="text-slate-600">{entry.consultant_name}</span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900">{Number(entry.hours)}h</span>
                    </td>
                    <td>
                      <span className="text-slate-600 max-w-xs truncate block">
                        {entry.description}
                      </span>
                    </td>
                    <td className="hide-mobile">
                      {entry.is_billable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[12px]">
                          <CheckCircle2 size={13} />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[12px]">
                          <XCircle size={13} />
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-10">
            <div className="empty-state-icon">
              <Clock size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No time entries recorded</p>
            <p className="text-[13px] text-slate-400 mt-0.5">
              Time entries will appear here once consultants log their hours.
            </p>
          </div>
        )}
      </div>

      {/* ── Invoices ── */}
      <div className="card p-5 animate-fade-in" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="icon-box icon-box-sm rounded-lg"
            style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}
          >
            <Receipt size={14} className="text-indigo-600" />
          </div>
          <h3 className="section-title">Invoices</h3>
          {project.invoices?.length ? (
            <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
              {project.invoices.length}
            </span>
          ) : null}
        </div>

        {project.invoices?.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {project.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <FileText size={14} className="text-slate-400" />
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900">
                        ${inv.total_amount?.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600">{inv.issue_date}</span>
                    </td>
                    <td>
                      <span className="text-slate-600">{inv.due_date}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-10">
            <div className="empty-state-icon">
              <Receipt size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No invoices yet</p>
            <p className="text-[13px] text-slate-400 mt-0.5">
              Invoices for this project will appear here once they are created.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
