'use client';

import { 
  Calendar, 
  Clock, 
  Repeat, 
  Power, 
  Edit2,
  ToggleLeft,
  ToggleRight,
  ChevronRight
} from 'lucide-react';
import { Schedule } from '@/types';
import { useRelayStore } from '@/store/relayStore';
import { cn, formatTime, formatTimeAgo, getDayShort } from '@/lib/utils';

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
}

export default function ScheduleCard({ schedule, onEdit }: ScheduleCardProps) {
  const { relays, toggleScheduleEnabled } = useRelayStore();
  const relay = relays.find(r => r.id === schedule.relayId);

  const getScheduleDescription = () => {
    switch (schedule.scheduleType) {
      case 'once':
        return `Once on ${schedule.date} at ${formatTime(schedule.time || '00:00')}`;
      case 'daily':
        return `Daily at ${formatTime(schedule.time || '00:00')}`;
      case 'weekly':
        const days = schedule.days?.map(d => getDayShort(d)).join(', ');
        return `${days} at ${formatTime(schedule.time || '00:00')}`;
      case 'interval':
        return `Every ${schedule.intervalMinutes} minutes`;
      default:
        return 'Unknown schedule';
    }
  };

  const getTypeIcon = () => {
    switch (schedule.scheduleType) {
      case 'once':
        return Calendar;
      case 'daily':
        return Clock;
      case 'weekly':
      case 'interval':
        return Repeat;
      default:
        return Calendar;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className={cn(
      'card p-5 transition-all duration-300',
      schedule.enabled 
        ? 'card-hover border-industrial-600' 
        : 'opacity-60 border-industrial-700'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border',
            schedule.enabled
              ? 'bg-accent-cyan/20 border-accent-cyan/30'
              : 'bg-industrial-700 border-industrial-600'
          )}>
            <TypeIcon 
              size={20} 
              className={schedule.enabled ? 'text-accent-cyan' : 'text-industrial-400'} 
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">{schedule.name}</h3>
            <p className="text-sm text-industrial-400">{getScheduleDescription()}</p>
          </div>
        </div>

        {/* Enable Toggle */}
        <button
          onClick={() => toggleScheduleEnabled(schedule.id)}
          className={cn(
            'toggle-switch',
            schedule.enabled ? 'bg-relay-on' : 'bg-industrial-600'
          )}
        >
          <span
            className={cn(
              'toggle-switch-thumb',
              schedule.enabled ? 'translate-x-8' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Target Relay */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-industrial-700/30 rounded-lg">
        <Power size={16} className="text-industrial-400" />
        <span className="text-sm text-industrial-300">Target:</span>
        <span className="text-sm font-medium text-white">
          {relay?.name || 'Unknown Relay'}
        </span>
        <ChevronRight size={14} className="text-industrial-500" />
        <span className={cn(
          'badge',
          schedule.action === 'ON' ? 'badge-on' : 
          schedule.action === 'OFF' ? 'badge-off' : 'badge-auto'
        )}>
          {schedule.action}
        </span>
      </div>

      {/* Schedule Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {schedule.durationMinutes && (
          <div className="text-sm">
            <span className="text-industrial-400">Duration:</span>
            <span className="ml-2 font-mono text-white">{schedule.durationMinutes}m</span>
          </div>
        )}
        {schedule.nextRun && (
          <div className="text-sm">
            <span className="text-industrial-400">Next Run:</span>
            <span className="ml-2 font-mono text-accent-cyan">
              {formatTimeAgo(schedule.nextRun)}
            </span>
          </div>
        )}
        {schedule.lastRun && (
          <div className="text-sm">
            <span className="text-industrial-400">Last Run:</span>
            <span className="ml-2 font-mono text-industrial-300">
              {formatTimeAgo(schedule.lastRun)}
            </span>
          </div>
        )}
      </div>

      {/* Edit Button */}
      <button
        onClick={() => onEdit(schedule)}
        className="btn btn-ghost w-full text-sm"
      >
        <Edit2 size={16} />
        Edit Schedule
      </button>
    </div>
  );
}
