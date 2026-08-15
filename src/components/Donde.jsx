import { useEffect, useRef, useState } from 'react';
import { borrar, guardar, leer } from '../almacen.js';
import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import './Donde.css';

/** Recuerda que el visitante ya dijo que si al mapa. Solo existe si lo dijo. */
const CLAVE_MAPA = 'diagon:mapa';

export default function Donde() {
  const { t } = useIdioma();
  const { direccion, geo } = negocio;

  // El iframe no se monta hasta que el visitante lo pide: cargarlo comunica su
  // IP a Google y usa almacenamiento del navegador, y eso exige consentimiento
  // previo (art. 22.2 LSSI). Asi el sitio no tiene ningun rastreador no exento
  // y no necesita banner de cookies.
  //
  // La respuesta se recuerda para no volver a preguntar en cada visita. Lo que
  // se guarda es la decision, no un identificador, y tiene que poder retirarse
  // con la misma facilidad con que se dio (art. 7.3 RGPD): de ahi el boton de
  // ocultar, que quita el mapa y borra el dato.
  const [mapaVisible, setMapaVisible] = useState(() => leer(CLAVE_MAPA) === '1');
  const marco = useRef(null);
  const boton = useRef(null);
  const anterior = useRef(mapaVisible);

  // El boton que enciende el mapa desaparece al pulsarlo y el foco se caeria al
  // principio del documento. Se lleva al mapa, que es lo que se acaba de pedir,
  // y al ocultarlo vuelve al boton que lo enciende.
  useEffect(() => {
    // Solo cuando cambia, no al montar: si el consentimiento venia guardado, el
    // mapa ya esta puesto y llevar ahi el foco dejaria a quien entra en el
    // final de la portada sin haber pedido nada.
    const cambio = anterior.current !== mapaVisible;
    anterior.current = mapaVisible;
    if (!cambio) return;
    if (mapaVisible) marco.current?.focus();
    else boton.current?.focus();
  }, [mapaVisible]);

  const mostrarMapa = () => {
    setMapaVisible(true);
    guardar(CLAVE_MAPA, '1');
  };

  const ocultarMapa = () => {
    setMapaVisible(false);
    borrar(CLAVE_MAPA);
  };

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

        {mapaVisible ? (
          <div className="donde__mapa-zona">
            <iframe
              ref={marco}
              className="donde__mapa"
              src={mapa}
              title={t('donde.mapaTitulo')}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <button
              type="button"
              className="donde__mapa-boton donde__mapa-boton--suave"
              onClick={ocultarMapa}
            >
              {t('donde.mapaOcultar')}
            </button>
          </div>
        ) : (
          <div className="donde__mapa donde__mapa--previo">
            <p className="donde__mapa-aviso">{t('donde.mapaAviso')}</p>
            {/* Antes del boton: quien lo pulsa tiene que haber leido ya que la
                respuesta se recuerda, no enterarse despues. */}
            <p className="donde__mapa-aviso donde__mapa-aviso--menor">
              {t('donde.mapaRecordar')}
            </p>
            <button
              ref={boton}
              type="button"
              className="donde__mapa-boton"
              onClick={mostrarMapa}
            >
              {t('donde.mapaCargar')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
