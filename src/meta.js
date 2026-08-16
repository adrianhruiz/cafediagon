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

  // De las paginas legales aqui solo sale el titulo. La descripcion es la
  // entrada de cada documento, y para leerla harian falta los cuatro
  // legal.*.json: 16 KB que Legal.jsx carga en un trozo aparte a proposito, y
  // que importarlos aqui devolveria al bundle que baja todo el mundo. La pone
  // metaDePagina() en src/entrada-servidor.jsx, que solo corre en el build.
  const nombre = traducir(idioma, pagina === AVISO ? 'pie.avisoLegal' : 'pie.privacidad');
  return { titulo: `${nombre} · ${negocio.nombre}`, descripcion: null, imagenAlt };
}
