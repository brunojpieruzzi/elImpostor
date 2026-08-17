import { getDb } from './mongo';

async function roomsCollection() {
  const db = await getDb();
  return db.collection('rooms');
}

export async function generateRoomCode() {
  const rooms = await roomsCollection();
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await rooms.findOne({ _id: code }, { projection: { _id: 1 } });
    if (!existing) return code;
  }
  throw new Error('No se pudo generar un código de sala único');
}

export async function createRoom(code, hostToken) {
  const rooms = await roomsCollection();
  await rooms.insertOne({
    _id: code,
    hostToken,
    status: 'lobby',
    oracleId: null,
    players: [],
    createdAt: new Date(),
  });
}

export async function getRoom(code) {
  const rooms = await roomsCollection();
  return rooms.findOne({ _id: code });
}

// Atómico: solo agrega si la sala sigue en lobby. Devuelve null si la sala
// no existe o si la ronda ya arrancó (evita que alguien se sume tarde).
export async function addPlayer(code, player) {
  const rooms = await roomsCollection();
  const result = await rooms.findOneAndUpdate(
    { _id: code, status: 'lobby' },
    { $push: { players: player } },
    { returnDocument: 'after' }
  );
  return result?.value ?? result ?? null;
}

export async function setRoomFields(code, fields) {
  const rooms = await roomsCollection();
  await rooms.updateOne({ _id: code }, { $set: fields });
}

export async function setPlayers(code, players) {
  const rooms = await roomsCollection();
  await rooms.updateOne({ _id: code }, { $set: { players } });
}
