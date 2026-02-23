import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { getKpis, getClients } from '@/lib/api';
import type { KPI, Client } from '@/lib/api';

export default function KPIs() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadKpis = async () => {
    try {
      const params: Record<string, string> = {};
      if (clientFilter) params.client_id = clientFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await getKpis(params);
      setKpis(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
    getClients().then(setClients).catch(() => {});
  }, []);

  useEffect(() => {
    loadKpis();
  }, [clientFilter, categoryFilter]);

  const categories = [...new Set(kpis.map((k) => k.category))];

  // Group KPIs by client
  const groupedByClient = kpis.reduce<Record<string, KPI[]>>((acc, kpi) => {
    const key = kpi.client_name || `Client ${kpi.client_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(kpi);
    return acc;
  }, {});

  const getProgress = (kpi: KPI) => {
    const range = kpi.target_value - kpi.baseline_value;
    if (range === 0) return 100;
    return Math.min(Math.max(((kpi.current_value - kpi.baseline_value) / range) * 100, 0), 100);
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 75) return { bg: '#d1fae5', fg: '#10b981', label: 'On Track', gradient: 'from-emerald-400 to-emerald-600' };
    if (progress >= 50) return { bg: '#fef3c7', fg: '#f59e0b', label: 'Needs Attention', gradient: 'from-amber-400 to-amber-600' };
    return { bg: '#fee2e2', fg: '#ef4444', label: 'Behind', gradient: 'from-red-400 to-red-600' };
  };

  const onTrack = kpis.filter((k) => getProgress(k) >= 75).length;
  const needsAttention = kpis.filter((k) => { const p = getProgress(k); return p >= 50 && p < 75; }).length;
  const behind = kpis.filter((k) => getProgress(k) < 50).length;

  const summaryCards = [
    {
      label: 'Total KPIs',
      value: kpis.length,
      icon: BarChart3,
      stripColor: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      valueColor: 'text-slate-900',
    },
    {
      label: 'On Track',
      value: onTrack,
      icon: TrendingUp,
      stripColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      valueColor: 'text-emerald-600',
    },
    {
      label: 'Needs Attention',
      value: needsAttention,
      icon: Target,
      stripColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      valueColor: 'text-amber-600',
    },
    {
      label: 'Behind',
      value: behind,
      icon: AlertTriangle,
      stripColor: 'bg-gradient-to-r from-red-500 to-red-600',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      valueColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title tracking-tight">KPI Tracking</h1>
        <p className="page-subtitle mt-1">Track key performance indicators across client engagements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {summaryCards.map((card) => (
          <div key={card.label} className="card overflow-hidden">
            <div className={`h-1 ${card.stripColor}`} />
            <div className="p-5 flex items-center gap-4">
              <div className={`icon-box icon-box-md ${card.iconBg} text-white shadow-lg`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className={`text-2xl font-extrabold tracking-tight ${card.valueColor}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Filters</span>
            <div className="divider hidden sm:block" style={{ height: '20px', width: '1px', background: '#e2e8f0' }} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <label className="label text-[11px]">Client</label>
              <select
                className="input w-full sm:w-auto min-w-[180px]"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label text-[11px]">Category</label>
              <select
                className="input w-full sm:w-auto min-w-[180px]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          {(clientFilter || categoryFilter) && (
            <button
              onClick={() => { setClientFilter(''); setCategoryFilter(''); }}
              className="btn btn-ghost text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* KPIs by Client */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : kpis.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-4 tracking-tight">No KPIs found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            KPIs will appear here once they are defined for clients. Try adjusting your filters or adding new performance indicators.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {Object.entries(groupedByClient).map(([clientName, clientKpis]) => (
            <div key={clientName} className="card overflow-hidden">
              {/* Client Group Header */}
              <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="icon-box icon-box-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <BarChart3 size={14} />
                  </div>
                  <div>
                    <h3 className="section-title text-base font-bold text-slate-900 tracking-tight">{clientName}</h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                      {clientKpis.length} {clientKpis.length === 1 ? 'indicator' : 'indicators'} tracked
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="p-4 sm:p-5 space-y-4">
                {clientKpis.map((kpi) => {
                  const progress = getProgress(kpi);
                  const status = getStatusColor(progress);
                  return (
                    <div
                      key={kpi.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="font-semibold text-slate-900 tracking-tight">{kpi.name}</h4>
                            <span
                              className="badge text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r text-white"
                              style={{
                                backgroundImage: `linear-gradient(135deg, ${status.fg}, ${status.fg}dd)`,
                              }}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">{kpi.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                            {kpi.current_value}
                          </p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{kpi.unit}</p>
                        </div>
                      </div>

                      {/* Progress bar (large) */}
                      <div className="progress-bar progress-bar-lg mb-3 bg-slate-100 rounded-full overflow-hidden" style={{ height: '10px' }}>
                        <div
                          className="progress-bar-fill h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${progress}%`,
                            backgroundImage: `linear-gradient(90deg, ${status.fg}cc, ${status.fg})`,
                          }}
                        />
                      </div>

                      {/* Values row */}
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Baseline: {kpi.baseline_value} {kpi.unit}
                        </span>
                        <span className="text-xs font-bold" style={{ color: status.fg }}>
                          {progress.toFixed(0)}% complete
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Target: {kpi.target_value} {kpi.unit}
                        </span>
                      </div>

                      {kpi.measurement_date && (
                        <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                          Last measured: {kpi.measurement_date}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
