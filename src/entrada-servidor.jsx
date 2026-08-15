/**
 * Punto de entrada del prerender: pinta la web sin navegador.
 *
 * Lo carga scripts/prerender.mjs a traves del pipeline SSR de vite, que es lo
 * que hace que aqui se puedan importar .jsx, .css y los json de contenido igual
 * que en el navegador.
 */
import { prerenderToNodeStream } from 'react-dom/static';
import { ProveedorIdioma } from './i18n/idioma.jsx';
import App from './App.jsx';
import './styles/global.css';

export { RUTAS, ruta, urlAbsoluta, PORTADA } from './rutas.js';
export { metaDe } from './meta.js';
export { IDIOMAS, IDIOMA_POR_DEFECTO } from './i18n/idioma.jsx';
export { default as negocio } from './content/business.json';

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
