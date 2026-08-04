/**
 * Construye src/content/menu.json a partir del export de traducciones del TPV
 * que vive en assets-origen/carta/.
 *
 * El export no trae precios ni la relacion producto -> categoria, asi que la
 * categoria se asigna aqui con el mapa CATEGORIA y el precio queda a null hasta
 * que el cafe lo facilite.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'assets-origen', 'carta');

const IDIOMAS = ['es', 'en', 'de', 'ca'];

/** Columnas de cada idioma en Productos.csv: [nombre, descripcion]. */
const COLUMNAS = { es: [3, 4], en: [5, 6], de: [9, 10], ca: [17, 18] };

/** Columna del nombre de cada idioma en Categorias.csv. */
const COLUMNAS_CATEGORIA = { es: 2, en: 3, de: 5, ca: 9 };

/** Orden de las categorias en la carta de la web. */
const ORDEN = [
  'Desayunos', 'Tostadas', 'Pa amb oli', 'Bocadillos', 'Sandwich',
  'Poké Bowls', 'Para Picar', 'Dulces', 'Tartas y bolleria',
  'Cafés', 'Tés e Infusiones', 'Bebidas', 'Licores', 'Combinados', 'Cocteles',
];

/** Productos internos que no deben salir en la carta publica. */
const OCULTOS = new Set(['cumpleaños', 'Nuevo complemento']);

/**
 * Producto -> categoria. El TPV no exporta esta relacion, asi que se deduce del
 * nombre y la descripcion. Revisado a mano contra las fotos de Instagram.
 */
