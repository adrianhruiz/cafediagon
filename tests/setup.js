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

afterEach(cleanup);
