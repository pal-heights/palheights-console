import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Comment from "@/models/Comments";

/* ---------- DB ---------- */
const MONGO_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
}

/* ---------- GET: Admin Comments List ---------- */
export async function GET() {
  try {
    await connectDB();

    const comments = await Comment.find().sort({ createdAt: -1 }).lean();

    /* ---------- StatusBlock Stats ---------- */
    const total = comments.length;
    const active = comments.filter((c) => !c.isDeleted).length;
    const deleted = comments.filter((c) => c.isDeleted).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = comments.filter(
      (c) => new Date(c.createdAt) >= today
    ).length;

    return NextResponse.json(
      {
        comments,
        stats: {
          total,
          active,
          deleted,
          today: todayCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
