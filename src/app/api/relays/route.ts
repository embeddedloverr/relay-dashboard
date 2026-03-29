import { NextRequest, NextResponse } from 'next/server';

// Types
type RelayState = 'ON' | 'OFF';
type RelayMode = 'auto' | 'manual' | 'disabled';
type TriggerType = 'manual' | 'schedule' | 'api' | 'system';

interface Relay {
  id: string;
  name: string;
  description: string;
  state: RelayState;
  mode: RelayMode;
  gpio: number;
  lastUpdated: string;
  lastTriggeredBy: TriggerType;
  group: string;
}

// In-memory storage (replace with database in production)
let relays: Relay[] = [
  {
    id: 'relay-001',
    name: 'Main Pump',
    description: 'Primary water distribution pump',
    state: 'OFF',
    mode: 'auto',
    gpio: 16,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
    group: 'pumps',
  },
  {
    id: 'relay-002',
    name: 'Inlet Valve',
    description: 'Tank inlet solenoid valve',
    state: 'ON',
    mode: 'manual',
    gpio: 17,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'manual',
    group: 'valves',
  },
  {
    id: 'relay-003',
    name: 'Outlet Valve',
    description: 'Tank outlet solenoid valve',
    state: 'OFF',
    mode: 'auto',
    gpio: 18,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'schedule',
    group: 'valves',
  },
  {
    id: 'relay-004',
    name: 'Emergency Light',
    description: 'Emergency indicator light',
    state: 'OFF',
    mode: 'auto',
    gpio: 19,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
    group: 'lights',
  },
  {
    id: 'relay-005',
    name: 'Exhaust Fan',
    description: 'Ventilation exhaust fan',
    state: 'ON',
    mode: 'manual',
    gpio: 21,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'manual',
    group: 'hvac',
  },
  {
    id: 'relay-006',
    name: 'Backup Pump',
    description: 'Secondary backup pump',
    state: 'OFF',
    mode: 'disabled',
    gpio: 22,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
    group: 'pumps',
  },
  {
    id: 'relay-007',
    name: 'Booster Pump',
    description: 'Pressure booster pump',
    state: 'OFF',
    mode: 'auto',
    gpio: 23,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
    group: 'pumps',
  },
  {
    id: 'relay-008',
    name: 'UV Sterilizer',
    description: 'Water UV sterilization unit',
    state: 'ON',
    mode: 'auto',
    gpio: 25,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'schedule',
    group: 'treatment',
  },
];

// Activity log
interface ActivityLog {
  id: string;
  timestamp: string;
  relayId: string;
  relayName: string;
  action: RelayState | 'TOGGLE';
  triggeredBy: TriggerType;
  details?: string;
}

const activityLogs: ActivityLog[] = [];

// GET - Fetch all relays
export async function GET() {
  return NextResponse.json({
    success: true,
    data: relays,
    timestamp: new Date().toISOString(),
  });
}

// POST - Create new relay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newRelay: Relay = {
      id: `relay-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      state: 'OFF',
      mode: body.mode || 'manual',
      gpio: body.gpio,
      lastUpdated: new Date().toISOString(),
      lastTriggeredBy: 'system',
      group: body.group,
    };

    relays.push(newRelay);

    return NextResponse.json({
      success: true,
      data: newRelay,
      message: 'Relay created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create relay' },
      { status: 400 }
    );
  }
}

// PATCH - Update relay state or properties
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, state, mode, name, description } = body;

    const relayIndex = relays.findIndex(r => r.id === id);
    if (relayIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Relay not found' },
        { status: 404 }
      );
    }

    const relay = relays[relayIndex];

    // Check if relay is disabled
    if (relay.mode === 'disabled' && state) {
      return NextResponse.json(
        { success: false, error: 'Cannot change state of disabled relay' },
        { status: 400 }
      );
    }

    // Update relay
    const updatedRelay: Relay = {
      ...relay,
      state: state !== undefined ? state : relay.state,
      mode: mode !== undefined ? mode : relay.mode,
      name: name !== undefined ? name : relay.name,
      description: description !== undefined ? description : relay.description,
      lastUpdated: new Date().toISOString(),
      lastTriggeredBy: 'api',
    };

    relays[relayIndex] = updatedRelay;

    // Log activity if state changed
    if (state && state !== relay.state) {
      activityLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        relayId: id,
        relayName: relay.name,
        action: state,
        triggeredBy: 'api',
        details: `API request: Set to ${state}`,
      });
    }

    // TODO: Publish MQTT command to actual hardware
    // await mqttClient.publish(`smartdwell/relays/${relay.gpio}/command`, state);

    return NextResponse.json({
      success: true,
      data: updatedRelay,
      message: `Relay ${relay.name} updated successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update relay' },
      { status: 400 }
    );
  }
}
