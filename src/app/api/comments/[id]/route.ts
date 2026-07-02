import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Comment from "@/models/Comments";

const MONGO_URI = process.env.MONGO_URI!;

export interface CommentDoc {
  _id: string;
  blogId: string;
  blogSlug: string;
  name: string;
  email: string;
  comment: string;
  ipAddress?: string;
  userAgent?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
}

/* ---------- GET : Fetch single comment ---------- */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const comment = (await Comment.findById(id).lean()) as CommentDoc | null;

    if (!comment || comment.isDeleted) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch comment" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE : Soft delete comment ---------- */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const deleted = (await Comment.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    ).lean()) as CommentDoc | null;

    if (!deleted) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

/* ---------- PATCH : Restore comment ---------- */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const restored = (await Comment.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true }
    ).lean()) as CommentDoc | null;

    if (!restored) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Comment restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to restore comment" },
      { status: 500 }
    );
  }
}
