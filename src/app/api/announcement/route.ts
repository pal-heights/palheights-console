import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Announcement from '@/models/Announcement';

export async function GET() {
  await dbConnect();
  try {
    const announcement = await Announcement.findOne().sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { text } = await request.json();
    let announcement = await Announcement.findOne();
    if (announcement) {
      announcement.text = text;
      await announcement.save();
    } else {
      announcement = await Announcement.create({ text });
    }
    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update announcement' }, { status: 500 });
  }
} 