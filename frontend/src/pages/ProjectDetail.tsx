import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  DollarSign,
  Clock,
  Users,
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
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found</p>
      </div>
    );
  }

  const budgetPct = project.budget > 0 ? Math.min((project.spent / project.budget) * 100, 100) : 0;
  const budgetColor = budgetPct >= 90 ? '#ef4444' : budgetPct >= 70 ? '#f59e0b' : '#10b981';
  const totalHours = project.time_entries?.reduce((sum, t) => sum + Number(t.hours), 0) ?? 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FolderKanban size={28} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
                <p className="text-slate-500 mt-1">{project.client_name}</p>
              </div>
              <div className="flex gap-2">
                <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
              </div>
            </div>
            {project.description && (
              <p className="text-sm text-slate-600 mt-3">{project.description}</p>
            )}
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-slate-400" />
                {project.start_date} - {project.end_date || 'Ongoing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Budget</p>
              <p className="text-lg font-bold text-slate-900">${project.budget?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Spent</p>
              <p className="text-lg font-bold text-slate-900">${project.spent?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Hours</p>
              <p className="text-lg font-bold text-slate-900">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Consultants</p>
              <p className="text-lg font-bold text-slate-900">{project.consultants?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Budget Utilization</h3>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">
            ${project.spent?.toLocaleString()} of ${project.budget?.toLocaleString()}
          </span>
          <span className="font-semibold" style={{ color: budgetColor }}>
            {budgetPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{ width: `${budgetPct}%`, backgroundColor: budgetColor }}
          />
        </div>
      </div>

      {/* Time Entries */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Time Entries</h3>
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
                    <td>{entry.date}</td>
                    <td className="hide-mobile">{entry.consultant_name}</td>
                    <td className="font-semibold">{Number(entry.hours)}h</td>
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
        ) : (
          <p className="text-center text-slate-400 py-8">No time entries recorded</p>
        )}
      </div>

      {/* Invoices */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Invoices</h3>
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
                    <td className="font-medium">{inv.invoice_number}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td className="font-semibold">${inv.total_amount?.toLocaleString()}</td>
                    <td>{inv.issue_date}</td>
                    <td>{inv.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">No invoices for this project</p>
        )}
      </div>
    </div>
  );
}
