import { useIdioma } from '../i18n/idioma.jsx';
import { AVISO, PRIVACIDAD, ruta } from '../rutas.js';
import negocio from '../content/business.json';
import './Pie.css';

/**
 * Trazados de los cuatro iconos del pie, dibujados a mano sobre una rejilla de
 * 24x24. Van sueltos y no como fichero: son cuatro peticiones que no se hacen
 * y ademas heredan el color del enlace, que es lo que les da el estado :hover
 * y el modo de contraste alto de Windows.
 */
const TELEFONO = 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.6a1 1 0 0 1-.25 1z';
const EMAIL = 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1m0 2v.4l8 5 8-5V7H4m0 2.75V17h16V9.75l-8 5z';
const INSTAGRAM = 'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm4 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9m0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m5-3.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5';
const UBICACION = 'M12 2a7 7 0 0 1 7 7c0 4.6-5.5 11.4-6.2 12.3a1 1 0 0 1-1.6 0C10.5 20.4 5 13.6 5 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 3.1 3.4 8 5 10.1C13.6 17 17 12.1 17 9a5 5 0 0 0-5-5m0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5';

/**
 * focusable="false": Internet Explorer y algunos Edge antiguos meten el svg en
 * el recorrido del tabulador, y entonces el enlace se tabula dos veces.
 */
function Icono({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"
         aria-hidden="true" focusable="false">
      <path d={children} />
    </svg>
  );
}

export default function Pie() {
  const { idioma, t } = useIdioma();
  const { direccion } = negocio;

  return (
    <footer className="pie">
      <div className="envoltorio">
        <div className="pie__columnas">
          {/* La direccion vive aqui y en ningun otro sitio de la web. El pie
              sale en todas las paginas, que es lo que pide el art. 10 LSSI
              para los datos de quien responde del sitio, y ya no hay una
              seccion "Donde estamos" que la repita. */}
          <div>
            <h2>{negocio.nombre}</h2>
            <address>
              {direccion.calle}<br />
              {direccion.cp} {direccion.localidad}, {direccion.municipio}<br />
              Mallorca
            </address>
          </div>

          {/* Cuatro iconos en una fila en vez de otras tantas lineas de texto.
              El nombre accesible de cada enlace sigue siendo el dato entero (el
              numero, el correo, la calle), que es lo que hay que leer en voz
              alta; los dibujos van aria-hidden para no leerse dos veces. */}
          <div>
            <h2>{t('pie.contacto')}</h2>
            <ul className="pie__contacto">
              <li>
                <a href={`tel:${negocio.telefono}`} aria-label={negocio.telefonoVisible}>
                  <Icono>{TELEFONO}</Icono>
                </a>
              </li>
              <li>
                <a href={`mailto:${negocio.email}`} aria-label={negocio.email}>
                  <Icono>{EMAIL}</Icono>
                </a>
              </li>
              <li>
                <a href={negocio.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Icono>{INSTAGRAM}</Icono>
                </a>
              </li>
              {/* El unico enlace a Google Maps que queda en la web: se va a
                  Google al pulsarlo, no antes, asi que sigue sin haber una
                  peticion a terceros en la propia visita. */}
              <li>
                <a href={negocio.maps} target="_blank" rel="noreferrer"
                   aria-label={t('pie.comoLlegar')}>
                  <Icono>{UBICACION}</Icono>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pie__cierre">
          <p className="pie__legal">
            © {new Date().getFullYear()} {negocio.nombre}. {t('pie.derechos')}.
          </p>

          {/* LSSI art. 10: el aviso legal tiene que estar accesible de forma
              permanente, facil y directa, y el pie sale en todas las vistas. */}
          <nav className="pie__enlaces-legales" aria-label={t('pie.legal')}>
            <a href={ruta(idioma, AVISO)}>{t('pie.avisoLegal')}</a>
            <a href={ruta(idioma, PRIVACIDAD)}>{t('pie.privacidad')}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
