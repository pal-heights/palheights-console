import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import BOEUser from '../../../../models/boe/BOEUser';

export async function POST(req: NextRequest) {
  await dbConnect();
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }
  const user = await BOEUser.findByIdAndUpdate(id, { trash: true }, { new: true });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 