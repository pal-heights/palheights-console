import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import BOEUser from '../../../../models/boe/BOEUser';

export async function GET() {
  await dbConnect();
  const users = await BOEUser.find({ trash: false })
    .select('userName email isVerified createdAt status assignedLeads')
    .lean();
  return NextResponse.json({ users });
} 