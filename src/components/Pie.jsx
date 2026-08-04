import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import './Pie.css';

export default function Pie() {
  const { t } = useIdioma();
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

        <p className="pie__legal">
          © {new Date().getFullYear()} {negocio.nombre}. {t('pie.derechos')}.
        </p>
      </div>
    </footer>
  );
}
