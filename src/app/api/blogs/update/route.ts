import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: "test" });
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, slug, featureImageUrl, meta, tags, content, blocks } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Blog ID is required" },
        { status: 400 },
      );
    }

    // Check if slug is taken by another blog
    const existingSlug = await Blog.findOne({ slug, _id: { $ne: id } });
    if (existingSlug) {
      return NextResponse.json(
        { message: "Slug is already in use by another blog" },
        { status: 409 },
      );
    }

    const updated = await Blog.findByIdAndUpdate(
      id,
      {
        slug,
        featureImageUrl,
        meta,
        tags,
        content: content ?? null,
        blocks: blocks ?? [],
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Blog updated successfully", blog: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update blog" },
      { status: 500 },
    );
  }
}
