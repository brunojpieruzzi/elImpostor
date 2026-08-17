'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function goToRoom(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setError('El código tiene 4 números.');
      return;
    }
    router.push(`/join/${trimmed}`);
  }

  return (
    <div className="screen">
      <div className="eyebrow">Ronda de curiosidades</div>
      <h1>🔮 El Oráculo 🔮</h1>
      <p>
        Una sola persona va a conocer el dato secreto. El resto tiene que
        descubrirlo a los gritos, tirando ideas y palabras sueltas hasta acertar.
      </p>
      <p className="small">
        Cada invitado juega desde su propio celular. El anfitrión arma la sala
        y comparte un código QR para sumarse.
      </p>

      <button className="btn-primary" onClick={() => router.push('/host')}>
        Soy el anfitrión / anfitriona 🎤
      </button>

      <div className="card" style={{ marginTop: 22 }}>
        <label htmlFor="joinCode">¿Tenés un código de sala?</label>
        <form onSubmit={goToRoom}>
          <input
            id="joinCode"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {error && <p className="small error-text">{error}</p>}
          <button className="btn-secondary" type="submit">
            Unirme al juego ▶️
          </button>
        </form>
      </div>
    </div>
  );
}
