import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

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
