'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import FinalReveal from '@/components/FinalReveal';

const POLL_MS = 1500;

export default function JoinClient({ code }) {
  const storageKey = `oraculo_player_${code}`;
  const [playerId, setPlayerId] = useState(null);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [state, setState] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [voting, setVoting] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.playerId) setPlayerId(parsed.playerId);
      } catch {}
    }
    setCheckedStorage(true);
  }, [storageKey]);

  const fetchState = useCallback(async () => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/rooms/${code}/player/${playerId}`, { cache: 'no-store' });
      if (res.status === 404) {
        localStorage.removeItem(storageKey);
        setPlayerId(null);
        setState(null);
        return;
      }
      const data = await res.json();
      setState(data);
    } catch {}
  }, [playerId, code, storageKey]);

  useEffect(() => {
    if (!playerId) return;
    fetchState();
    pollRef.current = setInterval(fetchState, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [playerId, fetchState]);

  async function submitJoin(e) {
    e.preventDefault();
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.status === 404) {
        setJoinError('Ese código no existe. Confirmá con el anfitrión.');
        return;
      }
      if (res.status === 409) {
        setJoinError('La ronda ya empezó, esperá a la próxima.');
        return;
      }
      if (!res.ok) {
        setJoinError('No se pudo sumar. Probá de nuevo.');
        return;
      }
      const data = await res.json();
      localStorage.setItem(storageKey, JSON.stringify({ playerId: data.playerId }));
      setPlayerId(data.playerId);
    } catch {
      setJoinError('No se pudo conectar. Probá de nuevo.');
    } finally {
      setJoining(false);
    }
  }

  async function castVote(votedForId) {
    setVoting(true);
    try {
      await fetch(`/api/rooms/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, votedForId }),
      });
      fetchState();
    } catch {
    } finally {
      setVoting(false);
    }
  }

  if (!checkedStorage) {
    return <div className="screen" />;
  }

  if (!playerId) {
    return (
      <div className="screen">
        <div className="eyebrow">Sala {code}</div>
        <h1>🎭 Impostor</h1>
        <p>
          En cada ronda, todos menos el Impostor conocen una palabra secreta.
          Tiren pistas sin decirla directamente y descubran quién no la sabe
          realmente. La última ronda no se juega... ¡hay un premio!
        </p>
        <form onSubmit={submitJoin}>
          <label htmlFor="playerName">Tu nombre</label>
          <input
            id="playerName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como te dicen"
            maxLength={40}
            autoComplete="off"
            required
          />
          {joinError && <p className="small error-text">{joinError}</p>}
          <button className="btn-primary" type="submit" disabled={joining}>
            {joining ? 'Sumando...' : 'Sumarme al juego 🎉'}
          </button>
        </form>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="screen">
        <p className="small">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="screen">
      {state.status === 'lobby' && (
        <>
          <div className="step">Adentro</div>
          <h2>¡Ya estás anotado, {state.name}! 🎉</h2>
          <p className="small">
            Esperá a que el anfitrión arranque la ronda 1. No sueltes el celular.
          </p>
          <p className="small">Van {state.playerCount} anotados.</p>
        </>
      )}

      {state.status.endsWith('_active') &&
        (state.isImpostor ? (
          <>
            <div className="step">Ronda {state.round} · Solo para vos</div>
            <h2>🎭 Sos el Impostor</h2>
            <div className="card">
              <div className="role-impostor">No sabés la palabra secreta.</div>
            </div>
            <p className="small">
              Escuchá lo que dicen los demás y tirá algo creíble sin que se
              note que no sabés de qué hablan.
            </p>
            <p className="small">Esperá a que el anfitrión abra la votación.</p>
          </>
        ) : (
          <>
            <div className="step">Ronda {state.round} · Solo para vos</div>
            <h2>🤫 La palabra es...</h2>
            <div className="card">
              <div className="role-word">{state.word}</div>
            </div>
            <p className="small">
              Digan palabras o frases relacionadas sin decir la palabra
              posta. Si alguien tira algo raro... ¡ese puede ser el Impostor!
            </p>
            <p className="small">Esperá a que el anfitrión abra la votación.</p>
          </>
        ))}

      {state.status.endsWith('_voting') && (
        <>
          <div className="step">Ronda {state.round} · Votación</div>
          <h2>🗳️ ¿Quién es el Impostor?</h2>
          <p className="small">Votá a quién sospechás.</p>
          <div className="vote-list">
            {state.players.map((p) => (
              <button
                key={p.id}
                className={'vote-btn' + (state.myVote === p.id ? ' selected' : '')}
                onClick={() => castVote(p.id)}
                disabled={voting}
              >
                <span>{p.name}</span>
                {state.myVote === p.id && <span className="vote-check">✓ tu voto</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {state.status.endsWith('_result') && (
        <>
          <div className="step">Ronda {state.round} · Resultado</div>
          <h2>La palabra era: {state.word}</h2>
          <div className="impostor-name">🎭 {state.impostorName}</div>
          <div>
            {state.votesTally.map((row) => (
              <div
                className={'result-row' + (state.accusedNames.includes(row.name) ? ' accused' : '')}
                key={row.id}
              >
                <span>{row.name}</span>
                <span className={row.name === state.impostorName ? 'tag-impostor' : 'tag-crew'}>
                  {row.count} voto{row.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
          <span className={'correct-badge ' + (state.wasCorrect ? 'yes' : 'no')}>
            {state.wasCorrect ? '✅ ¡Lo descubrieron!' : '❌ Se les escapó...'}
          </span>
          <p className="small">
            {state.round < state.totalRounds ? 'Esperá la próxima ronda...' : 'Esperá el gran momento...'}
          </p>
        </>
      )}

      {state.status === 'final_revealed' && (
        <FinalReveal secret={state.secret} showReplay={false} />
      )}
    </div>
  );
}
