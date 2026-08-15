import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IDIOMAS, IDIOMA_POR_DEFECTO } from '../src/i18n/idioma.jsx';
import { PORTADA, RUTAS, ruta, urlAbsoluta } from '../src/rutas.js';
import { metaDe } from '../src/meta.js';
import negocio from '../src/content/business.json';

/**
 * Lo que se publica no es index.html: son las doce paginas que escribe
 * scripts/prerender.mjs, y ninguna de ellas la mira nadie antes de subirla.
 * Aqui se leen tal y como quedan en dist/.
 *
 * Hace falta haber construido: en CI, el workflow hace el build antes de los
 * tests justo por esto.
 */
const DIST = join(process.cwd(), 'dist');
const BASE = ruta(IDIOMA_POR_DEFECTO);

const ficheroDe = (idioma, pagina) =>
  join(DIST, ruta(idioma, pagina).slice(BASE.length), 'index.html');

const hayBuild = existsSync(join(DIST, 'index.html'));

// Sin dist/ no hay nada que leer. Se salta en vez de fallar para que quien
// trabaje en el codigo pueda lanzar los tests sin construir cada vez; el
// workflow de .github construye antes de los tests, asi que en CI se ejecutan
// siempre y nadie puede subir un prerender roto sin enterarse.
if (!hayBuild) console.warn('sin dist/: los tests del prerender se saltan (npm run build)');

