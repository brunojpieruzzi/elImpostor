// Tope de rondas que puede elegir el anfitrión. Si pide más rondas que
// categorías elegidas, las categorías se repiten (con palabras distintas).
export const MAX_ROUNDS = 20;
export const DEFAULT_ROUNDS = 5;

// Nombre que ve el anfitrión al elegir las categorías de la partida.
export const CATEGORY_LABELS = {
  peliculas_series: 'Películas y series',
  asado: 'Asado',
  famosos_ar: 'Famosos argentinos',
  cosas_de_barrio: 'Cosas de barrio',
  lugares_ar: 'Lugares de Argentina',
  futbol: 'Fútbol',
  comida: 'Comida',
  verano: 'Verano',
  superheroes: 'Superhéroes',
};

export const WORD_POOLS = {
  peliculas_series: [
    'El Eternauta',
    'Los Simuladores',
    'Casados con Hijos',
    'El Clan',
    'Relatos Salvajes',
    'Esperando la Carroza',
    'Titanic',
    'Shrek',
    'Toy Story',
    'Friends',
    'Jurassic Park',
    'Matrix',
    'Rocky',
    'Avatar',
  ],
  asado: [
    'Chorizo',
    'Morcilla',
    'Entraña',
    'Vacío',
    'Provoleta',
    'Chimichurri',
    'Achuras',
    'Parrilla',
    'Fernet',
    'Tira de asado',
    'Molleja',
    'Choripán',
    'Ensalada mixta',
    'Sobremesa',
  ],
  famosos_ar: [
    'Messi',
    'Maradona',
    'Susana Giménez',
    'Charly García',
    'Tini',
    'Mirtha Legrand',
    'Guillermo Francella',
    'Ricardo Darín',
    'Lali',
    'Fito Páez',
    'Coscu',
    'Duki',
    'Luis Miguel',
    'Divino',
  ],
  cosas_de_barrio: [
    'Kiosco',
    'Mate',
    'Colectivo',
    'Subte',
    'SUBE',
    'Plaza',
    'Verdulería',
    'Carnicería',
    'Dulce de leche',
    'Alfajor',
    'Cuadra',
    'Vereda',
    'Pochoclo',
    'Termo',
  ],
  lugares_ar: [
    'Obelisco',
    'Bariloche',
    'Mar del Plata',
    'Cataratas',
    'Ushuaia',
    'Mendoza',
    'La Boca',
    'Córdoba',
    'Perito Moreno',
    'Salta',
    'Rosario',
    'Tigre',
    'Cafayate',
    'Villa Gesell',
  ],
  futbol: [
    'Boca',
    'River',
    'Mundial',
    'Penal',
    'Tribuna',
    'La Bombonera',
    'Hincha',
    'Árbitro',
    'Fútbol 5',
    'Barra',
    'Gol',
    'Camiseta',
    'Offside',
    'Mufa',
  ],
  comida: [
    'Milanesa',
    'Empanadas',
    'Pizza',
    'Fugazzeta',
    'Locro',
    'Ñoquis del 29',
    'Faina',
    'Medialunas',
    'Helado',
    'Pancho',
    'Lomito',
    'Tortilla',
    'Pastafrola',
    'Panqueque',
  ],
  verano: [
    'Playa',
    'Sombrilla',
    'Protector solar',
    'Pileta',
    'Heladería',
    'Ojotas',
    'Carpa',
    'Camping',
    'Ventilador',
    'Tostado de jamón y queso',
    'Mosquito',
    'Cuarteto',
    'Gancia',
    'Reposera',
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
    'Deadpool',
    'Capitán América',
    'Pantera Negra',
    'Joker',
  ],
};

export const ALL_CATEGORIES = Object.keys(WORD_POOLS);

// Lista para mostrar en la pantalla del anfitrión.
export function categoryList() {
  return ALL_CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key] || key,
    count: WORD_POOLS[key].length,
  }));
}

// Deja solo categorías que existen, sin repetidas.
export function sanitizeCategories(list) {
  if (!Array.isArray(list)) return [];
  return ALL_CATEGORIES.filter((key) => list.includes(key));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Arma el orden de categorías de la partida: mezcla las elegidas y, si hay
// más rondas que categorías, vuelve a mezclar y repite sin que la misma
// categoría salga dos rondas seguidas (cuando hay más de una).
export function buildRoundThemes(categories, rounds) {
  const pool = sanitizeCategories(categories);
  const base = pool.length > 0 ? pool : ALL_CATEGORIES;
  const themes = [];
  while (themes.length < rounds) {
    let batch = shuffle(base);
    if (base.length > 1 && themes.length > 0 && batch[0] === themes[themes.length - 1]) {
      batch = [...batch.slice(1), batch[0]];
    }
    themes.push(...batch);
  }
  return themes.slice(0, rounds);
}

// Elige una palabra al azar de esa categoría, evitando repetir una ya usada
// en la misma partida.
export function pickRoundWord(theme, usedWords = []) {
  const pool = WORD_POOLS[theme] || WORD_POOLS[ALL_CATEGORIES[0]];
  const available = pool.filter((w) => !usedWords.includes(w));
  const options = available.length > 0 ? available : pool;
  return options[Math.floor(Math.random() * options.length)];
}
