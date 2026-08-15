/**
 * Convierte el dist/ que deja vite en doce paginas estaticas: cuatro idiomas
 * por tres documentos (portada, aviso legal y privacidad).
 *
 * Por que hace falta
 * ------------------
 * La web se pintaba entera con JavaScript, asi que el fichero que se servia
 * era un <div id="root"> vacio. Googlebot ejecuta JavaScript, pero en una
 * segunda pasada y con retraso; Bing, DuckDuckGo, los previsualizadores de
 * WhatsApp y los rastreadores de las IA no lo ejecutan y se quedaban con nada.
 * De la carta, la galeria o el horario no veian una palabra.
 *
 * Aqui se pinta cada pagina con react-dom/static, se mete el resultado dentro
 * del div y se reescribe el <head> con lo que le toca a esa pagina: su idioma,
 * su titulo, su canonica y los hreflang de sus hermanas.
 *
 * Como
 * ----
 * Los componentes importan .css y .json y usan JSX: en Node pelado no se
 * cargan. Se carga el modulo por el pipeline SSR de vite, que es el mismo que
 * transforma el codigo en el servidor de desarrollo.
 *
 *   npm run build   ->  vite build && node scripts/prerender.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');

/**
 * Codigo de idioma tal y como lo quiere Open Graph: idioma_PAIS. Es lo unico
 * que no se puede sacar de la lista de idiomas, porque el pais no esta ahi.
 */
const LOCALES = { es: 'es_ES', en: 'en_GB', de: 'de_DE', ca: 'ca_ES' };

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  // El prerender no sirve nada: solo transforma modulos para pintarlos aqui.
  logLevel: 'warn',
});

const {
  pintar, metaDe, urlAbsoluta, ruta, RUTAS, IDIOMAS, IDIOMA_POR_DEFECTO, PORTADA,
} = await vite.ssrLoadModule('/src/entrada-servidor.jsx');

const plantilla = readFileSync(join(DIST, 'index.html'), 'utf8');

/** Escapa lo que va dentro de un atributo HTML entre comillas dobles. */
const atributo = (texto) => String(texto)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * La canonica de esta pagina y los hreflang de las cuatro traducciones.
 *
 * x-default es la castellana: es la que se sirve en la direccion sin prefijo,
 * o sea la que le toca a quien llega sin que ningun hreflang le encaje.
 */
function enlacesDe(idioma, pagina) {
  const alternativas = IDIOMAS.map((codigo) =>
    `  <link rel="alternate" hreflang="${codigo}" href="${urlAbsoluta(codigo, pagina)}" />`);
  return [
    `  <link rel="canonical" href="${urlAbsoluta(idioma, pagina)}" />`,
    ...alternativas,
    `  <link rel="alternate" hreflang="x-default" href="${urlAbsoluta(IDIOMA_POR_DEFECTO, pagina)}" />`,
  ].join('\n');
}

/**
 * La ficha del negocio solo va en las cuatro portadas: el aviso legal y la
 * privacidad no son la pagina que describe el cafe, y repetirla ahi solo mete
 * ruido. Las cuatro comparten @id, que es lo que dice que hablan del mismo
 * negocio, y cada una declara su propia direccion y su descripcion traducida.
 */
function fichaDe(html, idioma, pagina, descripcion) {
  const bloque = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;
  if (pagina !== PORTADA) return html.replace(bloque, '').replace(/\n\s*\n\s*\n/g, '\n\n');

  return html.replace(bloque, (_, abre, json, cierra) => {
    const ficha = JSON.parse(json);
    ficha.url = urlAbsoluta(idioma, PORTADA);
    if (descripcion) ficha.description = descripcion;
    return `${abre}\n  ${JSON.stringify(ficha, null, 2).replace(/\n/g, '\n  ')}\n  ${cierra}`;
  });
}

/** Cambia el content de una etiqueta que ya existe en la plantilla. */
const meta = (html, clave, valor) => html.replace(
  new RegExp(`(<meta\\s+(?:property|name)="${clave}"\\s+content=")[^"]*(")`),
  `$1${atributo(valor)}$2`,
);

let escritas = 0;

for (const { idioma, pagina } of RUTAS) {
  const { titulo, descripcion, imagenAlt } = metaDe(idioma, pagina);
  const cuerpo = await pintar(idioma, pagina);

  let html = plantilla
    .replace(/<html lang="[^"]*"/, `<html lang="${idioma}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${atributo(titulo)}</title>`)
    .replace(/  <link rel="canonical"[\s\S]*?hreflang="x-default"[^>]*>/, enlacesDe(idioma, pagina))
    .replace('<div id="root"></div>', `<div id="root">${cuerpo}</div>`);

  // Las paginas legales no llevan descripcion: ver el porque en src/meta.js.
  html = descripcion
    ? meta(html, 'description', descripcion)
    : html.replace(/\n\s*<meta name="description"[^>]*>/, '');

  html = meta(html, 'og:url', urlAbsoluta(idioma, pagina));
  html = meta(html, 'og:title', titulo);
  html = meta(html, 'og:description', descripcion ?? titulo);
  html = meta(html, 'og:locale', LOCALES[idioma]);
  html = meta(html, 'og:image:alt', imagenAlt);

  // og:locale:alternate son las otras tres. Al ser tres etiquetas con el mismo
  // nombre, meta() no sabe cual es cual: se quitan todas y se ponen de nuevo
  // detras de og:locale, que es donde estaban.
  const otras = IDIOMAS.filter((codigo) => codigo !== idioma)
    .map((codigo) => `\n  <meta property="og:locale:alternate" content="${LOCALES[codigo]}" />`)
    .join('');
  html = html
    .replace(/\n\s*<meta property="og:locale:alternate"[^>]*>/g, '')
    .replace(/(<meta property="og:locale" content="[^"]*" \/>)/, `$1${otras}`);

  html = fichaDe(html, idioma, pagina, descripcion);

  // ruta() da /cafediagon/de/aviso-legal/, y el fichero que sirve GitHub Pages
  // en esa direccion es el index.html de esa carpeta.
  const carpeta = join(DIST, ruta(idioma, pagina).replace(vite.config.base, ''));
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(join(carpeta, 'index.html'), html);
  escritas += 1;
}

await vite.close();

console.log(`${escritas} paginas prerenderizadas en dist/`);
for (const { idioma, pagina } of RUTAS) console.log(`  ${ruta(idioma, pagina)}`);