describe.skipIf(!hayBuild)('paginas publicadas', () => {
  const paginas = RUTAS.map((r) => ({ ...r, html: readFileSync(ficheroDe(r.idioma, r.pagina), 'utf8') }));

  it('existe un fichero por idioma y documento', () => {
    for (const { idioma, pagina } of RUTAS) {
      const fichero = ficheroDe(idioma, pagina);
      expect(existsSync(fichero), `falta ${fichero}`).toBe(true);
    }
  });

  it('ninguna llega vacia', () => {
    // Era el fallo de fondo: se servia un <div id="root"> vacio y quien no
    // ejecuta JavaScript (Bing, los previsualizadores, los rastreadores de las
    // IA) no veia ni una palabra de la carta ni del horario.
    for (const { idioma, pagina, html } of paginas) {
      expect(html, `${idioma}/${pagina} sigue llegando vacia`).not.toContain('<div id="root"></div>');
    }
  });

  it('las portadas traen la carta entera, no el hueco de espera', () => {
    for (const { idioma, pagina, html } of paginas) {
      if (pagina !== PORTADA) continue;
      const platos = (html.match(/class="plato"/g) ?? []).length;
      expect(platos, `la portada en ${idioma} trae ${platos} platos`).toBeGreaterThan(100);
    }
  });

  it('cada pagina declara su idioma en el <html>', () => {
    for (const { idioma, pagina, html } of paginas) {
      expect(html.match(/<html lang="([^"]*)"/)?.[1], `${idioma}/${pagina}`).toBe(idioma);
    }
  });

  it('cada pagina lleva su propio titulo', () => {
    for (const { idioma, pagina, html } of paginas) {
      const titulo = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      expect(titulo, `${idioma}/${pagina}`).toBe(metaDe(idioma, pagina).titulo);
    }
  });

  it('ninguna repite el titulo de otra', () => {
    // Doce resultados con el mismo texto en la lista de Google no son doce
    // resultados: son uno y once que estorban.
    const titulos = paginas.map(({ html }) => html.match(/<title>([\s\S]*?)<\/title>/)[1]);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it('la canonica de cada pagina es ella misma', () => {
    // Este era el fallo gordo: las cuatro traducciones se servian con la
    // canonica del castellano, o sea declarandose duplicados suyos. Google se
    // quedaba con una y tiraba las otras tres.
    for (const { idioma, pagina, html } of paginas) {
      const canonica = html.match(/rel="canonical"\s+href="([^"]+)"/)?.[1];
      expect(canonica, `${idioma}/${pagina}`).toBe(urlAbsoluta(idioma, pagina));
    }
  });

  it('cada pagina enlaza a sus tres traducciones y a la x-default', () => {
    for (const { idioma, pagina, html } of paginas) {
      const alternativas = Object.fromEntries(
        [...html.matchAll(/rel="alternate"\s+hreflang="([\w-]+)"\s+href="([^"]+)"/g)]
          .map(([, codigo, url]) => [codigo, url]),
      );
      expect(Object.keys(alternativas).sort(), `${idioma}/${pagina}`)
        .toEqual([...IDIOMAS, 'x-default'].sort());

      // Las traducciones son el mismo documento en otro idioma, no la portada:
      // desde el aviso legal en aleman, la alternativa inglesa es el aviso
      // legal en ingles.
      for (const codigo of IDIOMAS) {
        expect(alternativas[codigo], `${idioma}/${pagina} -> ${codigo}`)
          .toBe(urlAbsoluta(codigo, pagina));
      }
      expect(alternativas['x-default']).toBe(urlAbsoluta(IDIOMA_POR_DEFECTO, pagina));
    }
  });

  it('todo lo que enlazan los hreflang existe como fichero', () => {
    // Un hreflang a una direccion que devuelve 404 es peor que no ponerlo.
    for (const { html } of paginas) {
      for (const [, url] of html.matchAll(/rel="alternate"[^>]*href="([^"]+)"/g)) {
        const camino = new URL(url).pathname.slice(BASE.length);
        expect(existsSync(join(DIST, camino, 'index.html')), `${url} no existe`).toBe(true);
      }
    }
  });

  it('no queda ni un ?lang= de los de antes', () => {
    for (const { idioma, pagina, html } of paginas) {
      expect(html, `${idioma}/${pagina}`).not.toContain('?lang=');
    }
  });

  it('las rutas a las imagenes no dependen de la carpeta en la que este la pagina', () => {
    // Desde /de/aviso-legal/, un ./images/ buscaria las fotos en
    // /de/aviso-legal/images/ y se quedaria sin favicon ni precarga del hero.
    for (const { idioma, pagina, html } of paginas) {
      const cabeza = html.slice(0, html.indexOf('</head>'));
      expect(cabeza, `${idioma}/${pagina}`).not.toContain('href="./images/');
      expect(cabeza, `${idioma}/${pagina}`).not.toContain('%BASE_URL%');
    }
  });

  it('la tarjeta de compartir dice la direccion de su propia pagina', () => {
    for (const { idioma, pagina, html } of paginas) {
      const url = html.match(/property="og:url"\s+content="([^"]+)"/)?.[1];
      expect(url, `${idioma}/${pagina}`).toBe(urlAbsoluta(idioma, pagina));
    }
  });

  it('el idioma de Open Graph no se queda en el de la plantilla', () => {
    const LOCALES = { es: 'es_ES', en: 'en_GB', de: 'de_DE', ca: 'ca_ES' };
    for (const { idioma, pagina, html } of paginas) {
      expect(html.match(/property="og:locale"\s+content="([^"]+)"/)?.[1], `${idioma}/${pagina}`)
        .toBe(LOCALES[idioma]);
      const otros = [...html.matchAll(/property="og:locale:alternate"\s+content="([^"]+)"/g)]
        .map(([, valor]) => valor);
      expect(otros.sort(), `${idioma}/${pagina}`)
        .toEqual(IDIOMAS.filter((c) => c !== idioma).map((c) => LOCALES[c]).sort());
    }
  });

  describe('ficha del negocio', () => {
    const fichaDe = (html) => {
      const bloque = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      return bloque ? JSON.parse(bloque[1]) : null;
    };

    it('va en las cuatro portadas y en ninguna pagina legal', () => {
      // El aviso legal no es la pagina que describe el cafe: repetir la ficha
      // ahi solo mete ruido en lo que lee el buscador.
      for (const { idioma, pagina, html } of paginas) {
        const ficha = fichaDe(html);
        if (pagina === PORTADA) expect(ficha, `falta en la portada en ${idioma}`).toBeTruthy();
        else expect(ficha, `sobra en ${idioma}/${pagina}`).toBeNull();
      }
    });

    it('las cuatro hablan del mismo negocio pero cada una desde su direccion', () => {
      for (const { idioma, pagina, html } of paginas) {
        if (pagina !== PORTADA) continue;
        const ficha = fichaDe(html);
        expect(ficha['@id'], idioma).toBe(`${negocio.web}#negocio`);
        expect(ficha.url, idioma).toBe(urlAbsoluta(idioma, PORTADA));
      }
    });

    it('la descripcion de la ficha esta en el idioma de su pagina', () => {
      for (const { idioma, pagina, html } of paginas) {
        if (pagina !== PORTADA) continue;
        expect(fichaDe(html).description, idioma).toBe(metaDe(idioma, PORTADA).descripcion);
      }
    });
  });
});
