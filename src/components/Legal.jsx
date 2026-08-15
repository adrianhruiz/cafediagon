import { useIdioma } from '../i18n/idioma.jsx';
import { AVISO, PRIVACIDAD, ruta } from '../rutas.js';
import negocio from '../content/business.json';
import es from '../content/legal.es.json';
import en from '../content/legal.en.json';
import de from '../content/legal.de.json';
import ca from '../content/legal.ca.json';
import './Legal.css';

/**
 * Los cuatro idiomas van juntos aqui, al reves que la carta. Son 4 KB cada uno
 * y este trozo solo se baja cuando alguien abre el aviso legal o la privacidad:
 * no pesa en el arranque, que es lo que habia que proteger.
 */
const TEXTOS = { es, en, de, ca };

/** Filas de la ficha de identificacion segun donde se pinte. */
const FILAS = {
  // LSSI art. 10: nombre, NIF, domicilio, contacto directo y, por ser
  // actividad sujeta a autorizacion, el titulo que la habilita.
  completa: ['titular', 'nif', 'nombreComercial', 'domicilio', 'telefono', 'email',
    'actividad', 'licencia'],
  // RGPD art. 13.1.a: identidad y datos de contacto del responsable. El
  // epigrafe del IAE y el expediente municipal no pintan nada aqui.
  responsable: ['titular', 'nif', 'domicilio', 'telefono', 'email'],
};

/** Sustituye {marcadores}, igual que los textos de la interfaz. */
const rellenar = (texto, valores) =>
  texto.replace(/\{(\w+)\}/g, (coincidencia, clave) =>
    clave in valores ? String(valores[clave]) : coincidencia);

function fichaDe(identidad, datos) {
  const { direccion } = negocio;
  const domicilio = `${direccion.calle}, ${direccion.cp} ${direccion.localidad} `
    + `(${direccion.municipio}), ${direccion.provincia}`;

  return {
    titular: { texto: negocio.titular },
    nif: { texto: negocio.nif },
    nombreComercial: { texto: negocio.nombre },
    domicilio: { texto: domicilio },
    telefono: { texto: negocio.telefonoVisible, enlace: `tel:${negocio.telefono}` },
    email: { texto: negocio.email, enlace: `mailto:${negocio.email}` },
    actividad: { texto: identidad.actividadValor },
    licencia: { texto: rellenar(identidad.licenciaValor, datos) },
  };
}

function Ficha({ identidad, filas, valores }) {
  return (
    <dl className="legal__ficha">
      {filas.map((clave) => {
        const { texto, enlace } = valores[clave];
        return (
          <div className="legal__fila" key={clave}>
            <dt>{identidad[clave]}</dt>
            <dd>{enlace ? <a href={enlace}>{texto}</a> : texto}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function Bloque({ bloque, identidad, valores, datos }) {
  if (bloque.identidad) {
    return <Ficha identidad={identidad} filas={FILAS[bloque.identidad]} valores={valores} />;
  }
  if (bloque.lista) {
    return (
      <ul className="legal__lista">
        {bloque.lista.map((linea) => <li key={linea}>{rellenar(linea, datos)}</li>)}
      </ul>
    );
  }
  if (bloque.datos) {
    return (
      <dl className="legal__ficha">
        {bloque.datos.map(([etiqueta, valor]) => (
          <div className="legal__fila" key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{rellenar(valor, datos)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p>{rellenar(bloque.p, datos)}</p>;
}

/**
 * Aviso legal (LSSI art. 10) y politica de privacidad (RGPD arts. 13-14).
 *
 * Las dos son la misma pagina con otro texto, asi que el componente no sabe de
 * cual se trata: recibe el trozo de URL y pinta el documento que le toca.
 */
export default function Legal({ pagina = AVISO }) {
  const { idioma, t } = useIdioma();
  const textos = TEXTOS[idioma] ?? TEXTOS.es;
  const esAviso = pagina !== PRIVACIDAD;
  const doc = esAviso ? textos.aviso : textos.privacidad;

  // Los datos de contacto y del expediente salen de business.json y no se
  // repiten en los cuatro idiomas: los textos los nombran con {marcadores}.
  const datos = {
    email: negocio.email,
    telefono: negocio.telefonoVisible,
    nombre: negocio.nombre,
    titular: negocio.titular,
    organo: negocio.licencia.organo,
    expediente: negocio.licencia.expediente,
  };
  const valores = fichaDe(textos.identidad, datos);

  return (
    <section className="seccion legal">
      <div className="envoltorio legal__hoja">
        <p className="seccion__etiqueta">{t('legal.etiqueta')}</p>
        <h1 className="seccion__titulo legal__titulo">{doc.titulo}</h1>
        <p className="seccion__entrada">{doc.entrada}</p>
        <p className="legal__fecha">{textos.actualizado}</p>

        {doc.secciones.map((seccion) => (
          <section className="legal__seccion" key={seccion.titulo}>
            <h2>{seccion.titulo}</h2>
            {seccion.bloques.map((bloque, i) => (
              <Bloque
                /* Los bloques de una seccion no se reordenan nunca: son texto
                   fijo, asi que el indice vale de clave. */
                key={i}
                bloque={bloque}
                identidad={textos.identidad}
                valores={valores}
                datos={datos}
              />
            ))}
          </section>
        ))}

        <nav className="legal__pie" aria-label={t('legal.etiqueta')}>
          <a href={ruta(idioma, esAviso ? PRIVACIDAD : AVISO)}>
            {esAviso ? t('pie.privacidad') : t('pie.avisoLegal')}
          </a>
          <a href={ruta(idioma)}>{t('legal.volver')}</a>
        </nav>
      </div>
    </section>
  );
}
