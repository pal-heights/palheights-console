import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import Lead from '../../../../models/Lead';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;
    const includeTrashed = searchParams.get('include_trashed') === 'true';
    const verified = searchParams.get('verified');

    let query: any = includeTrashed ? {} : { trash: { $ne: true } };

    // Add verified filter if provided
    if (verified !== null && verified !== undefined) {
      query.verified = verified === 'true';
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalLeads = await Lead.countDocuments(query);
    const totalPages = Math.ceil(totalLeads / limit);

    return NextResponse.json({ leads, totalPages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 