import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import CareerApplication from "@/models/CareerApplication";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const MONGODB_URI = process.env.MONGO_URI!;

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
});

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

/* ---------- DELETE: Remove applicant + resume ---------- */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Applicant ID is required" },
        { status: 400 },
      );
    }

    // Find applicant first
    const applicant = await CareerApplication.findById(id);

    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    // Delete resume from Cloudflare R2
    if (applicant.resume?.key) {
      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: applicant.resume.key,
          }),
        );
      } catch (err) {
        console.error("Failed to delete resume from R2:", err);
      }
    }

    // Delete MongoDB document
    await CareerApplication.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Applicants Delete API]", error);

    return NextResponse.json(
      { error: "Failed to delete applicant" },
      { status: 500 },
    );
  }
}
