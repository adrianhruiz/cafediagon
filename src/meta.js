/**
 * Titulo y descripcion de cada pagina.
 *
 * Lo usan dos sitios que tienen que decir lo mismo: scripts/prerender.mjs, que
 * los escribe en el <head> de cada fichero publicado, y el proveedor de idioma,
 * que los repone al vuelo mientras se desarrolla (donde no hay prerender).
 */
import { traducir } from './i18n/idioma.jsx';
import negocio from './content/business.json';
import { AVISO, PORTADA } from './rutas.js';

export function metaDe(idioma, pagina = PORTADA) {
  const imagenAlt = traducir(idioma, 'meta.imagenAlt');

  if (pagina === PORTADA) {
    return {
      titulo: traducir(idioma, 'meta.titulo'),
      descripcion: traducir(idioma, 'meta.descripcion'),
      imagenAlt,
    };
  }

  // Las paginas legales no llevan descripcion. Escribir una obligaria a
  // inventarse un resumen comercial de un texto que no lo es, y Google saca uno
  // del propio documento mejor que el que se pondria aqui. El titulo si hace
  // falta: sin el, las ocho serian "Diagon Cafe" en la lista de resultados.
  const nombre = traducir(idioma, pagina === AVISO ? 'pie.avisoLegal' : 'pie.privacidad');
  return { titulo: `${nombre} · ${negocio.nombre}`, descripcion: null, imagenAlt };
}
