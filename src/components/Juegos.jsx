import { useIdioma } from '../i18n/idioma.jsx';
import Imagen from './Imagen.jsx';
import './Juegos.css';

/** Identificados en la foto de la estanteria. Los titulos no se traducen. */
const JUEGOS = [
  'Exploding Kittens', 'Azul', 'Munchkin', 'Arkham Horror', 'Paleo',
  '7 Wonders Duel', 'The Mind', 'Virus!', 'Sushi Go!', 'Trio', 'Secret Hitler',
  'Las Leyendas de Andor', 'Smart 10', 'Pasapalabra', 'Pictionary', 'Dominó',
  'Monopoly', 'Trivial Pursuit Harry Potter', 'Memory Harry Potter', 'Uno',
];

export default function Juegos() {
  const { t } = useIdioma();

  return (
    <section className="seccion juegos" id="juegos">
      <div className="envoltorio juegos__rejilla">
        <Imagen
          nombre="06-DJEJYueMzZM"
          alt={t('juegos.fotoAlt')}
          sizes="(max-width: 900px) 100vw, 50vw"
          className="juegos__foto"
        />
        <div>
          <p className="seccion__etiqueta">{t('juegos.etiqueta')}</p>
          <h2 className="seccion__titulo">{t('juegos.titulo')}</h2>
          <p className="seccion__entrada">{t('juegos.texto')}</p>
          <ul className="juegos__lista">
            {JUEGOS.map((j) => <li key={j}>{j}</li>)}
            <li className="juegos__mas">{t('juegos.yMas')}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
