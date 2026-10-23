import { getDb } from './mongo';
import {
  pickRoundWord,
  buildRoundThemes,
  sanitizeCategories,
  ALL_CATEGORIES,
  MAX_ROUNDS,
  DEFAULT_ROUNDS,
} from './secret';

export { MAX_ROUNDS };

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
    scores: {},
    categories: ALL_CATEGORIES,
    totalRounds: DEFAULT_ROUNDS,
    roundThemes: [],
    createdAt: new Date(),
  });
}

export async function getRoom(code) {
  const rooms = await roomsCollection();
  return rooms.findOne({ _id: code });
}

// Atómico: se puede sumar en cualquier momento salvo cuando ya terminó el
// juego. Si se suma a mitad de una ronda, no participa de esa ronda (no
// estaba en el "roster" cuando se sorteó) y recién entra a jugar desde la
// próxima.
export async function addPlayer(code, player) {
  const rooms = await roomsCollection();
  const result = await rooms.findOneAndUpdate(
    { _id: code, status: { $ne: 'final_revealed' } },
    { $push: { players: player }, $set: { [`scores.${player.id}`]: 0 } },
    { returnDocument: 'after' }
  );
  return result?.value ?? result ?? null;
}

export async function setRoomFields(code, fields) {
  const rooms = await roomsCollection();
  await rooms.updateOne({ _id: code }, { $set: fields });
}

// Solo se puede ajustar en el lobby, antes de arrancar la ronda 1. Se
// limita entre 1 y MAX_ROUNDS.
export async function setTotalRounds(code, desired) {
  const rooms = await roomsCollection();
  const n = Math.max(1, Math.min(MAX_ROUNDS, Math.round(desired)));
  const result = await rooms.updateOne(
    { _id: code, status: 'lobby' },
    { $set: { totalRounds: n } }
  );
  return result.matchedCount > 0 ? n : null;
}

// Categorías que el anfitrión habilita para la partida. Solo en el lobby y
// siempre queda al menos una. Devuelve la lista aplicada, o null si ya empezó.
export async function setCategories(code, list) {
  const rooms = await roomsCollection();
  const clean = sanitizeCategories(list);
  if (clean.length === 0) return [];
  const result = await rooms.updateOne(
    { _id: code, status: 'lobby' },
    { $set: { categories: clean } }
  );
  return result.matchedCount > 0 ? clean : null;
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

  // Al arrancar la ronda 1 se fija el orden de categorías de toda la partida
  // con lo que eligió el anfitrión.
  const roundThemes =
    roundNumber === 1 || !room.roundThemes?.length
      ? buildRoundThemes(room.categories, room.totalRounds)
      : room.roundThemes;
  const theme = roundThemes[roundNumber - 1] || roundThemes[0];
  const word = pickRoundWord(theme, room.usedWords || []);

  // Alguien que no sea el impostor arranca la ronda tirando la primera pista.
  const starterCandidates = players.filter((p) => p.id !== impostorId);
  const starterPool = starterCandidates.length > 0 ? starterCandidates : players;
  const starterId = starterPool[Math.floor(Math.random() * starterPool.length)].id;

  // Solo participan de esta ronda los que ya estaban anotados cuando arrancó.
  const rosterIds = players.map((p) => p.id);

  const currentRound = { roundNumber, word, impostorId, starterId, rosterIds, votes: {} };
  await rooms.updateOne(
    { _id: code },
    {
      $set: { status: `round${roundNumber}_active`, currentRound, roundThemes },
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

// Revela la ronda y reparte puntos: +1 a cada uno que haya votado al
// impostor de verdad. Al impostor: -1 si lo descubrieron (mayoría de votos
// lo señaló), +2 si zafó sin que lo descubran.
export async function revealRound(code) {
  const rooms = await roomsCollection();
  const room = await rooms.findOne({ _id: code });
  if (!room || !room.currentRound) return null;
  const { roundNumber, impostorId, votes } = room.currentRound;

  const { accused } = tallyVotes(room);
  const impostorCaught = accused.some((a) => a.id === impostorId);

  const deltas = {};
  Object.entries(votes || {}).forEach(([voterId, votedForId]) => {
    if (votedForId === impostorId) {
      deltas[voterId] = (deltas[voterId] || 0) + 1;
    }
  });
  deltas[impostorId] = (deltas[impostorId] || 0) + (impostorCaught ? -1 : 2);

  const update = { $set: { status: `round${roundNumber}_result` } };
  const incFields = Object.entries(deltas).reduce((acc, [playerId, delta]) => {
    acc[`scores.${playerId}`] = delta;
    return acc;
  }, {});
  if (Object.keys(incFields).length > 0) {
    update.$inc = incFields;
  }

  await rooms.updateOne({ _id: code }, update);
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

export function getScoreboard(room) {
  const scores = room.scores || {};
  return room.players
    .map((p) => ({ id: p.id, name: p.name, score: scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);
}
