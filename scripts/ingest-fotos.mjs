/**
 * Prepara las fotos que manda el cafe (movil, HEIC de iPhone, 1-7 MB cada una)
 * para que scripts/optimize-images.mjs pueda trabajar con ellas:
 *
 *   assets-origen/fotos-crudas/  ->  assets-origen/fotos/<nombre>.jpg
 *
 * Que hace falta hacer aqui y no en el otro script:
 *
 * - HEIC: sharp lee la cabecera pero no descomprime HEVC, asi que se descodifica
 *   con heic-convert (libde265 compilado a wasm) antes de pasarselo.
 * - Peso: los crudos ocupan ~68 MB y el repositorio no los guarda (van en
 *   .gitignore, la copia buena esta en el Drive del cafe). Lo que si se guarda
 *   es esta version de 1600 px, que sobra para cualquier hueco de la web.
 * - Datos personales: una foto de movil lleva EXIF con las coordenadas del
 *   local y la hora exacta. sharp no copia los metadatos salvo que se le pida,
 *   asi que la version que se publica sale limpia.
 * - Nombres: los de camara no dicen nada. assets-origen/fotos-nombres.json
 *   traduce cada uno y ademas deja por escrito que fotos no se usan y por que.
 */
import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import convert from 'heic-convert';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CRUDAS = join(RAIZ, 'assets-origen', 'fotos-crudas');
const DESTINO = join(RAIZ, 'assets-origen', 'fotos');
const MAPA = join(RAIZ, 'assets-origen', 'fotos-nombres.json');

/** Ancho o alto mayor. El hueco mas grande de la web es el hero a 1080. */
const LADO_MAYOR = 1600;

const { nombres, descartadas } = JSON.parse(readFileSync(MAPA, 'utf8'));

mkdirSync(DESTINO, { recursive: true });

/** heic-convert descodifica; sharp no sabe. El resto lo lee sharp directamente. */
async function leer(ruta) {
  const buffer = readFileSync(ruta);
  if (!/\.heic$/i.test(ruta)) return buffer;
  return Buffer.from(await convert({ buffer, format: 'JPEG', quality: 1 }));
}

const crudas = readdirSync(CRUDAS).filter((f) => /\.(heic|jpe?g|png)$/i.test(f));
const sinNombre = [];
let hechas = 0, totalOrigen = 0, totalDestino = 0;

for (const archivo of crudas) {
  if (descartadas[archivo]) continue;
  const nombre = nombres[archivo];
  if (!nombre) { sinNombre.push(archivo); continue; }

  const entrada = join(CRUDAS, archivo);
  const salida = join(DESTINO, `${nombre}.jpg`);
  const info = await sharp(await leer(entrada))
    .rotate() // aplica la orientacion del EXIF antes de tirarlo
    .resize(LADO_MAYOR, LADO_MAYOR, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(salida);

  totalOrigen += statSync(entrada).size;
  totalDestino += info.size;
  hechas++;
}

const kb = (n) => `${Math.round(n / 1024)} KB`;

console.log(`${hechas} fotos preparadas en assets-origen/fotos/`);
console.log(`crudas ${kb(totalOrigen)} -> originales de trabajo ${kb(totalDestino)}`);
if (Object.keys(descartadas).length) {
  console.log(`${Object.keys(descartadas).length} descartadas a proposito (ver fotos-nombres.json)`);
}
// Una foto nueva en el Drive no se cuela sin nombre: o se le pone, o se
// descarta por escrito. Si no, acabaria en la web como IMG_0640.
if (sinNombre.length) {
  console.error(`\nSin nombre en fotos-nombres.json:\n  ${sinNombre.join('\n  ')}`);
  process.exitCode = 1;
}
