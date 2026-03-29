import { NextRequest, NextResponse } from 'next/server';

interface ControlRequest {
  relayId: string;
  action: 'ON' | 'OFF' | 'TOGGLE';
  source?: 'dashboard' | 'api' | 'schedule';
  durationMinutes?: number;
}

// Simulated MQTT publish function
// In production, replace with actual MQTT client
async function publishMqttCommand(
  topic: string, 
  payload: object
): Promise<boolean> {
  console.log(`[MQTT] Publishing to ${topic}:`, payload);
  
  // Simulate MQTT publish delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, use something like:
  // const mqtt = require('mqtt');
  // const client = mqtt.connect('mqtt://your-broker:1883');
  // client.publish(topic, JSON.stringify(payload));
  
  return true;
}

// POST - Control relay (turn ON/OFF/TOGGLE)
export async function POST(request: NextRequest) {
  try {
    const body: ControlRequest = await request.json();
    const { relayId, action, source = 'api', durationMinutes } = body;

    if (!relayId || !action) {
      return NextResponse.json(
        { success: false, error: 'relayId and action are required' },
        { status: 400 }
      );
    }

    if (!['ON', 'OFF', 'TOGGLE'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be ON, OFF, or TOGGLE' },
        { status: 400 }
      );
    }

    // Construct MQTT topic
    // Topic format: smartdwell/relays/{relay_id}/command
    const topic = `smartdwell/relays/${relayId}/command`;
    
    // Construct payload
    const payload = {
      action,
      source,
      timestamp: new Date().toISOString(),
      duration: durationMinutes ? durationMinutes * 60 : null, // Convert to seconds
    };

    // Publish MQTT command
    const published = await publishMqttCommand(topic, payload);

    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish MQTT command' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Command ${action} sent to relay ${relayId}`,
      data: {
        relayId,
        action,
        source,
        topic,
        timestamp: payload.timestamp,
        durationMinutes: durationMinutes || null,
      },
    });
  } catch (error) {
    console.error('[Control API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process control request' },
      { status: 500 }
    );
  }
}

// GET - Get current relay states (for ESP32 to poll)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const mac = searchParams.get('mac');

  // In production, fetch from database
  // This endpoint can be used by ESP32 devices to poll for commands
  
  return NextResponse.json({
    success: true,
    data: {
      deviceId,
      mac,
      commands: [], // Pending commands for this device
      timestamp: new Date().toISOString(),
    },
  });
}
