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
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadKpis(); getClients().then(setClients).catch(() => {}); }, []);
  useEffect(() => { loadKpis(); }, [clientFilter, categoryFilter]);

  const categories = [...new Set(kpis.map((k) => k.category))];

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
    if (progress >= 75) return { fg: '#059669', label: 'On Track' };
    if (progress >= 50) return { fg: '#d97706', label: 'Needs Attention' };
    return { fg: '#dc2626', label: 'Behind' };
  };

  const onTrack = kpis.filter((k) => getProgress(k) >= 75).length;
  const needsAttention = kpis.filter((k) => { const p = getProgress(k); return p >= 50 && p < 75; }).length;
  const behind = kpis.filter((k) => getProgress(k) < 50).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">KPI Tracking</h1>
        <p className="page-subtitle">Track performance indicators across engagements</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-blue-50"><BarChart3 size={18} className="text-blue-600" /></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total KPIs</p><p className="text-xl font-bold text-gray-900">{kpis.length}</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-green-50"><TrendingUp size={18} className="text-green-600" /></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">On Track</p><p className="text-xl font-bold text-green-600">{onTrack}</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-amber-50"><Target size={18} className="text-amber-600" /></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Needs Attention</p><p className="text-xl font-bold text-amber-600">{needsAttention}</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-md rounded-lg bg-red-50"><AlertTriangle size={18} className="text-red-600" /></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Behind</p><p className="text-xl font-bold text-red-600">{behind}</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input w-auto" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <select className="input w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {(clientFilter || categoryFilter) && (
            <button onClick={() => { setClientFilter(''); setCategoryFilter(''); }} className="btn btn-ghost text-xs">Clear</button>
          )}
        </div>
      </div>

      {/* KPIs by client */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : kpis.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><BarChart3 size={24} className="text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No KPIs found</h3>
          <p className="text-sm text-gray-400">KPIs will appear once they are defined for clients.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByClient).map(([clientName, clientKpis]) => (
            <div key={clientName} className="card overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{clientName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{clientKpis.length} indicator{clientKpis.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-5 space-y-4">
                {clientKpis.map((kpi) => {
                  const progress = getProgress(kpi);
                  const status = getStatusColor(progress);
                  return (
                    <div key={kpi.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                            <span className="badge text-xs" style={{ background: `${status.fg}15`, color: status.fg }}>{status.label}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{kpi.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-gray-900">{kpi.current_value}</p>
                          <p className="text-xs text-gray-400">{kpi.unit}</p>
                        </div>
                      </div>
                      <div className="progress-bar progress-bar-lg mb-2">
                        <div className="progress-bar-fill" style={{ width: `${progress}%`, background: status.fg }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Baseline: {kpi.baseline_value} {kpi.unit}</span>
                        <span className="font-medium" style={{ color: status.fg }}>{progress.toFixed(0)}%</span>
                        <span>Target: {kpi.target_value} {kpi.unit}</span>
                      </div>
                      {kpi.measurement_date && (
                        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">Last measured: {kpi.measurement_date}</p>
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
