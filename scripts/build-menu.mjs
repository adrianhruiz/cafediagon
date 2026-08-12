/**
 * Construye src/content/menu.json a partir del export de traducciones del TPV
 * que vive en assets-origen/carta/.
 *
 * El export no trae la relacion producto -> categoria, asi que la categoria se
 * asigna aqui con el mapa CATEGORIA. Desde el export del 11/08/2026 si trae
 * precios (columna "Precio (€)"); los que vengan vacios quedan a null. El del
 * 12/08/2026 anade la columna "Alérgenos", en castellano y a mano.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'assets-origen', 'carta');

const IDIOMAS = ['es', 'en', 'de', 'ca'];

/** Columnas de cada idioma en Productos.csv: [nombre, descripcion]. */
const COLUMNAS = { es: [5, 6], en: [7, 8], de: [11, 12], ca: [19, 20] };

/** Columna del precio en Productos.csv. */
const COLUMNA_PRECIO = 3;

/** Columna de alergenos en Productos.csv, en castellano y separados por comas. */
const COLUMNA_ALERGENOS = 4;

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
  skabers: 'Sandwich', Skabers: 'Sandwich', Italiano: 'Sandwich',
  Frances: 'Sandwich',
  // Poké Bowls
  Gryffindor: 'Poké Bowls', Ravenclaw: 'Poké Bowls',
  // Para Picar
  Riddle: 'Para Picar', Incendio: 'Para Picar', Neville: 'Para Picar',
  Lockhart: 'Para Picar', Bellatrix: 'Para Picar', Voldemort: 'Para Picar',
  Scamander: 'Para Picar', Crounch: 'Para Picar', 'Plato aguacate': 'Para Picar',
  'Extra pan': 'Para Picar',
  // Dulces
  Castelobruxo: 'Dulces', 'Bola helado vainilla': 'Dulces', Crepe: 'Dulces',
  'Vasito TIRAMISU': 'Dulces', Pudding: 'Dulces', Verrine: 'Dulces',
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
  Espresso: 'Cafés', Expresso: 'Cafés', Capuchino: 'Cafés',
  'Café con miel': 'Cafés',
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
  Lacao: 'Bebidas', 'Cola Cao energy': 'Bebidas', 'Ginger Ale': 'Bebidas',
  'Chocolate Caliente': 'Bebidas',
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
 * Los 14 alergenos del anexo II del Rgto (UE) 1169/2011, en el orden en que los
 * lista la norma. El TPV los escribe a mano y con variantes ("leche" y "Leche",
 * "Frutos de cascara" y "frutos de cáscara", "Huevo" en singular), asi que aqui
 * se reduce cada celda a estos codigos y el nombre visible sale del diccionario
 * de idiomas. Un valor desconocido para el build en vez de publicarse a medias.
 */
const ALERGENOS = [
  'gluten', 'crustaceos', 'huevos', 'pescado', 'cacahuetes', 'soja', 'leche',
  'frutosCascara', 'apio', 'mostaza', 'sesamo', 'sulfitos', 'altramuces',
  'moluscos',
];

/** Como escribe el TPV cada alergeno, ya normalizado a minusculas y sin tildes. */
const ALERGENO_POR_TEXTO = {
  gluten: 'gluten',
  crustaceos: 'crustaceos',
  huevo: 'huevos', huevos: 'huevos',
  pescado: 'pescado',
  cacahuete: 'cacahuetes', cacahuetes: 'cacahuetes',
  soja: 'soja',
  leche: 'leche',
  'frutos de cascara': 'frutosCascara', 'frutos secos': 'frutosCascara',
  apio: 'apio',
  mostaza: 'mostaza',
  sesamo: 'sesamo', 'granos de sesamo': 'sesamo',
  sulfitos: 'sulfitos', 'dioxido de azufre y sulfitos': 'sulfitos',
  altramuces: 'altramuces',
  moluscos: 'moluscos',
};

/** La celda con la que el TPV declara que no lleva ninguno de los 14. */
const NINGUN_ALERGENO = 'ninguno';

/**
 * Correcciones sobre la columna de alergenos, confirmadas con el cafe el
 * 12/08/2026 (ver compliance/alergenos-revision.md). Van aqui y no en la hoja
 * porque el TPV la reescribe en cada export.
 */
