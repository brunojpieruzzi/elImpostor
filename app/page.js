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
      <div className="eyebrow">Impostor: Edición Casamiento</div>
      <h1>🎭 ¿Quién es el Impostor?</h1>
      <p>
        En cada ronda todos reciben la misma palabra secreta... menos el
        Impostor. Tiren pistas sin decirla directamente y voten a quién
        sospechan. La última ronda no se juega — ¡se revela algo grande!
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
