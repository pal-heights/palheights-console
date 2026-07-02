import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Comment from "@/models/Comments";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
}

/* ---------- DELETE : Permanently delete comment ---------- */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectDB();

    const deleted = await Comment.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Comment permanently deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Comment Permanent Delete]", error);

    return NextResponse.json(
      { message: "Failed to permanently delete comment" },
      { status: 500 },
    );
  }
}
