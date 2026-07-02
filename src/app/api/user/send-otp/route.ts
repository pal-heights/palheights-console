import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import nodemailer from 'nodemailer';
import { dbConnect } from '@/lib/dbConnect';
import Otp from '@/models/Otp';
import mongoose from 'mongoose';
// EmailCounter model for persistent incrementing ID
const EmailCounterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: { type: Number, default: 5677 },
});
const EmailCounter = mongoose.models.EmailCounter || mongoose.model('EmailCounter', EmailCounterSchema);

const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMax = 5;
const rateLimitMap: { [ip: string]: { count: number; lastRequest: number } } = {};

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitMap[ip] || { count: 0, lastRequest: now };
  if (now - entry.lastRequest > rateLimitWindowMs) {
    entry.count = 1;
    entry.lastRequest = now;
  } else {
    entry.count++;
  }
  rateLimitMap[ip] = entry;
  if (entry.count > rateLimitMax) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await dbConnect();

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now

    // Upsert OTP for this email
    await Otp.findOneAndUpdate(
      { email },
      { email, otp, expiresAt, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Generate a random alphanumeric ID for the email subject
    function randomId(length = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
    const emailId = randomId();

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Professional email format
    const mailOptions = {
      from: `Delfyle <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Delfyle email verification code (#${emailId})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 32px 24px; background: #fafbfc;">
          <h2 style="color: #1a237e;">Delfyle Account Verification</h2>
          <p>Dear User,</p>
          <p>Thank you for registering with <b>Delfyle</b>.</p>
          <p>Your One-Time Password (OTP) for account verification is:</p>
          <div style="font-size: 2rem; font-weight: bold; letter-spacing: 8px; color: #1565c0; margin: 24px 0;">${otp}</div>
          <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
          <br />
          <p style="font-size: 0.95rem; color: #888;">Best regards,<br />The Delfyle Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // For development: return OTP in response (remove in production)
    return NextResponse.json({ message: 'OTP sent successfully', otp, emailId });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
} 