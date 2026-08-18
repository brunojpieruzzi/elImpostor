// Server-only: nunca importar este archivo desde un Client Component.
// El dato secreto solo se manda al Oráculo (desde que arranca la ronda) y a
// todos recién en el momento del reveal final. Nunca viaja en el bundle del cliente.
export const SECRET_DAY = '28';
export const SECRET_MONTH = 'Agosto';
export const SECRET_YEAR = '2027';
export const SECRET_DATE_TEXT = `${SECRET_DAY} de ${SECRET_MONTH} de ${SECRET_YEAR}`;
export const REVEAL_NAMES = 'Eve & Bruno';

// Palabra secreta de cada ronda de Impostor, escalando hacia el tema del
// casamiento. Editable acá sin tocar el resto del código.
export const ROUND_WORDS = ['Fiesta', 'Novios'];
