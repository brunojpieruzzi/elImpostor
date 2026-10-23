import { NextResponse } from 'next/server';
import { getRoom, tallyVotes, getScoreboard, MAX_ROUNDS } from '@/lib/room';
import { categoryList } from '@/lib/secret';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Vista agregada para la pantalla del anfitrión. Requiere el hostToken de esa
// sala. Igual que en el juego original, el anfitrión tampoco sabe quién es
// el impostor hasta el momento del reveal de la ronda.
export async function GET(request, { params }) {
  const { code } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 });
  }

  const hostToken = request.headers.get('x-host-token');
  if (!hostToken || hostToken !== room.hostToken) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const players = [...room.players]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => ({ id: p.id, name: p.name }));

  const payload = {
    status: room.status,
    players,
    playerCount: players.length,
    totalRounds: room.totalRounds,
    maxRounds: MAX_ROUNDS,
  };

  if (room.status === 'lobby') {
    payload.categories = categoryList();
    payload.selectedCategories = room.categories;
  }

  if (room.status.endsWith('_active')) {
    payload.round = room.currentRound.roundNumber;
  }

  if (room.status.endsWith('_voting')) {
    payload.round = room.currentRound.roundNumber;
    payload.votesIn = Object.keys(room.currentRound.votes || {}).length;
  }

  if (room.status.endsWith('_result')) {
    const cr = room.currentRound;
    const impostor = room.players.find((p) => p.id === cr.impostorId);
    const { rows, accused } = tallyVotes(room);
    payload.round = cr.roundNumber;
    payload.word = cr.word;
    payload.impostorName = impostor ? impostor.name : '-';
    payload.votesTally = rows;
    payload.accusedNames = accused.map((a) => a.name);
    payload.wasCorrect = accused.some((a) => a.id === cr.impostorId);
    payload.scoreboard = getScoreboard(room);
  }

  if (room.status === 'final_revealed') {
    payload.scoreboard = getScoreboard(room);
  }

  return NextResponse.json(payload);
}
