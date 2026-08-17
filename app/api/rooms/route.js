import { NextResponse } from 'next/server';
import { generateRoomCode, createRoom } from '@/lib/room';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const code = await generateRoomCode();
    const hostToken = crypto.randomUUID();
    await createRoom(code, hostToken);
    return NextResponse.json({ code, hostToken });
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
