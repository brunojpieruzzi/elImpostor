import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/room';
import { SECRET_DATE_TEXT, REVEAL_NAMES } from '@/lib/secret';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Vista agregada para la pantalla del anfitrión. Requiere el hostToken de esa
// sala: nadie más puede ver la lista completa ni disparar acciones.
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

  const revealRoles = room.status === 'roles_revealed' || room.status === 'final_revealed';
  const players = [...room.players]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: revealRoles ? p.role : null,
    }));

  const payload = {
    status: room.status,
    players,
    playerCount: players.length,
  };

  if (room.status === 'final_revealed') {
    payload.secret = { dateText: SECRET_DATE_TEXT, names: REVEAL_NAMES };
  }

  return NextResponse.json(payload);
}
