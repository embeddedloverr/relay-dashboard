import { NextRequest, NextResponse } from 'next/server';
import { getDevicesCollection } from '@/lib/mongodb';
import { decrypt } from '@/lib/auth';

// PUT /api/devices/access - Grant or revoke access to a device (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = await decrypt(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const { mac, userId, action } = await request.json(); // action: "grant" | "revoke"

    if (!mac || !userId || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json({ success: false, error: 'mac, userId, and valid action required' }, { status: 400 });
    }

    const collection = await getDevicesCollection();
    
    // Check if device exists
    const device = await collection.findOne({ mac });
    if (!device) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    let updateQuery;
    if (action === 'grant') {
      // Add userId to allowedUsers array if not already present
      updateQuery = { $addToSet: { allowedUsers: userId } };
    } else {
      // Remove userId from allowedUsers array
      updateQuery = { $pull: { allowedUsers: userId } };
    }

    const result = await collection.findOneAndUpdate(
      { mac },
      updateQuery,
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[PUT /api/devices/access] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
