import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import {
  IDIOMAS, IDIOMA_POR_DEFECTO, idiomaGuardado, ProveedorIdioma,
} from './i18n/idioma.jsx';
import { leerRuta, PAGINAS, ruta } from './rutas.js';
import App from './App.jsx';
import './styles/global.css';

/**
 * A donde habria que estar, si no es aqui. Devuelve null cuando la direccion ya
 * es la buena, que es el caso normal.
 */
function destinoDe() {
  const { pathname, search, hash } = location;
  const { idioma, pagina } = leerRuta(pathname);

  // Las direcciones de antes siguen circulando por ahi (enlaces compartidos,
  // el historial de quien ya vino): el idioma iba en ?lang= y las dos paginas
  // legales en el hash. Se traducen a la direccion nueva en vez de dejarlas
  // caer en la portada en castellano.
  const pedido = new URLSearchParams(search).get('lang');
  const legalEnHash = PAGINAS.find((p) => hash === `#${p}`);
  if (IDIOMAS.includes(pedido) || legalEnHash) {
    const destino = ruta(IDIOMAS.includes(pedido) ? pedido : idioma, legalEnHash ?? pagina);
    // El hash se conserva salvo cuando era la ruta: ahi ya se ha gastado.
    return destino + (legalEnHash ? '' : hash);
  }

  /*
   * Quien ya eligio idioma alguna vez y vuelve por una direccion sin prefijo
   * (que es la castellana) se va a la suya.
   *
   * Solo con una eleccion guardada, nunca por el idioma del navegador: eso
   * moveria tambien a los rastreadores, y lo que Google pide es justo lo
   * contrario, que cada direccion sirva siempre el idioma que declara. De
   * emparejar a cada visitante con su traduccion ya se encargan los hreflang,
   * que es donde toca hacerlo: en la lista de resultados, antes de entrar.
   */
  const guardado = idiomaGuardado();
  if (guardado && guardado !== idioma && pathname === ruta(IDIOMA_POR_DEFECTO, pagina)) {
    return ruta(guardado, pagina) + hash;
  }

  return null;
}

const destino = destinoDe();

if (destino && destino !== `${location.pathname}${location.search}${location.hash}`) {
  // replace y no assign: la direccion vieja no tiene que quedarse en el
  // historial, o el boton de atras devolveria a ella y volveria a rebotar.
  location.replace(destino);
} else {
  const { idioma, pagina } = leerRuta();
  const raiz = document.getElementById('root');
  const arbol = (
    <StrictMode>
      <ProveedorIdioma inicial={idioma}>
        <App pagina={pagina} />
      </ProveedorIdioma>
    </StrictMode>
  );

  // Lo publicado viene pintado por scripts/prerender.mjs y solo hay que
  // engancharse; el servidor de desarrollo sirve el hueco vacio y hay que
  // pintarlo entero. Hidratar sobre un contenedor vacio es un error de React.
  if (raiz.firstChild) hydrateRoot(raiz, arbol);
  else createRoot(raiz).render(arbol);
}