const ALERGENOS_CORREGIDOS = {
  // La avena es cereal con gluten en el anexo II salvo que este certificada, y
  // la leche vegetal que se usa puede ser de soja. No lleva leche animal.
  Overnight: ['gluten', 'soja', 'frutosCascara'],
  // Se sirve con Baileys, que lleva leche.
  Carajillo: ['leche'],
  // El nombre ya nombra el alergeno (art. 21), pero declararlo "Ninguno" seria
  // decir lo contrario.
  'Vaso leche': ['leche'],
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
  Skabers: 'Scabbers',
  Expresso: 'Espresso',
  Frances: 'Francés',
  'Cola Cao energy': 'ColaCao Energy',
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
  Iberiquisimo: 'Iberiquísimo',
  'Gato Mallorquin': 'Gató mallorquí',
  'Expreso Martini': 'Espresso Martini',
  'Vaso leche': 'Vaso de leche',
  'Bola helado vainilla': 'Bola de helado de vainilla',
  'Copa whisky': 'Copa de whisky',
  'Copa de Ron': 'Copa de ron',
  'copa de Vodka': 'Copa de vodka',
  'copa Tequila': 'Copa de tequila',
  'Copa Baileys': 'Copa de Baileys',
  'Copa Vino Tinto': 'Copa de vino tinto',
  'Copa Vino Blanco': 'Copa de vino blanco',
  'Chupito Jack Daniels': 'Chupito de Jack Daniel\'s',
  'Chupito tequila': 'Chupito de tequila',
  Redbull: 'Red Bull',
  'Zumo Manzana': 'Zumo de manzana',
  'Zumo naranja': 'Zumo de naranja',
  'Zumo Piña': 'Zumo de piña',
  'Zumo Melocotón': 'Zumo de melocotón',
  'Napolitana crema y chocolate': 'Napolitana de crema y chocolate',
  'Tarta de Queso y Fresas': 'Tarta de queso y fresas',
  'Tarta Fresas y Nata': 'Tarta de fresas y nata',
  // El TPV los tiene en mayusculas sostenidas y desentonan con el resto.
  'ICE LATTE': 'Ice Latte',
  'ICE FLAT WHITE': 'Ice Flat White',
  'ICE MOCCA': 'Ice Mocca',
  'ICE AMERICANO': 'Ice Americano',
  'ICE CAPUCCINO': 'Ice Cappuccino',
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
  // El TPV escribe "florea" y a veces con una "о" cirilica dentro de "hibisco".
  [/florea de hibisc[oо]/gi, 'flores de hibisco'],
  [/\bgenjibre\b/gi, 'jengibre'],
  [/\bbaylies\b/gi, 'Baileys'],
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
  [/\byogurt\b/gi, 'yogur'],
  [/\bAgua caliente\b/g, 'agua caliente'],
];

const corregirDesc = (s) => ERRATAS_DESC.reduce((t, [re, a]) => t.replace(re, a), s);

/** El TPV se deja comas sin espacio detras ("surimi,mayonesa") en los 4 idiomas. */
const espaciarComas = (s) => s.replace(/,(?=[^\s\d])/g, ', ');

/**
 * Traducciones del TPV rehechas a mano. El export pasa nombres y descripciones
 * por un traductor automatico que deja palabras en castellano ("Espresso shot
 * with hielo picado") o cambia el sentido ("Para Picar" -> "To Chop"). Como las
 * erratas, esto se pierde en cuanto se reexporte la hoja: lo suyo es corregirlo
 * tambien en el TPV.
 *
 * Cuando los idiomas no decian lo mismo (avena en "Fit", copa de prosecco en
 * "Luxury"), manda el castellano, que es lo que escribio el cafe.
 */
