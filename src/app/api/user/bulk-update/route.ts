import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { userIds, action, updates } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    if (action === 'trash') {
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { trash: true } }
      );
      return NextResponse.json({ message: `${result.modifiedCount} users trashed successfully` }, { status: 200 });
    }

    if (updates && updates.trash === false) {
      // Restore users
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { trash: false } }
      );
      return NextResponse.json({ message: `${result.modifiedCount} users restored successfully` }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action or updates' }, { status: 400 });

  } catch (error) {
    console.error('Error performing bulk update on users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();

  try {
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });
    return NextResponse.json({ message: `${result.deletedCount} users deleted permanently` }, { status: 200 });

  } catch (error) {
    console.error('Error performing bulk delete on users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 