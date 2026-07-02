import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import Lead from '../../../../models/Lead';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const objectIds = ids.map(id => new ObjectId(id));

    const leads = await Lead.find({ _id: { $in: objectIds } }).lean();

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leads by IDs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
  if (!ids.length) return NextResponse.json({ leads: [] });
  const leads = await Lead.find({ _id: { $in: ids } });
  return NextResponse.json({ leads });
} 