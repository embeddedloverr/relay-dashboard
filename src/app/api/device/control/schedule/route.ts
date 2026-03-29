import { NextRequest, NextResponse } from 'next/server';
import { publishMqtt } from '@/lib/mqttClient';
import { verifyDeviceAccess } from '@/lib/auth';

/**
 * POST /api/device/control/schedule
 * 
 * Send a schedule to a device via MQTT.
 * Publishes to: sdwell/{MAC}/cmd/schedule
 * Payload:      [{"relay":1,"on":"18:00","off":"23:00"}, ...]
 * 
 * Request body:
 *   {
 *     mac: string,
 *     schedules: Array<{ relay: number, on: string (HH:mm), off: string (HH:mm) }>
 *   }
 */

interface ScheduleEntry {
  relay: number;
  on: string;   // HH:mm format
  off: string;  // HH:mm format
}

// Validate HH:mm time format
function isValidTime(time: string): boolean {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac, schedules } = body;

    if (!mac) {
      return NextResponse.json(
        { success: false, error: 'mac is required (device MAC address)' },
        { status: 400 }
      );
    }

    // Security Authorization Check
    const token = request.cookies.get('auth-token')?.value;
    const hasAccess = await verifyDeviceAccess(mac, token);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Access denied for this device' }, { status: 403 });
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'schedules must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each schedule entry
    for (let i = 0; i < schedules.length; i++) {
      const entry: ScheduleEntry = schedules[i];

      if (!entry.relay || typeof entry.relay !== 'number' || entry.relay < 1 || entry.relay > 6) {
        return NextResponse.json(
          { success: false, error: `schedules[${i}].relay must be a number between 1 and 6` },
          { status: 400 }
        );
      }

      if (!entry.on || !isValidTime(entry.on)) {
        return NextResponse.json(
          { success: false, error: `schedules[${i}].on must be in HH:mm format (e.g. "18:00")` },
          { status: 400 }
        );
      }

      if (!entry.off || !isValidTime(entry.off)) {
        return NextResponse.json(
          { success: false, error: `schedules[${i}].off must be in HH:mm format (e.g. "23:00")` },
          { status: 400 }
        );
      }
    }

    const topic = `sdwell/${mac}/cmd/schedule`;
    // The payload is the schedules array directly
    const payload: ScheduleEntry[] = schedules.map((s: ScheduleEntry) => ({
      relay: s.relay,
      on: s.on,
      off: s.off,
    }));

    const published = await publishMqtt(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command. Check broker connection.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Schedule with ${schedules.length} entries sent to ${mac}`,
      data: { mac, topic, payload, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Schedule Control API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process schedule request' },
      { status: 500 }
    );
  }
}
