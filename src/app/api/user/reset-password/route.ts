// import { NextRequest, NextResponse } from 'next/server';
// import User from '@/models/User';
// import bcrypt from 'bcryptjs';
// import { dbConnect } from '@/lib/dbConnect';

// export async function POST(req: NextRequest) {
//   await dbConnect();
//   try {
//     const { email, password } = await req.json();
//     if (!email || !password) {
//       return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
//     }
//     const user = await User.findOne({ email });
//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     await user.save();
//     return NextResponse.json({ success: true, message: 'Password updated successfully' });
//   } catch (err) {
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";

export async function POST(req: NextRequest) {
  console.log("🟢 [API] Password Reset Request Received");

  try {
    console.log("🔹 Connecting to DB...");
    await dbConnect();
    console.log("✅ DB Connected Successfully");

    const body = await req.json();
    console.log("📩 Request Body:", body);

    const { email, password } = body;

    if (!email || !password) {
      console.log("⚠️ Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("🔍 Finding user by email:", email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found for email:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔒 Hashing new password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed successfully");

    // Update password only, ignore other validations
    user.password = hashedPassword;
    await user.save({ validateBeforeSave: false }); // ✅ ignore other required fields

    console.log("✅ Password updated successfully for user:", email);
    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err: any) {
    console.error("🔥 Server error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
