import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FolderKanban,
  Calendar,
} from 'lucide-react';
import { getClient } from '@/lib/api';
import type { ClientDetail as ClientDetailType } from '@/lib/api';

type TabType = 'projects' | 'invoices' | 'kpis' | 'sessions';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  useEffect(() => {
    async function load() {
      try {
        const data = await getClient(id!);
        setClient(data);
      } catch {
        navigate('/clients');
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

  if (!client) {
    return (
      <div className="card animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-600 text-lg font-bold tracking-tight">Client not found</p>
          <p className="text-slate-400 text-sm mt-1">The client you are looking for does not exist or has been removed.</p>
          <button className="btn btn-primary mt-5" onClick={() => navigate('/clients')}>
            <ArrowLeft size={16} />
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'projects', label: 'Projects', count: client.projects?.length ?? 0 },
    { key: 'invoices', label: 'Invoices', count: client.invoices?.length ?? 0 },
    { key: 'kpis', label: 'KPIs', count: client.kpis?.length ?? 0 },
    { key: 'sessions', label: 'Sessions', count: client.sessions?.length ?? 0 },
  ];

  const totalRevenue = client.total_revenue ?? 0;
  const activeProjects = client.projects?.filter((p) => p.status === 'in_progress' || p.status === 'active').length ?? 0;
  const totalSessions = client.sessions?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/clients')}
        className="btn btn-ghost text-sm gap-1.5 px-3 py-2"
      >
        <ArrowLeft size={15} />
        Back to Clients
      </button>

      {/* Client Header - Gradient Card */}
      <div
        className="card rounded-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5, #7c3aed)' }}
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -40%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(-30%, 40%)' }}
        />

        <div className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div
              className="icon-box icon-box-lg rounded-xl shrink-0"
              style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}
            >
              <Building2 size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{client.company_name}</h2>
                  <p className="text-indigo-200/70 text-sm font-medium mt-1">{client.industry}</p>
                </div>
                <span
                  className={`badge badge-${client.status}`}
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {client.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-5 mt-4">
                <span className="flex items-center gap-1.5 text-sm text-indigo-100/80">
                  <Mail size={14} className="text-indigo-200/60" />
                  {client.contact_email}
                </span>
                {client.contact_phone && (
                  <span className="flex items-center gap-1.5 text-sm text-indigo-100/80">
                    <Phone size={14} className="text-indigo-200/60" />
                    {client.contact_phone}
                  </span>
                )}
                {client.city && (
                  <span className="flex items-center gap-1.5 text-sm text-indigo-100/80">
                    <MapPin size={14} className="text-indigo-200/60" />
                    {client.city}{client.country ? `, ${client.country}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        {/* Revenue stat */}
        <div className="card stat-card p-5 flex items-center gap-4 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #10b981, #10b98180)' }}
          />
          <div
            className="icon-box icon-box-md rounded-xl"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
          >
            <DollarSign size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Active Projects stat */}
        <div className="card stat-card p-5 flex items-center gap-4 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #6366f1, #6366f180)' }}
          />
          <div
            className="icon-box icon-box-md rounded-xl"
            style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7fe)' }}
          >
            <FolderKanban size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Projects</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{activeProjects}</p>
          </div>
        </div>

        {/* Sessions stat */}
        <div className="card stat-card p-5 flex items-center gap-4 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #8b5cf6, #8b5cf680)' }}
          />
          <div
            className="icon-box icon-box-md rounded-xl"
            style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}
          >
            <Calendar size={20} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalSessions}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card animate-slide-up">
        <div className="tab-list px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-item ${activeTab === tab.key ? 'tab-item-active' : ''}`}
            >
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="animate-fade-in">
              {client.projects?.length ? (
                <div className="space-y-3">
                  {client.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="card card-interactive p-4 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="icon-box icon-box-sm rounded-xl shrink-0"
                          style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7fe)' }}
                        >
                          <FolderKanban size={15} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {project.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                              <DollarSign size={10} />
                              Budget: ${project.budget?.toLocaleString()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[11px] text-slate-400 font-medium">
                              Spent: ${project.spent?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                        <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FolderKanban size={22} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-semibold text-sm">No projects yet</p>
                  <p className="text-slate-400 text-xs mt-1">Projects associated with this client will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="animate-fade-in">
              {client.invoices?.length ? (
                <div className="table-container rounded-xl">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th className="hide-mobile">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <span className="font-semibold text-sm text-slate-900">{inv.invoice_number}</span>
                          </td>
                          <td>
                            <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                          </td>
                          <td>
                            <span className="font-bold text-sm text-slate-900 tracking-tight">
                              ${inv.total_amount?.toLocaleString()}
                            </span>
                          </td>
                          <td className="hide-mobile">
                            <span className="text-sm text-slate-500 flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-300" />
                              {inv.due_date}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <DollarSign size={22} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-semibold text-sm">No invoices yet</p>
                  <p className="text-slate-400 text-xs mt-1">Invoices for this client will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="animate-fade-in">
              {client.kpis?.length ? (
                <div className="space-y-4">
                  {client.kpis.map((kpi) => {
                    const range = kpi.target_value - kpi.baseline_value;
                    const progress = range > 0
                      ? Math.min(((kpi.current_value - kpi.baseline_value) / range) * 100, 100)
                      : 0;
                    const safeProgress = Math.max(progress, 0);
                    const progressColor = progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';
                    const progressBg = progress >= 75 ? '#d1fae5' : progress >= 50 ? '#fef3c7' : '#fee2e2';
                    return (
                      <div key={kpi.id} className="card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="icon-box icon-box-sm rounded-xl"
                              style={{ background: `linear-gradient(135deg, ${progressBg}, ${progressBg})` }}
                            >
                              <span className="text-xs font-extrabold" style={{ color: progressColor }}>
                                {safeProgress.toFixed(0)}%
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{kpi.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                {kpi.category}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold tracking-tight" style={{ color: progressColor }}>
                            {kpi.current_value} / {kpi.target_value} {kpi.unit}
                          </p>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${safeProgress}%`,
                              background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            Baseline: {kpi.baseline_value} {kpi.unit}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Target: {kpi.target_value} {kpi.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span className="text-slate-400 text-lg font-bold">KPI</span>
                  </div>
                  <p className="text-slate-500 font-semibold text-sm">No KPIs tracked yet</p>
                  <p className="text-slate-400 text-xs mt-1">Key performance indicators for this client will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="animate-fade-in">
              {client.sessions?.length ? (
                <div className="table-container rounded-xl">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th className="hide-mobile">Consultant</th>
                        <th>Duration</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.sessions.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-300" />
                              {s.session_date}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg capitalize">
                              {s.session_type}
                            </span>
                          </td>
                          <td className="hide-mobile">
                            <span className="text-sm text-slate-600">{s.consultant_name}</span>
                          </td>
                          <td>
                            <span className="text-sm font-semibold text-slate-700">{s.duration_hours}h</span>
                          </td>
                          <td>
                            {s.satisfaction_rating ? (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{
                                    background:
                                      s.satisfaction_rating >= 4
                                        ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                                        : s.satisfaction_rating >= 3
                                          ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
                                          : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                  }}
                                >
                                  <span
                                    className="text-xs font-extrabold"
                                    style={{
                                      color:
                                        s.satisfaction_rating >= 4
                                          ? '#92400e'
                                          : s.satisfaction_rating >= 3
                                            ? '#475569'
                                            : '#991b1b',
                                    }}
                                  >
                                    {s.satisfaction_rating}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium">/5</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">--</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar size={22} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-semibold text-sm">No sessions recorded yet</p>
                  <p className="text-slate-400 text-xs mt-1">Consulting sessions with this client will appear here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
