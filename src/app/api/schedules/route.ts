import { NextRequest, NextResponse } from 'next/server';

interface Schedule {
  id: string;
  name: string;
  relayId: string;
  enabled: boolean;
  action: 'ON' | 'OFF' | 'TOGGLE';
  scheduleType: 'once' | 'daily' | 'weekly' | 'interval';
  time?: string;
  days?: string[];
  intervalMinutes?: number;
  durationMinutes?: number;
  date?: string;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage (replace with database in production)
let schedules: Schedule[] = [
  {
    id: 'sch-001',
    name: 'Morning Pump Cycle',
    relayId: 'relay-001',
    enabled: true,
    action: 'ON',
    scheduleType: 'daily',
    time: '06:00',
    durationMinutes: 30,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'sch-002',
    name: 'Evening Pump Cycle',
    relayId: 'relay-001',
    enabled: true,
    action: 'ON',
    scheduleType: 'daily',
    time: '18:00',
    durationMinutes: 45,
    lastRun: new Date(Date.now() - 43200000).toISOString(),
    nextRun: new Date(Date.now() + 21600000).toISOString(),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'sch-003',
    name: 'Weekend Maintenance',
    relayId: 'relay-006',
    enabled: false,
    action: 'ON',
    scheduleType: 'weekly',
    time: '10:00',
    days: ['SAT'],
    durationMinutes: 60,
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sch-004',
    name: 'UV Sterilizer Cycle',
    relayId: 'relay-008',
    enabled: true,
    action: 'ON',
    scheduleType: 'interval',
    intervalMinutes: 120,
    durationMinutes: 15,
    lastRun: new Date(Date.now() - 7200000).toISOString(),
    nextRun: new Date(Date.now() + 300000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 2592000000).toISOString(),
  },
];

// Calculate next run time based on schedule type
function calculateNextRun(schedule: Schedule): string | undefined {
  const now = new Date();
  
  switch (schedule.scheduleType) {
    case 'daily': {
      if (!schedule.time) return undefined;
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const next = new Date(now);
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next.toISOString();
    }
    
    case 'weekly': {
      if (!schedule.time || !schedule.days?.length) return undefined;
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const dayMap: Record<string, number> = {
        SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
      };
      
      let minNext: Date | null = null;
      for (const day of schedule.days) {
        const targetDay = dayMap[day];
        const next = new Date(now);
        const currentDay = next.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        if (daysUntil === 0) {
          next.setHours(hours, minutes, 0, 0);
          if (next <= now) daysUntil = 7;
        }
        next.setDate(next.getDate() + daysUntil);
        next.setHours(hours, minutes, 0, 0);
        
        if (!minNext || next < minNext) {
          minNext = next;
        }
      }
      return minNext?.toISOString();
    }
    
    case 'interval': {
      if (!schedule.intervalMinutes) return undefined;
      const next = new Date(now.getTime() + schedule.intervalMinutes * 60000);
      return next.toISOString();
    }
    
    case 'once': {
      if (!schedule.date || !schedule.time) return undefined;
      const next = new Date(`${schedule.date}T${schedule.time}:00`);
      return next > now ? next.toISOString() : undefined;
    }
    
    default:
      return undefined;
  }
}

// GET - Fetch all schedules
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const relayId = searchParams.get('relayId');
  const enabled = searchParams.get('enabled');

  let filteredSchedules = schedules;

  if (relayId) {
    filteredSchedules = filteredSchedules.filter(s => s.relayId === relayId);
  }

  if (enabled !== null) {
    const isEnabled = enabled === 'true';
    filteredSchedules = filteredSchedules.filter(s => s.enabled === isEnabled);
  }

  return NextResponse.json({
    success: true,
    data: filteredSchedules,
    count: filteredSchedules.length,
    timestamp: new Date().toISOString(),
  });
}

// POST - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const newSchedule: Schedule = {
      id: `sch-${Date.now()}`,
      name: body.name,
      relayId: body.relayId,
      enabled: body.enabled ?? true,
      action: body.action || 'ON',
      scheduleType: body.scheduleType || 'daily',
      time: body.time,
      days: body.days,
      intervalMinutes: body.intervalMinutes,
      durationMinutes: body.durationMinutes,
      date: body.date,
      createdAt: now,
      updatedAt: now,
    };

    // Calculate next run
    newSchedule.nextRun = calculateNextRun(newSchedule);

    schedules.push(newSchedule);

    return NextResponse.json({
      success: true,
      data: newSchedule,
      message: 'Schedule created successfully',
    });
  } catch (error) {
    console.error('[Schedules API] Create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 400 }
    );
  }
}

// PATCH - Update schedule
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const scheduleIndex = schedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const updatedSchedule: Schedule = {
      ...schedules[scheduleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate next run if schedule parameters changed
    if (updates.time || updates.days || updates.intervalMinutes || updates.date || updates.scheduleType) {
      updatedSchedule.nextRun = calculateNextRun(updatedSchedule);
    }

    schedules[scheduleIndex] = updatedSchedule;

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'Schedule updated successfully',
    });
  } catch (error) {
    console.error('[Schedules API] Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 400 }
    );
  }
}

// DELETE - Delete schedule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const scheduleIndex = schedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const deleted = schedules.splice(scheduleIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('[Schedules API] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 400 }
    );
  }
}
