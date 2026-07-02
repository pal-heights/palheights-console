import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import BOEUser from '@/models/boe/BOEUser';
import Lead from '@/models/Lead';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get token from cookies
    const token = request.cookies.get('boe-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId || !decoded.isBoe) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find the BOE user with populated assignedLeads
    const boeUser = await BOEUser.findById(decoded.userId)
      .populate({
        path: 'assignedLeads',
        model: 'Lead',
        select: '_id fullName email phoneNumber message service status assignedTo createdAt trash verified'
      })
      .select('assignedLeads');

    if (!boeUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Filter out trashed leads and return only active assigned leads
    const activeAssignedLeads = boeUser.assignedLeads.filter((lead: any) => !lead.trash);

    return NextResponse.json({
      success: true,
      assignedLeads: activeAssignedLeads,
      count: activeAssignedLeads.length
    });

  } catch (error) {
    console.error('Error fetching assigned leads:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 