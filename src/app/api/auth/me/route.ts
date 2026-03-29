import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getUsersCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await decrypt(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne({ _id: new ObjectId(payload.userId) });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('[GET /api/auth/me] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
