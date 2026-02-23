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
  iconColor = '#2563eb',
  iconBg = '#eff6ff',
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {(subtitle || trendValue) && (
            <div className="flex items-center gap-2 mt-2">
              {trendValue && trend && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
                    trend === 'up' && 'text-green-700 bg-green-50',
                    trend === 'down' && 'text-red-700 bg-red-50',
                    trend === 'neutral' && 'text-gray-500 bg-gray-50'
                  )}
                >
                  <TrendIcon size={12} />
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-gray-400">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="icon-box icon-box-md rounded-lg"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
