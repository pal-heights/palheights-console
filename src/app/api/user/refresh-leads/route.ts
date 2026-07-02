import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Lead from "@/models/Lead";
import { dbConnect } from "@/lib/dbConnect";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Get user from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Find unverified leads with the user's email
    const unverifiedLeads = await Lead.find({
      email: user.email,
      verified: false,
    });

    if (unverifiedLeads.length === 0) {
      // No new leads to link, but still return the current user data
      return NextResponse.json({ 
        message: "No new leads to link.",
        user: user 
      });
    }

    const leadIds = unverifiedLeads.map(lead => lead._id);

    // 3. Update the leads to be verified and assigned to the user
    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: { verified: true, user: userId } }
    );

    // 4. Update the user's leadsInitiated array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { leadsInitiated: { $each: leadIds } },
    });
    
    // 5. Fetch the updated user to return
    const updatedUser = await User.findById(userId);

    return NextResponse.json({
      message: `${leadIds.length} lead(s) successfully linked.`,
      user: updatedUser,
    });

  } catch (error: any) {
    console.error("Error refreshing leads:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
