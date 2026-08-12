import { useEffect, useRef, useState } from 'react';
import { IDIOMAS, NOMBRE_IDIOMA, useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import Imagen from './Imagen.jsx';
import './Cabecera.css';

const ENLACES = [
  ['sobre', 'nav.cafe'],
  ['carta', 'nav.carta'],
  ['juegos', 'nav.juegos'],
  ['galeria', 'nav.galeria'],
  ['donde', 'nav.donde'],
];

const ID_MENU = 'menu-principal';

export default function Cabecera() {
  const { idioma, setIdioma, t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const botonMenu = useRef(null);
  const nav = useRef(null);

  // Escape cierra el menu movil y devuelve el foco al boton que lo abrio.
  // Pulsar fuera tambien lo cierra: en movil el menu tapa el contenido y sin
  // esto hay que acertar otra vez en el boton para quitarlo de en medio.
  useEffect(() => {
    if (!abierto) return;

    // El foco entra en el menu al abrirlo. Sin esto el siguiente tabulador se
    // iba a los idiomas, porque el boton va antes que el <nav> en el DOM.
    nav.current?.querySelector('a')?.focus();

    const alPulsar = (e) => {
      if (e.key === 'Escape') { setAbierto(false); botonMenu.current?.focus(); }
    };
    const alTocarFuera = (e) => {
      if (nav.current?.contains(e.target) || botonMenu.current?.contains(e.target)) return;
      setAbierto(false);
    };
    document.addEventListener('keydown', alPulsar);
    document.addEventListener('pointerdown', alTocarFuera);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.removeEventListener('pointerdown', alTocarFuera);
    };
  }, [abierto]);

  return (
    <header className="cabecera">
      <div className="envoltorio cabecera__interior">
        <a className="cabecera__logo" href="#inicio">
          <Imagen nombre="logo" alt="" sizes="44px" prioridad />
          <span>DIAGON</span>
        </a>

        {/*
          El boton va antes que el menu que despliega para que el orden de
          tabulacion siga al visual (2.4.3). En pantalla no se mueve nada: el
          menu es absoluto en movil y el boton ya se colocaba con margin-left.
        */}
        <button
          ref={botonMenu}
          type="button"
          className="cabecera__hamburguesa"
          aria-expanded={abierto}
          aria-controls={ID_MENU}
          aria-label={abierto ? t('nav.cerrarMenu') : t('nav.abrirMenu')}
          onClick={() => setAbierto((v) => !v)}
        >
          <span aria-hidden="true">{abierto ? '✕' : '☰'}</span>
        </button>

        <nav
          ref={nav}
          id={ID_MENU}
          aria-label={t('nav.principal')}
          className={`cabecera__nav${abierto ? ' cabecera__nav--abierto' : ''}`}
        >
          <ul>
            {ENLACES.map(([id, clave]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={() => setAbierto(false)}>{t(clave)}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="cabecera__idiomas" role="group" aria-label={t('nav.cambiarIdioma')}>
          {IDIOMAS.map((codigo) => (
            <button
              key={codigo}
              type="button"
              lang={codigo}
              onClick={() => setIdioma(codigo)}
              aria-current={codigo === idioma ? 'true' : undefined}
              /* Visualmente basta "DE"; en voz alta no. El nombre accesible
                 lleva el idioma escrito en si mismo, que es lo que reconoce
                 quien lo busca. */
              aria-label={NOMBRE_IDIOMA[codigo]}
            >
              <span aria-hidden="true">{codigo.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <a className="cabecera__telefono" href={`tel:${negocio.telefono}`}>
          {negocio.telefonoVisible}
        </a>
      </div>
    </header>
  );
}
