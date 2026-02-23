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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  if (!client) {
    return (
      <div className="card empty-state animate-fade-in">
        <div className="empty-state-icon"><Building2 size={24} className="text-gray-400" /></div>
        <p className="text-lg font-semibold text-gray-700">Client not found</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/clients')}><ArrowLeft size={16} /> Back to Clients</button>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/clients')} className="btn btn-ghost text-sm px-2">
        <ArrowLeft size={15} /> Back to Clients
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {client.company_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{client.company_name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{client.industry}</p>
              </div>
              <span className={`badge badge-${client.status}`}>{client.status.replace('_', ' ')}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-gray-500"><Mail size={14} className="text-gray-400" /> {client.contact_email}</span>
              {client.contact_phone && <span className="flex items-center gap-1.5 text-sm text-gray-500"><Phone size={14} className="text-gray-400" /> {client.contact_phone}</span>}
              {client.city && <span className="flex items-center gap-1.5 text-sm text-gray-500"><MapPin size={14} className="text-gray-400" /> {client.city}{client.country ? `, ${client.country}` : ''}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-green-50"><DollarSign size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-blue-50"><FolderKanban size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Projects</p>
              <p className="text-xl font-bold text-gray-900">{activeProjects}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-purple-50"><Calendar size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</p>
              <p className="text-xl font-bold text-gray-900">{client.sessions?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="tab-list px-4">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`tab-item ${activeTab === tab.key ? 'tab-item-active' : ''}`}>
              {tab.label} <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'projects' && (
            <div className="animate-fade-in">
              {client.projects?.length ? (
                <div className="space-y-2">
                  {client.projects.map((project) => (
                    <Link key={project.id} to={`/projects/${project.id}`} className="card card-interactive p-4 flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="icon-box icon-box-sm rounded-lg bg-blue-50"><FolderKanban size={14} className="text-blue-600" /></div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">{project.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Budget: ${project.budget?.toLocaleString()} &middot; Spent: ${project.spent?.toLocaleString()}</p>
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
                <div className="empty-state"><div className="empty-state-icon"><FolderKanban size={20} className="text-gray-400" /></div><p className="text-sm text-gray-500">No projects yet</p></div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="animate-fade-in">
              {client.invoices?.length ? (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Invoice</th><th>Status</th><th>Amount</th><th className="hide-mobile">Due Date</th></tr></thead>
                    <tbody>
                      {client.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><span className="font-medium text-gray-900">{inv.invoice_number}</span></td>
                          <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                          <td><span className="font-semibold text-gray-900">${inv.total_amount?.toLocaleString()}</span></td>
                          <td className="hide-mobile"><span className="text-sm text-gray-500">{inv.due_date}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><div className="empty-state-icon"><DollarSign size={20} className="text-gray-400" /></div><p className="text-sm text-gray-500">No invoices yet</p></div>
              )}
            </div>
          )}

          {activeTab === 'kpis' && (
            <div className="animate-fade-in">
              {client.kpis?.length ? (
                <div className="space-y-4">
                  {client.kpis.map((kpi) => {
                    const range = kpi.target_value - kpi.baseline_value;
                    const progress = range > 0 ? Math.min(Math.max(((kpi.current_value - kpi.baseline_value) / range) * 100, 0), 100) : 0;
                    const color = progress >= 75 ? '#059669' : progress >= 50 ? '#d97706' : '#dc2626';
                    return (
                      <div key={kpi.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{kpi.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{kpi.category}</p>
                          </div>
                          <p className="text-sm font-semibold" style={{ color }}>{kpi.current_value} / {kpi.target_value} {kpi.unit}</p>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state"><div className="empty-state-icon"><span className="text-gray-400 font-bold">KPI</span></div><p className="text-sm text-gray-500">No KPIs tracked yet</p></div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="animate-fade-in">
              {client.sessions?.length ? (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Date</th><th>Type</th><th className="hide-mobile">Consultant</th><th>Duration</th><th>Rating</th></tr></thead>
                    <tbody>
                      {client.sessions.map((s) => (
                        <tr key={s.id}>
                          <td><span className="text-sm font-medium text-gray-700">{s.session_date}</span></td>
                          <td><span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded capitalize">{s.session_type}</span></td>
                          <td className="hide-mobile"><span className="text-sm text-gray-600">{s.consultant_name}</span></td>
                          <td><span className="text-sm font-semibold text-gray-700">{s.duration_hours}h</span></td>
                          <td>
                            {s.satisfaction_rating ? (
                              <span className="text-sm font-semibold text-gray-700">{s.satisfaction_rating}<span className="text-gray-400 font-normal">/5</span></span>
                            ) : <span className="text-gray-300">--</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><div className="empty-state-icon"><Calendar size={20} className="text-gray-400" /></div><p className="text-sm text-gray-500">No sessions recorded</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
