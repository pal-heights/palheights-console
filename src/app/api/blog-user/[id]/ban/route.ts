import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import BlogUser from "@/models/BlogUser";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: "test" });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const user = await BlogUser.findByIdAndUpdate(
      id,
      { isBanned: true },
      { new: true }
    );

    if (!user || user.isDeleted) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User banned successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json(
      { message: "Failed to ban user" },
      { status: 500 }
    );
  }
}
