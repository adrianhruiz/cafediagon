import { createContext, useContext, useEffect, useMemo } from 'react';
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

/**
 * El idioma que el visitante eligio a mano en otra visita, o null.
 *
 * Solo se guarda lo que se elige pulsando: el idioma del navegador no es una
 * eleccion suya, y la politica de privacidad declara "el idioma que has
 * elegido". Sirve para una sola cosa, en src/main.jsx: mandar a su idioma a
 * quien vuelve a entrar por una direccion sin prefijo.
 */
export function idiomaGuardado(almacen = globalThis.localStorage) {
  const guardado = leer(CLAVE, almacen);
  return IDIOMAS.includes(guardado) ? guardado : null;
}

export function guardarIdioma(codigo, almacen = globalThis.localStorage) {
  if (IDIOMAS.includes(codigo)) guardar(CLAVE, codigo, almacen);
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

/**
 * El idioma ya no cambia mientras se esta en la pagina: lo fija la direccion y
 * cada uno tiene la suya. Cambiar de idioma es ir a otra pagina, no un estado
 * que se mueve por dentro, asi que aqui no hay nada que actualizar.
 */
export function ProveedorIdioma({ children, inicial = IDIOMA_POR_DEFECTO }) {
  const idioma = IDIOMAS.includes(inicial) ? inicial : IDIOMA_POR_DEFECTO;

  useEffect(() => {
    // El prerender ya lo deja escrito en el fichero que se sirve. Esto es para
    // el servidor de desarrollo, donde el HTML de partida siempre es el mismo.
    document.documentElement.lang = idioma;
  }, [idioma]);

  const valor = useMemo(() => ({
    idioma,
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
