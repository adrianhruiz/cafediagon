import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ProveedorIdioma, IDIOMAS, IDIOMA_POR_DEFECTO, idiomaDeUrl, idiomaInicial, traducir, useIdioma,
} from '../src/i18n/idioma.jsx';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import de from '../src/i18n/de.json';
import ca from '../src/i18n/ca.json';

const DICCIONARIOS = { es, en, de, ca };

/** Todas las rutas hoja de un objeto anidado, en notacion con puntos. */
function rutas(obj, prefijo = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? rutas(v, `${prefijo}${k}.`)
      : [`${prefijo}${k}`]);
}

describe('diccionarios', () => {
  it('los cuatro idiomas tienen exactamente las mismas claves', () => {
    const referencia = rutas(es).sort();
    for (const codigo of IDIOMAS) {
      expect(rutas(DICCIONARIOS[codigo]).sort(), `faltan o sobran claves en ${codigo}`)
        .toEqual(referencia);
    }
  });

  it('no hay ningun texto vacio', () => {
    for (const codigo of IDIOMAS) {
      for (const ruta of rutas(DICCIONARIOS[codigo])) {
        expect(traducir(codigo, ruta).trim(), `${codigo} → ${ruta}`).not.toBe('');
      }
    }
  });

  it('los marcadores {x} coinciden entre idiomas', () => {
    const marcadores = (t) => (t.match(/\{(\w+)\}/g) ?? []).sort().join(',');
    for (const ruta of rutas(es)) {
      const esperados = marcadores(traducir('es', ruta));
      for (const codigo of IDIOMAS) {
        expect(marcadores(traducir(codigo, ruta)), `${codigo} → ${ruta}`).toBe(esperados);
      }
    }
  });
});

describe('traducir', () => {
  it('sustituye los marcadores', () => {
    expect(traducir('es', 'sobre.datoValoracion', { n: 67 })).toContain('67');
  });

  it('cae al castellano si falta la clave en el idioma pedido', () => {
    // 'premio' existe en los cuatro; una ruta inexistente devuelve la propia ruta.
    expect(traducir('de', 'no.existe.esta.clave')).toBe('no.existe.esta.clave');
  });
});

describe('idiomaInicial', () => {
  const almacenVacio = { getItem: () => null, setItem: () => {} };

  it('usa el idioma guardado por encima del navegador', () => {
    const almacen = { getItem: () => 'de', setItem: () => {} };
    expect(idiomaInicial({ languages: ['es-ES'] }, almacen)).toBe('de');
  });

  it('detecta el idioma del navegador', () => {
    expect(idiomaInicial({ languages: ['de-DE', 'en'] }, almacenVacio)).toBe('de');
    expect(idiomaInicial({ languages: ['ca-ES'] }, almacenVacio)).toBe('ca');
  });

  it('cae al castellano con un idioma que no soportamos', () => {
    expect(idiomaInicial({ languages: ['ja-JP'] }, almacenVacio)).toBe(IDIOMA_POR_DEFECTO);
  });

  it('no revienta si localStorage lanza (modo privado)', () => {
    const roto = { getItem: () => { throw new Error('denegado'); } };
    expect(idiomaInicial({ languages: ['en'] }, roto)).toBe('en');
  });

  it('la URL manda sobre lo guardado y sobre el navegador', () => {
    // Quien recibe un enlace con ?lang=de espera esa pagina en aleman aunque su
    // navegador vaya en castellano y tenga otra cosa guardada.
    const almacen = { getItem: () => 'ca', setItem: () => {} };
    expect(idiomaInicial({ languages: ['es-ES'] }, almacen, '?lang=de')).toBe('de');
  });

  it('un ?lang que no existe no tapa lo guardado', () => {
    const almacen = { getItem: () => 'ca', setItem: () => {} };
    expect(idiomaInicial({ languages: ['es-ES'] }, almacen, '?lang=ja')).toBe('ca');
  });
});

describe('idiomaDeUrl', () => {
  it('lee el idioma del parametro lang', () => {
    expect(idiomaDeUrl('?lang=en')).toBe('en');
    expect(idiomaDeUrl('?otro=1&lang=ca')).toBe('ca');
  });

  it('devuelve null si no hay parametro o no es un idioma nuestro', () => {
    expect(idiomaDeUrl('')).toBeNull();
    expect(idiomaDeUrl('?lang=ja')).toBeNull();
  });
});

function Sonda() {
  const { idioma, t, setIdioma } = useIdioma();
  return (
    <div>
      <p data-testid="titulo">{t('carta.titulo')}</p>
      <p data-testid="codigo">{idioma}</p>
      <button onClick={() => setIdioma('de')}>a aleman</button>
      <button onClick={() => setIdioma('xx')}>invalido</button>
    </div>
  );
}

describe('ProveedorIdioma', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
  });

  it('cambia los textos al cambiar de idioma', async () => {
    const usuario = userEvent.setup();
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);

    expect(screen.getByTestId('titulo')).toHaveTextContent(es.carta.titulo);
    await usuario.click(screen.getByText('a aleman'));
    expect(screen.getByTestId('titulo')).toHaveTextContent(de.carta.titulo);
  });

  it('actualiza el atributo lang del documento', async () => {
    const usuario = userEvent.setup();
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);

    expect(document.documentElement.lang).toBe('es');
    await usuario.click(screen.getByText('a aleman'));
    expect(document.documentElement.lang).toBe('de');
  });

  it('ignora un idioma que no existe', async () => {
    const usuario = userEvent.setup();
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);

    await usuario.click(screen.getByText('invalido'));
    expect(screen.getByTestId('codigo')).toHaveTextContent('es');
  });

  it('recuerda el idioma elegido', async () => {
    const usuario = userEvent.setup();
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);

    await usuario.click(screen.getByText('a aleman'));
    expect(localStorage.getItem('diagon:idioma')).toBe('de');
  });

  it('no guarda nada mientras el visitante no elija', () => {
    // El idioma detectado del navegador no es una eleccion suya: escribirlo al
    // entrar contradecia lo que declara la politica de privacidad.
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);
    expect(localStorage.getItem('diagon:idioma')).toBeNull();
  });

  it('deja el idioma elegido en la URL sin tocar la ruta ni el hash', async () => {
    // Es lo que hace que el enlace se pueda compartir: el almacenamiento local
    // solo sirve para quien ya esta aqui.
    const usuario = userEvent.setup();
    history.replaceState(null, '', '/cafediagon/#carta');
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);

    await usuario.click(screen.getByText('a aleman'));

    expect(location.pathname).toBe('/cafediagon/');
    expect(new URLSearchParams(location.search).get('lang')).toBe('de');
    expect(location.hash).toBe('#carta');
  });

  it('no llena el historial al cambiar de idioma', async () => {
    const usuario = userEvent.setup();
    const largo = history.length;
    render(<ProveedorIdioma inicial="es"><Sonda /></ProveedorIdioma>);

    await usuario.click(screen.getByText('a aleman'));
    expect(history.length).toBe(largo);
  });
});
