import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Announcement from "@/models/Announcements";

const MONGODB_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mode, links } = await req.json();

    if (!mode || !Array.isArray(links)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const normalizedLinks = links
      .map((link: unknown) => (typeof link === "string" ? link.trim() : ""))
      .filter(Boolean);

    if (normalizedLinks.length === 0) {
      await Announcement.deleteMany({});
      return NextResponse.json(
        { message: "Announcement cleared" },
        { status: 200 },
      );
    }

    for (const link of normalizedLinks) {
      if (!isValidUrl(link)) {
        return NextResponse.json(
          { message: "Each link must be a valid http or https URL" },
          { status: 400 },
        );
      }
    }

    if (mode === "single" && normalizedLinks.length !== 1) {
      return NextResponse.json(
        { message: "Single mode requires exactly 1 image link" },
        { status: 400 },
      );
    }

    if (mode === "slider" && (normalizedLinks.length < 2 || normalizedLinks.length > 4)) {
      return NextResponse.json(
        { message: "Slider mode requires 2–4 image links" },
        { status: 400 },
      );
    }

    const images = normalizedLinks.map((url) => ({ url }));

    await Announcement.deleteMany({});

    await Announcement.create({
      mode,
      images,
      isActive: true,
    });

    return NextResponse.json(
      { message: "Announcement saved" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
