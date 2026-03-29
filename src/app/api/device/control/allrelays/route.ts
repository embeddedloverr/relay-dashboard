import { NextRequest, NextResponse } from 'next/server';
import { publishMqtt } from '@/lib/mqttClient';

/**
 * POST /api/device/control/allrelays
 * 
 * Control ALL relays on a device via MQTT.
 * Publishes to: sdwell/{MAC}/cmd/allrelays
 * Payload:      {"state": "on" | "off"}
 * 
 * Request body:
 *   { mac: string, state: "on" | "off" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac, state } = body;

    if (!mac) {
      return NextResponse.json(
        { success: false, error: 'mac is required (device MAC address)' },
        { status: 400 }
      );
    }

    if (!state || !['on', 'off'].includes(state.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'state must be "on" or "off"' },
        { status: 400 }
      );
    }

    const topic = `sdwell/${mac}/cmd/allrelays`;
    const payload = { state: state.toLowerCase() };

    const published = await publishMqtt(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command. Check broker connection.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `All relays → ${state.toUpperCase()} command sent to ${mac}`,
      data: { mac, topic, payload, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[All Relays Control API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process all-relays control request' },
      { status: 500 }
    );
  }
}
