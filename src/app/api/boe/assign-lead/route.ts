import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import BOEUser from '@/models/boe/BOEUser';
import Lead from '@/models/Lead';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function POST(request: NextRequest) {
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

    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Find the BOE user
    const boeUser = await BOEUser.findById(decoded.userId);
    if (!boeUser) {
      return NextResponse.json({ error: 'BOE user not found' }, { status: 404 });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if lead is already assigned to someone else
    if (lead.assignedTo && lead.assignedTo !== decoded.userId) {
      return NextResponse.json({ error: 'Lead is already assigned to another user' }, { status: 400 });
    }

    // Update the lead with the BOE user ID
    await Lead.findByIdAndUpdate(leadId, {
      assignedTo: decoded.userId,
      status: 'in progress'
    });

    // Add the lead to the BOE user's assignedLeads array if not already present
    if (!boeUser.assignedLeads.includes(leadId)) {
      await BOEUser.findByIdAndUpdate(decoded.userId, {
        $push: { assignedLeads: leadId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning lead:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 