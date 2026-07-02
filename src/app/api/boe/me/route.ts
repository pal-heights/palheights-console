import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import BOEUser from '../../../../models/boe/BOEUser';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get token from cookie
    const token = request.cookies.get('boe-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.isBoe) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data
    const boe = await BOEUser.findById(decoded.userId).select('-password');
    
    if (!boe) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: boe._id,
        email: boe.email,
        userName: boe.userName,
        isVerified: boe.isVerified
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 