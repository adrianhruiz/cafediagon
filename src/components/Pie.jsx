import { useIdioma } from '../i18n/idioma.jsx';
import { AVISO, PRIVACIDAD, ruta } from '../rutas.js';
import negocio from '../content/business.json';
import './Pie.css';

export default function Pie() {
  const { idioma, t } = useIdioma();
  const { direccion } = negocio;

  return (
    <footer className="pie">
      <div className="envoltorio">
        <div className="pie__columnas">
          <div>
            <h2>{negocio.nombre}</h2>
            <address>
              {direccion.calle}<br />
              {direccion.cp} {direccion.localidad}, Mallorca
            </address>
          </div>

          <div>
            <h2>{t('pie.contacto')}</h2>
            <a href={`tel:${negocio.telefono}`}>{negocio.telefonoVisible}</a><br />
            <a href={`mailto:${negocio.email}`}>{negocio.email}</a>
          </div>

          <div>
            <h2>{t('pie.siguenos')}</h2>
            <a href={negocio.instagram} target="_blank" rel="noreferrer">Instagram</a>
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
