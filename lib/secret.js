// Server-only: nunca importar este archivo desde un Client Component.
// El dato secreto solo se manda al Oráculo (desde que arranca la ronda) y a
// todos recién en el momento del reveal final. Nunca viaja en el bundle del cliente.
export const SECRET_DAY = '28';
export const SECRET_MONTH = 'Agosto';
export const SECRET_YEAR = '2027';
export const SECRET_DATE_TEXT = `${SECRET_DAY} de ${SECRET_MONTH} de ${SECRET_YEAR}`;
export const REVEAL_NAMES = 'Eve & Bruno';

// Temática de cada ronda de Impostor, en orden. Se alterna pelis/series con
// casamiento para que el patrón no sea obvio. Editable acá sin tocar el
// resto del código (agregar más entradas = más rondas).
export const ROUND_THEMES = ['movie', 'wedding', 'movie', 'wedding'];
export const TOTAL_ROUNDS = ROUND_THEMES.length;

export const WORD_POOLS = {
  movie: [
    'Titanic',
    'Matrix',
    'Shrek',
    'Frozen',
    'Grease',
    'Avatar',
    'Rocky',
    'Toy Story',
    'Friends',
    'Jurassic Park',
  ],
  wedding: [
    'Novios',
    'Fiesta',
    'Anillo',
    'Vals',
    'Brindis',
    'Padrino',
    'Torta',
    'Ramo',
    'Luna de miel',
  ],
};

// Elige una palabra al azar de la temática de esa ronda, evitando repetir
// una ya usada en la misma partida.
export function pickRoundWord(roundNumber, usedWords = []) {
  const theme = ROUND_THEMES[roundNumber - 1] || 'movie';
  const pool = WORD_POOLS[theme];
  const available = pool.filter((w) => !usedWords.includes(w));
  const options = available.length > 0 ? available : pool;
  return options[Math.floor(Math.random() * options.length)];
}
