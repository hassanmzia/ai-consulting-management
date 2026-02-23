import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  iconColor = '#3b82f6',
  iconBg = '#eff6ff',
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {(subtitle || trendValue) && (
            <div className="flex items-center gap-2 mt-2">
              {trendValue && trend && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-0.5 text-xs font-semibold',
                    trend === 'up' && 'text-emerald-600',
                    trend === 'down' && 'text-red-600',
                    trend === 'neutral' && 'text-slate-500'
                  )}
                >
                  <TrendIcon size={14} />
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
