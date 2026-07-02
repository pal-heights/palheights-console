// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/dbConnect';
// import User from '@/models/User';

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const userName = formData.get('userName');
//     const email = formData.get('email');
//     const file = formData.get('profilePicture'); // This may be a File or null
//     if (!userName || !email) {
//       return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
//     }
//     await dbConnect();
//     const user = await User.findOne({ email });
//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }
//     user.userName = userName;
//     if (file && typeof file === 'object' && 'arrayBuffer' in file) {
//       // Save the file as a base64 string (for demo; in production, upload to S3 or similar)
//       const buffer = Buffer.from(await file.arrayBuffer());
//       // Validate file type and size
//       if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
//         return NextResponse.json({ error: 'Invalid image format. Only .jpg/.jpeg allowed.' }, { status: 400 });
//       }
//       if (buffer.length > 50 * 1024) {
//         return NextResponse.json({ error: 'Image must be less than 50KB.' }, { status: 400 });
//       }
//       user.profilePicture = `data:${file.type};base64,${buffer.toString('base64')}`;
//     }
//     await user.save();
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error('Update profile error:', error);
//     return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userName = formData.get("userName");
    const email = formData.get("email");
    const file = formData.get("profilePicture"); // File or null

    if (!userName || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only update provided fields
    user.userName = userName;

    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate type
      if (!["image/jpeg", "image/jpg"].includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid image format. Only .jpg/.jpeg allowed." },
          { status: 400 }
        );
      }

      // Validate size
      if (buffer.length > 50 * 1024) {
        return NextResponse.json(
          { error: "Image must be less than 50KB." },
          { status: 400 }
        );
      }

      user.profilePicture = `data:${file.type};base64,${buffer.toString(
        "base64"
      )}`;
    }

    // Save only the updated fields without touching required but unchanged ones
    await user.save({ validateBeforeSave: false });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}