const TRADUCCIONES = {
  // Desayunos
  Fit: {
    descripcion: {
      en: 'Yoghurt, peanut butter, fruit',
      de: 'Joghurt, Erdnussbutter, Obst',
      ca: 'Iogurt, crema de cacauet, fruita',
    },
  },
  Lupin: {
    descripcion: {
      en: 'Oats, chia, plant milk, yoghurt, dried fruit',
      de: 'Hafer, Chia, Pflanzenmilch, Joghurt, Trockenfrüchte',
      ca: 'Civada, xia, llet vegetal, iogurt, fruita seca',
    },
  },
  // La leche es vegetal (ver compliance/alergenos-revision.md); la hoja no lo dice.
  Overnight: {
    descripcion: {
      es: 'Avena, miel, leche vegetal, frutos secos',
      en: 'Oats, honey, plant milk, nuts',
      de: 'Hafer, Honig, Pflanzenmilch, Nüsse',
      ca: 'Civada, mel, llet vegetal, fruits secs',
    },
  },
  'Luxury (2 personas)': {
    descripcion: {
      es: 'Zumo de naranja, tabla de quesos y embutidos ibéricos, fruta, yogur y surtido de panes y bollería.',
      en: 'Orange juice, board of Iberian cheeses and cured meats, fruit, yoghurt and an assortment of breads and pastries.',
      de: 'Orangensaft, ein Brett mit iberischem Käse und Wurst, Obst, Joghurt und eine Auswahl an Brot und Gebäck.',
      ca: 'Suc de taronja, taula de formatges i embotits ibèrics, fruita, iogurt i assortiment de pans i brioixeria.',
    },
  },
  // Tostadas
  Hogwards: {
    descripcion: {
      en: 'Toast with roasted sobrasada, brie cheese and honey.',
      de: 'Toast mit gerösteter Sobrasada, Brie und Honig.',
      ca: 'Torrada de sobrassada rostida, formatge brie i mel.',
    },
  },
  Mandragora: {
    descripcion: { es: 'Tomate, mozzarella, balsámico, albahaca seca y orégano' },
  },
  Weasley: {
    descripcion: { de: 'Toast mit Marmelade und Butter' },
  },
  'Variedad de tostadas': {
    nombre: { en: 'Assorted toasts', de: 'Toast-Auswahl', ca: 'Varietat de torrades' },
    descripcion: {
      es: 'Variedad de tostadas (una de queso, una de atún, una de serrano y una vegetariana)',
      en: 'Assorted toasts (one cheese, one tuna, one Serrano ham and one vegetarian)',
      de: 'Toast-Auswahl (einer mit Käse, einer mit Thunfisch, einer mit Serrano-Schinken und einer vegetarisch)',
      ca: 'Varietat de torrades (una de formatge, una de tonyina, una de pernil serrà i una de vegetariana)',
    },
  },
  // Pa amb oli
  Ibérico: {
    descripcion: {
      en: 'Tomato, Serrano ham, cured loin, chorizo and salchichón of your choice',
      de: 'Tomate, Serrano-Schinken, Lomo, Chorizo und Salchichón nach Wahl',
      ca: 'Tomàquet, pernil serrà, llom, xoriço i salsitxó a triar',
    },
  },
  Lucius: {
    descripcion: {
      en: 'Tomato and cured meat of your choice',
      de: 'Tomate und Wurst nach Wahl',
    },
  },
  // Bocadillos
  Dobby: {
    descripcion: {
      es: 'Bocadillo en pan de bollo con el embutido que quieras.',
      en: 'Bun sandwich with the cured meat of your choice.',
      de: 'Brötchen-Sandwich mit Wurst nach Wahl.',
      ca: 'Entrepà de pa de brioix amb l\'embotit que vulguis.',
    },
  },
  'Medio Bocadillo': {
    descripcion: {
      es: 'Medio bocadillo a elegir',
      en: 'Half sandwich of your choice',
      de: 'Halbes Sandwich nach Wahl',
      ca: 'Mig entrepà a triar',
    },
  },
  // Poke bowls
  Ravenclaw: {
    descripcion: {
      en: 'Pieces of salmon or chicken, pickled onion, cucumber, carrot, corn, hoisin sauce',
      de: 'Lachs- oder Hähnchenstücke, eingelegte Zwiebeln, Gurke, Karotte, Mais, Hoisin-Sauce',
      ca: 'Trossos de salmó o pollastre, ceba adobada, cogombre, pastanaga, blat de moro, salsa hoisin',
    },
  },
  // Para picar
  Bellatrix: {
    descripcion: {
      en: 'Serrano ham, cured loin, chorizo, salchichón, fuet and pagès sausage',
      de: 'Serrano-Schinken, Lomo, Chorizo, Salchichón, Fuet und Landwurst',
      ca: 'Pernil serrà, llom, xoriço, salsitxó, fuet i llonganissa de pagès',
    },
  },
  Riddle: {
    descripcion: {
      en: 'Variety of cheeses, with bread',
      de: 'Verschiedene Käsesorten, mit Brot',
      ca: 'Varietat de formatges, amb pa',
    },
  },
  Incendio: {
    descripcion: {
      es: 'Totopos, queso, jalapeños, pollo y guacamole.',
      en: 'Tortilla chips, cheese, jalapeños, chicken and guacamole.',
      de: 'Tortillachips, Käse, Jalapeños, Hähnchen und Guacamole.',
      ca: 'Totopos, formatge, jalapenys, pollastre i guacamole.',
    },
  },
  Crounch: {
    descripcion: {
      en: 'American-style chicken wings (6 pieces)',
      de: 'Chicken Wings nach amerikanischer Art (6 Stück)',
      ca: 'Ales de pollastre a l\'estil americà (6 unitats)',
    },
  },
  // Dulces, tartas y bolleria
  Verrine: {
    descripcion: {
      en: 'Assorted desserts in small glasses',
      de: 'Verschiedene Desserts im Glas',
      ca: 'Postres variats en gotets',
    },
  },
  Daim: {
    descripcion: {
      es: 'Tarta sueca de avena, chocolate y almendras caramelizadas',
      en: 'Swedish cake with oats, chocolate and caramelised almonds',
      de: 'Schwedischer Kuchen mit Hafer, Schokolade und karamellisierten Mandeln',
      ca: 'Pastís suec de civada, xocolata i ametlles caramel·litzades',
    },
  },
  'Gato Mallorquin': {
    descripcion: {
      es: 'Bizcocho de almendra mallorquín',
      en: 'Mallorcan almond sponge cake',
      de: 'Mallorquinischer Mandelkuchen',
      ca: 'Pa de pessic d\'ametlla mallorquí',
    },
  },
  'Tarta entera': {
    nombre: { en: 'Whole cake', de: 'Ganze Torte', ca: 'Pastís sencer' },
    descripcion: {
      en: 'Whole cakes to order.',
      de: 'Ganze Torten auf Bestellung.',
      ca: 'Pastissos sencers per encàrrec.',
    },
  },
  'tarta Banoffee': {
    nombre: { en: 'Banoffee pie', de: 'Banoffee-Torte', ca: 'Pastís Banoffee' },
  },
  'Napolitana crema y chocolate': {
    nombre: {
      en: 'Cream and chocolate napolitana',
      de: 'Napolitana mit Creme und Schokolade',
      ca: 'Napolitana de crema i xocolata',
    },
  },
  // Cafes
  'Café con miel': {
    nombre: { en: 'Coffee with honey', de: 'Kaffee mit Honig', ca: 'Cafè amb mel' },
  },
  'Café Irlandés': {
    nombre: { en: 'Irish coffee', de: 'Irish Coffee', ca: 'Cafè irlandès' },
  },
  // "baylies" es Baileys. "Amazonas" se deja tal cual: es el licor que pone el
  // cafe y no hay con que contrastarlo; pendiente de confirmar con ellos.
  Carajillo: {
    descripcion: {
      es: 'Carga de espresso con Amazonas o Baileys',
      en: 'Espresso shot with Amazonas or Baileys',
      de: 'Espresso-Shot mit Amazonas oder Baileys',
      ca: 'Càrrega d\'espresso amb Amazonas o Baileys',
    },
  },
  Cortado: {
    descripcion: {
      en: 'Espresso shot with a little milk',
      de: 'Espresso-Shot mit wenig Milch',
    },
  },
  Latte: {
    descripcion: {
      en: 'Espresso shot with hot milk',
      de: 'Espresso-Shot mit heißer Milch',
      ca: 'Càrrega d\'espresso amb llet calenta',
    },
  },
  'Flat White': {
    descripcion: {
      en: 'Double espresso shot with hot milk',
      de: 'Doppelter Espresso-Shot mit heißer Milch',
      ca: 'Doble càrrega d\'espresso amb llet calenta',
    },
  },
  'Latte Macchiato': {
    descripcion: {
      en: 'Espresso shot with plenty of milk and milk foam',
      de: 'Espresso-Shot mit viel Milch und Milchschaum',
      ca: 'Càrrega d\'espresso amb molta llet i escuma de llet',
    },
  },
  Lungo: {
    descripcion: {
      en: 'Espresso diluted with plenty of water',
      de: 'Mit viel Wasser verlängerter Espresso',
      ca: 'Espresso rebaixat amb molta aigua',
    },
  },
  Mocca: {
    descripcion: {
      es: 'Café con chocolate líquido y leche',
      en: 'Coffee with liquid chocolate and milk',
      de: 'Kaffee mit flüssiger Schokolade und Milch',
      ca: 'Cafè amb xocolata líquida i llet',
    },
  },
  'Prensa francesa': {
    descripcion: {
      es: 'Café molido prensado con agua caliente',
      en: 'Ground coffee pressed with hot water',
      de: 'Gemahlener Kaffee, mit heißem Wasser aufgebrüht',
      ca: 'Cafè mòlt premsat amb aigua calenta',
    },
  },
  'ICE AMERICANO': {
    descripcion: {
      en: 'Espresso shot with ice and water',
      de: 'Espresso-Shot mit Eis und Wasser',
      ca: 'Càrrega d\'espresso amb gel i aigua',
    },
  },
  'ICE CAPUCCINO': {
    descripcion: {
      en: 'Espresso shot with crushed ice and milk foam',
      de: 'Espresso-Shot mit zerstoßenem Eis und Milchschaum',
      ca: 'Càrrega d\'espresso amb gel picat i escuma de llet',
    },
  },
  'ICE FLAT WHITE': {
    descripcion: {
      en: 'Double espresso shot with crushed ice and milk',
      de: 'Doppelter Espresso-Shot mit zerstoßenem Eis und Milch',
      ca: 'Doble càrrega d\'espresso amb gel picat i llet',
    },
  },
  'ICE LATTE': {
    descripcion: {
      en: 'Espresso shot with crushed ice and milk',
      de: 'Espresso-Shot mit zerstoßenem Eis und Milch',
      ca: 'Càrrega d\'espresso amb gel picat i llet',
    },
  },
  'ICE MOCCA': {
    descripcion: {
      es: 'Carga de espresso con chocolate, hielo picado y leche',
      en: 'Espresso shot with chocolate, crushed ice and milk',
      de: 'Espresso-Shot mit Schokolade, zerstoßenem Eis und Milch',
      ca: 'Càrrega d\'espresso amb xocolata, gel picat i llet',
    },
  },
  'Ice matcha': {
    descripcion: {
      es: 'Té matcha con hielo picado y leche o agua',
      en: 'Matcha tea with crushed ice and milk or water',
      de: 'Matcha-Tee mit zerstoßenem Eis und Milch oder Wasser',
      ca: 'Te matcha amb gel picat i llet o aigua',
    },
  },
  'Chai latte': {
    descripcion: {
      es: 'Té chai de chocolate o vainilla',
      en: 'Chai tea with chocolate or vanilla',
      de: 'Chai-Tee mit Schokolade oder Vanille',
      ca: 'Te chai de xocolata o vainilla',
    },
  },
  // Tes e infusiones
  'Te chai': {
    nombre: { en: 'Chai tea', de: 'Chai-Tee', ca: 'Te chai' },
  },
  'Te de granada': {
    nombre: { en: 'Pomegranate tea', de: 'Granatapfel-Tee', ca: 'Te de magrana' },
  },
  'Te frio': {
    nombre: { en: 'Iced tea', de: 'Eistee', ca: 'Te fred' },
    descripcion: {
      es: 'Té frío de manzana',
      en: 'Apple iced tea',
      de: 'Apfel-Eistee',
      ca: 'Te fred de poma',
    },
  },
  'Té gengibre y limon': {
    nombre: {
      en: 'Ginger and lemon tea',
      de: 'Ingwer-Zitronen-Tee',
      ca: 'Te de gingebre i llimona',
    },
  },
  'Té Matcha': {
    nombre: { en: 'Matcha tea', de: 'Matcha-Tee', ca: 'Te matcha' },
    descripcion: {
      es: 'Té verde matcha con leche o agua',
      en: 'Matcha green tea with milk or water',
      de: 'Matcha-Grüntee mit Milch oder Wasser',
      ca: 'Te verd matcha amb llet o aigua',
    },
  },
  'Té Tropical': {
    nombre: { en: 'Tropical tea', de: 'Tropischer Tee', ca: 'Te tropical' },
    descripcion: {
      es: 'Té blanco, té verde, hojas de zarzamora, chips de plátano, trozos de mango, trozos de piña, hojas de estevia.',
      en: 'White tea, green tea, blackberry leaves, banana chips, mango pieces, pineapple pieces, stevia leaves.',
      de: 'Weißer Tee, grüner Tee, Brombeerblätter, Bananenchips, Mangostücke, Ananasstücke, Steviablätter.',
      ca: 'Te blanc, te verd, fulles d\'esbarzer, xips de plàtan, trossos de mango, trossos de pinya, fulles d\'estèvia.',
    },
  },
  'Té de Almendra y Canela': {
    nombre: {
      en: 'Almond and cinnamon tea',
      de: 'Mandel-Zimt-Tee',
      ca: 'Te d\'ametlla i canyella',
    },
  },
  'Té de Manzana Asada y Canela': {
    nombre: {
      en: 'Baked apple and cinnamon tea',
      de: 'Bratapfel-Zimt-Tee',
      ca: 'Te de poma al forn i canyella',
    },
    descripcion: {
      en: 'Apple pieces, hibiscus flowers, grapes, cinnamon, sunflower petals, vanilla extract.',
      de: 'Apfelstücke, Hibiskusblüten, Trauben, Zimt, Sonnenblumenblüten, Vanilleextrakt.',
      ca: 'Trossos de poma, flors d\'hibisc, raïm, canyella, pètals de gira-sol, extracte de vainilla.',
    },
  },
  'Té de Frutos de invierno': {
    nombre: {
      en: 'Winter fruits tea',
      de: 'Winterfrüchte-Tee',
      ca: 'Te de fruits d\'hivern',
    },
    descripcion: {
      es: 'Trozos de manzana, flores de hibisco, almendras picadas, canela, rooibos, cáscara de rosa mosqueta, vainilla.',
      en: 'Apple pieces, hibiscus flowers, chopped almonds, cinnamon, rooibos, rosehip peel, vanilla.',
      de: 'Apfelstücke, Hibiskusblüten, gehackte Mandeln, Zimt, Rooibos, Hagebuttenschalen, Vanille.',
      ca: 'Trossos de poma, flors d\'hibisc, ametlles picades, canyella, rooibos, pell de rosa mosqueta, vainilla.',
    },
  },
  // Bebidas
  Appleshorle: {
    descripcion: {
      es: 'Refresco de agua con gas y zumo de manzana',
      en: 'Sparkling water with apple juice',
      de: 'Sprudelwasser mit Apfelsaft',
      ca: 'Aigua amb gas amb suc de poma',
    },
  },
  Caña: {
    nombre: { en: 'Draught beer', de: 'Bier vom Fass', ca: 'Canya' },
  },
  'Chocolate Caliente': {
    descripcion: {
      en: 'Thick drinking chocolate',
      de: 'Trinkschokolade',
      ca: 'Xocolata desfeta',
    },
  },
  'Cola Cao energy': {
    descripcion: {
      en: 'Ready-made chocolate milk in a bottle',
      de: 'Fertige Schokomilch in der Flasche',
      ca: 'Batut de xocolata amb llet en ampolla',
    },
  },
  'Fanta Limón': {
    nombre: { en: 'Fanta Lemon', de: 'Fanta Zitrone', ca: 'Fanta de llimona' },
  },
  'Fanta Naranja': {
    nombre: { en: 'Fanta Orange', de: 'Fanta Orange', ca: 'Fanta de taronja' },
  },
  Limonada: {
    nombre: { en: 'Lemonade', de: 'Limonade', ca: 'Llimonada' },
  },
  'Ginger Ale': {
    descripcion: {
      en: 'Orange and ginger soft drink',
      de: 'Orangen-Ingwer-Limonade',
      ca: 'Refresc de taronja i gingebre',
    },
  },
  Shandy: {
    descripcion: {
      es: 'Cerveza con Fanta de limón',
      en: 'Beer with Fanta Lemon',
      de: 'Bier mit Fanta Zitrone',
      ca: 'Cervesa amb Fanta de llimona',
    },
  },
  Spezie: {
    descripcion: {
      es: 'Cola con Fanta de naranja',
      en: 'Cola with Fanta Orange',
      de: 'Cola mit Fanta Orange',
      ca: 'Cola amb Fanta de taronja',
    },
  },
  'Tinto de Verano': {
    descripcion: {
      es: 'Vino tinto con Fanta de limón',
      en: 'Red wine with Fanta Lemon',
      de: 'Rotwein mit Fanta Zitrone',
      ca: 'Vi negre amb Fanta de llimona',
    },
  },
  Tónica: {
    nombre: { en: 'Tonic water', de: 'Tonic Water', ca: 'Tònica' },
  },
  'Vaso leche': {
    nombre: { en: 'Glass of milk', de: 'Glas Milch', ca: 'Got de llet' },
  },
  // Licores. "Hierbas" es el licor mallorquin: el nombre no se traduce.
  'Hierbas secas': {
    nombre: {
      en: 'Dry hierbas liqueur',
      de: 'Trockener Hierbas-Likör',
      ca: 'Herbes seques',
    },
  },
  'Hierbas mezcladas': {
    nombre: {
      en: 'Mixed hierbas liqueur',
      de: 'Gemischter Hierbas-Likör',
      ca: 'Herbes mesclades',
    },
  },
  'Hierbas dulces': {
    nombre: {
      en: 'Sweet hierbas liqueur',
      de: 'Süßer Hierbas-Likör',
      ca: 'Herbes dolces',
    },
  },
  'Copa whisky': {
    nombre: { en: 'Glass of whisky', de: 'Glas Whisky', ca: 'Copa de whisky' },
  },
  'Copa de Ron': {
    nombre: { en: 'Glass of rum', de: 'Glas Rum', ca: 'Copa de rom' },
  },
  'copa de Vodka': {
    nombre: { en: 'Glass of vodka', de: 'Glas Wodka', ca: 'Copa de vodka' },
  },
  'copa Tequila': {
    nombre: { en: 'Glass of tequila', de: 'Glas Tequila', ca: 'Copa de tequila' },
  },
  'Copa Baileys': {
    nombre: { en: 'Glass of Baileys', de: 'Glas Baileys', ca: 'Copa de Baileys' },
  },
  'Copa Vino Tinto': {
    nombre: { en: 'Glass of red wine', de: 'Glas Rotwein', ca: 'Copa de vi negre' },
  },
  'Copa Vino Blanco': {
    nombre: { en: 'Glass of white wine', de: 'Glas Weißwein', ca: 'Copa de vi blanc' },
  },
  'Chupito Jack Daniels': {
    nombre: {
      en: 'Jack Daniel\'s shot',
      de: 'Jack Daniel\'s Shot',
      ca: 'Xopet de Jack Daniel\'s',
    },
  },
  'Chupito tequila': {
    nombre: { en: 'Tequila shot', de: 'Tequila-Shot', ca: 'Xopet de tequila' },
  },
  // Combinados
  '43 + Leche': {
    nombre: { en: '43 + milk', de: '43 + Milch', ca: '43 + llet' },
  },
  'Jack Daniels manzana + Refresco': {
    nombre: {
      es: 'Jack Daniel\'s Apple + Refresco',
      en: 'Jack Daniel\'s Apple + soft drink',
      de: 'Jack Daniel\'s Apple + Softdrink',
      ca: 'Jack Daniel\'s Apple + refresc',
    },
  },
  // Cocteles
  'Expreso Martini': {
    descripcion: {
      en: 'Coffee liqueur, vodka, sugar and an espresso shot',
      de: 'Kaffeelikör, Wodka, Zucker und ein Espresso-Shot',
    },
  },
};
// "Skabers" y "skabers" son la misma fila segun como la exporte el TPV.
TRADUCCIONES.Skabers = TRADUCCIONES.skabers = {};

