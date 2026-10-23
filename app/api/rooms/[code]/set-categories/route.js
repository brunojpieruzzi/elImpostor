import { NextResponse } from 'next/server';
import { getRoom, setCategories } from '@/lib/room';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request, { params }) {
  const { code } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 });
  }

  const hostToken = request.headers.get('x-host-token');
  if (!hostToken || hostToken !== room.hostToken) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (room.status !== 'lobby') {
    return NextResponse.json({ error: 'already_started' }, { status: 409 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const applied = await setCategories(code, body.categories);
  if (applied === null) {
    return NextResponse.json({ error: 'already_started' }, { status: 409 });
  }
  if (applied.length === 0) {
    return NextResponse.json({ error: 'no_categories' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, categories: applied });
}
