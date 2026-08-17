'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import FinalReveal from '@/components/FinalReveal';

const POLL_MS = 1500;
const STORAGE_KEY = 'oraculo_host';

function mapError(code) {
  switch (code) {
    case 'not_enough_players':
      return 'Necesitás al menos 3 invitados anotados.';
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
      color: { dark: '#2a2247', light: '#ffffff' },
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
        <h1>🔮 El Oráculo 🔮</h1>
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
            {room.playerCount} anotado{room.playerCount === 1 ? '' : 's'} (mínimo 3)
          </p>

          {actionError && <p className="small error-text">{actionError}</p>}
          <button
            className="btn-primary"
            onClick={() => callAction('start')}
            disabled={room.playerCount < 3}
          >
            Elegir al Oráculo en secreto 🤫
          </button>
        </>
      )}

      {room.status === 'assigned' && (
        <>
          <div className="step">Paso 2 · Ronda de adivinanzas</div>
          <h2>🔮 ¡Ya está elegido!</h2>
          <p>
            Decile a todos que miren su celular: ahí van a ver si son el
            Oráculo o si tienen que adivinar.
          </p>
          <p className="small">
            El Oráculo da pistas indirectas sobre el dato secreto, sin
            decirlo. El resto grita ideas hasta adivinar (¡o rendirse!).
          </p>
          {actionError && <p className="small error-text">{actionError}</p>}
          <button className="btn-danger" onClick={() => callAction('reveal-roles')}>
            ¿Ya adivinaron o se rindieron? Revelar Oráculo ➡️
          </button>
        </>
      )}

      {room.status === 'roles_revealed' && (
        <>
          <div className="step">Resultado</div>
          <h2>El Oráculo era...</h2>
          <div className="oracle-name">
            {room.players.find((p) => p.role === 'oracle')?.name || '-'}
          </div>
          <div>
            {room.players.map((p) => (
              <div className="result-row" key={p.id}>
                <span>{p.name}</span>
                <span className={p.role === 'oracle' ? 'tag-oracle' : 'tag-guesser'}>
                  {p.role === 'oracle' ? '🔮 Oráculo' : '🙃 Adivinaba'}
                </span>
              </div>
            ))}
          </div>
          {actionError && <p className="small error-text">{actionError}</p>}
          <button className="btn-primary" onClick={() => callAction('reveal-final')}>
            Ahora sí... ¡el gran reveal! 🎉
          </button>
        </>
      )}

      {room.status === 'final_revealed' && (
        <FinalReveal secret={room.secret} onReplay={newRoom} />
      )}
    </div>
  );
}
