import { NextResponse } from 'next/server';
import { getRoom, castVote } from '@/lib/room';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request, { params }) {
  const { code } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 });
  }
  if (!room.status.endsWith('_voting')) {
    return NextResponse.json({ error: 'voting_closed' }, { status: 409 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { playerId, votedForId } = body || {};
  if (!playerId || !votedForId) {
    return NextResponse.json({ error: 'invalid_vote' }, { status: 400 });
  }
  if (playerId === votedForId) {
    return NextResponse.json({ error: 'cannot_vote_self' }, { status: 400 });
  }
  const voter = room.players.find((p) => p.id === playerId);
  const target = room.players.find((p) => p.id === votedForId);
  if (!voter || !target) {
    return NextResponse.json({ error: 'invalid_player' }, { status: 400 });
  }

  const ok = await castVote(code, room.currentRound.roundNumber, playerId, votedForId);
  if (!ok) {
    return NextResponse.json({ error: 'voting_closed' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
