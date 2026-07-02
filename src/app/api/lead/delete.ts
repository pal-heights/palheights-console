import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../lib/dbConnect';
import Lead from '../../../models/Lead';

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }
    const deleted = await Lead.findByIdAndDelete(leadId);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead', details: error }, { status: 500 });
  }
} 