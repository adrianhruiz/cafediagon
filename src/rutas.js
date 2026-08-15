/**
 * Las direcciones de la web, en un solo sitio.
 *
 * Antes solo habia una URL: los cuatro idiomas se pedian con ?lang= y las dos
 * paginas legales con el hash. Ninguna de las dos cosas sirve para que las
 * indexen. El buscador no ve el hash, y GitHub Pages sirve el mismo fichero sea
 * cual sea el parametro, asi que las cuatro traducciones eran literalmente el
 * mismo documento en castellano y la canonica las declaraba duplicados de si
 * mismas: Google se quedaba con una y tiraba las otras tres.
 *
 * Ahora cada combinacion de idioma y pagina tiene su propia direccion y su
 * propio fichero, que escribe scripts/prerender.mjs. El castellano se queda en
 * la raiz porque es el idioma por defecto y la x-default.
 *
 *   /cafediagon/                    /cafediagon/de/
 *   /cafediagon/aviso-legal/        /cafediagon/de/aviso-legal/
 *   /cafediagon/privacidad/         /cafediagon/de/privacidad/
 */
import { IDIOMAS, IDIOMA_POR_DEFECTO } from './i18n/idioma.jsx';
import negocio from './content/business.json';

/** Lo que vite pone delante de todo. En produccion, /cafediagon/. */
const BASE = import.meta.env.BASE_URL;

/** Las dos paginas legales, por el trozo de URL que las nombra. */
export const AVISO = 'aviso-legal';
export const PRIVACIDAD = 'privacidad';
export const PAGINAS = [AVISO, PRIVACIDAD];

/** La portada no tiene trozo propio: es lo que queda al quitar el idioma. */
export const PORTADA = null;

/** Direccion de una pagina dentro de la web, lista para meter en un href. */
export function ruta(idioma, pagina = PORTADA) {
  const trozos = [];
  // El idioma por defecto no lleva prefijo: seria /cafediagon/es/, una segunda
  // direccion con el mismo contenido que la raiz.
  if (idioma !== IDIOMA_POR_DEFECTO) trozos.push(idioma);
  if (pagina) trozos.push(pagina);
  return trozos.length ? `${BASE}${trozos.join('/')}/` : BASE;
}

/**
 * La misma direccion con el dominio delante. Es lo que hay que escribir en la
 * canonica, en los hreflang y en las etiquetas og:, donde una ruta relativa no
 * la sabe resolver nadie: quien las lee no esta en la pagina.
 */
export function urlAbsoluta(idioma, pagina = PORTADA) {
  return negocio.web + ruta(idioma, pagina).slice(BASE.length);
}

/**
 * Que idioma y que pagina pide un camino. Es lo contrario de ruta().
 *
 * Un idioma o una pagina que no existen se ignoran en vez de fallar: la web se
 * publica en un sitio estatico y cualquiera puede escribir lo que quiera en la
 * barra de direcciones.
 */
export function leerRuta(camino = globalThis.location?.pathname ?? BASE) {
  const resto = camino.startsWith(BASE) ? camino.slice(BASE.length) : camino.replace(/^\/+/, '');
  const trozos = resto.split('/').filter(Boolean);
  const idioma = IDIOMAS.includes(trozos[0]) ? trozos.shift() : IDIOMA_POR_DEFECTO;
  const pagina = PAGINAS.includes(trozos[0]) ? trozos[0] : PORTADA;
  return { idioma, pagina };
}

/**
 * Las doce paginas que se publican: cuatro idiomas por tres documentos. De aqui
 * salen los ficheros del prerender, los hreflang de cada uno y el sitemap.
 */
export const RUTAS = IDIOMAS.flatMap((idioma) =>
  [PORTADA, ...PAGINAS].map((pagina) => ({ idioma, pagina })));
