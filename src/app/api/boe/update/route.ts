import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import BOEUser from '../../../../models/boe/BOEUser';

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { userId, updates } = await req.json();
    if (!userId || !updates) {
      return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 });
    }
    const user = await BOEUser.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user', details: error }, { status: 500 });
  }
} 