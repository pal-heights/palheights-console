import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import BlogUser from '@/models/BlogUser';
import AdminUser from '@/models/admin/AdminUser';
import bcrypt from 'bcryptjs';
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
    
    // First, try to find admin user
    const adminUser = await AdminUser.findOne({ email });
    
    if (adminUser) {
      // Verify admin password
      const validAdmin = await bcrypt.compare(password, adminUser.password);
      if (!validAdmin) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      // Generate JWT token for admin
      const token = jwt.sign(
        { 
          userId: adminUser._id, 
          email: adminUser.email, 
          userName: adminUser.username,
          isAdmin: true,
          isBlogManager: true // Also set this for compatibility
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set both admin-token and blog-manager-token cookies
      const response = NextResponse.json({ 
        success: true, 
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.username,
          role: 'admin'
        }
      });

      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      response.cookies.set('blog-manager-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return response;
    }

    // If not admin, try to find blog user
    const blogUser = await BlogUser.findOne({ email }).select('+password');
    
    if (!blogUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if user is banned
    if (blogUser.isBanned) {
      return NextResponse.json({ error: 'Your account is banned. Please contact admin.' }, { status: 403 });
    }

    // Check if user is deleted
    if (blogUser.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, blogUser.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Update last login time
    blogUser.lastLoginAt = new Date();
    await blogUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: blogUser._id, 
        email: blogUser.email, 
        name: blogUser.name,
        role: blogUser.role,
        isBlogManager: true 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: blogUser._id,
        email: blogUser.email,
        name: blogUser.name,
        role: blogUser.role
      }
    });

    response.cookies.set('blog-manager-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Blog manager sign-in error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