/** El TPV solo traduce la marca de los combinados y deja "Refresco" en castellano. */
const REFRESCO = { es: 'Refresco', en: 'soft drink', de: 'Softdrink', ca: 'refresc' };

/**
 * Nombre de categoria corregido por idioma. El TPV traduce "Para Picar" como
 * "To Chop" / "Zum Hacken", que es cortar en trozos, no picar algo de comer.
 */
const CATEGORIAS_TRADUCIDAS = {
  Tostadas: { en: 'Toasts', de: 'Toasts' },
  Bocadillos: { en: 'Filled rolls', de: 'Belegte Brötchen' },
  Sandwich: { es: 'Sándwiches', en: 'Sandwiches', de: 'Sandwiches', ca: 'Sandvitxos' },
  'Para Picar': { en: 'To share', de: 'Zum Teilen' },
  'Tartas y bolleria': { es: 'Tartas y bollería', ca: 'Pastissos i brioixeria' },
  Cafés: { en: 'Coffees', de: 'Kaffees' },
  Combinados: { en: 'Mixed drinks', de: 'Longdrinks' },
  Cocteles: { es: 'Cócteles', en: 'Cocktails', de: 'Cocktails', ca: 'Còctels' },
};

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

const slug = (s) => s.toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Precio del TPV a numero. Acepta coma o punto decimal. El TPV marca los
 * productos gratuitos con la palabra "Gratis", que aqui es un 0 real; lo que no
 * se pueda leer queda a null y la carta lo muestra como "Consultar".
 */
