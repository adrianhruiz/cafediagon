/**
 * Genera public/images/ a partir de assets-origen/: webp para navegadores
 * modernos y jpg de respaldo, en los anchos que la web pide de verdad.
 *
 * Los originales de Instagram pesan ~750 KB cada uno; servirlos tal cual
 * arruinaria el Lighthouse en movil.
 */
import { mkdirSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'assets-origen');
const DESTINO = join(RAIZ, 'public', 'images');

/** Anchos servidos por srcset. El hero necesita mas que una miniatura. */
const ANCHOS = { hero: [800, 1400, 2000], normal: [400, 800, 1200], logo: [96, 192] };

const HEROES = new Set(['17-DEx8Xqxsd16', '06-DJEJYueMzZM', '21-DEnfYHEMvoF']);

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

    for (const [ext, opts] of [['webp', { quality: 80 }], ['jpg', { quality: 82, mozjpeg: true }]]) {
      const archivo = `${nombre}-${w}.${ext}`;
      const info = ext === 'webp'
        ? await base.clone().webp(opts).toFile(join(DESTINO, archivo))
        : await base.clone().jpeg(opts).toFile(join(DESTINO, archivo));
      totalDestino += info.size;
      if (ext === 'webp') salidas.push({ w, archivo, alto: info.height });
    }
  }

  generados[nombre] = {
    anchos: salidas.map((s) => s.w),
    ratio: +(meta.width / meta.height).toFixed(4),
    mayor: salidas.at(-1)?.archivo ?? null,
  };
}

const kb = (n) => `${Math.round(n / 1024)} KB`;

await procesar(join(ORIGEN, 'logo-hd.jpg'), 'logo', ANCHOS.logo, { cuadrado: true });

for (const archivo of readdirSync(join(ORIGEN, 'posts')).filter((f) => f.endsWith('.jpg'))) {
  const nombre = basename(archivo, '.jpg');
  await procesar(join(ORIGEN, 'posts', archivo), nombre,
    HEROES.has(nombre) ? ANCHOS.hero : ANCHOS.normal);
}

writeFileSync(join(RAIZ, 'src', 'content', 'imagenes.json'),
  JSON.stringify(generados, null, 2) + '\n');

console.log(`${Object.keys(generados).length} imagenes procesadas`);
console.log(`originales ${kb(totalOrigen)} -> derivados ${kb(totalDestino)}`);
