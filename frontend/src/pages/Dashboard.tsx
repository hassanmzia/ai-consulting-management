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
  AreaChart,
  Area,
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

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  in_progress: '#6366f1',
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
      {/* Welcome banner */}
      <div className="card p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5, #7c3aed)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Welcome back</h2>
          <p className="text-indigo-200/70 mt-1 text-sm">Here&apos;s an overview of your consulting practice</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatsCard
          title="Revenue"
          value={formatCurrency(stats?.total_revenue ?? 0)}
          icon={DollarSign}
          trend={stats?.revenue_trend !== undefined ? (stats.revenue_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.revenue_trend !== undefined ? formatTrend(stats.revenue_trend) : undefined}
          subtitle="vs last period"
          iconColor="#10b981"
          iconBg="#d1fae5"
        />
        <StatsCard
          title="Projects"
          value={stats?.active_projects ?? 0}
          icon={FolderKanban}
          trend={stats?.projects_trend !== undefined ? (stats.projects_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.projects_trend !== undefined ? formatTrend(stats.projects_trend) : undefined}
          subtitle="active"
          iconColor="#6366f1"
          iconBg="#eef2ff"
        />
        <StatsCard
          title="Clients"
          value={stats?.active_clients ?? 0}
          icon={Users}
          trend={stats?.clients_trend !== undefined ? (stats.clients_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.clients_trend !== undefined ? formatTrend(stats.clients_trend) : undefined}
          subtitle="active"
          iconColor="#8b5cf6"
          iconBg="#ede9fe"
        />
        <StatsCard
          title="Hours"
          value={stats?.billable_hours_this_month?.toFixed(0) ?? '0'}
          icon={Clock}
          trend={stats?.hours_trend !== undefined ? (stats.hours_trend >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={stats?.hours_trend !== undefined ? formatTrend(stats.hours_trend) : undefined}
          subtitle="billable this month"
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
          title="Satisfaction"
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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Monthly Revenue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Revenue vs target trends</p>
            </div>
          </div>
          <div className="h-56 sm:h-72">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} tickFormatter={(v: number) => formatCurrency(v)} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px' }}
                  />
                  <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={1.5} fill="url(#targetGradient)" strokeDasharray="4 4" name="Target" />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGradient)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">
                <p className="text-slate-400 text-sm">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Status Pie Chart */}
        <div className="card p-5">
          <div className="mb-5">
            <h3 className="section-title">Project Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution by status</p>
          </div>
          <div className="h-56 sm:h-72">
            {projectStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatus}
                    cx="50%"
                    cy="42%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="status"
                    strokeWidth={0}
                  >
                    {projectStatus.map((entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-600 capitalize font-medium">{value.replace('_', ' ')}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">
                <p className="text-slate-400 text-sm">No project data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultant Utilization */}
        <div className="card p-5">
          <div className="mb-5">
            <h3 className="section-title">Consultant Utilization</h3>
            <p className="text-xs text-slate-400 mt-0.5">Billable hours percentage</p>
          </div>
          {utilization.length > 0 ? (
            <div className="space-y-4">
              {utilization.map((consultant) => {
                const util = consultant.utilization ?? 0;
                const color = util >= 85 ? '#ef4444' : util >= 70 ? '#10b981' : util >= 50 ? '#f59e0b' : '#94a3b8';
                return (
                  <div key={consultant.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{consultant.name}</span>
                      <span className="text-sm font-bold" style={{ color }}>{util.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(util, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-slate-400 text-sm">No utilization data available</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="mb-5">
            <h3 className="section-title">Recent Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest actions and updates</p>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-100 transition-colors">
                    <Activity size={14} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium leading-snug">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 font-medium">{item.user}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-300 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p className="text-slate-400 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
