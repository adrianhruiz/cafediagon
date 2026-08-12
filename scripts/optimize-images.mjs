/**
 * Genera public/images/ a partir de assets-origen/: avif y webp para
 * navegadores modernos y jpg de respaldo, en los anchos que la web pide
 * de verdad.
 *
 * Los originales de Instagram pesan ~750 KB cada uno; servirlos tal cual
 * arruinaria el Lighthouse en movil.
 *
 * El orden de FORMATOS es el de preferencia del navegador: <picture> se queda
 * con el primero que entienda, asi que avif va delante de webp y el jpg solo
 * lo ve quien no entienda ninguno de los dos.
 */
import { mkdirSync, readdirSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'assets-origen');
const DESTINO = join(RAIZ, 'public', 'images');

/**
 * Anchos servidos por srcset, segun lo grande que se vea cada foto:
 *
 * - fondo: la del hero, a ancho de pantalla pero al 55% de opacidad y debajo
 *   de un velo oscuro. Ampliar 800 hasta 1920 no se nota ahi, y un ancho mas
 *   seria el archivo mas pesado de toda la primera pantalla.
 * - destacada: las de "El cafe" y "Juegos", que se ven a media pagina y nitidas.
 *   Con 1080 (el ancho original) una pantalla retina deja de estirarlas.
 * - normal: miniaturas de galeria, como mucho a 400 CSS px.
 *
 * Los anchos mayores que el original se descartan solos al generar.
 */
const ANCHOS = { fondo: [800], destacada: [400, 800, 1080], normal: [400, 800], logo: [96, 192] };

const FONDOS = new Set(['17-DEx8Xqxsd16']);
const DESTACADAS = new Set(['06-DJEJYueMzZM', '21-DEnfYHEMvoF']);

const anchosDe = (nombre) => {
  if (FONDOS.has(nombre)) return ANCHOS.fondo;
  if (DESTACADAS.has(nombre)) return ANCHOS.destacada;
  return ANCHOS.normal;
};

/**
 * Calidades elegidas mirando el resultado, no por defecto:
 * - avif 50 se ve igual que webp 80 y pesa alrededor de la mitad.
 * - webp sube a effort 6 y submuestreo inteligente: mismo peso, menos artefactos
 *   en los bordes de color (las fotos tienen mucho rojo y madera).
 * - mozjpeg solo lo carga quien no soporta ninguno de los otros dos.
 */
const FORMATOS = [
  { ext: 'avif', tipo: 'image/avif', aplicar: (img) => img.avif({ quality: 50, effort: 4 }) },
  { ext: 'webp', tipo: 'image/webp', aplicar: (img) => img.webp({ quality: 78, effort: 6, smartSubsample: true }) },
  { ext: 'jpg', tipo: 'image/jpeg', aplicar: (img) => img.jpeg({ quality: 80, mozjpeg: true }) },
];

// Se regenera entera: si cambian los anchos, los derivados viejos se quedarian
// ocupando sitio en el repo y en el despliegue sin que nadie los pida.
rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

const generados = {};
let totalOrigen = 0, totalDestino = 0;

async function procesar(rutaEntrada, nombre, anchos, { cuadrado = false } = {}) {
  const meta = await sharp(rutaEntrada).metadata();
  totalOrigen += statSync(rutaEntrada).size;
  const salidas = [];

  for (const w of anchos) {
    if (w > meta.width * 1.05) continue; // no ampliar
    let base = sharp(rutaEntrada).rotate();
    base = cuadrado
      ? base.resize(w, w, { fit: 'cover', position: 'attention' })
      : base.resize(w, null, { withoutEnlargement: true });

    for (const { ext, aplicar } of FORMATOS) {
      const archivo = `${nombre}-${w}.${ext}`;
      const info = await aplicar(base.clone()).toFile(join(DESTINO, archivo));
      totalDestino += info.size;
      if (ext === 'webp') salidas.push({ w, archivo });
    }
  }

  generados[nombre] = {
    anchos: salidas.map((s) => s.w),
    ratio: +(meta.width / meta.height).toFixed(4),
  };
}

const kb = (n) => `${Math.round(n / 1024)} KB`;

await procesar(join(ORIGEN, 'logo-hd.jpg'), 'logo', ANCHOS.logo, { cuadrado: true });

// posts/: lo que estaba publicado en Instagram. fotos/: lo que manda el cafe
// por Drive, ya preparado por scripts/ingest-fotos.mjs.
for (const carpeta of ['posts', 'fotos']) {
  for (const archivo of readdirSync(join(ORIGEN, carpeta)).filter((f) => f.endsWith('.jpg'))) {
    const nombre = basename(archivo, '.jpg');
    if (generados[nombre]) throw new Error(`Dos originales se llaman ${nombre}`);
    await procesar(join(ORIGEN, carpeta, archivo), nombre, anchosDe(nombre));
  }
}

// Este json viaja dentro del bundle, asi que la lista de formatos va una sola
// vez arriba y no repetida en cada una de las 66 imagenes.
writeFileSync(join(RAIZ, 'src', 'content', 'imagenes.json'),
  JSON.stringify({ formatos: FORMATOS.map(({ ext, tipo }) => ({ ext, tipo })), imagenes: generados }, null, 2) + '\n');

console.log(`${Object.keys(generados).length} imagenes procesadas`);
console.log(`originales ${kb(totalOrigen)} -> derivados ${kb(totalDestino)}`);
