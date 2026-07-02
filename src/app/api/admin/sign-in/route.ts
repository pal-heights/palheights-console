import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import AdminUser from '@/models/admin/AdminUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMax = 5;
const rateLimitMap: { [ip: string]: { count: number; lastRequest: number } } = {};

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  // Rate limiting logic
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitMap[ip] || { count: 0, lastRequest: now };
  if (now - entry.lastRequest > rateLimitWindowMs) {
    entry.count = 1;
    entry.lastRequest = now;
  } else {
    entry.count++;
  }
  rateLimitMap[ip] = entry;
  if (entry.count > rateLimitMax) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email, password } = await request.json();
    await dbConnect();
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: admin._id, 
        email: admin.email, 
        userName: admin.userName,
        isAdmin: true 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: admin._id,
        email: admin.email,
        userName: admin.userName
      }
    });

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 