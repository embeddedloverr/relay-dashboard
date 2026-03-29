import { NextRequest, NextResponse } from 'next/server';
import { publishMqtt } from '@/lib/mqttClient';
import { verifyDeviceAccess } from '@/lib/auth';

/**
 * POST /api/device/control/mode
 * 
 * Change a device's operating mode via MQTT.
 * Publishes to: sdwell/{MAC}/cmd/mode
 * Payload:      {"relay":1, "mode":"auto"|"manual"} (relay 0 = apply to ALL)
 * 
 * Request body:
 *   { mac: string, relay: number, mode: "auto" | "manual" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac, relay, mode } = body;

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

    if (relay === undefined || typeof relay !== 'number' || relay < 0 || relay > 6) {
      return NextResponse.json(
        { success: false, error: 'relay must be a number between 0 and 6 (0 = all relays)' },
        { status: 400 }
      );
    }

    if (!mode || !['auto', 'manual'].includes(mode.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'mode must be "auto" or "manual"' },
        { status: 400 }
      );
    }

    const topic = `sdwell/${mac}/cmd/mode`;
    const payload = { relay, mode: mode.toLowerCase() };

    const published = await publishMqtt(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command. Check broker connection.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Relay ${relay} Mode → ${mode} command sent to ${mac}`,
      data: { mac, topic, payload, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Mode Control API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process mode change request' },
      { status: 500 }
    );
  }
}
