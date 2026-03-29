import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { decrypt } from '@/lib/auth';

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = await decrypt(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const collection = await getUsersCollection();
    
    // Return all users except passwords
    const users = await collection.find({}, { projection: { passwordHash: 0 } }).toArray();

    return NextResponse.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('[GET /api/users] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
