import { NextResponse } from 'next/server';
import { getRoom, startRound } from '@/lib/room';
import { TOTAL_ROUNDS } from '@/lib/secret';

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

  const currentRoundNumber = room.currentRound?.roundNumber;
  if (!currentRoundNumber || room.status !== `round${currentRoundNumber}_result`) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 409 });
  }
  if (currentRoundNumber >= TOTAL_ROUNDS) {
    return NextResponse.json({ error: 'no_more_rounds' }, { status: 409 });
  }

  await startRound(code, currentRoundNumber + 1);
  return NextResponse.json({ ok: true });
}
