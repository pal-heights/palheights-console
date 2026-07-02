import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export async function GET(req: NextRequest) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;
    const includeTrashed = searchParams.get('include_trashed') === 'true';

    const query = includeTrashed ? {} : { trash: { $ne: true } };

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('leadsInitiated', 'status') // Populate the status of each lead
      .lean();

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({ users, totalPages });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 