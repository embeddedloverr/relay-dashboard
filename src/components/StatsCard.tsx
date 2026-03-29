'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'cyan' | 'green' | 'red' | 'orange' | 'purple';
}

const colorStyles = {
  cyan: {
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/30',
    icon: 'text-accent-cyan',
    glow: 'shadow-accent-cyan/20',
  },
  green: {
    bg: 'bg-relay-on/10',
    border: 'border-relay-on/30',
    icon: 'text-relay-on',
    glow: 'shadow-relay-on/20',
  },
  red: {
    bg: 'bg-relay-off/10',
    border: 'border-relay-off/30',
    icon: 'text-relay-off',
    glow: 'shadow-relay-off/20',
  },
  orange: {
    bg: 'bg-accent-orange/10',
    border: 'border-accent-orange/30',
    icon: 'text-accent-orange',
    glow: 'shadow-accent-orange/20',
  },
  purple: {
    bg: 'bg-accent-purple/10',
    border: 'border-accent-purple/30',
    icon: 'text-accent-purple',
    glow: 'shadow-accent-purple/20',
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
}: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={cn(
      'card card-hover p-5 relative overflow-hidden',
      'hover:shadow-lg',
      styles.glow
    )}>
      {/* Background Pattern */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-industrial-400 font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-white">
              {value}
            </span>
            {trendValue && (
              <span className={cn(
                'text-sm font-medium',
                trend === 'up' ? 'text-relay-on' : trend === 'down' ? 'text-relay-off' : 'text-industrial-400'
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-industrial-400">{subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center border',
          styles.bg,
          styles.border
        )}>
          <Icon size={24} className={styles.icon} />
        </div>
      </div>
    </div>
  );
}
