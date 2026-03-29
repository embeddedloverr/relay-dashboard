import { NextRequest, NextResponse } from 'next/server';
import { publishMqtt } from '@/lib/mqttClient';

/**
 * POST /api/device/control/relay
 * 
 * Control a single relay on a device via MQTT.
 * Publishes to: sdwell/{MAC}/cmd/relay
 * Payload:      {"relay": 1, "state": "on" | "off" | "toggle"}
 * 
 * Request body:
 *   { mac: string, relay: number (1-6), state: "on" | "off" | "toggle" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac, relay, state } = body;

    // Validate required fields
    if (!mac) {
      return NextResponse.json(
        { success: false, error: 'mac is required (device MAC address)' },
        { status: 400 }
      );
    }

    if (!relay || typeof relay !== 'number' || relay < 1 || relay > 6) {
      return NextResponse.json(
        { success: false, error: 'relay must be a number between 1 and 6' },
        { status: 400 }
      );
    }

    if (!state || !['on', 'off', 'toggle'].includes(state.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'state must be "on", "off", or "toggle"' },
        { status: 400 }
      );
    }

    const topic = `sdwell/${mac}/cmd/relay`;
    const payload = {
      relay: relay,
      state: state.toLowerCase(),
    };

    const published = await publishMqtt(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command. Check broker connection.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Relay ${relay} → ${state.toUpperCase()} command sent to ${mac}`,
      data: { mac, topic, payload, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Relay Control API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process relay control request' },
      { status: 500 }
    );
  }
}
