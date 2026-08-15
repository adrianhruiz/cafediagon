import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { cartaDe } from '../src/components/Carta.jsx';
import { IDIOMAS } from '../src/i18n/idioma.jsx';

/*
 * La carta de cada idioma se baja en su propio trozo, y montarla suspende hasta
 * que llega. React solo reintenta un <Suspense> suspendido cuando la promesa se
 * resuelve dentro de act(), y en vitest eso solo pasa en el primer montaje de
 * cada fichero: a partir del segundo, el primer idioma que se pide se queda
 * colgado para siempre.
 *
 * No es un fallo de la web. En un navegador de verdad React reintenta solo, y
 * lo que se publica ni siquiera llega a suspender, que scripts/prerender.mjs
 * deja la carta ya pintada en el fichero. Es el entorno de pruebas.
 *
 * Se bajan los cuatro antes de empezar: asi Carta.jsx los encuentra resueltos y
 * pinta sin suspender, y un test puede montar la web en cualquier idioma.
 */
await Promise.all(IDIOMAS.map((idioma) => cartaDe(idioma)));

/*
 * Con esta combinacion de vitest y jsdom, globalThis.localStorage llega como un
 * objeto vacio sin metodos, asi que los tests que tocan el idioma guardado
 * fallaban por el entorno y no por el codigo. Se instala un Storage real.
 */
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const crearAlmacen = () => {
    const datos = new Map();
    return {
      get length() { return datos.size; },
      key: (i) => [...datos.keys()][i] ?? null,
      getItem: (k) => (datos.has(String(k)) ? datos.get(String(k)) : null),
      setItem: (k, v) => { datos.set(String(k), String(v)); },
      removeItem: (k) => { datos.delete(String(k)); },
      clear: () => datos.clear(),
    };
  };
  for (const nombre of ['localStorage', 'sessionStorage']) {
    const almacen = crearAlmacen();
    Object.defineProperty(globalThis, nombre, { value: almacen, configurable: true });
    if (globalThis.window) {
      Object.defineProperty(globalThis.window, nombre, { value: almacen, configurable: true });
    }
  }
}

/*
 * jsdom no implementa scrollTo y lo anuncia con un volcado de pila por cada
 * navegacion a una pagina legal. No hay nada que comprobar en un scroll: se
 * silencia con una funcion vacia para no enterrar los fallos de verdad.
 */
if (globalThis.window) {
  globalThis.window.scrollTo = () => {};
  // Element.scrollIntoView ni siquiera existe en jsdom: llamarlo revienta.
  globalThis.window.Element.prototype.scrollIntoView = () => {};
}

afterEach(cleanup);
