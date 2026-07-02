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

/* ---------- GET : Fetch single blog (for edit) ---------- */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const blog = await Blog.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).lean();

    if (!blog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE : Soft delete blog ---------- */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const blog = await Blog.findByIdAndUpdate(
      id,
      { isDeleted: true, status: "draft" },
      { new: true }
    );

    if (!blog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Blog deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete blog" },
      { status: 500 }
    );
  }
}

/* ---------- PATCH : Restore blog ---------- */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const restoredBlog = await Blog.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        status: "draft", // restore safely as draft
      },
      { new: true }
    );

    if (!restoredBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Blog restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to restore blog" },
      { status: 500 }
    );
  }
}
