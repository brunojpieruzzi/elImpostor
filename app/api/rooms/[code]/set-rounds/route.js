import { NextResponse } from 'next/server';
import { getRoom, setTotalRounds, MAX_ROUNDS } from '@/lib/room';

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
  const rounds = Number(body.rounds);
  if (!Number.isFinite(rounds)) {
    return NextResponse.json({ error: 'invalid_rounds' }, { status: 400 });
  }

  const applied = await setTotalRounds(code, rounds);
  if (applied === null) {
    return NextResponse.json({ error: 'already_started' }, { status: 409 });
  }

  return NextResponse.json({ ok: true, totalRounds: applied, maxRounds: MAX_ROUNDS });
}
