import { NextRequest, NextResponse } from 'next/server';
import { publishMqtt } from '@/lib/mqttClient';
import { verifyDeviceAccess } from '@/lib/auth';

/**
 * POST /api/device/control/clearschedule
 * 
 * Clear all schedules on a device via MQTT (clears RAM + EEPROM).
 * Publishes to: sdwell/{MAC}/cmd/clearschedule
 * Payload:      {"confirm": true}
 * 
 * Request body:
 *   { mac: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac } = body;

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

    const topic = `sdwell/${mac}/cmd/clearschedule`;
    const payload = { confirm: true };

    const published = await publishMqtt(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command. Check broker connection.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Clear schedule command sent to ${mac}`,
      data: { mac, topic, payload, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Clear Schedule API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process clear schedule request' },
      { status: 500 }
    );
  }
}
