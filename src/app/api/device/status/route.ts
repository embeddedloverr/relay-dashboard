import { NextRequest, NextResponse } from 'next/server';
import { getMqttPacketsCollection, getDevicesCollection } from '@/lib/mongodb';
import { decrypt } from '@/lib/auth';

// Relay names mapping (position in the 'r' string -> relay info)
const RELAY_NAMES = [
  { id: 'relay-1', name: 'Relay 1', description: 'Relay Channel 1' },
  { id: 'relay-2', name: 'Relay 2', description: 'Relay Channel 2' },
  { id: 'relay-3', name: 'Relay 3', description: 'Relay Channel 3' },
  { id: 'relay-4', name: 'Relay 4', description: 'Relay Channel 4' },
  { id: 'relay-5', name: 'Relay 5', description: 'Relay Channel 5' },
  { id: 'relay-6', name: 'Relay 6', description: 'Relay Channel 6' },
];

interface RelayState {
  id: string;
  name: string;
  description: string;
  state: 'ON' | 'OFF';
  mode: 'auto' | 'manual';
  position: number;
}

interface DeviceStatus {
  deviceId: string;
  mac: string;
  timestamp: string;
  rssi: number;
  ip: string;
  relays: RelayState[];
  relayRaw: string;
  modeRaw: string;
  scheduleCount: number;
  receivedAt: string;
}

// Parse the 'r' and 'm' fields: "100000", "000000" -> relay states array
function parseRelayStates(rField: string, mField: string): RelayState[] {
  return RELAY_NAMES.map((relay, index) => ({
    ...relay,
    state: (rField[index] === '1' ? 'ON' : 'OFF') as 'ON' | 'OFF',
    mode: (mField[index] === '1' ? 'manual' : 'auto') as 'auto' | 'manual',
    position: index + 1,
  }));
}

// GET /api/device/status — fetch latest relay status for all devices
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = await decrypt(token);
    
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mac = searchParams.get('mac'); // optional: filter by specific MAC

    const collection = await getMqttPacketsCollection();
    const devicesCollection = await getDevicesCollection();

    // 1. Determine allowed MACs for this user
    let allowedMacs: string[] | null = null; // null means 'admin' -> all MACs allowed
    if (payload.role !== 'admin') {
      const allowedDevices = await devicesCollection.find({ allowedUsers: payload.userId }).toArray();
      allowedMacs = allowedDevices.map(d => d.mac);
      
      // If user has no assigned devices, return empty immediately
      if (allowedMacs.length === 0) {
        return NextResponse.json({ success: true, data: [], count: 0 });
      }

      // If requested specific MAC but user doesn't have access
      if (mac && !allowedMacs.includes(mac)) {
        return NextResponse.json({ success: false, error: 'Access denied for this device' }, { status: 403 });
      }
    }

    // Build topic filter based on permissions
    let topicFilter: any = /^sdwell\/[^/]+\/status$/;
    
    if (mac) {
      topicFilter = `sdwell/${mac}/status`;
    } else if (allowedMacs !== null) {
      const allowedTopics = allowedMacs.map(m => `sdwell/${m}/status`);
      topicFilter = { $in: allowedTopics };
    }

    // Aggregation: get latest status packet per device
    const pipeline: object[] = [
      { $match: { topic: topicFilter } },
      { $sort: { receivedAt: -1 } },
    ];

    if (mac) {
      // Single device - just get the latest
      pipeline.push({ $limit: 1 });
    } else {
      // Multiple devices - get latest per unique device MAC
      // Group by json.mac first, fallback to json.id for backwards compat
      pipeline.push(
        {
          $group: {
            _id: { $ifNull: ['$json.mac', '$json.id'] },
            doc: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$doc' } }
      );
    }

    const results = await collection.aggregate(pipeline).toArray();

    const devices: DeviceStatus[] = results.map((doc) => {
      const json = doc.json || {};
      const rField = json.r || '000000';
      const mField = json.m || '000000';
      const deviceMac = json.mac || json.id || 'unknown';

      return {
        deviceId: deviceMac,
        mac: deviceMac,
        timestamp: json.ts || '',
        rssi: json.rssi || 0,
        ip: json.ip || '',
        relays: parseRelayStates(rField, mField),
        relayRaw: rField,
        modeRaw: mField,
        scheduleCount: json.sch ?? 0,
        receivedAt: doc.receivedAt?.toISOString?.() || doc.receivedAt || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: devices,
      count: devices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Device Status API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch device status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
