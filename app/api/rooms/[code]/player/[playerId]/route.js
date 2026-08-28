import { NextResponse } from 'next/server';
import { getRoom, tallyVotes, getScoreboard } from '@/lib/room';
import { SECRET_DATE_TEXT, REVEAL_NAMES } from '@/lib/secret';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Cada invitado sondea su propio estado acá. Durante una ronda activa, solo
// el propio jugador sabe si es el impostor (y por lo tanto si ve la palabra
// o no). El dato final solo se manda una vez que status es 'final_revealed'.
export async function GET(request, { params }) {
  const { code, playerId } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 });
  }
  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return NextResponse.json({ error: 'player_not_found' }, { status: 404 });
  }

  const response = {
    status: room.status,
    name: player.name,
    playerCount: room.players.length,
    totalRounds: room.totalRounds,
  };

  if (room.status.endsWith('_active')) {
    const cr = room.currentRound;
    response.round = cr.roundNumber;
    if (!cr.rosterIds.includes(playerId)) {
      // Se sumó a mitad de esta ronda: espera a la siguiente, sin ver
      // la palabra ni el rol de la ronda en curso.
      response.waitingForNextRound = true;
    } else {
      const isImpostor = cr.impostorId === playerId;
      response.isImpostor = isImpostor;
      response.word = isImpostor ? null : cr.word;
      response.isStarter = cr.starterId === playerId;
    }
  }

  if (room.status.endsWith('_voting')) {
    const cr = room.currentRound;
    response.round = cr.roundNumber;
    if (!cr.rosterIds.includes(playerId)) {
      response.waitingForNextRound = true;
    } else {
      response.players = room.players
        .filter((p) => p.id !== playerId)
        .map((p) => ({ id: p.id, name: p.name }));
      response.myVote = cr.votes[playerId] || null;
    }
  }

  if (room.status.endsWith('_result')) {
    const cr = room.currentRound;
    const impostor = room.players.find((p) => p.id === cr.impostorId);
    const { rows, accused, totalVotes } = tallyVotes(room);
    response.round = cr.roundNumber;
    response.word = cr.word;
    response.impostorId = cr.impostorId;
    response.impostorName = impostor ? impostor.name : '-';
    response.votesTally = rows;
    response.accusedNames = accused.map((a) => a.name);
    response.wasCorrect = accused.some((a) => a.id === cr.impostorId);
    response.totalVotes = totalVotes;
    response.scoreboard = getScoreboard(room);
  }

  if (room.status === 'final_revealed') {
    response.secret = { dateText: SECRET_DATE_TEXT, names: REVEAL_NAMES };
    response.scoreboard = getScoreboard(room);
  }

  return NextResponse.json(response);
}
