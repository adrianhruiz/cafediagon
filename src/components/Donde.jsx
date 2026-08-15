import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import Imagen from './Imagen.jsx';
import './Donde.css';

/** Licencia de las teselas con las que esta dibujado el mapa (ODbL). */
const OSM = 'https://www.openstreetmap.org/copyright';

export default function Donde() {
  const { t } = useIdioma();
  const { direccion } = negocio;

  // El mapa es una imagen servida por esta misma web, dibujada en el build por
  // scripts/build-mapa.mjs con teselas de OpenStreetMap. El iframe de Google
  // mandaba la IP del visitante a Google y escribia en su navegador antes de
  // que consintiera nada (art. 22.2 LSSI), asi que habia que pedirle permiso
  // con un boton: mucha friccion para lo que casi todo el mundo quiere, que es
  // ver donde cae el cafe. Asi se ve al entrar, no sale ni una peticion a
  // terceros y la web sigue sin necesitar banner de cookies. Quien quiera
  // llegar hasta aqui pulsa y se va a Google Maps, que es una visita suya a
  // otro sitio.

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
              {/* El horario se guarda por dia y en 24 h, no como frase hecha:
                  asi el nombre del dia sale del diccionario de idiomas y el
                  aleman no lee "lunes". El mismo dato alimenta el
                  openingHoursSpecification del JSON-LD. */}
              {negocio.horario
                ? <ul className="donde__horario">
                    {negocio.horario.map((h) => (
                      <li key={h.dia} className={h.cerrado ? 'donde__horario--cerrado' : undefined}>
                        <span>{t(`donde.dias.${h.dia}`)}</span>
                        <span>{h.cerrado ? t('donde.cerrado') : `${h.abre} – ${h.cierra}`}</span>
                      </li>
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

        <div className="donde__mapa-zona">
          {/* El mapa entero lleva a Google Maps, que es lo que se espera al
              pulsarlo, y ahi ya decide el visitante: es una salida de la web,
              no una carga de terceros dentro de ella. */}
          <a className="donde__mapa" href={negocio.maps} target="_blank" rel="noreferrer">
            <Imagen
              nombre="mapa"
              alt={t('donde.mapaTitulo')}
              sizes="(max-width: 900px) 92vw, 46vw"
            />
          </a>
          {/* La atribucion de OpenStreetMap la pide su licencia (ODbL). Va
              tambien quemada en la propia imagen, por si se comparte suelta. */}
          <p className="donde__mapa-credito">
            <a href={OSM} target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
          </p>
        </div>
      </div>
    </section>
  );
}
