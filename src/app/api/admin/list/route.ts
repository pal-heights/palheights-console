import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import AdminUser from '@/models/admin/AdminUser';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const admins = await AdminUser.find({}, '-password'); // Exclude password from response
    return NextResponse.json({ success: true, admins });
  } catch (error:any) {
    console.error('Admin list error:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
} 