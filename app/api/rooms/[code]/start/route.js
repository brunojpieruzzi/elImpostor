import { NextResponse } from 'next/server';
import { getRoom, startRound } from '@/lib/room';

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
  if (room.players.length < 2) {
    return NextResponse.json({ error: 'not_enough_players' }, { status: 400 });
  }

  await startRound(code, 1);
  return NextResponse.json({ ok: true });
}
