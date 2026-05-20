import { NextRequest, NextResponse } from 'next/server';
import { getSchedulesCollection } from '@/lib/mongodb';

export interface Schedule {
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
  try {
    const { searchParams } = new URL(request.url);
    const relayId = searchParams.get('relayId');
    const enabled = searchParams.get('enabled');

    const collection = await getSchedulesCollection();
    let query: any = {};
    
    if (relayId) {
      query.relayId = relayId;
    }

    if (enabled !== null) {
      query.enabled = enabled === 'true';
    }

    const schedules = await collection.find(query).toArray();
    
    // Convert _id to string or map it back
    const formattedSchedules = schedules.map((s: any) => ({
      ...s,
      _id: s._id.toString()
    }));

    return NextResponse.json({
      success: true,
      data: formattedSchedules,
      count: formattedSchedules.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Schedules API] Fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch schedules' }, { status: 500 });
  }
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

    const collection = await getSchedulesCollection();
    await collection.insertOne(newSchedule);

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

    const collection = await getSchedulesCollection();
    
    // Find the schedule first to recalculate nextRun if necessary
    const existingSchedule = await collection.findOne({ id });
    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const updatedSchedule: any = {
      ...existingSchedule,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate next run if schedule parameters changed
    if (updates.time || updates.days || updates.intervalMinutes || updates.date || updates.scheduleType) {
      updatedSchedule.nextRun = calculateNextRun(updatedSchedule);
    }

    // Don't modify the _id field during update
    const { _id, ...updatePayload } = updatedSchedule;

    await collection.updateOne({ id }, { $set: updatePayload });

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

    const collection = await getSchedulesCollection();
    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
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
