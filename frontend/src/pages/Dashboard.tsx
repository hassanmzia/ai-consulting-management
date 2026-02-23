import { useEffect, useState } from 'react';
import {
  DollarSign,
  FolderKanban,
  Users,
  Clock,
  FileText,
  Star,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  in_progress: '#3b82f6',
  completed: '#8b5cf6',
  planning: '#f59e0b',
  on_hold: '#94a3b8',
  cancelled: '#ef4444',
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
      } catch {
        // Errors handled per-request above
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
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue ?? 0)}
          icon={DollarSign}
          trend={stats?.revenue_trend !== undefined ? (stats.revenue_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.revenue_trend !== undefined ? formatTrend(stats.revenue_trend) : undefined}
          subtitle="vs last period"
          iconColor="#10b981"
          iconBg="#d1fae5"
        />
        <StatsCard
          title="Active Projects"
          value={stats?.active_projects ?? 0}
          icon={FolderKanban}
          trend={stats?.projects_trend !== undefined ? (stats.projects_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.projects_trend !== undefined ? formatTrend(stats.projects_trend) : undefined}
          subtitle="vs last period"
          iconColor="#3b82f6"
          iconBg="#dbeafe"
        />
        <StatsCard
          title="Active Clients"
          value={stats?.active_clients ?? 0}
          icon={Users}
          trend={stats?.clients_trend !== undefined ? (stats.clients_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.clients_trend !== undefined ? formatTrend(stats.clients_trend) : undefined}
          subtitle="vs last period"
          iconColor="#8b5cf6"
          iconBg="#ede9fe"
        />
        <StatsCard
          title="Billable Hours"
          value={stats?.billable_hours_this_month?.toFixed(0) ?? '0'}
          icon={Clock}
          trend={stats?.hours_trend !== undefined ? (stats.hours_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.hours_trend !== undefined ? formatTrend(stats.hours_trend) : undefined}
          subtitle="this month"
          iconColor="#f59e0b"
          iconBg="#fef3c7"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(stats?.outstanding_invoices ?? 0)}
          icon={FileText}
          subtitle="invoices pending"
          iconColor="#ef4444"
          iconBg="#fee2e2"
        />
        <StatsCard
          title="Avg Satisfaction"
          value={stats?.avg_satisfaction?.toFixed(1) ?? '0.0'}
          icon={Star}
          subtitle="out of 5.0"
          iconColor="#f59e0b"
          iconBg="#fef3c7"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2 overflow-hidden">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Monthly Revenue</h3>
          <div className="h-56 sm:h-72">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(v: number) => formatCurrency(v)}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Project Status Pie Chart */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Project Status</h3>
          <div className="h-56 sm:h-72">
            {projectStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {projectStatus.map((entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-600 capitalize">{value.replace('_', ' ')}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No project data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultant Utilization */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Consultant Utilization</h3>
          <div className="h-56 sm:h-72">
            {utilization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={utilization}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={75}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(0)}%`, 'Utilization']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar dataKey="utilization" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No utilization data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{item.user}</span>
                      <span className="text-xs text-slate-300">|</span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
