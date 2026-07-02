import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';
import { JWT_SECRET } from '@/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookies (works for both server and client fetch)
    const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // Safely extract email from payload
    let email: string | undefined;
    if (typeof payload === 'object' && payload && 'email' in payload) {
      email = (payload as { email?: string }).email;
    }
    if (!email) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ email }).lean() as IUser | null;
    if (!user || Array.isArray(user)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if ((user.status && user.status.toLowerCase() === 'blocked') || user.trash === true) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Remove sensitive fields using destructuring
    const { password, trash, ...safeUser } = user as any;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('User me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
} 