import { lazy, Suspense } from 'react';
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

export default function App() {
  const { t } = useIdioma();

  return (
    <>
      <a className="saltar" href="#contenido">{t('nav.saltar')}</a>
      <Cabecera />
      {/* tabIndex -1: sin el, algunos navegadores mueven el scroll con el salto
          de contenido pero dejan el foco donde estaba. */}
      <main id="contenido" tabIndex={-1}>
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
      </main>
      <Pie />
    </>
  );
}
