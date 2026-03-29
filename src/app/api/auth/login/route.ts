import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { comparePasswords, encrypt } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await comparePasswords(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Authenticated! Create token
    const token = await encrypt({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
