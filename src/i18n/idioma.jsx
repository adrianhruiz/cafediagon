import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

/** Elige idioma inicial: el guardado, si no el del navegador, si no castellano. */
export function idiomaInicial(navegador = globalThis.navigator, almacen = globalThis.localStorage) {
  try {
    const guardado = almacen?.getItem(CLAVE);
    if (IDIOMAS.includes(guardado)) return guardado;
  } catch {
    // localStorage puede fallar en modo privado; no es motivo para romper.
  }
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
    try { localStorage.setItem(CLAVE, idioma); } catch { /* modo privado */ }
  }, [idioma]);

  const valor = useMemo(() => ({
    idioma,
    setIdioma: (nuevo) => IDIOMAS.includes(nuevo) && setIdioma(nuevo),
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