const CATEGORIA = {
  // Desayunos
  Scrambled: 'Desayunos', Uagadou: 'Desayunos', Fit: 'Desayunos',
  Tonks: 'Desayunos', Ilvermorny: 'Desayunos', Lupin: 'Desayunos',
  Quidditch: 'Desayunos', Overnight: 'Desayunos', Iberiquisimo: 'Desayunos',
  'Luxury (2 personas)': 'Desayunos',
  // Tostadas
  Hogwards: 'Tostadas', Weasley: 'Tostadas', Luna: 'Tostadas',
  Beauxbatons: 'Tostadas', Narcisa: 'Tostadas', Mandragora: 'Tostadas',
  Mandangus: 'Tostadas', 'Variedad de tostadas': 'Tostadas',
  'Media Tostada': 'Tostadas',
  // Pa amb oli
  Imperio: 'Pa amb oli', 'Avada Kedavra': 'Pa amb oli', Cruccio: 'Pa amb oli',
  Ibérico: 'Pa amb oli', Caprese: 'Pa amb oli', Lucius: 'Pa amb oli',
  'Medio Pa amb oli': 'Pa amb oli',
  // Bocadillos
  Hedwig: 'Bocadillos', Cubano: 'Bocadillos', Dobby: 'Bocadillos',
  'Medio Bocadillo': 'Bocadillos',
  // Sandwich
  Thestral: 'Sandwich', Buckbeak: 'Sandwich', Grindylow: 'Sandwich',
  Veggi: 'Sandwich', Dumbledore: 'Sandwich', Snape: 'Sandwich',
  skabers: 'Sandwich',
  // Poké Bowls
  Gryffindor: 'Poké Bowls', Ravenclaw: 'Poké Bowls',
  // Para Picar
  Riddle: 'Para Picar', Incendio: 'Para Picar', Neville: 'Para Picar',
  Lockhart: 'Para Picar', Bellatrix: 'Para Picar', Voldemort: 'Para Picar',
  Scamander: 'Para Picar', Crounch: 'Para Picar', 'Plato aguacate': 'Para Picar',
  'Extra pan': 'Para Picar',
  // Dulces
  Castelobruxo: 'Dulces', 'Bola helado vainilla': 'Dulces', Crepe: 'Dulces',
  'Vasito TIRAMISU': 'Dulces', Pudding: 'Dulces',
  // Tartas y bolleria
  'Tarta de coco': 'Tartas y bolleria', 'Tarta de Oreo': 'Tartas y bolleria',
  'Tarta huesitos': 'Tartas y bolleria', 'Tarta macha': 'Tartas y bolleria',
  'Tarta de queso': 'Tartas y bolleria', 'Tarta entera': 'Tartas y bolleria',
  'Tarta de zanahoria': 'Tartas y bolleria', 'Tarta avellana': 'Tartas y bolleria',
  'Tarta Fresas y Nata': 'Tartas y bolleria',
  'Tarta de Queso y Fresas': 'Tartas y bolleria',
  'tarta Banoffee': 'Tartas y bolleria',
  'tarta de chocolate y coco': 'Tartas y bolleria',
  'tarta de fruta sin gluten': 'Tartas y bolleria',
  'Pastelitos de coco y crema': 'Tartas y bolleria',
  'Pastelito de chocolate y almendra': 'Tartas y bolleria',
  'Pastelito chocolate y coco': 'Tartas y bolleria',
  'pastelito manzana': 'Tartas y bolleria',
  'Pastelito platano': 'Tartas y bolleria',
  'Caña de chocolate': 'Tartas y bolleria', Daim: 'Tartas y bolleria',
  Crespells: 'Tartas y bolleria', 'Gato Mallorquin': 'Tartas y bolleria',
  'Napolitana crema y chocolate': 'Tartas y bolleria', Croissan: 'Tartas y bolleria',
  // Cafes
  'Café Bombón': 'Cafés', Americano: 'Cafés', 'Doble espresso': 'Cafés',
  Lungo: 'Cafés', Babychino: 'Cafés', Mocca: 'Cafés', 'Prensa francesa': 'Cafés',
  Espresso: 'Cafés', Capuchino: 'Cafés', 'Café con miel': 'Cafés',
  Latte: 'Cafés', Cortado: 'Cafés', 'Flat White': 'Cafés',
  'Café Irlandés': 'Cafés', Carajillo: 'Cafés', 'Latte Macchiato': 'Cafés',
  'ICE LATTE': 'Cafés', 'ICE FLAT WHITE': 'Cafés', 'ICE MOCCA': 'Cafés',
  'ICE AMERICANO': 'Cafés', 'ICE CAPUCCINO': 'Cafés', 'Chai latte': 'Cafés',
  'Ice matcha': 'Cafés',
  // Tes e infusiones
  'Té Frutos Rojos': 'Tés e Infusiones', Manzanilla: 'Tés e Infusiones',
  'Té gengibre y limon': 'Tés e Infusiones', 'Poleo Menta': 'Tés e Infusiones',
  'Menta Fresca': 'Tés e Infusiones', 'Breakfast Tea': 'Tés e Infusiones',
  'Té Verde': 'Tés e Infusiones', 'Té Rojo': 'Tés e Infusiones',
  'Té Matcha': 'Tés e Infusiones', Rooibos: 'Tés e Infusiones',
  'Te frio': 'Tés e Infusiones', 'Té Tropical': 'Tés e Infusiones',
  'Té de Manzana Asada y Canela': 'Tés e Infusiones',
  'Té de Almendra y Canela': 'Tés e Infusiones',
  'Infusión de Menta': 'Tés e Infusiones',
  'Té de Frutos de invierno': 'Tés e Infusiones',
  'Te de granada': 'Tés e Infusiones', 'Te chai': 'Tés e Infusiones',
  // Bebidas
  Nestea: 'Bebidas', 'Fanta Naranja': 'Bebidas', Agua: 'Bebidas',
  "Estrella Galicia 0'0": 'Bebidas', 'Zumo Manzana': 'Bebidas',
  'Agua con gas': 'Bebidas', 'Estrella Galicia': 'Bebidas',
  'Zumo Melocotón': 'Bebidas', 'Ice Tea (Natural)': 'Bebidas',
  'Fanta Limón': 'Bebidas', Sprite: 'Bebidas', Tónica: 'Bebidas',
  'Zumo Piña': 'Bebidas', 'Coca Cola': 'Bebidas', 'Coca Cola Zero': 'Bebidas',
  Sangria: 'Bebidas', Limonada: 'Bebidas', 'Zumo naranja': 'Bebidas',
  Lacao: 'Bebidas', 'Ginger Ale': 'Bebidas', 'Chocolate Caliente': 'Bebidas',
  Shandy: 'Bebidas', Clara: 'Bebidas', Redbull: 'Bebidas', Spezie: 'Bebidas',
  'Vaso leche': 'Bebidas', 'Monster grande': 'Bebidas', Appleshorle: 'Bebidas',
  'Tinto de Verano': 'Bebidas', 'cerveza pequeña': 'Bebidas', Caña: 'Bebidas',
  Aquarius: 'Bebidas',
  // Licores
  'Chupito Jack Daniels': 'Licores', Aperol: 'Licores',
  'Hierbas secas': 'Licores', 'Hierbas mezcladas': 'Licores',
  'Hierbas dulces': 'Licores', Brandy: 'Licores', 'Copa whisky': 'Licores',
  'Copa de Ron': 'Licores', 'copa de Vodka': 'Licores', 'copa Tequila': 'Licores',
  'Copa Baileys': 'Licores', Martini: 'Licores', 'Chupito tequila': 'Licores',
  'Copa Vino Tinto': 'Licores', 'Copa Vino Blanco': 'Licores',
  'copa de cava': 'Licores', Jaggermeister: 'Licores',
  // Combinados
  "Seagram's + Refresco": 'Combinados', 'Smirnoff + Refresco': 'Combinados',
  'Barceló + Refresco': 'Combinados', 'J&B + Refresco': 'Combinados',
  'Habana Club especial + Refresco': 'Combinados', 'Campari + Soda': 'Combinados',
  'Broockmans + Refresco': 'Combinados', 'Hendricks + Refresco': 'Combinados',
  'Red Label + Refresco': 'Combinados', '43 + Leche': 'Combinados',
  'Jack Daniels manzana + Refresco': 'Combinados',
  'Beefeater + Refresco': 'Combinados', 'Jack Daniels + Refresco': 'Combinados',
  'Puerto de Indias + Refresco': 'Combinados',
  'Habana Club + Refresco': 'Combinados', 'Amaretto + refresco': 'Combinados',
  // Cocteles
  Margarita: 'Cocteles', 'Expreso Martini': 'Cocteles', Lumumba: 'Cocteles',
  Negroni: 'Cocteles', 'Long Island Iced Tee': 'Cocteles',
};

