import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(MONGO_URI, {
    dbName: "test",
  });
}

/* ---------- DELETE : Permanently delete blog ---------- */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectDB();

    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Blog permanently deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to permanently delete blog" },
      { status: 500 },
    );
  }
}
