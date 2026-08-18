'use client';
import { useEffect, useRef, useState } from 'react';

const FRAMES = ['🥁 ...', '🥁 🥁 ...', '🥁 🥁 🥁 ...', '✨ ¡Ahí viene!'];

export default function FinalReveal({ secret, onReplay, showReplay = true }) {
  const [frame, setFrame] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [needsTapForSound, setNeedsTapForSound] = useState(false);
  const started = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < FRAMES.length) {
        setFrame(i);
      } else {
        clearInterval(iv);
        setRevealed(true);
        launchConfetti();
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => setNeedsTapForSound(true));
        }
      }
    }, 650);
    return () => clearInterval(iv);
  }, []);

  function playSongNow() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setNeedsTapForSound(false)).catch(() => {});
  }

  return (
    <div className={'final-wrap' + (revealed ? ' revealed' : '')}>
      <audio ref={audioRef} src="/reveal-song.mp3" preload="auto" onError={() => setNeedsTapForSound(false)} />
      <div className="eyebrow">{revealed ? '¡Sorpresa! 💍' : 'El gran momento'}</div>
      <h2>{revealed ? '¡Nos casamos!' : 'Redoble de tambores...'}</h2>
      {!revealed && <div className="drumroll">{FRAMES[frame]}</div>}
      {revealed && needsTapForSound && (
        <button className="btn-ghost" onClick={playSongNow}>🔊 Tocá para escuchar la canción</button>
      )}
      {revealed && secret && (
        <div>
          <div className="final-date">{secret.dateText}</div>
          <div className="final-names">{secret.names} se casan 🎊</div>
          <p className="small">¡Los esperamos para celebrar el amor (y brindar de más)! 🥂</p>
        </div>
      )}
      {revealed && showReplay && (
        <button className="btn-secondary" onClick={onReplay}>
          Jugar otra ronda con otros invitados 🔁
        </button>
      )}
    </div>
  );
}

function launchConfetti() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  const colors = ['#6b8e23', '#c15123', '#dcd6ca', '#45611a', '#ffffff'];
  const emojis = ['💍', '💛', '🎉', '✨'];
  const total = 90;
  for (let i = 0; i < total; i++) {
    const piece = document.createElement('div');
    const useEmoji = Math.random() < 0.25;
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    const duration = 2.4 + Math.random() * 2.2;
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = Math.random() * 0.6 + 's';
    if (useEmoji) {
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.fontSize = 14 + Math.random() * 10 + 'px';
      piece.style.width = 'auto';
      piece.style.height = 'auto';
    } else {
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
    }
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + 1) * 1000);
  }
}
