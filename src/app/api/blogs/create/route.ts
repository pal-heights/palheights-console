// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import Blog from "@/models/Blog";

// /* ---------- DB Connect ---------- */
// const MONGODB_URI = process.env.MONGO_URI!;

// async function connectDB() {
//   if (mongoose.connection.readyState === 1) return;
//   await mongoose.connect(MONGODB_URI);
// }

// /* ---------- Utils ---------- */
// function slugify(text: string) {
//   return text
//     .toLowerCase()
//     .trim()
//     .replace(/[^\w\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-");
// }

// /* ---------- POST: Save Blog ---------- */
// export async function POST(req: Request) {
//   try {
//     await connectDB();

//     const body = await req.json();

//     const { featureImageUrl, meta, tags, blocks } = body;

//     if (
//       !featureImageUrl?.trim() ||
//       !meta?.title?.trim() ||
//       !meta?.description?.trim() ||
//       !meta?.category?.trim() ||
//       !meta?.seoTitle?.trim() ||
//       !meta?.seoDescription?.trim() ||
//       !meta?.seoKeywords?.trim() ||
//       !tags?.length ||
//       !blocks?.length
//     ) {
//       return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
//     }

//     const baseSlug = slugify(meta.title);
//     let slug = baseSlug;
//     let count = 1;

//     while (await Blog.findOne({ slug })) {
//       slug = `${baseSlug}-${count++}`;
//     }

//     const blog = await Blog.create({
//       slug,
//       status: "draft",
//       featureImageUrl,
//       meta,
//       tags,
//       blocks,
//     });

//     return NextResponse.json(
//       { message: "Blog saved", blogId: blog._id },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ message: "Server error" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

/* ---------- DB Connect ---------- */
const MONGODB_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

/* ---------- Utils ---------- */
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------- POST: Save Blog ---------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { featureImageUrl, meta, tags, content, blocks } = body;

    if (
      !featureImageUrl?.trim() ||
      !meta?.title?.trim() ||
      !meta?.description?.trim() ||
      !meta?.category?.trim() ||
      !meta?.seoTitle?.trim() ||
      !meta?.seoDescription?.trim() ||
      !meta?.seoKeywords?.trim() ||
      !tags?.length ||
      !content
      // !blocks?.length
    ) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const baseSlug = slugify(meta.title);
    let slug = baseSlug;
    let count = 1;

    while (await Blog.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const blog = await Blog.create({
      slug,
      status: "draft",
      featureImageUrl,
      meta,
      tags,
      content,
      blocks,
    });

    return NextResponse.json(
      { message: "Blog saved", blogId: blog._id },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
