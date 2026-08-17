import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/room';
import { SECRET_DATE_TEXT, REVEAL_NAMES } from '@/lib/secret';

export const dynamic = 'force-dynamic';

// Cada invitado sondea su propio estado acá. El dato secreto solo se incluye
// para el Oráculo (desde que se asignan los roles) o para todos una vez que
// el anfitrión dispara el reveal final.
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
    role: player.role,
    playerCount: room.players.length,
  };

  const oracleSeesSecret = player.role === 'oracle' && room.status !== 'lobby';
  if (oracleSeesSecret || room.status === 'final_revealed') {
    response.secret = { dateText: SECRET_DATE_TEXT, names: REVEAL_NAMES };
  }

  if (room.status === 'roles_revealed' || room.status === 'final_revealed') {
    const oracle = room.players.find((p) => p.role === 'oracle');
    response.oracleName = oracle ? oracle.name : null;
    response.players = [...room.players]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({ name: p.name, role: p.role }));
  }

  return NextResponse.json(response);
}
