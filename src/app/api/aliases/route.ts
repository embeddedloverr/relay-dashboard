import { NextRequest, NextResponse } from 'next/server';
import { getAliasesCollection } from '@/lib/mongodb';

export interface DeviceAlias {
  mac: string;
  deviceName?: string;
  relays?: Record<number, string>;
  updatedAt: string;
}

// GET /api/aliases?mac=XYZ or GET all aliases
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mac = searchParams.get('mac');

    const collection = await getAliasesCollection();
    
    if (mac) {
      const alias = await collection.findOne({ mac });
      return NextResponse.json({ success: true, data: alias || { mac, relays: {} } });
    }

    const aliases = await collection.find({}).toArray();
    return NextResponse.json({ success: true, data: aliases });
  } catch (error) {
    console.error('[GET Aliases API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch aliases' }, { status: 500 });
  }
}

// POST /api/aliases - Update alias for device or relay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mac, deviceName, relayNum, relayName } = body;

    if (!mac) {
      return NextResponse.json({ success: false, error: 'mac is required' }, { status: 400 });
    }

    const collection = await getAliasesCollection();
    const updateQuery: any = {
      $set: { updatedAt: new Date().toISOString() },
    };

    if (deviceName !== undefined) {
      updateQuery.$set.deviceName = deviceName;
    }

    if (relayNum !== undefined && relayName !== undefined) {
      updateQuery.$set[`relays.${relayNum}`] = relayName;
    }

    const result = await collection.findOneAndUpdate(
      { mac },
      updateQuery,
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[POST Aliases API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update alias' }, { status: 500 });
  }
}
