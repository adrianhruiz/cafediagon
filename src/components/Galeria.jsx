import { idiomaDeCampo, useIdioma } from '../i18n/idioma.jsx';
import galeria from '../content/gallery.json';
import Imagen from './Imagen.jsx';
import './Galeria.css';

export default function Galeria() {
  const { t, campo, idioma } = useIdioma();

  return (
    <section className="seccion" id="galeria">
      <div className="envoltorio">
        <p className="seccion__etiqueta">{t('galeria.etiqueta')}</p>
        <h2 className="seccion__titulo">{t('galeria.titulo')}</h2>

        <ul className="galeria">
          {/*
            La descripcion va en el alt y ya no se pinta debajo. Antes era un
            pie sobre una franja opaca pegada al borde inferior de la foto: se
            leia bien, pero se comia el tercio de abajo de cada imagen, que es
            justo lo que se viene a ver.

            Quien no ve la pantalla no pierde nada, que el alt dice lo mismo que
            decia el pie. Quien la ve gana la foto entera.

            lang en el <img> por si algun dia falta una traduccion: el alt se
            lee con el idioma del elemento que lo lleva, y sin esto un lector en
            aleman diria el castellano de respaldo con voz alemana (3.1.2).
          */}
          {galeria.map(({ img, alt }) => {
            const codigo = idiomaDeCampo(alt, idioma);
            return (
              <li key={img}>
                <Imagen
                  nombre={img}
                  alt={campo(alt)}
                  lang={codigo === idioma ? undefined : codigo}
                  sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
