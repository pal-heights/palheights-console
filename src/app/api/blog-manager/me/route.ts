import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import BlogUser from '@/models/BlogUser';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get token from cookie
    const token = request.cookies.get('blog-manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isBlogManager) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data
    const blogUser = await BlogUser.findById(decoded.userId);
    
    if (!blogUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if user is banned or deleted
    if (blogUser.isBanned) {
      return NextResponse.json({ error: 'Your account is banned' }, { status: 403 });
    }

    if (blogUser.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: blogUser._id,
        email: blogUser.email,
        name: blogUser.name,
        role: blogUser.role
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Blog manager me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