function precioDe(celda) {
  const texto = limpiar(celda);
  if (/^gratis$/i.test(texto)) return 0;
  const n = Number(texto.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Alergenos declarados de un producto, como codigos del anexo II y en el orden
 * de la norma. Devuelve [] cuando el cafe ha declarado "Ninguno" y null cuando
 * la celda esta vacia, que no es lo mismo: sin dato la carta no afirma nada.
 */
function alergenosDe(celda, nombre) {
  const corregidos = ALERGENOS_CORREGIDOS[nombre];
  if (corregidos) return [...corregidos].sort((a, b) => ALERGENOS.indexOf(a) - ALERGENOS.indexOf(b));

  const texto = limpiar(celda);
  if (!texto) return null;
  if (sinTildes(texto) === NINGUN_ALERGENO) return [];

  const codigos = new Set();
  for (const trozo of texto.split(/[,;]/)) {
    const clave = sinTildes(limpiar(trozo));
    if (!clave) continue;
    const codigo = ALERGENO_POR_TEXTO[clave];
    if (!codigo) throw new Error(`Alergeno desconocido en "${nombre}": "${trozo.trim()}"`);
    codigos.add(codigo);
  }
  return ALERGENOS.filter((a) => codigos.has(a));
}

const categorias = leer('Categorías.csv');
const productos = leer('Productos.csv');

// Nombre de categoria por idioma, indexado por su nombre en castellano.
const categoriaPorIdioma = new Map(
  categorias.map((f) => {
    const base = limpiar(f[1]);
    const nombres = Object.fromEntries(
      IDIOMAS.map((l) => [l, limpiar(f[COLUMNAS_CATEGORIA[l]]) || base]),
    );
    return [base, { ...nombres, ...CATEGORIAS_TRADUCIDAS[base] }];
  }),
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
    // Las erratas solo se corrigen en castellano; el resto sale de TRADUCCIONES.
    descripciones[l] = d ? espaciarComas(capitalizar(l === 'es' ? corregirDesc(d) : d)) : null;
  }
  // El nombre propio (Hedwig, Voldemort) no se traduce: se aplica la errata a todos.
  if (ERRATAS[base]) for (const l of IDIOMAS) {
    if (nombres[l].toLowerCase() === base.toLowerCase()) nombres[l] = ERRATAS[base];
  }
  // Combinados: el TPV deja "Refresco" sin traducir detras de la marca.
  const marca = /\+\s*refrescos?$/i.test(base) && base.replace(/\s*\+\s*refrescos?$/i, '');
  if (marca) for (const l of IDIOMAS) nombres[l] = `${marca} + ${REFRESCO[l]}`;

  const traduccion = TRADUCCIONES[base];
  if (traduccion?.nombre) Object.assign(nombres, traduccion.nombre);
  if (traduccion?.descripcion) Object.assign(descripciones, traduccion.descripcion);

  agrupados.get(categoria).push({
    // Los productos dados de alta a mano en el TPV salen sin Id en el export.
    id: limpiar(fila[0]) || slug(base),
    nombre: nombres,
    descripcion: descripciones,
    precio: precioDe(fila[COLUMNA_PRECIO]),
    alergenos: alergenosDe(fila[COLUMNA_ALERGENOS], base),
    sinGluten,
  });
}

// Sin fecha de generacion a proposito: haria que el fichero cambiase cada dia
// y el paso de CI que comprueba que esta al dia fallaria siempre.
const menu = {
  idiomas: IDIOMAS,
  avisoPrecios: 'Precios pendientes de recibir del cafe.',
  categorias: ORDEN.map((c) => ({
    id: slug(c),
    nombre: categoriaPorIdioma.get(c) ?? Object.fromEntries(IDIOMAS.map((l) => [l, c])),
    productos: agrupados.get(c).sort((a, b) => a.nombre.es.localeCompare(b.nombre.es, 'es')),
  })).filter((c) => c.productos.length),
};

writeFileSync(join(RAIZ, 'src', 'content', 'menu.json'), JSON.stringify(menu, null, 2) + '\n');

const total = menu.categorias.reduce((n, c) => n + c.productos.length, 0);
console.log(`${total} productos en ${menu.categorias.length} categorias`);
for (const c of menu.categorias) console.log(`  ${c.nombre.es.padEnd(20)} ${c.productos.length}`);
if (sinCategoria.length) console.log(`\nSIN CATEGORIA (${sinCategoria.length}): ${sinCategoria.join(', ')}`);

const todos = menu.categorias.flatMap((c) => c.productos);

const sinPrecio = todos.filter((p) => p.precio == null);
if (sinPrecio.length) {
  console.log(`\nSIN PRECIO (${sinPrecio.length}): ${sinPrecio.map((p) => p.nombre.es).join(', ')}`);
}

const sinAlergenos = todos.filter((p) => p.alergenos == null);
if (sinAlergenos.length) {
  console.log(`\nSIN ALERGENOS (${sinAlergenos.length}): ${sinAlergenos.map((p) => p.nombre.es).join(', ')}`);
}
