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
    if (progress >= 75) return { bg: '#d1fae5', fg: '#10b981', label: 'On Track' };
    if (progress >= 50) return { bg: '#fef3c7', fg: '#f59e0b', label: 'Needs Attention' };
    return { bg: '#fee2e2', fg: '#ef4444', label: 'Behind' };
  };

  const onTrack = kpis.filter((k) => getProgress(k) >= 75).length;
  const needsAttention = kpis.filter((k) => { const p = getProgress(k); return p >= 50 && p < 75; }).length;
  const behind = kpis.filter((k) => getProgress(k) < 50).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 mt-1">Track key performance indicators across client engagements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total KPIs</p>
            <p className="text-xl font-bold text-slate-900">{kpis.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">On Track</p>
            <p className="text-xl font-bold text-emerald-600">{onTrack}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <Target size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Needs Attention</p>
            <p className="text-xl font-bold text-amber-600">{needsAttention}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Behind</p>
            <p className="text-xl font-bold text-red-600">{behind}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="input w-auto"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          <select
            className="input w-auto"
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

      {/* KPIs by Client */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : kpis.length === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-medium">No KPIs found</p>
          <p className="text-slate-400 text-sm mt-1">KPIs will appear here once they are defined for clients</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByClient).map(([clientName, clientKpis]) => (
            <div key={clientName} className="card">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">{clientName}</h3>
                <p className="text-sm text-slate-500">{clientKpis.length} KPIs tracked</p>
              </div>
              <div className="p-4 space-y-4">
                {clientKpis.map((kpi) => {
                  const progress = getProgress(kpi);
                  const status = getStatusColor(progress);
                  return (
                    <div key={kpi.id} className="p-4 rounded-lg border border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900">{kpi.name}</h4>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: status.bg, color: status.fg }}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-0.5">{kpi.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-slate-900">
                            {kpi.current_value} <span className="text-sm font-normal text-slate-400">{kpi.unit}</span>
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: status.fg }}
                          />
                        </div>
                      </div>

                      {/* Values row */}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Baseline: {kpi.baseline_value} {kpi.unit}</span>
                        <span className="font-medium">{progress.toFixed(0)}% complete</span>
                        <span>Target: {kpi.target_value} {kpi.unit}</span>
                      </div>

                      {kpi.measurement_date && (
                        <p className="text-xs text-slate-400 mt-2">
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
