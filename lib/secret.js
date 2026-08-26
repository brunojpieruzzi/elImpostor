// Rama de prueba: sin ningún dato real de casamiento. El reveal final
// muestra un premio genérico para poder probar la mecánica sin filtrar nada.
export const SECRET_DATE_TEXT = '🍕 Pizza gratis para el equipo';
export const REVEAL_NAMES = 'Cortesía de la casa';

// Temática de cada ronda de Impostor, en orden. Sin temática de casamiento
// en esta rama de prueba. Editable acá sin tocar el resto del código
// (agregar más entradas = más rondas).
export const ROUND_THEMES = ['movie', 'paises', 'animals', 'movie', 'paises', 'animals'];
export const TOTAL_ROUNDS = ROUND_THEMES.length;

export const WORD_POOLS = {
  movie: [
    'Titanic',
    'Matrix',
    'Shrek',
    'Frozen',
    'Greys Anatomy',
    'Avatar',
    'Rocky',
    'Toy Story',
    'Friends',
    'Jurassic Park',
  ],
  animals: [
    'Perro',
    'Gato',
    'Elefante',
    'Tigre',
    'León',
    'Jirafa',
    'Cebra',
    'Mono',
    'Delfín',
    'Pingüino',
  ],
  paises: [
    'Argentina',
    'Brasil',
    'Canadá',
    'Dinamarca',
    'Egipto',
    'Francia',
    'Grecia',
    'Hungría',
    'India',
    'Japón',
  ],
  comida: [
    'Pizza',
    'Asado',
    'Sushi',
    'Empanadas',
    'Helado',
    'Hamburguesa',
    'Milanesa',
    'Tacos',
    'Pasta',
    'Ensalada',
  ],
  deportes: [
    'Fútbol',
    'Tenis',
    'Básquet',
    'Natación',
    'Boxeo',
    'Rugby',
    'Golf',
    'Ciclismo',
    'Vóley',
    'Surf',
  ],
  profesiones: [
    'Doctor',
    'Bombero',
    'Maestro',
    'Chef',
    'Piloto',
    'Abogado',
    'Músico',
    'Policía',
    'Ingeniero',
    'Peluquero',
  ],
  superheroes: [
    'Batman',
    'Superman',
    'Spiderman',
    'Hulk',
    'Thor',
    'Flash',
    'Wonder Woman',
    'Iron Man',
    'Wolverine',
    'Aquaman',
  ],
  colores: [
    'Rojo',
    'Azul',
    'Verde',
    'Amarillo',
    'Negro',
    'Blanco',
    'Violeta',
    'Naranja',
    'Rosa',
    'Celeste',
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
