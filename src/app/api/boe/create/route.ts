import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/dbConnect';
import BOEUser from '../../../../models/boe/BOEUser';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { username, email, password } = body;
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }
  // Check BOE user count
  const count = await BOEUser.countDocuments({ trash: false });
  if (count >= 5) {
    return NextResponse.json({ error: 'Maximum 5 Backoffice Executives allowed.' }, { status: 400 });
  }
  // Check for duplicate email
  const existing = await BOEUser.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await BOEUser.create({
    userName: username,
    email,
    password: hashedPassword,
    isBoe: true,
    assignedLeads: [],
    trash: false,
    isVerified: true,
    createdAt: new Date(),
  });
  return NextResponse.json({ success: true, user: { id: newUser._id, username: newUser.userName, email: newUser.email } });
} 