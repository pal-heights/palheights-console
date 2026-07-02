import { NextResponse } from "next/server";
import mongoose from "mongoose";
import CareerApplication from "@/models/CareerApplication";

/* ---------- DB Connect ---------- */
const MONGODB_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

/* ---------- GET: Fetch all Applicants ---------- */
export async function GET() {
  try {
    await connectDB();

    const applicants = await CareerApplication.find()
      .sort({ createdAt: -1 })
      .lean();

    const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "";

    const data = applicants.map((a: any) => ({
      _id: a._id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      position: a.position,
      message: a.message ?? "",
      resume: {
        filename: a.resume.filename,
        mimetype: a.resume.mimetype,
        size: a.resume.size,
        url: `${r2PublicUrl}${a.resume.key}`,
      },
      appliedAt: a.createdAt,
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("[Applicants API]", error);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 },
    );
  }
}
