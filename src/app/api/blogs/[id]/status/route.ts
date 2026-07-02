import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: "test" });
}

/* ---------- PATCH : Toggle blog status (admin only) ---------- */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ AUTH CHECK (example)
    const cookies = request.headers.get("cookie") || "";
    const isAdmin = cookies.includes("admin-token=");

    if (!isAdmin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { status } = await request.json(); // "published" | "draft"

    await connectDB();

    const { id } = await context.params;

    const blog = await Blog.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!blog) {
      return NextResponse.json(
        { message: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    console.error("Update blog status error:", error);
    return NextResponse.json(
      { message: "Failed to update status" },
      { status: 500 }
    );
  }
}
