import { NextResponse } from "next/server";
import mongoose from "mongoose";
import BlogUser from "@/models/BlogUser";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: "test" });
}

export async function GET() {
  try {
    await connectDB();

    const users = await BlogUser.find({})
      .select("name email role isBanned createdAt lastLoginAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching blog users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog users" },
      { status: 500 }
    );
  }
}

