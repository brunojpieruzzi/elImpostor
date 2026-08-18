import { getDb } from './mongo';
import { pickRoundWord } from './secret';

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
    currentRound: null,
    usedWords: [],
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

// Arranca una ronda de Impostor: sortea al impostor (evitando repetir el de
// la ronda anterior cuando hay más de 2 jugadores) y elige una palabra al
// azar de la temática de esa ronda, sin repetir palabras ya usadas.
export async function startRound(code, roundNumber) {
  const rooms = await roomsCollection();
  const room = await rooms.findOne({ _id: code });
  if (!room) return null;

  const players = room.players;
  const prevImpostorId = room.currentRound?.impostorId;
  let candidates = players;
  if (players.length > 2 && prevImpostorId) {
    const filtered = players.filter((p) => p.id !== prevImpostorId);
    if (filtered.length > 0) candidates = filtered;
  }
  const impostorId = candidates[Math.floor(Math.random() * candidates.length)].id;
  const word = pickRoundWord(roundNumber, room.usedWords || []);

  const currentRound = { roundNumber, word, impostorId, votes: {} };
  await rooms.updateOne(
    { _id: code },
    {
      $set: { status: `round${roundNumber}_active`, currentRound },
      $push: { usedWords: word },
    }
  );
  return currentRound;
}

// El anfitrión abre la votación recién cuando quiere: pasa de la pantalla
// de la palabra a la pantalla (separada) de votación.
export async function openVoting(code) {
  const rooms = await roomsCollection();
  const room = await rooms.findOne({ _id: code });
  if (!room || !room.currentRound) return null;
  const { roundNumber } = room.currentRound;
  await rooms.updateOne({ _id: code }, { $set: { status: `round${roundNumber}_voting` } });
  return room.currentRound;
}

// Solo válido durante la votación abierta de la ronda; se puede cambiar el
// voto hasta que el anfitrión cierre la ronda.
export async function castVote(code, roundNumber, voterId, votedForId) {
  const rooms = await roomsCollection();
  const result = await rooms.updateOne(
    { _id: code, status: `round${roundNumber}_voting` },
    { $set: { [`currentRound.votes.${voterId}`]: votedForId } }
  );
  return result.matchedCount > 0;
}

export async function revealRound(code) {
  const rooms = await roomsCollection();
  const room = await rooms.findOne({ _id: code });
  if (!room || !room.currentRound) return null;
  const { roundNumber } = room.currentRound;
  await rooms.updateOne({ _id: code }, { $set: { status: `round${roundNumber}_result` } });
  return room.currentRound;
}

export function tallyVotes(room) {
  const votes = room.currentRound?.votes || {};
  const counts = {};
  Object.values(votes).forEach((votedForId) => {
    counts[votedForId] = (counts[votedForId] || 0) + 1;
  });
  const rows = room.players.map((p) => ({ id: p.id, name: p.name, count: counts[p.id] || 0 }));
  rows.sort((a, b) => b.count - a.count);
  const topCount = rows[0]?.count || 0;
  const accused = topCount > 0 ? rows.filter((r) => r.count === topCount) : [];
  return { rows, accused, totalVotes: Object.keys(votes).length };
}
