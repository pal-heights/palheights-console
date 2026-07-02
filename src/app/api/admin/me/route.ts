import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import AdminUser from '@/models/admin/AdminUser';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data
    const admin = await AdminUser.findById(decoded.userId).select('-password');
    
    if (!admin) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 