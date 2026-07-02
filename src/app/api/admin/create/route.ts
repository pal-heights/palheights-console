import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import AdminUser from '@/models/admin/AdminUser';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { username, email, password } = await request.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    const adminCount = await AdminUser.countDocuments();
    if (adminCount >= 2) {
      return NextResponse.json({ error: 'Maximum 2 Admin Users allowed.' }, { status: 400 });
    }
    const existing = await AdminUser.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Admin with this email already exists.' }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await AdminUser.create({ username, email, password: hashedPassword, isAdmin: true });
    return NextResponse.json({ success: true, admin: { _id: newAdmin._id, username: newAdmin.username, email: newAdmin.email, isAdmin: newAdmin.isAdmin } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin.' }, { status: 500 });
  }
} 