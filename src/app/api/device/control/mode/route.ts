import { NextRequest, NextResponse } from 'next/server';
import { publishMqtt } from '@/lib/mqttClient';

/**
 * POST /api/device/control/mode
 * 
 * Change a device's operating mode via MQTT.
 * Publishes to: sdwell/{MAC}/cmd/mode
 * Payload:      {"mode": "auto"} or {"mode": "manual"}
 * 
 * Request body:
 *   { mac: string, mode: "auto" | "manual" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac, mode } = body;

    if (!mac) {
      return NextResponse.json(
        { success: false, error: 'mac is required (device MAC address)' },
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
    const payload = { mode: mode.toLowerCase() };

    const published = await publishMqtt(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command. Check broker connection.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Mode → ${mode} command sent to ${mac}`,
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
