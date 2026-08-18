'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import FinalReveal from '@/components/FinalReveal';

const POLL_MS = 1500;
const STORAGE_KEY = 'oraculo_host';

function mapError(code) {
  switch (code) {
    case 'not_enough_players':
      return 'Necesitás al menos 2 invitados anotados.';
    case 'already_started':
      return 'La ronda ya empezó.';
    case 'invalid_state':
      return 'Ese paso ya se hizo.';
    case 'forbidden':
      return 'No tenés permiso sobre esta sala.';
    default:
      return 'Algo salió mal. Probá de nuevo.';
  }
}

export default function HostPage() {
  const [code, setCode] = useState(null);
  const [hostToken, setHostToken] = useState(null);
  const [room, setRoom] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [host, setHost] = useState('');
  const [creating, setCreating] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [actionError, setActionError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.code && parsed.hostToken) {
          setCode(parsed.code);
          setHostToken(parsed.hostToken);
        }
      } catch {}
    }
    setCheckedStorage(true);
  }, []);

  const fetchRoom = useCallback(async () => {
    if (!code || !hostToken) return;
    try {
      const res = await fetch(`/api/rooms/${code}`, {
        headers: { 'x-host-token': hostToken },
        cache: 'no-store',
      });
      if (res.status === 404 || res.status === 403) {
        localStorage.removeItem(STORAGE_KEY);
        setCode(null);
        setHostToken(null);
        setRoom(null);
        return;
      }
      const data = await res.json();
      setRoom(data);
    } catch {}
  }, [code, hostToken]);

  useEffect(() => {
    if (!code || !hostToken) return;
    fetchRoom();
    pollRef.current = setInterval(fetchRoom, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [code, hostToken, fetchRoom]);

  useEffect(() => {
    if (!code) {
      setQrUrl('');
      setJoinLink('');
      setHost('');
      return;
    }
    const url = `${window.location.origin}/join/${code}`;
    setJoinLink(url);
    setHost(window.location.host);
    QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: '#45611a', light: '#ffffff' },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [code]);

  async function createRoom() {
    setCreating(true);
    setActionError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setCode(data.code);
      setHostToken(data.hostToken);
      setRoom(null);
    } catch {
      setActionError('No se pudo crear la sala. Probá de nuevo.');
    } finally {
      setCreating(false);
    }
  }

  async function callAction(path) {
    setActionError('');
    try {
      const res = await fetch(`/api/rooms/${code}/${path}`, {
        method: 'POST',
        headers: { 'x-host-token': hostToken },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(mapError(data.error));
        return;
      }
      fetchRoom();
    } catch {
      setActionError('Se perdió la conexión. Probá de nuevo.');
    }
  }

  function newRoom() {
    localStorage.removeItem(STORAGE_KEY);
    setCode(null);
    setHostToken(null);
    setRoom(null);
  }

  if (!checkedStorage) {
    return <div className="screen" />;
  }

  if (!code || !hostToken) {
    return (
      <div className="screen">
        <div className="eyebrow">Panel del anfitrión</div>
        <h1>🎭 Impostor: Edición Casamiento</h1>
        <p>
          Creá una sala y compartí el QR con tus invitados. Cada uno entra
          desde su propio celular.
        </p>
        {actionError && <p className="small error-text">{actionError}</p>}
        <button className="btn-primary" onClick={createRoom} disabled={creating}>
          {creating ? 'Creando sala...' : 'Crear sala nueva 🎉'}
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="screen">
        <p className="small">Cargando sala...</p>
      </div>
    );
  }

  return (
    <div className="screen">
      {room.status === 'lobby' && (
        <>
          <div className="step">Paso 1 · Sala abierta</div>
          <h2>Sumá invitados</h2>
          {qrUrl && (
            <div className="qr-box">
              <img src={qrUrl} alt="Código QR para unirse" width={220} height={220} />
            </div>
          )}
          <div className="room-code">{code}</div>
          <p className="small">
            O entrá en <strong>{host}</strong> y cargá el código.
          </p>

          <div className="player-list">
            {room.players.length === 0 && (
              <span className="small">Todavía no se sumó nadie...</span>
            )}
            {room.players.map((p) => (
              <span className="player-chip" key={p.id}>
                {p.name}
              </span>
            ))}
          </div>
          <p className="small">
            {room.playerCount} anotado{room.playerCount === 1 ? '' : 's'} (mínimo 2)
          </p>

          {actionError && <p className="small error-text">{actionError}</p>}
          <button
            className="btn-primary"
            onClick={() => callAction('start')}
            disabled={room.playerCount < 2}
          >
            Arrancar Ronda 1: Impostor 🎭
          </button>
        </>
      )}

      {(room.status === 'round1_active' || room.status === 'round2_active') && (
        <>
          <div className="step">Ronda {room.round} en curso</div>
          <h2>🎭 Discutan y voten</h2>
          <p>
            Cada invitado ya tiene su celular con la palabra (o con el rol de
            Impostor). Que tiren pistas en voz alta sin decir la palabra, y
            que voten desde su celular a quién sospechan.
          </p>
          <p className="small">
            Ni vos sabés quién es el Impostor todavía — se revela cuando
            cierres la ronda.
          </p>
          <p className="small">
            {room.votesIn} de {room.playerCount} votaron
          </p>
          {actionError && <p className="small error-text">{actionError}</p>}
          <button className="btn-danger" onClick={() => callAction('round-reveal')}>
            Revelar Impostor de la Ronda {room.round} ➡️
          </button>
        </>
      )}

      {(room.status === 'round1_result' || room.status === 'round2_result') && (
        <>
          <div className="step">Ronda {room.round} · Resultado</div>
          <h2>La palabra era: {room.word}</h2>
          <div className="impostor-name">🎭 {room.impostorName}</div>
          <div>
            {room.votesTally.map((row) => (
              <div
                className={'result-row' + (room.accusedNames.includes(row.name) ? ' accused' : '')}
                key={row.id}
              >
                <span>{row.name}</span>
                <span className={row.name === room.impostorName ? 'tag-impostor' : 'tag-crew'}>
                  {row.count} voto{row.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
          <span className={'correct-badge ' + (room.wasCorrect ? 'yes' : 'no')}>
            {room.wasCorrect ? '✅ ¡Lo descubrieron!' : '❌ Se les escapó...'}
          </span>
          {actionError && <p className="small error-text">{actionError}</p>}
          {room.status === 'round1_result' ? (
            <button className="btn-primary" onClick={() => callAction('round-next')}>
              Arrancar Ronda 2: Impostor 🎭
            </button>
          ) : (
            <button className="btn-primary" onClick={() => callAction('reveal-final')}>
              Ahora sí... ¡el gran reveal! 🎉
            </button>
          )}
        </>
      )}

      {room.status === 'final_revealed' && (
        <FinalReveal secret={room.secret} onReplay={newRoom} />
      )}
    </div>
  );
}