/**
 * Erratas del TPV corregidas solo para la web. Conviene arreglarlas tambien en
 * origen: aqui se pierden en cuanto se reexporte la hoja.
 */
const ERRATAS = {
  Hogwards: 'Hogwarts',
  Cruccio: 'Crucio',
  Croissan: 'Croissant',
  skabers: 'Scabbers',
  Veggi: 'Veggie',
  Mandragora: 'Mandrágora',
  Mandangus: 'Mundungus',
  'Tarta macha': 'Tarta de matcha',
  'Te frio': 'Té frío',
  'Te chai': 'Té chai',
  'Te de granada': 'Té de granada',
  'Té gengibre y limon': 'Té de jengibre y limón',
  Jaggermeister: 'Jägermeister',
  Spezie: 'Spezi',
  Appleshorle: 'Apfelschorle',
  Capuchino: 'Cappuccino',
  'Long Island Iced Tee': 'Long Island Iced Tea',
};

/** Erratas dentro de las descripciones, corregidas solo para la web. */
const ERRATAS_DESC = [
  [/tostada don sobrasada/gi, 'tostada de sobrasada'],
  [/\bcacahuate\b/gi, 'cacahuete'],
  [/\bCreepes\b/gi, 'Crepes'],
  [/\bSerraro\b/gi, 'Serrano'],
  [/\btoppins\b/gi, 'toppings'],
  [/\bhoishin\b/gi, 'hoisin'],
  [/\bTrozos d manzana\b/gi, 'Trozos de manzana'],
  [/\bflores de hibsco\b/gi, 'flores de hibisco'],
  [/\bflorea de hibiscо?\b/gi, 'flores de hibisco'],
  [/\bzumo de limon\b/gi, 'zumo de limón'],
  [/\bjamon\b/gi, 'jamón'],
  [/\bsalmon\b/gi, 'salmón'],
  [/\bPan Mallorquin\b/gi, 'Pan mallorquín'],
  [/\blonganiza de payes\b/gi, 'longaniza de pagès'],
  [/\bexpresso\b/gi, 'espresso'],
  [/\bLicor de cafe\b/gi, 'Licor de café'],
  [/\bazucar\b/gi, 'azúcar'],
  [/\bCafe\b/g, 'Café'],
  [/\bplatano\b/gi, 'plátano'],
];

