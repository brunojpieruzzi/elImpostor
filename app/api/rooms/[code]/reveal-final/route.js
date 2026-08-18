import { NextResponse } from 'next/server';
import { getRoom, setRoomFields } from '@/lib/room';
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
  if (room.status !== `round${TOTAL_ROUNDS}_result`) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 409 });
  }

  await setRoomFields(code, { status: 'final_revealed' });
  return NextResponse.json({ ok: true });
}
