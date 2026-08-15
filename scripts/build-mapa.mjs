/**
 * Genera assets-origen/mapa/mapa.jpg: una imagen del mapa alrededor del cafe,
 * armada con teselas de OpenStreetMap.
 *
 * Por que una imagen y no el iframe de Google Maps: el iframe manda la IP del
 * visitante a Google y escribe en su navegador antes de que consienta nada
 * (art. 22.2 LSSI), asi que habia que pedirle permiso con un boton. Con la
 * imagen, el mapa se ve al entrar, no sale ni una peticion a terceros y la web
 * sigue sin necesitar banner. Quien quiera llegar hasta aqui pulsa y se va a
 * Google Maps, que es una visita suya a otro sitio.
 *
 * Las teselas se descargan una vez y el jpg se guarda en el repositorio: la
 * politica de uso de OSM no admite que un build las pida en cada despliegue.
 * Solo hay que volver a ejecutarlo si cambia la direccion del cafe.
 *
 *   npm run mapa && npm run imagenes
 *
 * La atribucion a OpenStreetMap (ODbL) va quemada en la esquina de la imagen y
 * repetida como enlace bajo el mapa: si la foto se comparte suelta, tiene que
 * seguir diciendo de donde sale.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import negocio from '../src/content/business.json' with { type: 'json' };

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'assets-origen', 'mapa');

/**
 * Zoom 17: unos 0,9 m por pixel a esta latitud, o sea algo menos de un
 * kilometro de ancho. Se ven los nombres de las calles de alrededor, que es lo
 * que hace falta para situarse, sin que el cafe quede en un punto perdido.
 */
const ZOOM = 17;
const TESELA = 256;

/** 1080x760 es el ancho mayor que sirve la web y una proporcion parecida a las fotos. */
const ANCHO = 1080;
const ALTO = 760;

/** La politica de uso de OSM exige identificar a quien pide las teselas. */
const AGENTE = 'cafediagon-build/1.0 (+https://github.com/adrianhruiz/cafediagon)';

const { lat, lng } = negocio.geo;

/** Coordenadas del mapa deslizante: grados a pixeles globales de este zoom. */
function aPixeles(latitud, longitud, zoom) {
  const n = 2 ** zoom;
  const rad = (latitud * Math.PI) / 180;
  const x = ((longitud + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x: x * TESELA, y: y * TESELA };
}

const centro = aPixeles(lat, lng, ZOOM);
const izquierda = Math.round(centro.x - ANCHO / 2);
const arriba = Math.round(centro.y - ALTO / 2);

const primeraX = Math.floor(izquierda / TESELA);
const primeraY = Math.floor(arriba / TESELA);
const ultimaX = Math.floor((izquierda + ANCHO - 1) / TESELA);
const ultimaY = Math.floor((arriba + ALTO - 1) / TESELA);

async function bajarTesela(x, y) {
  const url = `https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`;
  const respuesta = await fetch(url, { headers: { 'User-Agent': AGENTE } });
  if (!respuesta.ok) throw new Error(`${url} devolvio ${respuesta.status}`);
  return Buffer.from(await respuesta.arrayBuffer());
}

// De una en una y no en paralelo: son 20 teselas y el servidor de OSM lo presta
// gratis. No hay ninguna prisa que justifique abrirle 20 conexiones.
const piezas = [];
for (let y = primeraY; y <= ultimaY; y += 1) {
  for (let x = primeraX; x <= ultimaX; x += 1) {
    piezas.push({
      input: await bajarTesela(x, y),
      left: (x - primeraX) * TESELA,
      top: (y - primeraY) * TESELA,
    });
  }
}

const mosaico = await sharp({
  create: {
    width: (ultimaX - primeraX + 1) * TESELA,
    height: (ultimaY - primeraY + 1) * TESELA,
    channels: 3,
    background: '#ffffff',
  },
})
  .composite(piezas)
  .png()
  .toBuffer();

const recorte = await sharp(mosaico)
  .extract({
    left: izquierda - primeraX * TESELA,
    top: arriba - primeraY * TESELA,
    width: ANCHO,
    height: ALTO,
  })
  .png()
  .toBuffer();

/** Chincheta en el centro, en el cobre de la web, y sombra para que se vea sobre cualquier tesela. */
const chincheta = Buffer.from(`
<svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${ANCHO / 2}, ${ALTO / 2})">
    <path d="M0 6 C -14 -14, -22 -22, -22 -34 A 22 22 0 1 1 22 -34 C 22 -22, 14 -14, 0 6 Z"
          fill="#8c5a2b" stroke="#fdf8f0" stroke-width="3" stroke-linejoin="round" />
    <circle cx="0" cy="-34" r="8" fill="#fdf8f0" />
  </g>
</svg>`);

/** La atribucion de OSM viaja dentro de la imagen, no solo en el HTML. */
const credito = Buffer.from(`
<svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${ANCHO - 268}" y="${ALTO - 30}" width="268" height="30" fill="#ffffff" fill-opacity="0.8" />
  <text x="${ANCHO - 10}" y="${ALTO - 10}" text-anchor="end"
        font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#202227">
    © OpenStreetMap contributors
  </text>
</svg>`);

mkdirSync(DESTINO, { recursive: true });
const salida = join(DESTINO, 'mapa.jpg');

// Calidad alta aqui porque esto es el original: quien lo recomprime de verdad,
// y con los ajustes medidos, es scripts/optimize-images.mjs.
const info = await sharp(recorte)
  .composite([{ input: chincheta }, { input: credito }])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(salida);

console.log(`mapa ${ANCHO}x${ALTO} en zoom ${ZOOM} sobre ${lat}, ${lng}`);
console.log(`${piezas.length} teselas -> ${salida} (${Math.round(info.size / 1024)} KB)`);
console.log('siguiente paso: npm run imagenes');
