/**
 * Punto de entrada del prerender: pinta la web sin navegador.
 *
 * Lo carga scripts/prerender.mjs a traves del pipeline SSR de vite, que es lo
 * que hace que aqui se puedan importar .jsx, .css y los json de contenido igual
 * que en el navegador.
 */
import { prerenderToNodeStream } from 'react-dom/static';
import { ProveedorIdioma } from './i18n/idioma.jsx';
import { AVISO, PORTADA } from './rutas.js';
import { metaDe } from './meta.js';
import App from './App.jsx';
import legalEs from './content/legal.es.json';
import legalEn from './content/legal.en.json';
import legalDe from './content/legal.de.json';
import legalCa from './content/legal.ca.json';
import './styles/global.css';

export { RUTAS, ruta, urlAbsoluta, PORTADA } from './rutas.js';
export { metaDe } from './meta.js';
export { IDIOMAS, IDIOMA_POR_DEFECTO } from './i18n/idioma.jsx';
export { default as negocio } from './content/business.json';

const LEGALES = { es: legalEs, en: legalEn, de: legalDe, ca: legalCa };

/**
 * Lo mismo que metaDe, pero con la descripcion de las paginas legales.
 *
 * Vive aqui y no en src/meta.js porque para escribirla hay que leer los cuatro
 * legal.*.json, que son 16 KB. Legal.jsx los carga en un trozo aparte justo
 * para que no pesen en el arranque, y meter ese import en meta.js los devolveria
 * al bundle principal, que lo baja todo el mundo. Este fichero solo lo carga
 * scripts/prerender.mjs: no viaja al navegador.
 *
 * La descripcion es la entrada del propio documento, tal cual. Es el resumen
 * que ya estaba escrito y traducido, y describe la pagina mejor que cualquier
 * frase nueva. Alguna pasa de los 160 caracteres que ensena Google, que la
 * recorta al mostrarla: es preferible eso a partir una frase por la mitad o a
 * inventarse un resumen comercial de un aviso legal.
 */
export function metaDePagina(idioma, pagina) {
  const base = metaDe(idioma, pagina);
  if (pagina === PORTADA) return base;
  const documento = LEGALES[idioma] ?? LEGALES.es;
  const doc = pagina === AVISO ? documento.aviso : documento.privacidad;
  return { ...base, descripcion: doc.entrada };
}

/**
 * prerenderToNodeStream y no renderToStaticMarkup: la carta y las paginas
 * legales van en trozos aparte, detras de un lazy() y un <Suspense>, y el
 * pintado sincrono se queda con el hueco de espera. Este espera a que todo haya
 * llegado, que es justo lo que hace falta para un fichero que se guarda en
 * disco. Ademas deja el marcado que necesita hydrateRoot en el navegador.
 */
export async function pintar(idioma, pagina) {
  const { prelude } = await prerenderToNodeStream(
    <ProveedorIdioma inicial={idioma}>
      <App pagina={pagina} />
    </ProveedorIdioma>,
  );

  let html = '';
  for await (const trozo of prelude) html += trozo;
  return html;
}
