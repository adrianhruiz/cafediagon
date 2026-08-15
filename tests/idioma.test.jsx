import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProveedorIdioma, IDIOMAS, IDIOMA_POR_DEFECTO, guardarIdioma, idiomaGuardado, traducir, useIdioma,
} from '../src/i18n/idioma.jsx';
import { AVISO, leerRuta, PAGINAS, PORTADA, PRIVACIDAD, RUTAS, ruta, urlAbsoluta } from '../src/rutas.js';
import negocio from '../src/content/business.json';
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

describe('rutas', () => {
  // Cada idioma y cada pagina tienen ahora direccion propia, que es lo que hace
  // que se puedan indexar por separado. Antes el idioma iba en ?lang= y las
  // paginas legales en el hash: ni una cosa ni la otra las ve un buscador.
  const BASE = '/cafediagon/';

  it('el castellano se queda en la raiz y los demas llevan prefijo', () => {
    // Un /es/ seria una segunda direccion con el mismo contenido que la raiz.
    expect(ruta(IDIOMA_POR_DEFECTO)).toBe(BASE);
    expect(ruta('de')).toBe(`${BASE}de/`);
    expect(ruta('ca')).toBe(`${BASE}ca/`);
  });

  it('las paginas legales cuelgan del idioma', () => {
    expect(ruta('es', AVISO)).toBe(`${BASE}aviso-legal/`);
    expect(ruta('de', AVISO)).toBe(`${BASE}de/aviso-legal/`);
    expect(ruta('ca', PRIVACIDAD)).toBe(`${BASE}ca/privacidad/`);
  });

  it('leerRuta deshace lo que hace ruta', () => {
    for (const { idioma, pagina } of RUTAS) {
      expect(leerRuta(ruta(idioma, pagina)), `${idioma} / ${pagina}`).toEqual({ idioma, pagina });
    }
  });

  it('una direccion que no existe cae en la portada en castellano', () => {
    // La web se publica en un sitio estatico: cualquiera puede escribir lo que
    // quiera en la barra de direcciones y no puede reventar por eso.
    expect(leerRuta(`${BASE}ja/`)).toEqual({ idioma: 'es', pagina: PORTADA });
    expect(leerRuta(`${BASE}de/lo-que-sea/`)).toEqual({ idioma: 'de', pagina: PORTADA });
    expect(leerRuta(BASE)).toEqual({ idioma: 'es', pagina: PORTADA });
  });

  it('hay una pagina por idioma y documento, sin repetir', () => {
    expect(RUTAS.length).toBe(IDIOMAS.length * (PAGINAS.length + 1));
    const direcciones = RUTAS.map(({ idioma, pagina }) => ruta(idioma, pagina));
    expect(new Set(direcciones).size).toBe(direcciones.length);
  });

  it('la direccion absoluta cuelga de la web declarada en business.json', () => {
    // Es lo que va en la canonica, en los hreflang y en las og:, donde una ruta
    // relativa no la sabe resolver nadie: quien las lee no esta en la pagina.
    for (const { idioma, pagina } of RUTAS) {
      const url = urlAbsoluta(idioma, pagina);
      expect(url.startsWith(negocio.web), url).toBe(true);
      expect(new URL(url).pathname).toBe(ruta(idioma, pagina));
    }
  });
});

function Sonda() {
  const { idioma, t } = useIdioma();
  return (
    <div>
      <p data-testid="titulo">{t('carta.titulo')}</p>
      <p data-testid="codigo">{idioma}</p>
    </div>
  );
}

describe('ProveedorIdioma', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
  });

  it('pinta en el idioma que le dan', () => {
    render(<ProveedorIdioma inicial="de"><Sonda /></ProveedorIdioma>);
    expect(screen.getByTestId('titulo')).toHaveTextContent(de.carta.titulo);
  });

  it('escribe el idioma en el atributo lang del documento', () => {
    render(<ProveedorIdioma inicial="de"><Sonda /></ProveedorIdioma>);
    expect(document.documentElement.lang).toBe('de');
  });

  it('cae al castellano con un idioma que no existe', () => {
    render(<ProveedorIdioma inicial="xx"><Sonda /></ProveedorIdioma>);
    expect(screen.getByTestId('codigo')).toHaveTextContent(IDIOMA_POR_DEFECTO);
    expect(screen.getByTestId('titulo')).toHaveTextContent(es.carta.titulo);
  });

  it('no guarda nada por el hecho de pintar', () => {
    // Solo se guarda lo que se elige pulsando. El idioma que trae la direccion
    // no es una eleccion de quien entra: puede venir de un enlace de otro.
    render(<ProveedorIdioma inicial="de"><Sonda /></ProveedorIdioma>);
    expect(localStorage.getItem('diagon:idioma')).toBeNull();
  });
});

describe('idioma guardado', () => {
  beforeEach(() => localStorage.clear());

  it('guarda y devuelve la eleccion', () => {
    guardarIdioma('de');
    expect(idiomaGuardado()).toBe('de');
    expect(localStorage.getItem('diagon:idioma')).toBe('de');
  });

  it('no guarda un idioma que no existe', () => {
    guardarIdioma('ja');
    expect(idiomaGuardado()).toBeNull();
  });

  it('no se cree lo que hay guardado si ya no es un idioma nuestro', () => {
    localStorage.setItem('diagon:idioma', 'ja');
    expect(idiomaGuardado()).toBeNull();
  });

  it('no revienta si localStorage lanza (modo privado)', () => {
    const roto = { getItem: () => { throw new Error('denegado'); },
      setItem: () => { throw new Error('denegado'); } };
    expect(idiomaGuardado(roto)).toBeNull();
    expect(() => guardarIdioma('de', roto)).not.toThrow();
  });
});
