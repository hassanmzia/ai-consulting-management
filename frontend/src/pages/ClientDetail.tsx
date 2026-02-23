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
      <div className="text-center py-12">
        <p className="text-slate-500">Client not found</p>
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
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Clients
      </button>

      {/* Client Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 size={28} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{client.company_name}</h2>
                <p className="text-slate-500 mt-1">{client.industry}</p>
              </div>
              <span className={`badge badge-${client.status}`}>
                {client.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Mail size={15} className="text-slate-400" />
                {client.contact_email}
              </span>
              {client.contact_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={15} className="text-slate-400" />
                  {client.contact_phone}
                </span>
              )}
              {client.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-slate-400" />
                  {client.city}{client.country ? `, ${client.country}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <DollarSign size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <FolderKanban size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Projects</p>
            <p className="text-xl font-bold text-slate-900">{activeProjects}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
            <Calendar size={20} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Sessions</p>
            <p className="text-xl font-bold text-slate-900">{totalSessions}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-slate-200 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'projects' && (
            <div>
              {client.projects?.length ? (
                <div className="space-y-3">
                  {client.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{project.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Budget: ${project.budget?.toLocaleString()} | Spent: ${project.spent?.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                        <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">No projects yet</p>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              {client.invoices?.length ? (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Invoice</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Status</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Amount</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.invoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-slate-100">
                        <td className="py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                        <td className="py-3">
                          <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                        </td>
                        <td className="py-3 font-semibold">${inv.total_amount?.toLocaleString()}</td>
                        <td className="py-3 text-slate-500">{inv.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-slate-400 py-8">No invoices yet</p>
              )}
            </div>
          )}

          {activeTab === 'kpis' && (
            <div>
              {client.kpis?.length ? (
                <div className="space-y-3">
                  {client.kpis.map((kpi) => {
                    const progress = kpi.target_value > 0
                      ? Math.min(((kpi.current_value - kpi.baseline_value) / (kpi.target_value - kpi.baseline_value)) * 100, 100)
                      : 0;
                    const progressColor = progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={kpi.id} className="p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">{kpi.name}</p>
                            <p className="text-xs text-slate-400">{kpi.category}</p>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: progressColor }}>
                            {kpi.current_value} / {kpi.target_value} {kpi.unit}
                          </p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${Math.max(progress, 0)}%`, backgroundColor: progressColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">No KPIs tracked yet</p>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              {client.sessions?.length ? (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Date</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Type</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Consultant</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Duration</th>
                      <th className="text-left text-xs font-semibold uppercase text-slate-500 pb-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.sessions.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="py-3 text-slate-700">{s.session_date}</td>
                        <td className="py-3 capitalize text-slate-600">{s.session_type}</td>
                        <td className="py-3 text-slate-600">{s.consultant_name}</td>
                        <td className="py-3 text-slate-600">{s.duration_hours}h</td>
                        <td className="py-3">
                          {s.satisfaction_rating ? (
                            <span className="font-semibold text-amber-500">{s.satisfaction_rating}/5</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-slate-400 py-8">No sessions recorded yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
