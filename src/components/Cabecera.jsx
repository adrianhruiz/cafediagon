import { useEffect, useRef, useState } from 'react';
import { IDIOMAS, useIdioma } from '../i18n/idioma.jsx';
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

export default function Cabecera() {
  const { idioma, setIdioma, t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const botonMenu = useRef(null);

  // Escape cierra el menu movil y devuelve el foco al boton que lo abrio.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e) => {
      if (e.key === 'Escape') { setAbierto(false); botonMenu.current?.focus(); }
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto]);

  return (
    <header className="cabecera">
      <div className="envoltorio cabecera__interior">
        <a className="cabecera__logo" href="#inicio">
          <Imagen nombre="logo" alt="" sizes="44px" prioridad />
          <span>DIAGON</span>
        </a>

        <nav className={`cabecera__nav${abierto ? ' cabecera__nav--abierto' : ''}`}>
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
            >
              {codigo.toUpperCase()}
            </button>
          ))}
        </div>

        <a className="cabecera__telefono" href={`tel:${negocio.telefono}`}>
          {negocio.telefonoVisible}
        </a>

        <button
          ref={botonMenu}
          type="button"
          className="cabecera__hamburguesa"
          aria-expanded={abierto}
          aria-label={abierto ? t('nav.cerrarMenu') : t('nav.abrirMenu')}
          onClick={() => setAbierto((v) => !v)}
        >
          <span aria-hidden="true">{abierto ? '✕' : '☰'}</span>
        </button>
      </div>
    </header>
  );
}
