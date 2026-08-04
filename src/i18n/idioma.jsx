import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import es from './es.json';
import en from './en.json';
import de from './de.json';
import ca from './ca.json';

const TEXTOS = { es, en, de, ca };

export const IDIOMAS = Object.keys(TEXTOS);
export const IDIOMA_POR_DEFECTO = 'es';

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

const Contexto = createContext(null);

export function ProveedorIdioma({ children, inicial }) {
  const [idioma, setIdioma] = useState(() => inicial ?? idiomaInicial());

  useEffect(() => {
    document.documentElement.lang = idioma;
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

export function useIdioma() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useIdioma necesita estar dentro de <ProveedorIdioma>');
  return ctx;
}
