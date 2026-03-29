import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await getUsersCollection();

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });
    }

    // Determine role. First user becomes admin.
    const userCount = await collection.countDocuments();
    const role = userCount === 0 ? 'admin' : 'subuser';

    const hashedPassword = await hashPassword(password);

    const newUser = {
      email,
      passwordHash: hashedPassword,
      name,
      role,
      createdAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(newUser);

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: result.insertedId, 
        email, 
        name, 
        role 
      } 
    });

  } catch (error) {
    console.error('[POST /api/auth/register] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
