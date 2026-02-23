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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  if (!project) {
    return (
      <div className="card empty-state animate-fade-in">
        <div className="empty-state-icon"><FolderKanban size={24} className="text-gray-400" /></div>
        <p className="text-lg font-semibold text-gray-700">Project not found</p>
        <button className="btn btn-secondary mt-4" onClick={() => navigate('/projects')}><ArrowLeft size={16} /> Back to Projects</button>
      </div>
    );
  }

  const budgetPct = project.budget > 0 ? Math.min((project.spent / project.budget) * 100, 100) : 0;
  const budgetColor = budgetPct >= 90 ? '#dc2626' : budgetPct >= 70 ? '#d97706' : '#059669';
  const totalHours = project.time_entries?.reduce((sum, t) => sum + Number(t.hours), 0) ?? 0;
  const remaining = Math.max((project.budget ?? 0) - (project.spent ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/projects')} className="btn btn-ghost text-sm px-2"><ArrowLeft size={15} /> Back to Projects</button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <FolderKanban size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{project.client_name}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
              </div>
            </div>
            {project.description && <p className="text-sm text-gray-600 mt-3 max-w-2xl">{project.description}</p>}
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><Calendar size={13} className="text-gray-400" /> {project.start_date} &rarr; {project.end_date || 'Ongoing'}</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><Users size={13} className="text-gray-400" /> {project.consultants?.length ?? 0} consultants</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><Clock size={13} className="text-gray-400" /> {totalHours.toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Budget</p>
          <p className="text-xl font-bold text-gray-900">${(project.budget ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Spent</p>
          <p className="text-xl font-bold text-gray-900">${(project.spent ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Hours Logged</p>
          <p className="text-xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
          <p className="text-xl font-bold text-gray-900">${remaining.toLocaleString()}</p>
        </div>
      </div>

      {/* Budget bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Budget Utilization</h3>
          <span className="text-sm font-semibold" style={{ color: budgetColor }}>{budgetPct.toFixed(1)}%</span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div className="progress-bar-fill" style={{ width: `${budgetPct}%`, background: budgetColor }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>${(project.spent ?? 0).toLocaleString()} spent</span>
          <span>${(project.budget ?? 0).toLocaleString()} total</span>
        </div>
      </div>

      {/* Time Entries */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Time Entries</h3>
        {project.time_entries?.length ? (
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th className="hide-mobile">Consultant</th><th>Hours</th><th>Description</th><th className="hide-mobile">Billable</th></tr></thead>
              <tbody>
                {project.time_entries.map((entry) => (
                  <tr key={entry.id}>
                    <td><span className="font-medium text-gray-700">{entry.date}</span></td>
                    <td className="hide-mobile"><span className="text-gray-600">{entry.consultant_name}</span></td>
                    <td><span className="font-semibold text-gray-900">{Number(entry.hours)}h</span></td>
                    <td><span className="text-gray-600 max-w-xs truncate block">{entry.description}</span></td>
                    <td className="hide-mobile">
                      {entry.is_billable ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs"><CheckCircle2 size={13} /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium text-xs"><XCircle size={13} /> No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-8"><div className="empty-state-icon"><Clock size={20} className="text-gray-400" /></div><p className="text-sm text-gray-500">No time entries recorded</p></div>
        )}
      </div>

      {/* Invoices */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Invoices</h3>
        {project.invoices?.length ? (
          <div className="table-container">
            <table>
              <thead><tr><th>Invoice #</th><th>Status</th><th>Amount</th><th>Issue Date</th><th>Due Date</th></tr></thead>
              <tbody>
                {project.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><span className="flex items-center gap-1.5 font-medium text-gray-800"><FileText size={14} className="text-gray-400" /> {inv.invoice_number}</span></td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td><span className="font-semibold text-gray-900">${inv.total_amount?.toLocaleString()}</span></td>
                    <td><span className="text-gray-600">{inv.issue_date}</span></td>
                    <td><span className="text-gray-600">{inv.due_date}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-8"><div className="empty-state-icon"><FileText size={20} className="text-gray-400" /></div><p className="text-sm text-gray-500">No invoices yet</p></div>
        )}
      </div>
    </div>
  );
}
