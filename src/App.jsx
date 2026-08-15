import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useIdioma } from './i18n/idioma.jsx';
import negocio from './content/business.json';
import Cabecera from './components/Cabecera.jsx';
import Hero from './components/Hero.jsx';
import Sobre from './components/Sobre.jsx';
import Juegos from './components/Juegos.jsx';
import Galeria from './components/Galeria.jsx';
import Donde from './components/Donde.jsx';
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

/**
 * Las dos paginas legales se identifican por el hash. Es lo unico que hace
 * falta para tener URL propia y compartible sin meter un enrutador ni partir el
 * build en varias paginas: el resto de hashes (#carta, #donde) siguen siendo
 * anclas de la portada y no coinciden con estos dos.
 */
const PAGINAS_LEGALES = ['aviso-legal', 'privacidad'];

function paginaDe(hash) {
  const trozo = decodeURIComponent(String(hash).replace(/^#/, ''));
  return PAGINAS_LEGALES.includes(trozo) ? trozo : null;
}

export default function App() {
  const { t } = useIdioma();
  const [pagina, setPagina] = useState(() => paginaDe(globalThis.location?.hash ?? ''));
  const principal = useRef(null);
  const anterior = useRef(pagina);

  useEffect(() => {
    const alCambiar = () => setPagina(paginaDe(location.hash));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  useEffect(() => {
    // Solo al cambiar de vista, no en cada montaje: en desarrollo StrictMode
    // ejecuta el efecto dos veces y robaria el foco al entrar en la pagina.
    const cambio = anterior.current !== pagina;
    anterior.current = pagina;
    if (!cambio) return;

    if (pagina) {
      window.scrollTo(0, 0);
      // El enlace que trae aqui esta en el pie y desaparece de pantalla: sin
      // esto el foco se queda en el aire y el teclado sigue por donde estaba.
      principal.current?.focus();
      return;
    }
    // Al volver a la portada el navegador ya intento saltar al ancla, pero la
    // seccion todavia no existia: se salta ahora, con la portada montada.
    const destino = location.hash.slice(1);
    if (destino) document.getElementById(destino)?.scrollIntoView();
  }, [pagina]);

  /**
   * Dentro de una pagina legal el hash es la ruta, asi que dejar que #contenido
   * llegue a la barra de direcciones devolveria a la portada en lugar de
   * saltarse la cabecera. Se hace a mano lo que haria el ancla.
   */
  const alSaltar = (e) => {
    if (!pagina) return;
    e.preventDefault();
    principal.current?.focus();
    principal.current?.scrollIntoView();
  };

  return (
    <>
      <a className="saltar" href="#contenido" onClick={alSaltar}>{t('nav.saltar')}</a>
      <Cabecera />
      {/* tabIndex -1: sin el, algunos navegadores mueven el scroll con el salto
          de contenido pero dejan el foco donde estaba. */}
      <main id="contenido" tabIndex={-1} ref={principal}>
        {pagina ? (
          <Suspense fallback={<div className="legal-hueco" aria-hidden="true" />}>
            <Legal pagina={pagina} />
          </Suspense>
        ) : (
          <>
            <Hero />
            <p className="franja-premio">
              <span aria-hidden="true">🏆</span>{' '}
              <b>{negocio.premio.entidad} {negocio.premio.anyo}</b> — {t('premio')}
            </p>
            <Sobre />
            {/* El hueco reserva alto para que la pagina no pegue un salto cuando
                entra la carta, y lleva el id para que el enlace del menu apunte a
                algun sitio durante los milisegundos que tarda. */}
            <Suspense fallback={<div className="carta-hueco" id="carta" aria-hidden="true" />}>
              <Carta />
            </Suspense>
            <Juegos />
            <Galeria />
            <Donde />
          </>
        )}
      </main>
      <Pie />
    </>
  );
}
