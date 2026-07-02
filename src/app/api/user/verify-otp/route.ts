import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Otp from '@/models/Otp';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      console.log({ event: 'otp_verified', status: 'fail', email, ip, timestamp: new Date().toISOString(), message: 'Missing email or OTP' });
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }
    await dbConnect();
    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) {
      console.log({ event: 'otp_verified', status: 'fail', email, ip, timestamp: new Date().toISOString(), message: 'Invalid OTP' });
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }
    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      console.log({ event: 'otp_verified', status: 'fail', email, ip, timestamp: new Date().toISOString(), message: 'OTP expired' });
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }
    // OTP is valid, delete it for security
    await Otp.deleteOne({ _id: otpDoc._id });
    console.log({ event: 'otp_verified', status: 'success', email, ip, timestamp: new Date().toISOString(), message: 'OTP verified successfully' });
    return NextResponse.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
} 