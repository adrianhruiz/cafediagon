import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * El contraste de la paleta se comprueba aqui y no a ojo. tokens.css afirmaba
 * en un comentario que todos los pares pasaban AA y cuatro no lo hacian: un
 * comentario no se entera de que alguien ha aclarado un color.
 *
 * Formula de WCAG 2.x (relative luminance + ratio). Los pares son los que de
 * verdad se usan en la hoja de estilos; si se inventa una combinacion nueva,
 * hay que añadirla a la lista.
 */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = readFileSync(join(RAIZ, 'src', 'styles', 'tokens.css'), 'utf8');

/** Lee las variables --x: #hex del :root. */
const TOKENS = Object.fromEntries(
  [...CSS.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(([, n, v]) => [n, v]),
);

const rgb = (hex) => hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
const canal = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminancia = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);

function contraste(frente, fondo) {
  const [claro, oscuro] = [luminancia(frente), luminancia(fondo)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Color resultante de pintar `frente` con opacidad `alfa` sobre `fondo`. */
const mezclar = (frente, fondo, alfa) =>
  frente.map((c, i) => Math.round(alfa * c + (1 - alfa) * fondo[i]));

const color = (nombre) => {
  const valor = TOKENS[nombre];
  if (!valor) throw new Error(`no existe el token --${nombre}`);
  return rgb(valor);
};

/** [frente, fondo, minimo, donde se usa] */
const TEXTO = [
  ['tinta', 'crema', 4.5, 'texto general'],
  ['tinta-3', 'crema', 4.5, 'entradillas de seccion'],
  ['tinta-3', 'crema-2', 4.5, 'descripciones de la carta'],
  ['tinta-3', 'crema-3', 4.5, 'etiqueta "sin gluten"'],
  ['tinta-4', 'crema', 4.5, 'texto secundario'],
  ['tinta-4', 'crema-2', 4.5, 'cuenta de productos por categoria'],
  ['cobre', 'crema', 4.5, 'etiquetas de seccion y enlaces'],
  ['cobre', 'crema-2', 4.5, 'precios y avisos de la carta'],
  ['crema', 'cobre', 4.5, 'boton de cargar el mapa'],
  ['tinta', 'cobre-claro', 4.5, 'boton principal del hero'],
  ['crema', 'tinta', 4.5, 'texto sobre cabecera y juegos'],
  ['pergamino', 'tinta', 4.5, 'titulos sobre fondo oscuro'],
  ['pergamino', 'tinta-2', 4.5, 'franja del premio'],
  ['cobre-claro', 'tinta-2', 4.5, 'entidad del premio'],
  ['cobre-claro', 'tinta', 4.5, 'etiquetas de la seccion de juegos'],
];

/** Bordes y anillos de foco: 3:1 contra lo que tengan al lado (1.4.11). */
const NO_TEXTO = [
  ['borde-control', 'crema', 3, 'borde de los filtros de la carta'],
  ['borde-control', 'crema-2', 3, 'borde de los filtros sobre fondo alterno'],
  ['tinta', 'crema', 3, 'anillo de foco sobre fondo claro'],
  ['tinta', 'crema-2', 3, 'anillo de foco sobre fondo alterno'],
  ['pergamino', 'tinta', 3, 'halo de foco sobre fondo oscuro'],
];

describe('contraste de la paleta', () => {
  it.each(TEXTO)('%s sobre %s llega a %s:1 (%s)', (frente, fondo, minimo) => {
    expect(contraste(color(frente), color(fondo))).toBeGreaterThanOrEqual(minimo);
  });

  it.each(NO_TEXTO)('%s sobre %s llega a %s:1 (%s)', (frente, fondo, minimo) => {
    expect(contraste(color(frente), color(fondo))).toBeGreaterThanOrEqual(minimo);
  });

  it('el aviso de la carta pasa AA sobre su propio fondo tintado', () => {
    // .carta__aviso: rgba(95, 99, 107, 0.06) sobre --crema-2.
    const fondo = mezclar([95, 99, 107], color('crema-2'), 0.06);
    expect(contraste(color('cobre'), fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('el pie de la galeria pasa AA en la peor foto posible', () => {
    // rgba(32, 34, 39, 0.88) sobre una foto blanca, que es el caso mas claro.
    const fondo = mezclar(color('tinta'), [255, 255, 255], 0.88);
    expect(contraste([255, 255, 255], fondo)).toBeGreaterThanOrEqual(4.5);
  });
});
