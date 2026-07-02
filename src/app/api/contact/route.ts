// @ts-ignore: No types for nodemailer
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Lead from '@/models/Lead';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/utils/jwt';

const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMax = 5;
const rateLimitMap: { [ip: string]: { count: number; lastRequest: number } } = {};

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  // Rate limiting logic
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
    const { fullName, phone, email, service, message } = await request.json();

    await dbConnect();

    // Get JWT token from cookies
    const token = request.cookies.get('token')?.value;
    let userId: string | undefined;
    let verified = false;

    if (token) {
      // Verify JWT and extract user ID
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // Token is invalid, treat as unauthenticated
        userId = "";
        verified = false;
      }

      // Extract userId from payload
      if (typeof payload === 'object' && payload && 'userId' in payload) {
        userId = (payload as { userId?: string }).userId;
        verified = true; // User is logged in, so verified is true
      } else {
        userId = "";
        verified = false;
      }
    } else {
      // No token, treat as unauthenticated
      userId = "";
      verified = false;
    }

    // Save to DB (leads collection)
    let leadDoc;
    const leadData: any = {
      fullName,
      email,
      phoneNumber: phone,
      message,
      service: Array.isArray(service) ? service : [service],
      status: 'pending',
      assignedBo: 'none',
      trash: false,
      verified: verified,
    };

    // Only set user field if userId is valid
    if (userId && userId !== "") {
      leadData.user = userId;
    }

    leadDoc = await Lead.create(leadData);

    // Only push lead ID to user's leadsInitiated if user is authenticated
    if (userId && userId !== "") {
      await User.findByIdAndUpdate(userId, { $push: { leadsInitiated: leadDoc._id } });
    }

    // Configure your SMTP transport (Gmail example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // sender: kunalparaye39@gmail.com
        pass: process.env.GMAIL_PASS, // sender's password
      },
    });

    await transporter.sendMail({
      from: `"Delfyle Main" <${process.env.GMAIL_USER}>`, // sender
      to: 'delfylesales@gmail.com', // recipient
      subject: `New Contact: ${fullName} (${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()})`,
      html: `
        <h2>Delfyle Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Nodemailer error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 