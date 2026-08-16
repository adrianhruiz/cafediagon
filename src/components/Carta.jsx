import { use, useEffect, useMemo, useRef, useState } from 'react';
import { Campo, useIdioma } from '../i18n/idioma.jsx';
import './Carta.css';

const TODO = 'todo';

/**
 * La carta en los cuatro idiomas son 53 KB minificados dentro del bundle, y
 * tres cuartas partes son texto que ese visitante no va a leer. Cada idioma va
 * en su propio trozo (scripts/build-menu.mjs los genera) y solo se baja el que
 * se esta leyendo, cuando hace falta y no antes del primer pintado.
 *
 * Las dos tablas van fuera del componente para que sobrevivan a los montajes:
 * pedidas guarda la promesa (sin esto cada render lanzaria otra peticion) y
 * resueltas lo que ya ha llegado, que es lo unico que se puede pintar sin
 * suspender.
 *
 * cartaDe se exporta solo para tests/setup.js, que la usa para bajar los cuatro
 * idiomas antes de empezar. El motivo esta explicado alli.
 */
const pedidas = new Map();
const resueltas = new Map();

export function cartaDe(idioma) {
  if (!pedidas.has(idioma)) {
    pedidas.set(idioma, import(`../content/menu.${idioma}.json`).then((m) => {
      resueltas.set(idioma, m.default);
      return m.default;
    }));
  }
  return pedidas.get(idioma);
}

/**
 * Espera la carta del idioma pedido y se la pasa a la que pinta.
 *
 * La primera vez suspende, y el hueco lo pone el <Suspense> de App. El efecto
 * es lo que despierta al componente cuando el trozo llega: sin el, la promesa
 * se resuelve y nadie vuelve a pintar. Con el prerender esto casi no se ve, que
 * el fichero publicado ya trae la carta hecha, pero se sigue recorriendo al
 * hidratar y en el servidor de desarrollo.
 *
 * Va suelto y sin un solo hook detras del use() a proposito: cuando use()
 * suspende, React vuelve a ejecutar el componente desde arriba, y los hooks que
 * quedasen despues no llegan a registrarse en la primera pasada. Por eso lo que
 * pinta la carta es otro componente y recibe el menu por prop.
 */
export default function Carta() {
  const { idioma } = useIdioma();
  const [, repintar] = useState(0);
  const ultima = useRef(null);
  const llegada = resueltas.get(idioma);

  useEffect(() => {
    if (resueltas.has(idioma)) return;
    let vivo = true;
    cartaDe(idioma).then(() => { if (vivo) repintar((n) => n + 1); });
    return () => { vivo = false; };
  }, [idioma]);

  // use() se puede llamar bajo condicion, al reves que el resto de hooks: es
  // justo para esto.
  const menu = llegada ?? ultima.current ?? use(cartaDe(idioma));
  ultima.current = menu;

  return <CartaPintada menu={menu} />;
}

