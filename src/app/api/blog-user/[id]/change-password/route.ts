import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import BlogUser from "@/models/BlogUser";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: "test" });
}

/* ---------- PATCH : Admin change user password ---------- */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    const user = await BlogUser.findById(id).select("+password");

    if (!user || user.isDeleted) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    user.password = newPassword;
    await user.save(); // hashed via pre-save hook

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { message: "Failed to update password" },
      { status: 500 }
    );
  }
}
