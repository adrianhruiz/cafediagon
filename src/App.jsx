import { useIdioma } from './i18n/idioma.jsx';
import negocio from './content/business.json';
import Cabecera from './components/Cabecera.jsx';
import Hero from './components/Hero.jsx';
import Sobre from './components/Sobre.jsx';
import Carta from './components/Carta.jsx';
import Juegos from './components/Juegos.jsx';
import Galeria from './components/Galeria.jsx';
import Donde from './components/Donde.jsx';
import Pie from './components/Pie.jsx';
import './App.css';

export default function App() {
  const { t } = useIdioma();

  return (
    <>
      <a className="saltar" href="#contenido">{t('nav.saltar')}</a>
      <Cabecera />
      <main id="contenido">
        <Hero />
        <p className="franja-premio">
          <span aria-hidden="true">🏆</span>{' '}
          <b>{negocio.premio.entidad} {negocio.premio.anyo}</b> — {t('premio')}
        </p>
        <Sobre />
        <Carta />
        <Juegos />
        <Galeria />
        <Donde />
      </main>
      <Pie />
    </>
  );
}