function CartaPintada({ menu }) {
  const { t, campo, idioma } = useIdioma();
  const [filtro, setFiltro] = useState(TODO);

  // Los dos recorren las 15 categorias o los 151 productos, y se rehacian en
  // cada render: tambien al pulsar un filtro y al cambiar de idioma.
  const visibles = useMemo(
    () => (filtro === TODO ? menu.categorias : menu.categorias.filter((c) => c.id === filtro)),
    [menu, filtro],
  );

  const nombreDelFiltro = filtro === TODO
    ? t('carta.todo')
    : campo(menu.categorias.find((c) => c.id === filtro)?.nombre);

  // Sin precios todavia, no tiene sentido prometer una columna de precios.
  const hayPrecios = useMemo(
    () => menu.categorias.some((c) => c.productos.some((p) => p.precio != null)),
    [menu],
  );

  const precioDe = (p) => {
    if (p.precio == null) return t('carta.precioPendiente');
    if (p.precio === 0) return t('carta.gratis');
    return p.precio.toLocaleString(idioma, { style: 'currency', currency: 'EUR' });
  };

  /**
   * Rgto (UE) 1169/2011: hay que informar de los 14, y aqui se informa plato a
   * plato. Repetir "Ninguno de los 14" bajo dos tercios de la carta (aguas,
   * cafes solos, licores) es ruido que tapa los platos que si llevan algo, asi
   * que la lista vacia no escribe linea.
   *
   * Sin dato es otra cosa y no puede confundirse con ese silencio: se manda a
   * preguntar en el local, que es afirmar menos que decir que no lleva nada.
   * tests/contenido.test.js vigila que ningun producto llegue sin el dato.
   */
  const alergenosDe = (p) => {
    if (p.alergenos == null) return t('carta.alergenosPendientes');
    if (!p.alergenos.length) return null;
    return p.alergenos.map((a) => t(`carta.alergeno.${a}`)).join(', ');
  };

  return (
    <section className="seccion seccion--alt" id="carta">
      <div className="envoltorio">
        <p className="seccion__etiqueta">{t('carta.etiqueta')}</p>
        <h2 className="seccion__titulo">{t('carta.titulo')}</h2>

        {/* Los dos avisos obligatorios suben aqui, al hueco que dejo la
            entradilla: son la letra pequena de todo lo que viene debajo, y
            debajo de los filtros quedaban ya empezada la lista de platos.

            El de la cocina compartida va primero: es el unico de los dos que
            puede acabar en urgencias. Debajo, TRLGDCU art. 20: el precio
            anunciado es el final, con impuestos incluidos, y conviene decirlo
            expresamente. */}
        <div className="carta__avisos">
          <p className="carta__aviso">
            <strong>{t('carta.avisoCocina')}</strong>
          </p>
          <p className="carta__aviso">
            <strong>{hayPrecios ? t('carta.avisoIva') : t('carta.avisoPrecios')}</strong>
          </p>
        </div>

        <div className="carta__filtros" role="group" aria-label={t('carta.filtrarPor')}>
          <button
            type="button"
            onClick={() => setFiltro(TODO)}
            aria-pressed={filtro === TODO}
          >
            {t('carta.todo')}
          </button>
          {menu.categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltro(c.id)}
              aria-pressed={filtro === c.id}
            >
              <Campo valor={c.nombre} />
            </button>
          ))}
        </div>

        {/* Al filtrar se cambia media pagina sin mover el foco: quien no ve la
            pantalla no se entera de nada si no se le dice (4.1.3). */}
        <p className="oculto-visual" role="status">
          {t('carta.resultado', { filtro: nombreDelFiltro })}
        </p>

        {/* --platos alimenta la estimacion de alto de Carta.css: sin ella el
            navegador no sabe si el bloque que se salta tiene 3 platos o 28. */}
        {visibles.map((c) => (
          <section
            className="carta__categoria"
            key={c.id}
            aria-labelledby={`cat-${c.id}`}
            style={{ '--platos': c.productos.length }}
          >
            {/* La cuenta se oculta al lector: dentro del h3 convertiria el
                nombre de la seccion en "Tostadas 8", y la propia lista ya
                anuncia cuantos elementos tiene. */}
            <h3 className="carta__categoria-titulo" id={`cat-${c.id}`}>
              <Campo valor={c.nombre} />
              <span className="carta__cuenta" aria-hidden="true">{c.productos.length}</span>
            </h3>

            <ul className="carta__lista">
              {c.productos.map((p) => {
                const desc = campo(p.descripcion);
                const alergenos = alergenosDe(p);
                return (
                  <li className="plato" key={p.id}>
                    <div className="plato__cabecera">
                      <h4 className="plato__nombre">
                        <Campo valor={p.nombre} />
                        {p.sinGluten && (
                          <span className="plato__etiqueta">{t('carta.sinGluten')}</span>
                        )}
                      </h4>
                      <span className="plato__linea" aria-hidden="true" />
                      <span className="plato__precio">{precioDe(p)}</span>
                    </div>
                    {desc && (
                      <p className="plato__descripcion"><Campo valor={p.descripcion} /></p>
                    )}
                    {alergenos && (
                      <p className="plato__alergenos">
                        <span className="plato__alergenos-etiqueta">
                          {t('carta.alergenosEtiqueta')}:
                        </span>{' '}
                        {alergenos}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
