import { NextResponse } from 'next/server';
import { getRoom, addPlayer } from '@/lib/room';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request, { params }) {
  const { code } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 });
  }
  if (room.status === 'final_revealed') {
    return NextResponse.json({ error: 'game_over' }, { status: 409 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  const name = (rawName || 'Invitado').slice(0, 40);

  const id = crypto.randomUUID();
  const updated = await addPlayer(code, { id, name, joinedAt: Date.now() });
  if (!updated) {
    return NextResponse.json({ error: 'game_over' }, { status: 409 });
  }

  return NextResponse.json({ playerId: id, name });
}
