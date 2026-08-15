import { useEffect, useRef, useState } from 'react';
import { guardarIdioma, IDIOMAS, NOMBRE_IDIOMA, useIdioma } from '../i18n/idioma.jsx';
import { PORTADA, ruta } from '../rutas.js';
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

export default function Cabecera({ pagina = PORTADA }) {
  const { idioma, t } = useIdioma();
  const portada = ruta(idioma);
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
        {/* A la portada del idioma que se este leyendo, no a un ancla: desde el
            aviso legal, #inicio no lleva a ninguna parte. */}
        <a className="cabecera__logo" href={portada}>
          {/* ansioso y no prioridad: se ve al entrar, pero son 3,5 KB a 44 px
              y con fetchpriority alto le disputaba la conexion al hero, que es
              el LCP y va precargado desde index.html. */}
          <Imagen nombre="logo" alt="" sizes="44px" ansioso />
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
                {/* Las secciones son anclas de la portada, asi que el enlace
                    lleva la portada delante: desde una pagina legal, un #carta
                    a secas no lleva a ninguna parte. Estando ya en la portada
                    el navegador lo trata como el ancla que es y no recarga. */}
                <a href={`${portada}#${id}`} onClick={() => setAbierto(false)}>{t(clave)}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          Enlaces y no botones: cada idioma es ahora una direccion de verdad, y
          eso hace dos cosas que un boton no hacia. Se pueden abrir en otra
          pestana y copiar, como cualquier enlace; y un rastreador puede seguir
          los cuatro, que es como encuentra las traducciones sin depender solo
          de las etiquetas hreflang del <head>.

          Se queda en la misma pagina: desde el aviso legal en castellano, DE
          lleva al aviso legal en aleman y no a la portada.
        */}
        <nav className="cabecera__idiomas" aria-label={t('nav.cambiarIdioma')}>
          {IDIOMAS.map((codigo) => (
            <a
              key={codigo}
              lang={codigo}
              href={ruta(codigo, pagina)}
              // Lo unico que se guarda en el navegador, y solo cuando se pulsa:
              // asi quien vuelve por una direccion sin prefijo aterriza en su
              // idioma. Detectarlo del navegador no seria una eleccion suya.
              onClick={() => guardarIdioma(codigo)}
              aria-current={codigo === idioma ? 'page' : undefined}
              /* Visualmente basta "DE"; en voz alta no. El nombre accesible
                 lleva el idioma escrito en si mismo, que es lo que reconoce
                 quien lo busca. */
              aria-label={NOMBRE_IDIOMA[codigo]}
            >
              <span aria-hidden="true">{codigo.toUpperCase()}</span>
            </a>
          ))}
        </nav>

        <a className="cabecera__telefono" href={`tel:${negocio.telefono}`}>
          {negocio.telefonoVisible}
        </a>
      </div>
    </header>
  );
}
