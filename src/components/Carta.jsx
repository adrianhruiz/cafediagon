import { useMemo, useState } from 'react';
import { useIdioma } from '../i18n/idioma.jsx';
import menu from '../content/menu.json';
import './Carta.css';

const TODO = 'todo';

export default function Carta() {
  const { t, campo, idioma } = useIdioma();
  const [filtro, setFiltro] = useState(TODO);

  const total = useMemo(
    () => menu.categorias.reduce((n, c) => n + c.productos.length, 0),
    [],
  );

  const visibles = filtro === TODO
    ? menu.categorias
    : menu.categorias.filter((c) => c.id === filtro);

  // Sin precios todavia, no tiene sentido prometer una columna de precios.
  const hayPrecios = menu.categorias.some((c) => c.productos.some((p) => p.precio != null));

  return (
    <section className="seccion seccion--alt" id="carta">
      <div className="envoltorio">
        <p className="seccion__etiqueta">{t('carta.etiqueta')}</p>
        <h2 className="seccion__titulo">{t('carta.titulo')}</h2>
        <p className="seccion__entrada">
          {t('carta.entrada', { platos: total, categorias: menu.categorias.length })}
        </p>

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
              {campo(c.nombre)}
            </button>
          ))}
        </div>

        {!hayPrecios && <p className="carta__aviso">{t('carta.avisoPrecios')}</p>}

        {/* Obligatorio: los 14 alergenos hay que informarlos en cualquier soporte
            donde se presente la oferta, tambien en la carta web (Rgto 1169/2011). */}
        <p className="carta__aviso">{t('carta.avisoAlergenos')}</p>

        {visibles.map((c) => (
          <section className="carta__categoria" key={c.id} aria-labelledby={`cat-${c.id}`}>
            <h3 className="carta__categoria-titulo" id={`cat-${c.id}`}>
              {campo(c.nombre)}
              <span className="carta__cuenta">{c.productos.length}</span>
            </h3>

            <ul className="carta__lista">
              {c.productos.map((p) => {
                const desc = campo(p.descripcion);
                return (
                  <li className="plato" key={p.id}>
                    <div className="plato__cabecera">
                      <h4 className="plato__nombre">
                        {campo(p.nombre)}
                        {p.sinGluten && (
                          <span className="plato__etiqueta">{t('carta.sinGluten')}</span>
                        )}
                      </h4>
                      <span className="plato__linea" aria-hidden="true" />
                      <span className="plato__precio">
                        {p.precio != null
                          ? p.precio.toLocaleString(idioma, { style: 'currency', currency: 'EUR' })
                          : t('carta.precioPendiente')}
                      </span>
                    </div>
                    {desc && <p className="plato__descripcion">{desc}</p>}
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
