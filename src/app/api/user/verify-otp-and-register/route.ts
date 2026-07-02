import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Otp from '@/models/Otp';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, userName, password, phone, profilePicture } = await request.json();
    if (!email || !otp || !userName || !password || !phone) {
      return NextResponse.json({ error: 'Email, OTP, userName, password, and phone are required' }, { status: 400 });
    }
    await dbConnect();
    // Verify OTP
    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }
    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }
    await Otp.deleteOne({ _id: otpDoc._id });
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        userName,
        email,
        phone,
        verified: true,
        status: 'active',
        requestStatus: 'pending',
        trash: false,
        createdAt: new Date(),
        password: hashedPassword,
        profilePicture: profilePicture || "",
      });
    }
    return NextResponse.json({ message: 'User registered and OTP verified. Please sign in.' });
  } catch (error) {
    console.error('Verify OTP & Register error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP and register user' }, { status: 500 });
  }
} 