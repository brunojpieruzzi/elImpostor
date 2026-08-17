'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import FinalReveal from '@/components/FinalReveal';

const POLL_MS = 1500;

const IDEAS = [
  'Digan si el número es par o impar, sin decir cuál es.',
  'Comparen el mes con una estación del año.',
  'Den una pista sobre algo que pasó ese año, sin decir el año.',
  'Reaccionen con "más frío" o "más caliente" a las ideas que van tirando los demás.',
];

export default function JoinClient({ code }) {
  const storageKey = `oraculo_player_${code}`;
  const [playerId, setPlayerId] = useState(null);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [state, setState] = useState(null);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
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

  if (!checkedStorage) {
    return <div className="screen" />;
  }

  if (!playerId) {
    return (
      <div className="screen">
        <div className="eyebrow">Sala {code}</div>
        <h1>🔮 El Oráculo 🔮</h1>
        <p>
          Una sola persona va a conocer el dato secreto. El resto tiene que
          descubrirlo a los gritos, tirando ideas y palabras sueltas hasta acertar.
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
            Esperá a que el anfitrión arranque la ronda. No sueltes el celular.
          </p>
          <p className="small">Van {state.playerCount} anotados.</p>
        </>
      )}

      {state.status === 'assigned' &&
        (state.role === 'oracle' ? (
          <>
            <div className="step">Solo para tus ojos</div>
            <h2>🔮 Sos el Oráculo</h2>
            <div className="card">
              <div className="role-oracle">
                El dato secreto es:
                <br />
                {state.secret?.dateText}
              </div>
            </div>
            <p className="small">
              Dales pistas indirectas para que el resto lo adivine, sin decirlo
              directamente.
            </p>
            <button className="btn-ghost" onClick={() => setIdeasOpen((v) => !v)}>
              💡 Banco de ideas
            </button>
            {ideasOpen && (
              <ul className="ideas">
                {IDEAS.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="step">Solo para tus ojos</div>
            <h2>🙃 Sos de los que adivinan</h2>
            <div className="card">
              <div className="role-guesser">No sabés nada... todavía.</div>
            </div>
            <p className="small">
              Prestá atención a las pistas del Oráculo y gritá ideas, palabras y
              números hasta acertar.
            </p>
          </>
        ))}

      {state.status === 'roles_revealed' && (
        <>
          <div className="step">Resultado</div>
          <h2>El Oráculo era...</h2>
          <div className="oracle-name">{state.oracleName || '-'}</div>
          <div>
            {(state.players || []).map((p, i) => (
              <div className="result-row" key={i}>
                <span>{p.name}</span>
                <span className={p.role === 'oracle' ? 'tag-oracle' : 'tag-guesser'}>
                  {p.role === 'oracle' ? '🔮 Oráculo' : '🙃 Adivinaba'}
                </span>
              </div>
            ))}
          </div>
          <p className="small">Esperá el gran momento...</p>
        </>
      )}

      {state.status === 'final_revealed' && (
        <FinalReveal secret={state.secret} showReplay={false} />
      )}
    </div>
  );
}
