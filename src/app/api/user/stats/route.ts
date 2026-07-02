import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      newToday,
      last30Days,
      suspended,
      suspendedToday,
      suspendedLast30Days,
    ] = await Promise.all([
      User.countDocuments({ trash: { $ne: true } }),
      User.countDocuments({ trash: { $ne: true }, createdAt: { $gte: today } }),
      User.countDocuments({ trash: { $ne: true }, createdAt: { $gte: last30 } }),
      User.countDocuments({ trash: { $ne: true }, status: { $in: ['suspended', 'Suspended'] } }),
      User.countDocuments({ trash: { $ne: true }, status: { $in: ['suspended', 'Suspended'] }, createdAt: { $gte: today } }),
      User.countDocuments({ trash: { $ne: true }, status: { $in: ['suspended', 'Suspended'] }, createdAt: { $gte: last30 } }),
    ]);

    const stats = {
      total,
      newToday,
      last30Days,
      suspended,
      suspendedToday,
      suspendedLast30Days,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 