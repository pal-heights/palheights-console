import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import Lead from '../../../../models/Lead';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { leadIds, action, updates } = await req.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs are required' }, { status: 400 });
    }

    if (action === 'trash') {
      const result = await Lead.updateMany(
        { _id: { $in: leadIds } },
        { $set: { trash: true } }
      );
      return NextResponse.json({ message: `${result.modifiedCount} leads trashed successfully` }, { status: 200 });
    }

    if (updates && updates.trash === false) {
      // Restore leads
      const result = await Lead.updateMany(
        { _id: { $in: leadIds } },
        { $set: { trash: false } }
      );
      return NextResponse.json({ message: `${result.modifiedCount} leads restored successfully` }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action or updates' }, { status: 400 });

  } catch (error) {
    console.error('Error performing bulk update on leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();

  try {
    const { leadIds } = await req.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs are required' }, { status: 400 });
    }

    const result = await Lead.deleteMany({ _id: { $in: leadIds } });
    return NextResponse.json({ message: `${result.deletedCount} leads deleted permanently` }, { status: 200 });

  } catch (error) {
    console.error('Error performing bulk delete on leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 