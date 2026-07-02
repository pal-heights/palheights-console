import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

    // Clear the blog-manager-token cookie
    response.cookies.set('blog-manager-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Blog manager logout error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
