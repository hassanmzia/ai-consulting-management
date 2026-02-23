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
  iconColor = '#6366f1',
  iconBg = '#eef2ff',
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${iconColor}, ${iconColor}80)` }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</p>
          {(subtitle || trendValue) && (
            <div className="flex items-center gap-2 mt-2.5">
              {trendValue && trend && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                    trend === 'up' && 'text-emerald-700 bg-emerald-50',
                    trend === 'down' && 'text-red-700 bg-red-50',
                    trend === 'neutral' && 'text-slate-500 bg-slate-50'
                  )}
                >
                  <TrendIcon size={12} />
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="icon-box icon-box-md rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
