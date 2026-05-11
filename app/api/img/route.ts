import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const size = req.nextUrl.searchParams.get('size') || 'w800';

  if (!id || !/^[a-zA-Z0-9_-]{10,}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid or missing id' }, { status: 400 });
  }

  const destination = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(size)}`;
  return NextResponse.redirect(destination, 302);
}
