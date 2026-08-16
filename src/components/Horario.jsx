import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import './Horario.css';

export default function Horario() {
  const { t } = useIdioma();

  // Esta seccion era "Donde estamos" y llevaba tambien la direccion y el mapa.
  // La direccion esta ahora en el pie, con su enlace a Google Maps, que es
  // donde se busca y ademas sale en todas las paginas; aqui se queda lo unico
  // que no se puede leer en ningun otro sitio, que es a que hora abrimos.

  return (
    <section className="seccion seccion--alt" id="horario">
      <div className="envoltorio">
        <p className="seccion__etiqueta">{t('horario.etiqueta')}</p>
        <h2 className="seccion__titulo">{t('horario.titulo')}</h2>

        {/* El horario se guarda por dia y en 24 h, no como frase hecha: asi el
            nombre del dia sale del diccionario de idiomas y el aleman no lee
            "lunes". El mismo dato alimenta el openingHoursSpecification del
            JSON-LD. */}
        {negocio.horario
          ? <ul className="horario__dias">
              {negocio.horario.map((h) => (
                <li key={h.dia} className={h.cerrado ? 'horario__dias--cerrado' : undefined}>
                  <span>{t(`horario.dias.${h.dia}`)}</span>
                  <span>{h.cerrado ? t('horario.cerrado') : `${h.abre} – ${h.cierra}`}</span>
                </li>
              ))}
            </ul>
          : <p className="horario__pendiente">{t('horario.pendiente')}</p>}
      </div>
    </section>
  );
}
