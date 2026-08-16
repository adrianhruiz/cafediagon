import { lazy, Suspense, useEffect } from 'react';
import { useIdioma } from './i18n/idioma.jsx';
import { metaDe } from './meta.js';
import { PORTADA } from './rutas.js';
import Cabecera from './components/Cabecera.jsx';
import Hero from './components/Hero.jsx';
import Sobre from './components/Sobre.jsx';
import Juegos from './components/Juegos.jsx';
import Galeria from './components/Galeria.jsx';
import Pie from './components/Pie.jsx';
import './App.css';

/**
 * La carta es la seccion mas pesada con diferencia y esta bajo el pliegue: su
 * codigo, su CSS y su json salen del bundle que bloquea el primer pintado y se
 * bajan mientras se lee el hero.
 */
const Carta = lazy(() => import('./components/Carta.jsx'));

/**
 * El aviso legal y la privacidad son texto largo que casi nadie abre: mismo
 * trato que la carta, fuera del arranque.
 */
const Legal = lazy(() => import('./components/Legal.jsx'));

export default function App({ pagina = PORTADA }) {
  const { idioma, t } = useIdioma();

  useEffect(() => {
    // scripts/prerender.mjs escribe esto en el fichero de cada pagina, asi que
    // en produccion ya viene puesto antes de que arranque nada. Esto es para el
    // servidor de desarrollo, que sirve siempre el index.html de la raiz.
    const { titulo, descripcion } = metaDe(idioma, pagina);
    document.title = titulo;

    // Solo se escribe cuando hay algo que escribir, nunca se borra. En las
    // paginas legales metaDe no trae descripcion (la pone el prerender, que es
    // el unico que puede leer los textos legales sin cargarlos en el bundle):
    // si aqui se quitara, Google, que ejecuta el JavaScript, veria como
    // desaparece la que traia el fichero.
    if (descripcion) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', descripcion);
    }
  }, [idioma, pagina]);

  return (
    <>
      <a className="saltar" href="#contenido">{t('nav.saltar')}</a>
      <Cabecera pagina={pagina} />
      {/* tabIndex -1: sin el, algunos navegadores mueven el scroll con el salto
          de contenido pero dejan el foco donde estaba. */}
      <main id="contenido" tabIndex={-1}>
        {pagina ? (
          <Suspense fallback={<div className="legal-hueco" aria-hidden="true" />}>
            <Legal pagina={pagina} />
          </Suspense>
        ) : (
          <>
            <Hero />
            <Sobre />
            {/* El hueco reserva alto para que la pagina no pegue un salto cuando
                entra la carta, y lleva el id para que el enlace del menu apunte a
                algun sitio durante los milisegundos que tarda. */}
            <Suspense fallback={<div className="carta-hueco" id="carta" aria-hidden="true" />}>
              <Carta />
            </Suspense>
            <Juegos />
            <Galeria />
          </>
        )}
      </main>
      <Pie />
    </>
  );
}
