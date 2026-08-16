import { useIdioma } from '../i18n/idioma.jsx';
import negocio from '../content/business.json';
import Imagen from './Imagen.jsx';
import './Hero.css';

export default function Hero() {
  const { t } = useIdioma();

  return (
    <section className="hero" id="inicio">
      <Imagen
        nombre="17-DEx8Xqxsd16"
        alt=""
        sizes="100vw"
        prioridad
        className="hero__fondo"
      />
      <div className="hero__contenido">
        <p className="hero__ubicacion">{t('hero.ubicacion')}</p>
        <h1 className="hero__titulo">{t('hero.titulo')}</h1>
        <p className="hero__entrada">{t('hero.entrada')}</p>
        <div className="hero__botones">
          <a className="boton boton--principal" href="#carta">{t('hero.verCarta')}</a>
          <a className="boton boton--secundario" href={negocio.maps}
             target="_blank" rel="noreferrer">{t('hero.comoLlegar')}</a>
        </div>

        {/* Directiva Omnibus: una distincion anunciada tiene que poder
            comprobarse. Se enlaza a la ficha que la acredita en vez de
            incrustar el sello de Restaurant Guru, que trae una hoja de estilos
            de su CDN y devolveria un rastreador a la web.

            Va aqui, bajo los botones, y no en una franja propia: la franja
            gastaba una banda entera de alto para una linea de texto. */}
        <p className="hero__premio">
          <a href={negocio.premio.url} target="_blank" rel="noreferrer">
            <span aria-hidden="true">🏆</span>{' '}
            <b>{negocio.premio.entidad} {negocio.premio.anyo}</b> — {t('premio')}
          </a>
        </p>
      </div>
    </section>
  );
}
