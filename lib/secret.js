// Rama de prueba: sin ningún dato real de casamiento. El reveal final
// muestra un premio genérico para poder probar la mecánica sin filtrar nada.
export const SECRET_DATE_TEXT = '🍕 Pizza gratis para el equipo';
export const REVEAL_NAMES = 'Cortesía de la casa';

// Temática de cada ronda de Impostor, en orden. Sin temática de casamiento
// en esta rama de prueba. Editable acá sin tocar el resto del código
// (agregar más entradas = más rondas).
export const ROUND_THEMES = ['movie', 'disney_villanos', 'superheroes', 'comida', 'superheroes', 'animals'];
export const TOTAL_ROUNDS = ROUND_THEMES.length;

export const WORD_POOLS = {
  movie: [
    'Avatar',
    'Friends',
    'Titanic',
    'Rocky',
    'Frozen',
    'Jurassic Park',
    'Matrix',
    'Toy Story',
    'Shrek',
    'Greys Anatomy',
  ],
  animals: [
    'Jirafa',
    'Perro',
    'Delfín',
    'Tigre',
    'Mono',
    'Gato',
    'Pingüino',
    'Elefante',
    'Cebra',
    'León',
  ],
  paises: [
    'Japón',
    'Argentina',
    'Grecia',
    'Canadá',
    'India',
    'Brasil',
    'Francia',
    'Egipto',
    'Hungría',
    'Dinamarca',
  ],
  comida: [
    'Sushi',
    'Milanesa',
    'Pizza',
    'Ensalada',
    'Tacos',
    'Asado',
    'Pasta',
    'Helado',
    'Empanadas',
    'Hamburguesa',
  ],
  deportes: [
    'Rugby',
    'Fútbol',
    'Surf',
    'Básquet',
    'Golf',
    'Natación',
    'Vóley',
    'Tenis',
    'Ciclismo',
    'Boxeo',
  ],
  profesiones: [
    'Chef',
    'Ingeniero',
    'Doctor',
    'Músico',
    'Peluquero',
    'Bombero',
    'Abogado',
    'Piloto',
    'Maestro',
    'Policía',
  ],
  superheroes: [
    'Thor',
    'Wolverine',
    'Batman',
    'Aquaman',
    'Spiderman',
    'Wonder Woman',
    'Superman',
    'Flash',
    'Iron Man',
    'Hulk',
  ],
  colores: [
    'Naranja',
    'Rojo',
    'Celeste',
    'Verde',
    'Rosa',
    'Azul',
    'Blanco',
    'Amarillo',
    'Violeta',
    'Negro',
  ],
  disney_villanos: [
    'Hades',
    'Scar',
    'Maléfica',
    'Capitán Garfio',
    'Jafar',
    'Dr. Facilier',
    'Úrsula',
    'Reina Malvada',
    'Gastón',
    'Cruella de Vil',
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
