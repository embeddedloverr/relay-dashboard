import { NextRequest, NextResponse } from 'next/server';
import { getMqttPacketsCollection, getDevicesCollection } from '@/lib/mongodb';
import { decrypt } from '@/lib/auth';

interface DeviceHealth {
  deviceId: string;
  mac: string;
  timestamp: string;
  rssi: number;
  heap: number;
  uptime: number;
  uptimeFormatted: string;
  receivedAt: string;
  isOnline: boolean;
  lastSeenAgo: number; // seconds since last heartbeat
}

// Format uptime seconds into human-readable string
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

// RSSI quality label
function getRssiQuality(rssi: number): string {
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  if (rssi >= -80) return 'Weak';
  return 'Very Weak';
}

// GET /api/device/health — fetch latest heartbeat for all devices
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = await decrypt(token);
    
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mac = searchParams.get('mac'); // optional: filter by specific MAC
    const onlineThreshold = parseInt(searchParams.get('threshold') || '60'); // seconds

    const collection = await getMqttPacketsCollection();
    const devicesCollection = await getDevicesCollection();

    // 1. Determine allowed MACs for this user
    let allowedMacs: string[] | null = null; // null means 'admin' -> all MACs allowed
    if (payload.role !== 'admin') {
      const allowedDevices = await devicesCollection.find({ allowedUsers: payload.userId }).toArray();
      allowedMacs = allowedDevices.map(d => d.mac);
      
      if (allowedMacs.length === 0) {
        return NextResponse.json({ success: true, data: [], count: 0 });
      }

      if (mac && !allowedMacs.includes(mac)) {
        return NextResponse.json({ success: false, error: 'Access denied for this device' }, { status: 403 });
      }
    }

    // Build topic filter based on permissions
    let topicFilter: any = /^sdwell\/[^/]+\/heartbeat$/;
    
    if (mac) {
      topicFilter = `sdwell/${mac}/heartbeat`;
    } else if (allowedMacs !== null) {
      const allowedTopics = allowedMacs.map(m => `sdwell/${m}/heartbeat`);
      topicFilter = { $in: allowedTopics };
    }

    // Aggregation: get latest heartbeat per device
    const pipeline: object[] = [
      { $match: { topic: topicFilter } },
      { $sort: { receivedAt: -1 } },
    ];

    if (mac) {
      pipeline.push({ $limit: 1 });
    } else {
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
    const now = Date.now();

    const devices: DeviceHealth[] = results.map((doc) => {
      const json = doc.json || {};
      const receivedAt = doc.receivedAt
        ? new Date(doc.receivedAt).getTime()
        : now;
      const lastSeenAgo = Math.floor((now - receivedAt) / 1000);
      const uptimeSeconds = json.up || 0;
      const deviceMac = json.mac || json.id || 'unknown';

      return {
        deviceId: deviceMac,
        mac: deviceMac,
        timestamp: json.ts || '',
        rssi: json.rssi || 0,
        rssiQuality: getRssiQuality(json.rssi || -100),
        heap: json.heap || 0,
        heapFormatted: `${((json.heap || 0) / 1024).toFixed(1)} KB`,
        uptime: uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
        receivedAt: doc.receivedAt?.toISOString?.() || doc.receivedAt || '',
        isOnline: lastSeenAgo <= onlineThreshold,
        lastSeenAgo,
      };
    });

    return NextResponse.json({
      success: true,
      data: devices,
      count: devices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Device Health API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch device health',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