const corregirDesc = (s) => ERRATAS_DESC.reduce((t, [re, a]) => t.replace(re, a), s);

/** Parser de CSV con soporte de comillas y saltos de linea dentro de campo. */
function parseCsv(texto) {
  const filas = [];
  let fila = [], campo = '', enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else { enComillas = false; }
      } else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((c) => c.trim()));
}

const leer = (archivo) => parseCsv(readFileSync(join(ORIGEN, archivo), 'utf8')).slice(1);

const limpiar = (s) => (s ?? '').trim().replace(/\s+/g, ' ');

/** Normaliza la primera letra: el TPV mezcla "tarta de coco" y "Tarta de coco". */
const capitalizar = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const categorias = leer('Categorías.csv');
const productos = leer('Productos.csv');

// Nombre de categoria por idioma, indexado por su nombre en castellano.
const categoriaPorIdioma = new Map(
  categorias.map((f) => [
    limpiar(f[1]),
    Object.fromEntries(IDIOMAS.map((l) => [l, limpiar(f[COLUMNAS_CATEGORIA[l]]) || limpiar(f[1])])),
  ]),
);

const sinCategoria = [];
const agrupados = new Map(ORDEN.map((c) => [c, []]));

for (const fila of productos) {
  const base = limpiar(fila[1]);
  if (!base || OCULTOS.has(base)) continue;

  const categoria = CATEGORIA[base];
  if (!categoria) { sinCategoria.push(base); continue; }

  // "SIN GLUTEN" viaja dentro de la descripcion; se extrae como distintivo.
  const descBase = limpiar(fila[2]);
  const sinGluten = /sin gluten/i.test(base + ' ' + descBase);

  const nombres = {}, descripciones = {};
  for (const l of IDIOMAS) {
    const [ci, cd] = COLUMNAS[l];
    nombres[l] = capitalizar(limpiar(fila[ci])) || capitalizar(ERRATAS[base] ?? base);
    const d = limpiar(fila[cd]).replace(/\s*sin gluten\s*/i, '').replace(/^\((.*)\)$/, '$1');
    // Las erratas solo se corrigen en castellano; el resto es traduccion suya.
    descripciones[l] = d ? capitalizar(l === 'es' ? corregirDesc(d) : d) : null;
  }
  // El nombre propio (Hedwig, Voldemort) no se traduce: se aplica la errata a todos.
  if (ERRATAS[base]) for (const l of IDIOMAS) {
    if (nombres[l].toLowerCase() === base.toLowerCase()) nombres[l] = ERRATAS[base];
  }

  agrupados.get(categoria).push({
    id: fila[0],
    nombre: nombres,
    descripcion: descripciones,
    precio: null, // pendiente: el TPV no exporta precios
    sinGluten,
  });
}

const menu = {
  generadoEl: new Date().toISOString().slice(0, 10),
  idiomas: IDIOMAS,
  avisoPrecios: 'Precios pendientes de recibir del cafe.',
  categorias: ORDEN.map((c) => ({
    id: c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'),
    nombre: categoriaPorIdioma.get(c) ?? Object.fromEntries(IDIOMAS.map((l) => [l, c])),
    productos: agrupados.get(c).sort((a, b) => a.nombre.es.localeCompare(b.nombre.es, 'es')),
  })).filter((c) => c.productos.length),
};

writeFileSync(join(RAIZ, 'src', 'content', 'menu.json'), JSON.stringify(menu, null, 2) + '\n');

const total = menu.categorias.reduce((n, c) => n + c.productos.length, 0);
console.log(`${total} productos en ${menu.categorias.length} categorias`);
for (const c of menu.categorias) console.log(`  ${c.nombre.es.padEnd(20)} ${c.productos.length}`);
if (sinCategoria.length) console.log(`\nSIN CATEGORIA (${sinCategoria.length}): ${sinCategoria.join(', ')}`);
