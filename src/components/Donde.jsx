import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import './Donde.css';

export default function Donde() {
  const { t } = useIdioma();
  const { direccion, geo } = negocio;

  // Mapa sin API key: el modo embed publico basta para una ficha estatica.
  const mapa = `https://www.google.com/maps?q=${geo.lat},${geo.lng}&hl=es&z=17&output=embed`;

  return (
    <section className="seccion seccion--alt" id="donde">
      <div className="envoltorio donde">
        <div>
          <p className="seccion__etiqueta">{t('donde.etiqueta')}</p>
          <h2 className="seccion__titulo">{t('donde.titulo')}</h2>

          <ul className="donde__datos">
            <li>
              <h3>{t('donde.direccion')}</h3>
              <address>
                {direccion.calle}<br />
                {direccion.cp} {direccion.localidad}, {direccion.municipio}<br />
                Mallorca
              </address>
              <a className="donde__mapa-enlace" href={negocio.maps}
                 target="_blank" rel="noreferrer">{t('donde.comoLlegar')}</a>
            </li>

            <li>
              <h3>{t('donde.horario')}</h3>
              {negocio.horario
                ? <ul className="donde__horario">
                    {negocio.horario.map((h) => (
                      <li key={h.dias}><span>{h.dias}</span><span>{h.horas}</span></li>
                    ))}
                  </ul>
                : <p className="donde__pendiente">{t('donde.horarioPendiente')}</p>}
            </li>

            <li>
              <h3>{t('donde.telefono')}</h3>
              <a href={`tel:${negocio.telefono}`}>{negocio.telefonoVisible}</a>
            </li>

            <li>
              <h3>{t('donde.email')}</h3>
              <a href={`mailto:${negocio.email}`}>{negocio.email}</a>
            </li>

            <li>
              <h3>{t('donde.instagram')}</h3>
              <a href={negocio.instagram} target="_blank" rel="noreferrer">@cafediagon</a>
            </li>
          </ul>
        </div>

        <iframe
          className="donde__mapa"
          src={mapa}
          title={t('donde.mapaTitulo')}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
