import { NextRequest, NextResponse } from 'next/server';
import { getDevicesCollection, getUsersCollection } from '@/lib/mongodb';
import { decrypt } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET /api/devices - List devices for the current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = await decrypt(token);
    
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await getDevicesCollection();
    
    let devices;
    if (payload.role === 'admin') {
      devices = await collection.find({}).toArray();
    } else {
      devices = await collection.find({ allowedUsers: payload.userId }).toArray();
    }

    return NextResponse.json({ success: true, count: devices.length, data: devices });
  } catch (error) {
    console.error('[GET /api/devices] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/devices/register - Claim a new MAC address (Admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = await decrypt(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const { mac, name } = await request.json();

    if (!mac) {
      return NextResponse.json({ success: false, error: 'MAC address is required' }, { status: 400 });
    }

    const collection = await getDevicesCollection();
    
    // Check if MAC is already registered
    const existing = await collection.findOne({ mac });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Device already registered' }, { status: 400 });
    }

    const newDevice = {
      mac,
      name: name || `Device ${mac}`,
      ownerId: payload.userId,
      allowedUsers: [],
      createdAt: new Date().toISOString()
    };

    const result = await collection.insertOne(newDevice);

    return NextResponse.json({ success: true, data: { _id: result.insertedId, ...newDevice } });
  } catch (error) {
    console.error('[POST /api/devices/register] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
