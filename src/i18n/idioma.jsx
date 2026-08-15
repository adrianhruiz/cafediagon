import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { guardar, leer } from '../almacen.js';
import es from './es.json';
import en from './en.json';
import de from './de.json';
import ca from './ca.json';

const TEXTOS = { es, en, de, ca };

export const IDIOMAS = Object.keys(TEXTOS);
export const IDIOMA_POR_DEFECTO = 'es';

/** Cada idioma escrito en si mismo: Español, English, Deutsch, Català. */
export const NOMBRE_IDIOMA = Object.fromEntries(
  Object.entries(TEXTOS).map(([codigo, dicc]) => [codigo, dicc.idioma]),
);

const CLAVE = 'diagon:idioma';

/** Parametro que fija el idioma en la URL: ?lang=de. */
export const PARAMETRO = 'lang';

/** El idioma que pide la URL, o null si no pide ninguno que exista. */
export function idiomaDeUrl(busqueda = globalThis.location?.search) {
  const pedido = new URLSearchParams(busqueda ?? '').get(PARAMETRO);
  return IDIOMAS.includes(pedido) ? pedido : null;
}

/**
 * Deja el idioma elegido en la barra de direcciones. Asi el enlace se puede
 * compartir y abre la misma pagina en el mismo idioma, que es algo que el
 * almacenamiento local no puede hacer: solo vale para quien ya esta aqui.
 *
 * replaceState y no pushState: cambiar de idioma no es navegar, y meterlo en el
 * historial obligaria a pulsar atras una vez por cada cambio. El hash se
 * conserva porque es la ruta de las paginas legales.
 */
function escribirEnUrl(idioma) {
  const { location, history } = globalThis;
  if (!location?.href || typeof history?.replaceState !== 'function') return;
  const url = new URL(location.href);
  url.searchParams.set(PARAMETRO, idioma);
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Elige idioma inicial: el de la URL, si no el guardado, si no el del
 * navegador, si no castellano. La URL manda porque quien abre un enlace con
 * ?lang=de espera esa pagina en aleman, aunque su navegador vaya en otro idioma.
 */
export function idiomaInicial(
  navegador = globalThis.navigator,
  almacen = globalThis.localStorage,
  busqueda = globalThis.location?.search,
) {
  const pedido = idiomaDeUrl(busqueda);
  if (pedido) return pedido;

  const guardado = leer(CLAVE, almacen);
  if (IDIOMAS.includes(guardado)) return guardado;

  for (const etiqueta of navegador?.languages ?? [navegador?.language].filter(Boolean)) {
    const base = String(etiqueta).toLowerCase().split('-')[0];
    if (IDIOMAS.includes(base)) return base;
  }
  return IDIOMA_POR_DEFECTO;
}

/**
 * Devuelve el texto de una ruta con puntos y sustituye {marcadores}.
 * Si falta la clave cae al castellano en vez de dejar un hueco en pantalla.
 */
export function traducir(idioma, ruta, valores) {
  const buscar = (dicc) => ruta.split('.').reduce((n, k) => (n == null ? n : n[k]), dicc);
  const texto = buscar(TEXTOS[idioma]) ?? buscar(TEXTOS[IDIOMA_POR_DEFECTO]);
  if (typeof texto !== 'string') return ruta;
  if (!valores) return texto;
  return texto.replace(/\{(\w+)\}/g, (coincidencia, clave) =>
    clave in valores ? String(valores[clave]) : coincidencia);
}

/**
 * En que idioma esta realmente un campo {es,en,de,ca}: el pedido si lo tiene,
 * si no el castellano de respaldo. Devuelve null si no hay ni una cosa ni otra.
 */
export function idiomaDeCampo(obj, idioma) {
  if (obj?.[idioma] != null && obj[idioma] !== '') return idioma;
  if (obj?.[IDIOMA_POR_DEFECTO] != null && obj[IDIOMA_POR_DEFECTO] !== '') return IDIOMA_POR_DEFECTO;
  return null;
}

const Contexto = createContext(null);

export function ProveedorIdioma({ children, inicial }) {
  const [idioma, setIdioma] = useState(() => inicial ?? idiomaInicial());

  useEffect(() => {
    document.documentElement.lang = idioma;
    // El titulo y la descripcion tambien son contenido: si se quedan en
    // castellano, el lector de pantalla anuncia la pestaña en un idioma y la
    // pagina en otro.
    document.title = traducir(idioma, 'meta.titulo');
    document.querySelector('meta[name="description"]')
      ?.setAttribute('content', traducir(idioma, 'meta.descripcion'));
  }, [idioma]);

  /**
   * Solo se guarda lo que el visitante elige a mano. Antes se escribia tambien
   * el idioma detectado del navegador, que no es una eleccion suya: la
   * politica de privacidad declara "el idioma que has elegido", y guardar algo
   * que nadie ha elegido no era eso.
   */
  const elegir = (nuevo) => {
    if (!IDIOMAS.includes(nuevo)) return;
    setIdioma(nuevo);
    guardar(CLAVE, nuevo);
    escribirEnUrl(nuevo);
  };

  const valor = useMemo(() => ({
    idioma,
    setIdioma: elegir,
    t: (ruta, valores) => traducir(idioma, ruta, valores),
    /** Toma el campo del idioma activo de un objeto {es,en,de,ca}. */
    campo: (obj) => obj?.[idioma] ?? obj?.[IDIOMA_POR_DEFECTO] ?? null,
  }), [idioma]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Pinta un campo traducible marcando su idioma cuando no es el de la pagina.
 *
 * Hoy la carta esta traducida entera, pero el export del TPV llega a medias y
 * los productos nuevos entran con huecos: sin este marcado, un lector de
 * pantalla en aleman lee el castellano de respaldo con voz alemana (3.1.2).
 */
export function Campo({ valor }) {
  const { idioma } = useIdioma();
  const codigo = idiomaDeCampo(valor, idioma);
  if (codigo == null) return null;
  const texto = valor[codigo];
  return codigo === idioma ? texto : <span lang={codigo}>{texto}</span>;
}

export function useIdioma() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useIdioma necesita estar dentro de <ProveedorIdioma>');
  return ctx;
}
