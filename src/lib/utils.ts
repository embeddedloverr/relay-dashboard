import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { DayOfWeek } from '@/types';

export function formatTimestamp(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'dd MMM yyyy, HH:mm:ss');
  } catch {
    return 'Invalid date';
  }
}

export function formatTimeAgo(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return 'Unknown';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function getDayName(day: DayOfWeek): string {
  const names: Record<DayOfWeek, string> = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
  };
  return names[day];
}

export function getDayShort(day: DayOfWeek): string {
  const names: Record<DayOfWeek, string> = {
    MON: 'Mon',
    TUE: 'Tue',
    WED: 'Wed',
    THU: 'Thu',
    FRI: 'Fri',
    SAT: 'Sat',
    SUN: 'Sun',
  };
  return names[day];
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getRelayStateColor(state: 'ON' | 'OFF'): string {
  return state === 'ON' ? 'text-relay-on' : 'text-relay-off';
}

export function getRelayStateBg(state: 'ON' | 'OFF'): string {
  return state === 'ON' ? 'bg-relay-on' : 'bg-relay-off';
}

export function getModeColor(mode: 'manual' | 'auto' | 'disabled'): string {
  switch (mode) {
    case 'manual':
      return 'text-accent-cyan';
    case 'auto':
      return 'text-relay-on';
    case 'disabled':
      return 'text-industrial-400';
    default:
      return 'text-industrial-300';
  }
}

export function calculateNextRun(schedule: {
  scheduleType: string;
  time?: string;
  days?: DayOfWeek[];
  intervalMinutes?: number;
  date?: string;
}): Date | null {
  const now = new Date();
  
  switch (schedule.scheduleType) {
    case 'once':
      if (schedule.date && schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const date = new Date(schedule.date);
        date.setHours(hours, minutes, 0, 0);
        return date > now ? date : null;
      }
      break;
      
    case 'daily':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const nextRun = new Date(now);
        nextRun.setHours(hours, minutes, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        return nextRun;
      }
      break;
      
    case 'weekly':
      if (schedule.time && schedule.days && schedule.days.length > 0) {
        const dayMap: Record<DayOfWeek, number> = {
          SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
        };
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const scheduleDays = schedule.days.map((d) => dayMap[d]).sort();
        
        for (let i = 0; i < 8; i++) {
          const checkDate = new Date(now);
          checkDate.setDate(checkDate.getDate() + i);
          checkDate.setHours(hours, minutes, 0, 0);
          
          if (scheduleDays.includes(checkDate.getDay()) && checkDate > now) {
            return checkDate;
          }
        }
      }
      break;
      
    case 'interval':
      if (schedule.intervalMinutes) {
        const nextRun = new Date(now);
        nextRun.setMinutes(nextRun.getMinutes() + schedule.intervalMinutes);
        return nextRun;
      }
      break;
  }
  
  return null;
}
