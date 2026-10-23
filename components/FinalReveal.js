'use client';
import { useEffect, useRef, useState } from 'react';

const FRAMES = ['🥁 ...', '🥁 🥁 ...', '🥁 🥁 🥁 ...', '✨ ¡Ahí viene!'];

export default function FinalReveal({ scoreboard, onReplay, showReplay = true }) {
  const [frame, setFrame] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const started = useRef(false);

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
      }
    }, 650);
    return () => clearInterval(iv);
  }, []);

  const board = scoreboard || [];
  const topScore = board.length > 0 ? board[0].score : 0;
  const winners = board.filter((p) => p.score === topScore).map((p) => p.name);

  return (
    <div className={'final-wrap' + (revealed ? ' revealed' : '')}>
      <div className="eyebrow">{revealed ? 'Fin del juego 🎉' : 'El gran momento'}</div>
      <h2>{revealed ? '¡Y el podio es...!' : 'Redoble de tambores...'}</h2>
      {!revealed && <div className="drumroll">{FRAMES[frame]}</div>}

      {revealed && winners.length > 0 && (
        <div>
          <div className="final-winner">
            🏆 {winners.join(' y ')}
          </div>
          <p className="small">
            {winners.length === 1 ? 'Ganó' : 'Ganaron'} con {topScore} punto{Math.abs(topScore) === 1 ? '' : 's'}
          </p>
        </div>
      )}

      {revealed && board.length > 0 && (
        <div className="score-board">
          <div className="step">🏆 Puntaje final</div>
          {board.map((p, i) => (
            <div className="result-row" key={p.id}>
              <span>{i === 0 ? '🥇 ' : ''}{p.name}</span>
              <span className={p.score > 0 ? 'score-positive' : p.score < 0 ? 'score-negative' : 'score-zero'}>
                {p.score > 0 ? `+${p.score}` : p.score} pt{Math.abs(p.score) === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}

      {revealed && <p className="small">¡Gracias por jugar! 🎊</p>}

      {revealed && showReplay && (
        <button className="btn-secondary" onClick={onReplay}>
          Jugar otra partida 🔁
        </button>
      )}
    </div>
  );
}

function launchConfetti() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  const colors = ['#6b8e23', '#c15123', '#dcd6ca', '#45611a', '#ffffff'];
  const emojis = ['🎉', '⭐', '🎊', '✨'];
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
