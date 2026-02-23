import { useEffect, useState } from 'react';
import {
  DollarSign,
  FolderKanban,
  Users,
  Clock,
  FileText,
  Star,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatsCard from '@/components/StatsCard';
import {
  getDashboardStats,
  getRevenueChart,
  getProjectStatus,
  getConsultantUtilization,
  getRecentActivity,
} from '@/lib/api';
import type {
  DashboardStats,
  RevenueChartData,
  ProjectStatusData,
  ConsultantUtilizationData,
  ActivityItem,
} from '@/lib/api';

const PIE_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#ec4899'];

const STATUS_COLORS: Record<string, string> = {
  active: '#059669',
  in_progress: '#2563eb',
  completed: '#7c3aed',
  planning: '#d97706',
  on_hold: '#9ca3af',
  cancelled: '#dc2626',
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTrend(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatusData[]>([]);
  const [utilization, setUtilization] = useState<ConsultantUtilizationData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, revenueRes, projectRes, utilRes, activityRes] = await Promise.allSettled([
          getDashboardStats(),
          getRevenueChart(),
          getProjectStatus(),
          getConsultantUtilization(),
          getRecentActivity(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (revenueRes.status === 'fulfilled') setRevenueData(revenueRes.value);
        if (projectRes.status === 'fulfilled') setProjectStatus(projectRes.value);
        if (utilRes.status === 'fulfilled') setUtilization(utilRes.value);
        if (activityRes.status === 'fulfilled') setActivity(activityRes.value);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Revenue"
          value={formatCurrency(stats?.total_revenue ?? 0)}
          icon={DollarSign}
          trend={stats?.revenue_trend !== undefined ? (stats.revenue_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.revenue_trend !== undefined ? formatTrend(stats.revenue_trend) : undefined}
          subtitle="vs last period"
          iconColor="#059669"
          iconBg="#d1fae5"
        />
        <StatsCard
          title="Projects"
          value={stats?.active_projects ?? 0}
          icon={FolderKanban}
          trend={stats?.projects_trend !== undefined ? (stats.projects_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.projects_trend !== undefined ? formatTrend(stats.projects_trend) : undefined}
          subtitle="active"
          iconColor="#2563eb"
          iconBg="#dbeafe"
        />
        <StatsCard
          title="Clients"
          value={stats?.active_clients ?? 0}
          icon={Users}
          trend={stats?.clients_trend !== undefined ? (stats.clients_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.clients_trend !== undefined ? formatTrend(stats.clients_trend) : undefined}
          subtitle="active"
          iconColor="#7c3aed"
          iconBg="#ede9fe"
        />
        <StatsCard
          title="Hours"
          value={stats?.billable_hours_this_month?.toFixed(0) ?? '0'}
          icon={Clock}
          trend={stats?.hours_trend !== undefined ? (stats.hours_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.hours_trend !== undefined ? formatTrend(stats.hours_trend) : undefined}
          subtitle="billable this month"
          iconColor="#d97706"
          iconBg="#fef3c7"
        />
        <StatsCard title="Outstanding" value={formatCurrency(stats?.outstanding_invoices ?? 0)} icon={FileText} subtitle="invoices pending" iconColor="#dc2626" iconBg="#fee2e2" />
        <StatsCard title="Satisfaction" value={stats?.avg_satisfaction?.toFixed(1) ?? '0.0'} icon={Star} subtitle="out of 5.0" iconColor="#d97706" iconBg="#fef3c7" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="section-title mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 mb-4">Revenue vs target trends</p>
          <div className="h-64">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => formatCurrency(v)} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                  <Area type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Target" />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full"><p className="text-gray-400 text-sm">No revenue data</p></div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="section-title mb-1">Project Status</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution by status</p>
          <div className="h-64">
            {projectStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectStatus} cx="50%" cy="42%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="count" nameKey="status" strokeWidth={0}>
                    {projectStatus.map((entry, index) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-gray-600 capitalize">{value.replace('_', ' ')}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full"><p className="text-gray-400 text-sm">No project data</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-1">Consultant Utilization</h3>
          <p className="text-xs text-gray-400 mb-4">Billable hours percentage</p>
          {utilization.length > 0 ? (
            <div className="space-y-4">
              {utilization.map((c) => {
                const util = c.utilization ?? 0;
                const color = util >= 85 ? '#dc2626' : util >= 70 ? '#059669' : util >= 50 ? '#d97706' : '#9ca3af';
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{c.name}</span>
                      <span className="text-sm font-semibold" style={{ color }}>{util.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(util, 100)}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><p className="text-gray-400 text-sm">No utilization data</p></div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="section-title mb-1">Recent Activity</h3>
          <p className="text-xs text-gray-400 mb-4">Latest actions and updates</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{item.user}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-gray-300 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            ) : (
              <div className="empty-state"><p className="text-gray-400 text-sm">No recent activity</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
