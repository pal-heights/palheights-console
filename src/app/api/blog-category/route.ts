import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Category from "@/models/Category";

/* ---------- DB Connect ---------- */
const MONGODB_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

/* ---------- GET: Fetch all Categories ---------- */
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

/* ---------- POST: Save Category ---------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Case-insensitive check for existing category
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, "i") } });

    if (existingCategory) {
      return NextResponse.json({ message: "Category already exists" }, { status: 409 });
    }

    const newCategory = await Category.create({ name: trimmedName });

    return NextResponse.json(
      { message: "Category created", category: newCategory },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
