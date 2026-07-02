import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function POST(request: NextRequest) {
  try {
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
    const { fullName, profilePicture } = await request.json();
    if (!fullName || !profilePicture) {
      return NextResponse.json({ error: 'Full name and profile picture are required' }, { status: 400 });
    }
    // Validate base64 image
    const matches = profilePicture.match(/^data:image\/(jpeg|jpg);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format. Only .jpg/.jpeg allowed.' }, { status: 400 });
    }
    const base64Data = matches[2];
    const sizeInBytes = (base64Data.length * 3) / 4 - (base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0);
    if (sizeInBytes < 5 * 1024 || sizeInBytes > 15 * 1024) {
      return NextResponse.json({ error: 'Image must be between 5KB and 15KB.' }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    user.userName = fullName;
    user.profilePicture = profilePicture;
    await user.save();
    const userObj = user.toObject();
    // Remove sensitive fields using destructuring
    const { password, trash, ...safeUser } = userObj as any;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 