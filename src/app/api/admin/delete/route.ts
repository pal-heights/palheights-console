import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import AdminUser from '@/models/admin/AdminUser';

export async function POST(req: NextRequest) {
  console.log('DELETE API called');
  await dbConnect();
  try {
    const body = await req.json();
    console.log('Request body:', body);
    const { adminId } = body;
    if (!adminId) {
      console.log('Missing adminId');
      return NextResponse.json({ error: 'Missing adminId' }, { status: 400 });
    }
    console.log('Attempting to delete admin with ID:', adminId);
    const deleted = await AdminUser.findByIdAndDelete(adminId);
    if (!deleted) {
      console.log('Admin not found');
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    console.log('Admin deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin', details: error }, { status: 500 });
  }
} 