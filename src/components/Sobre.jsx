import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import Imagen from './Imagen.jsx';
import './Sobre.css';

export default function Sobre() {
  const { t, idioma } = useIdioma();
  const valoracion = negocio.google.valoracion.toLocaleString(idioma, { minimumFractionDigits: 1 });

  return (
    <section className="seccion" id="sobre">
      <div className="envoltorio sobre">
        <div>
          <p className="seccion__etiqueta">{t('sobre.etiqueta')}</p>
          <h2 className="seccion__titulo">{t('sobre.titulo')}</h2>
          <p className="seccion__entrada">{t('sobre.texto')}</p>

          <ul className="sobre__datos">
            <li>
              <b>{valoracion}</b>
              <span>{t('sobre.datoValoracion', { n: negocio.google.resenas })}</span>
            </li>
            <li>
              <b>+200</b>
              <span>{t('sobre.datoJuegos')}</span>
            </li>
            <li>
              <b>{negocio.premio.anyo}</b>
              <span>{t('sobre.datoPremio')}</span>
            </li>
          </ul>
        </div>

        <Imagen
          nombre="21-DEnfYHEMvoF"
          alt=""
          sizes="(max-width: 900px) 100vw, 50vw"
          className="sobre__foto"
        />
      </div>
    </section>
  );
}
