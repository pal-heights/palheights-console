import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Announcement from "@/models/Announcements";

/* 🔥 IMPORTANT: always fresh for admin */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------- DB ---------- */
const MONGODB_URI = process.env.MONGO_URI!;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

function resolveLegacyPreview(img: {
  url?: string;
  data?: string;
  mime?: string;
}): string | null {
  if (img.url) return img.url;
  if (img.data && img.mime) {
    return `data:${img.mime};base64,${img.data}`;
  }
  return null;
}

/* ---------- GET (ADMIN ONLY) ---------- */
export async function GET() {
  try {
    await connectDB();

    const announcement = await Announcement.findOne()
      .select("mode images")
      .lean<any>();

    if (!announcement) {
      return NextResponse.json(null, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const links: string[] = [];
    const previews: (string | null)[] = [];

    for (const img of announcement.images) {
      if (img.url) {
        links.push(img.url);
        previews.push(img.url);
      } else {
        links.push("");
        previews.push(resolveLegacyPreview(img));
      }
    }

    return NextResponse.json(
      {
        mode: announcement.mode,
        links,
        previews,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Admin announcement fetch error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
