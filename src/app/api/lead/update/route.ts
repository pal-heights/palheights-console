import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import Lead from '../../../../models/Lead';
import BOEUser from '../../../../models/boe/BOEUser';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { leadId, updates } = await req.json();

    if (!leadId || !updates) {
      return NextResponse.json({ error: 'Lead ID and updates are required' }, { status: 400 });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // If assigning a user, also update status to "in progress" and update the BOEUser
    if (updates.assignedTo) {
      updates.status = "in progress";

      // Add lead to the new BOE user's assignedLeads array
      await BOEUser.updateOne(
        { _id: updates.assignedTo },
        { $addToSet: { assignedLeads: leadId } }
      );

      // If the lead was previously assigned, remove it from the old BOE user's list
      if (lead.assignedTo && lead.assignedTo.toString() !== updates.assignedTo) {
        await BOEUser.updateOne(
          { _id: lead.assignedTo },
          { $pull: { assignedLeads: leadId } }
        );
      }
    } else if (updates.assignedTo === null && lead.assignedTo) {
      // If un-assigning, remove the lead from the BOE user's list
      await BOEUser.updateOne(
        { _id: lead.assignedTo },
        { $pull: { assignedLeads: leadId } }
      );
      // Remove the assignedTo property from the lead
      await Lead.updateOne(
        { _id: leadId },
        { $unset: { assignedTo: "" } }
      );
      // Set status to pending
      updates.status = "pending";
      // Prevent assignedTo from being set to null below
      delete updates.assignedTo;
    }

    Object.assign(lead, updates);
    await lead.save();

    return NextResponse.json({ message: 'Lead updated successfully', lead }, { status: 200 });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 