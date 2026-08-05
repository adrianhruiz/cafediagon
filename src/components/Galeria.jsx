import { useIdioma } from '../i18n/idioma.jsx';
import galeria from '../content/gallery.json';
import negocio from '../content/business.json';
import Imagen from './Imagen.jsx';
import './Galeria.css';

export default function Galeria() {
  const { t, campo } = useIdioma();

  return (
    <section className="seccion" id="galeria">
      <div className="envoltorio">
        <p className="seccion__etiqueta">{t('galeria.etiqueta')}</p>
        <h2 className="seccion__titulo">{t('galeria.titulo')}</h2>

        <ul className="galeria">
          {galeria.map(({ img, alt }) => (
            <li key={img}>
              <figure>
                <Imagen
                  nombre={img}
                  alt={campo(alt)}
                  sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
                />
                <figcaption>{campo(alt)}</figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <p className="galeria__enlace">
          <a href={negocio.instagram} target="_blank" rel="noreferrer">
            {t('galeria.verEnInstagram')}
          </a>
        </p>
      </div>
    </section>
  );
}
