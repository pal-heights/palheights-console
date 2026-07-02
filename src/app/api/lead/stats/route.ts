import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import Lead from '../../../../models/Lead';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now.getTime() - 30 * oneDay);

    const [
      total,
      last30Days,
      thisWeek,
      pending,
      pendingThisWeek,
      pendingThisMonth,
      assigned,
      completed,
    ] = await Promise.all([
      Lead.countDocuments({ trash: { $ne: true } }),
      Lead.countDocuments({ trash: { $ne: true }, createdAt: { $gte: startOf30Days } }),
      Lead.countDocuments({ trash: { $ne: true }, createdAt: { $gte: startOfWeek } }),
      Lead.countDocuments({ trash: { $ne: true }, status: 'pending' }),
      Lead.countDocuments({ trash: { $ne: true }, status: 'pending', createdAt: { $gte: startOfWeek } }),
      Lead.countDocuments({ trash: { $ne: true }, status: 'pending', createdAt: { $gte: startOfMonth } }),
      Lead.countDocuments({ trash: { $ne: true }, assignedTo: { $ne: null } }),
      Lead.countDocuments({ trash: { $ne: true }, status: 'completed' }),
    ]);

    const stats = {
      total,
      last30Days,
      thisWeek,
      pending,
      pendingThisWeek,
      pendingThisMonth,
      assigned,
      notAssigned: total - assigned,
      completed,
      notCompleted: total - completed,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 