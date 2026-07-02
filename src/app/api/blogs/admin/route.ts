import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: "test" });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check for admin token
    const token = request.cookies.get("admin-token");
    const isAdmin = !!token?.value;

    // Fetch all blogs, including trashed ones
    const blogs = await Blog.find({})
      .select("meta slug status isDeleted tags createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ blogs, isAdmin }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
