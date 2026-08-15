import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import menu from '../src/content/menu.json';
import menuEs from '../src/content/menu.es.json';
import menuEn from '../src/content/menu.en.json';
import menuDe from '../src/content/menu.de.json';
import menuCa from '../src/content/menu.ca.json';
import galeria from '../src/content/gallery.json';
import negocio from '../src/content/business.json';
import legalEs from '../src/content/legal.es.json';
import legalEn from '../src/content/legal.en.json';
import legalDe from '../src/content/legal.de.json';
import legalCa from '../src/content/legal.ca.json';
import { compartir, formatos, imagenes } from '../src/content/imagenes.json';
import { IDIOMAS } from '../src/i18n/idioma.jsx';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import de from '../src/i18n/de.json';
import ca from '../src/i18n/ca.json';

const PUBLICO = join(process.cwd(), 'public', 'images');

describe('carta', () => {
  const productos = menu.categorias.flatMap((c) => c.productos);

  it('tiene categorias y productos', () => {
    expect(menu.categorias.length).toBeGreaterThan(0);
    expect(productos.length).toBeGreaterThan(150);
  });

  it('ningun producto se repite entre categorias', () => {
    const ids = productos.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada producto tiene nombre en los cuatro idiomas', () => {
    for (const p of productos) {
      for (const l of IDIOMAS) {
        expect(p.nombre[l], `${p.nombre.es} → ${l}`).toBeTruthy();
      }
    }
  });

  it('cada categoria tiene nombre en los cuatro idiomas', () => {
    for (const c of menu.categorias) {
      for (const l of IDIOMAS) expect(c.nombre[l], `${c.id} → ${l}`).toBeTruthy();
    }
  });

  it('los precios son null o un numero no negativo', () => {
    for (const p of productos) {
      if (p.precio !== null) {
        expect(typeof p.precio).toBe('number');
        // 0 es valido: el TPV marca "Gratis" algun producto (Babychino).
        expect(p.precio).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('los alergenos son codigos conocidos, sin repetir y sin texto libre', () => {
    // Los 14 del anexo II del Rgto (UE) 1169/2011. La lista vacia significa
    // "ninguno" declarado por el cafe; null significa que no hay dato.
    const CATORCE = [
      'gluten', 'crustaceos', 'huevos', 'pescado', 'cacahuetes', 'soja', 'leche',
      'frutosCascara', 'apio', 'mostaza', 'sesamo', 'sulfitos', 'altramuces',
      'moluscos',
    ];
    for (const p of productos) {
      if (p.alergenos === null) continue;
      expect(Array.isArray(p.alergenos), `${p.nombre.es}`).toBe(true);
      expect(new Set(p.alergenos).size, `${p.nombre.es} repite alergenos`).toBe(p.alergenos.length);
      for (const a of p.alergenos) {
        expect(CATORCE, `${p.nombre.es} declara "${a}"`).toContain(a);
      }
    }
  });

  it('ningun producto se queda sin dato de alergenos', () => {
    // La carta ya no escribe "Ninguno de los 14" bajo cada plato: lo dice una
    // vez el aviso de la cabecera, asi que un plato sin linea afirma que no
    // lleva ninguno. Si el TPV dejase de exportar la columna, ese silencio
    // pasaria a ser mentira, y esto tiene que saltar antes de publicarlo.
    const sinDato = productos.filter((p) => p.alergenos == null).map((p) => p.nombre.es);
    expect(sinDato, `sin alergenos declarados: ${sinDato.join(', ')}`).toEqual([]);
  });

  it('no deja a medias las traducciones automaticas del TPV', () => {
    // El export traduce palabra a palabra y se deja trozos en castellano
    // ("Espresso shot with hielo picado", "una of cheese").
    const RESTOS = [
      'hielo picado', 'baylies', 'florea', 'hibsco', 'Variedad de', 'Variedad of',
      'una of', 'una de', 'Refresco', 'caliente', 'mucha', 'poca ', 'liquido',
      'Trozos de', 'Trozos of', 'Alitas', 'Postres variados', 'Tartas enteras',
      'Biscocho', 'caramelizadas', 'Te macha', 'Te chai', 'Te frio',
    ];
    for (const p of productos) {
      for (const l of ['en', 'de']) {
        const texto = `${p.nombre[l]} ${p.descripcion[l] ?? ''}`;
        for (const resto of RESTOS) {
          expect(texto, `${p.nombre.es} → ${l} sigue con "${resto}"`).not.toContain(resto);
        }
      }
    }
  });

  it('no arrastra las erratas del TPV', () => {
    const texto = JSON.stringify(productos.map((p) => [p.nombre.es, p.descripcion.es]));
    for (const errata of ['Hogwards', 'Cruccio', 'Croissan"', 'cacahuate', 'don sobrasada']) {
      expect(texto, `sigue apareciendo "${errata}"`).not.toContain(errata);
    }
  });
});

describe('carta por idioma', () => {
  // La web no carga menu.json, sino el recorte de un solo idioma. Si los dos se
  // separan, los tests de arriba seguirian en verde sobre un fichero que no
  // pinta nadie: hay que comprobar que dicen lo mismo.
  const RECORTES = { es: menuEs, en: menuEn, de: menuDe, ca: menuCa };

  it('existe un recorte por cada idioma', () => {
    expect(Object.keys(RECORTES).sort()).toEqual([...IDIOMAS].sort());
  });

  it('cada recorte trae las mismas categorias y productos que menu.json', () => {
    for (const [idioma, recorte] of Object.entries(RECORTES)) {
      expect(recorte.categorias.map((c) => c.id), idioma)
        .toEqual(menu.categorias.map((c) => c.id));
      for (const [i, c] of recorte.categorias.entries()) {
        expect(c.productos.map((p) => p.id), `${idioma} / ${c.id}`)
          .toEqual(menu.categorias[i].productos.map((p) => p.id));
      }
    }
  });

  it('cada campo trae un solo idioma: el suyo o el castellano de respaldo', () => {
    for (const [idioma, recorte] of Object.entries(RECORTES)) {
      const campos = recorte.categorias.flatMap((c) => [
        c.nombre,
        ...c.productos.flatMap((p) => [p.nombre, p.descripcion]),
      ]);
      for (const campo of campos) {
        const claves = Object.keys(campo);
        expect(claves.length, `${idioma}: ${JSON.stringify(campo)}`).toBeLessThanOrEqual(1);
        for (const k of claves) expect([idioma, 'es'], idioma).toContain(k);
      }
    }
  });

  it('el texto de cada campo es el que menu.json da para ese idioma', () => {
    for (const [idioma, recorte] of Object.entries(RECORTES)) {
      for (const [i, c] of recorte.categorias.entries()) {
        const original = menu.categorias[i];
        const esperado = original.nombre[idioma] || original.nombre.es;
        expect(Object.values(c.nombre)[0], `${idioma} / ${c.id}`).toBe(esperado);

        for (const [j, p] of c.productos.entries()) {
          const base = original.productos[j];
          expect(Object.values(p.nombre)[0], `${idioma} / ${base.nombre.es}`)
            .toBe(base.nombre[idioma] || base.nombre.es);
          const desc = base.descripcion[idioma] || base.descripcion.es;
          expect(Object.values(p.descripcion)[0] ?? null, `${idioma} / ${base.nombre.es}`)
            .toBe(desc ?? null);
        }
      }
    }
  });

  it('pesa bastante menos que la carta entera', () => {
    // Es lo unico que justifica partirla en cuatro: si un cambio deshace el
    // recorte, esto tiene que avisar.
    const entera = JSON.stringify(menu).length;
    for (const [idioma, recorte] of Object.entries(RECORTES)) {
      expect(JSON.stringify(recorte).length, idioma).toBeLessThan(entera * 0.6);
    }
  });
});

describe('galeria', () => {
  it('cada foto tiene alt en los cuatro idiomas', () => {
    for (const f of galeria) {
      for (const l of IDIOMAS) expect(f.alt[l], `${f.img} → ${l}`).toBeTruthy();
    }
  });

  it('cada foto existe entre las imagenes generadas', () => {
    for (const f of galeria) expect(imagenes[f.img], `falta ${f.img}`).toBeTruthy();
  });

  it('no hay fotos repetidas', () => {
    const nombres = galeria.map((f) => f.img);
    expect(new Set(nombres).size).toBe(nombres.length);
  });
});

describe('imagenes generadas', () => {
  // Del jpg solo se genera el ancho de respaldo: es el src del <img> y lo pide
  // quien no entiende ni avif ni webp. Los otros dos van en toda la serie.
  const SERIE_COMPLETA = formatos.filter((f) => f.ext !== 'jpg');

  it('todos los derivados declarados existen en public/images', () => {
    for (const [nombre, datos] of Object.entries(imagenes)) {
      for (const w of datos.anchos) {
        for (const { ext } of SERIE_COMPLETA) {
          const archivo = `${nombre}-${w}.${ext}`;
          expect(existsSync(join(PUBLICO, archivo)), `falta ${archivo}`).toBe(true);
        }
      }
      expect(existsSync(join(PUBLICO, `${nombre}-${datos.respaldo}.jpg`)),
        `falta el respaldo de ${nombre}`).toBe(true);
    }
  });

  it('el respaldo jpg es uno de los anchos declarados', () => {
    for (const [nombre, datos] of Object.entries(imagenes)) {
      expect(datos.anchos, nombre).toContain(datos.respaldo);
    }
  });

  it('cada imagen tiene al menos un ancho y una relacion de aspecto', () => {
    for (const [nombre, datos] of Object.entries(imagenes)) {
      expect(datos.anchos.length, nombre).toBeGreaterThan(0);
      expect(datos.ratio, nombre).toBeGreaterThan(0);
    }
  });

  // El orden manda: <picture> se queda con el primero que entienda el navegador,
  // y el jpg va al final porque es el src del <img>, o sea el ultimo respaldo.
  it('los formatos van de mejor a peor y acaban en jpg', () => {
    expect(formatos.map((f) => f.ext)).toEqual(['avif', 'webp', 'jpg']);
  });

  // La precarga esta escrita a mano en index.html y no la revisa el build:
  // si cambia el nombre o el ancho del hero, aqui se cae en vez de precargar
  // un 404 en cada visita.
  it('la imagen precargada en index.html existe', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const precargas = [...html.matchAll(/rel="preload"[^>]*href="\.\/images\/([^"]+)"/g)];
    expect(precargas.length).toBe(1);
    for (const [, archivo] of precargas) {
      expect(existsSync(join(PUBLICO, archivo)), `falta ${archivo}`).toBe(true);
    }
  });

  // Del jpg ya no se genera la serie entera, y el icono de iOS pide un ancho
  // que la web no usa en ningun <img>: si se cae, se cae en silencio.
  it('los iconos declarados en index.html existen', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const iconos = [...html.matchAll(/rel="(?:icon|apple-touch-icon)"[^>]*href="\.\/images\/([^"]+)"/g)];
    expect(iconos.length).toBe(2);
    for (const [, archivo] of iconos) {
      expect(existsSync(join(PUBLICO, archivo)), `falta ${archivo}`).toBe(true);
    }
  });
});

describe('URL por idioma en index.html', () => {
  // Los cuatro idiomas son el mismo documento: sin hreflang el buscador solo ve
  // uno. Las etiquetas estan escritas a mano, asi que si se añade un idioma al
  // diccionario y nadie toca el HTML, esto se cae en vez de dejarlo sin indexar.
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const alternativas = Object.fromEntries(
    [...html.matchAll(/rel="alternate"\s+hreflang="([\w-]+)"\s+href="([^"]+)"/g)]
      .map(([, codigo, url]) => [codigo, url]),
  );

  it('hay una alternativa por idioma, mas la x-default', () => {
    expect(Object.keys(alternativas).sort()).toEqual([...IDIOMAS, 'x-default'].sort());
  });

  it('cada alternativa pide su idioma con ?lang=', () => {
    for (const idioma of IDIOMAS) {
      expect(alternativas[idioma]).toBe(`${negocio.web}?lang=${idioma}`);
    }
    // x-default no fija idioma: es la que decide por el idioma del navegador.
    expect(alternativas['x-default']).toBe(negocio.web);
  });

  it('la canonica y la ficha de Google apuntan a la misma direccion', () => {
    const canonica = html.match(/rel="canonical"\s+href="([^"]+)"/);
    expect(canonica?.[1]).toBe(negocio.web);

    const bloque = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(JSON.parse(bloque[1]).url).toBe(negocio.web);
  });

  it('la web declarada acaba en la barra del base del build', () => {
    // vite.config.js publica en /cafediagon/: si el base cambia y business.json
    // no, los hreflang apuntarian a una URL que no existe.
    const config = readFileSync(join(process.cwd(), 'vite.config.js'), 'utf8');
    const base = config.match(/base:.*\?\?\s*'([^']+)'/)[1];
    expect(new URL(negocio.web).pathname).toBe(base);
  });
});

describe('datos del negocio', () => {
  it('el telefono esta en formato internacional sin espacios', () => {
    expect(negocio.telefono).toMatch(/^\+\d{9,15}$/);
  });

  it('el email es valido', () => {
    expect(negocio.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  });

  it('las coordenadas caen en Mallorca', () => {
    expect(negocio.geo.lat).toBeGreaterThan(39.2);
    expect(negocio.geo.lat).toBeLessThan(40.0);
    expect(negocio.geo.lng).toBeGreaterThan(2.3);
    expect(negocio.geo.lng).toBeLessThan(3.5);
  });

  // La media de Google esta escrita a mano y cambia sola. Una cifra sin fecha
  // se lee como actual, y en cuanto deja de serlo es una afirmacion falsa sobre
  // algo que influye en la decision de venir: publicidad enganosa. La fecha la
  // convierte en un dato historico, que no caduca; estos tests vigilan que la
  // fecha exista, sea creible y no se quede tan vieja que el dato ya no diga
  // nada util.
  describe('valoracion de Google', () => {
    const MESES_MAXIMO = 6;
    const fecha = new Date(negocio.google.fecha);

    it('lleva fecha, y es una fecha de verdad', () => {
      expect(negocio.google.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(fecha.getTime())).toBe(false);
    });

    it('no viene del futuro', () => {
      expect(fecha.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it(`no tiene mas de ${MESES_MAXIMO} meses`, () => {
      // Cuando esto se ponga rojo no hay bug: toca mirar la ficha de Google,
      // actualizar valoracion, resenas y fecha en business.json, y ya.
      const limite = new Date();
      limite.setMonth(limite.getMonth() - MESES_MAXIMO);
      const meses = Math.floor((Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      expect(fecha.getTime(), `el dato de Google tiene ~${meses} meses: refrescalo`)
        .toBeGreaterThan(limite.getTime());
    });

    it('la valoracion y el numero de resenas son creibles', () => {
      expect(negocio.google.valoracion).toBeGreaterThan(0);
      expect(negocio.google.valoracion).toBeLessThanOrEqual(5);
      expect(Number.isInteger(negocio.google.resenas)).toBe(true);
      expect(negocio.google.resenas).toBeGreaterThan(0);
    });

    it('los cuatro idiomas dicen de cuando es el dato', () => {
      for (const [codigo, dic] of Object.entries({ es, en, de, ca })) {
        expect(dic.sobre.datoValoracion, `${codigo} no coloca {fecha}`).toContain('{fecha}');
        expect(dic.sobre.datoValoracion, `${codigo} no dice que es de Google`)
          .toMatch(/google/i);
      }
    });
  });

  describe('horario', () => {
    // Los siete en orden: si falta uno, la seccion "Donde estamos" deja un
    // hueco y quien lo lea no sabe si ese dia se abre o no.
    const SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    it('trae los siete dias, en orden y sin repetir', () => {
      expect(Array.isArray(negocio.horario)).toBe(true);
      expect(negocio.horario.map((h) => h.dia)).toEqual(SEMANA);
    });

    it('cada dia o abre con dos horas validas o esta cerrado', () => {
      for (const h of negocio.horario) {
        if (h.cerrado) {
          expect(h.abre, `${h.dia} esta cerrado y trae hora`).toBeUndefined();
          expect(h.cierra, `${h.dia} esta cerrado y trae hora`).toBeUndefined();
          continue;
        }
        for (const hora of [h.abre, h.cierra]) {
          expect(hora, `${h.dia}`).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
        }
        expect(h.abre.localeCompare(h.cierra), `${h.dia} cierra antes de abrir`).toBeLessThan(0);
      }
    });

    it('los cuatro idiomas nombran los siete dias y el cierre', () => {
      for (const [codigo, dic] of Object.entries({ es, en, de, ca })) {
        expect(dic.donde.cerrado, `${codigo} no traduce "cerrado"`).toBeTruthy();
        for (const dia of SEMANA) {
          expect(dic.donde.dias?.[dia], `${codigo} no traduce "${dia}"`).toBeTruthy();
        }
      }
    });

    // El JSON-LD de index.html esta escrito a mano y es lo que lee Google para
    // decir "abierto ahora" en los resultados. Si se separa de business.json,
    // la web y el buscador dicen cosas distintas y nadie se entera.
    it('el JSON-LD de index.html dice el mismo horario que business.json', () => {
      const DIA_SCHEMA = {
        lunes: 'Monday', martes: 'Tuesday', miercoles: 'Wednesday', jueves: 'Thursday',
        viernes: 'Friday', sabado: 'Saturday', domingo: 'Sunday',
      };
      const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
      const bloque = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(bloque, 'no hay JSON-LD en index.html').toBeTruthy();
      const ficha = JSON.parse(bloque[1]);

      // Se aplana a "dia -> abre-cierra" para poder comparar sin depender de
      // como se hayan agrupado los dias en el JSON-LD.
      const declarado = {};
      for (const tramo of ficha.openingHoursSpecification) {
        for (const dia of [tramo.dayOfWeek].flat()) {
          declarado[dia] = `${tramo.opens}-${tramo.closes}`;
        }
      }

      const esperado = Object.fromEntries(negocio.horario.map((h) => [
        DIA_SCHEMA[h.dia],
        // Schema.org no tiene "cerrado": el dia sin horas se declara con un
        // tramo de duracion cero, que es como lo entiende Google.
        h.cerrado ? '00:00-00:00' : `${h.abre}-${h.cierra}`,
      ]));

      expect(declarado).toEqual(esperado);
    });
  });

  // Sin estos datos no se puede publicar el aviso legal, y publicarlo a medias
  // es peor que no tenerlo: identifica mal a quien responde del sitio.
  it('identifica al titular con nombre y NIF (LSSI art. 10)', () => {
    expect(negocio.titular).toBeTruthy();
    expect(negocio.titular).not.toBe(negocio.nombre);
    // DNI de persona fisica o CIF de sociedad.
    expect(negocio.nif).toMatch(/^(\d{8}[A-Z]|[A-Z]\d{7}[0-9A-Z])$/);
  });

  it('declara el titulo habilitante de la actividad', () => {
    expect(negocio.licencia.expediente).toBeTruthy();
    expect(negocio.licencia.organo).toBeTruthy();
  });

  it('la forma juridica cuadra con lo que el aviso legal deja fuera', () => {
    // Persona fisica: no hay datos registrales que publicar. Si algun dia pasa
    // a sociedad, el art. 10.1.b pide los del Registro Mercantil y este test
    // avisa de que el aviso legal se queda corto.
    expect(negocio.formaJuridica).toBe('persona-fisica');
  });
});

describe('ficha de Google (JSON-LD)', () => {
  // La ficha es lo que Google lee para decidir si este cafe sale en una busqueda
  // local, y es el unico trozo de la web que no mira nadie: si se separa de
  // business.json o de la carta, se publica mal y no hay pantalla donde se note.
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const ficha = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );

  /** Los ficheros que la ficha nombra viven en public/images, servidos por la web. */
  const archivoDe = (url) => {
    expect(url.startsWith(`${negocio.web}images/`), `${url} no cuelga de la web`).toBe(true);
    return url.slice(`${negocio.web}images/`.length);
  };

  it('se identifica con un @id estable colgado de la web', () => {
    // Sin @id la ficha es anonima y no se puede referenciar desde otra pagina.
    // Cuando el prerender parta la web en una URL por idioma, las cuatro tienen
    // que seguir hablando del mismo negocio, y eso lo dice este identificador.
    expect(ficha['@id']).toBe(`${negocio.web}#negocio`);
    expect(ficha.url).toBe(negocio.web);
  });

  it('las fotos y el logo son URLs absolutas de ficheros que existen', () => {
    // Google descarta las rutas relativas en JSON-LD, y una absoluta rota se
    // queda sin foto en el resultado sin avisar de nada.
    expect(Array.isArray(ficha.image)).toBe(true);
    expect(ficha.image.length).toBeGreaterThan(0);
    for (const url of [...ficha.image, ficha.logo]) {
      const archivo = archivoDe(url);
      expect(existsSync(join(PUBLICO, archivo)), `falta ${archivo}`).toBe(true);
    }
  });

  it('las fotos de la ficha son jpg y del ancho grande', () => {
    // El respaldo jpg solo se genera en un ancho por foto: si la ficha apunta a
    // uno pequeno, Google recibe una miniatura. Y avif/webp no son formatos que
    // se pueda dar por hecho que entienda cualquier rastreador.
    for (const url of ficha.image) {
      const archivo = archivoDe(url);
      const [, nombre, ancho] = archivo.match(/^(.+)-(\d+)\.jpg$/) ?? [];
      expect(nombre, `${url} no es un jpg del pipeline de imagenes`).toBeTruthy();
      expect(Number(ancho), `${archivo} es demasiado pequena para la ficha`)
        .toBeGreaterThanOrEqual(800);
      // La tarjeta de compartir es el unico jpg que no sale de la serie de
      // <picture>: se recorta aparte y no tiene entrada en imagenes.
      if (archivo === compartir.archivo) continue;
      expect(imagenes[nombre]?.respaldo, `${nombre} no tiene ese respaldo`).toBe(Number(ancho));
    }
  });

  it('ofrece la foto en mas de una proporcion', () => {
    // Google elige entre las fotos declaradas segun donde vaya a pintar el
    // resultado, y con una sola proporcion recorta el como puede.
    expect(ficha.image.length).toBeGreaterThan(1);
    expect(ficha.image, 'la ficha no ofrece la tarjeta apaisada')
      .toContain(`${negocio.web}images/${compartir.archivo}`);
  });

  it('el contacto y la direccion son los de business.json', () => {
    expect(ficha.telephone).toBe(negocio.telefono);
    expect(ficha.email).toBe(negocio.email);
    expect(ficha.address.streetAddress).toBe(negocio.direccion.calle);
    expect(ficha.address.postalCode).toBe(negocio.direccion.cp);
    expect(ficha.address.addressLocality).toBe(negocio.direccion.localidad);
    expect(ficha.address.addressCountry).toBe(negocio.direccion.pais);
    expect(ficha.geo.latitude).toBe(negocio.geo.lat);
    expect(ficha.geo.longitude).toBe(negocio.geo.lng);
  });

  it('el mapa, la apertura y el Instagram son los de business.json', () => {
    expect(ficha.hasMap).toBe(negocio.maps);
    expect(ficha.foundingDate).toBe(negocio.aperturaDesde);
    expect(ficha.sameAs).toContain(negocio.instagram);
  });

  it('hasMenu apunta a una seccion que la web pinta de verdad', () => {
    // La carta no es una pagina aparte: es un ancla de la portada. Si alguien le
    // cambia el id al <section>, el enlace de la ficha deja de llevar a ninguna
    // parte y Google se queda sin saber donde esta la carta.
    const ancla = ficha.hasMenu.replace(negocio.web, '');
    expect(ancla).toMatch(/^#[\w-]+$/);
    const carta = readFileSync(join(process.cwd(), 'src', 'components', 'Carta.jsx'), 'utf8');
    expect(carta, `nadie pinta ${ancla}`).toContain(`id="${ancla.slice(1)}"`);
  });

  it('la moneda es la que marcan los precios de la carta', () => {
    expect(ficha.currenciesAccepted).toBe('EUR');
  });

  // priceRange es una afirmacion sobre lo que cuesta venir, y los precios suben
  // solos con cada export del TPV. Se ata a la carta para que, cuando deje de
  // ser cierta, salte aqui y no en la cabeza de quien llegue con otra idea.
  describe('priceRange', () => {
    /** Gasto por persona que representa cada simbolo, en euros. */
    const BANDAS = { '€': 15, '€€': 30, '€€€': 60, '€€€€': Infinity };

    const medianaDe = (id) => {
      const categoria = menu.categorias.find((c) => c.id === id);
      const precios = categoria.productos
        .map((p) => p.precio)
        .filter((p) => typeof p === 'number' && p > 0)
        .sort((a, b) => a - b);
      expect(precios.length, `${id} se ha quedado sin precios`).toBeGreaterThan(0);
      return precios[Math.floor(precios.length / 2)];
    };

    it('es uno de los simbolos que Google entiende', () => {
      expect(Object.keys(BANDAS)).toContain(ficha.priceRange);
    });

    it('la banda declarada aguanta un cubierto tipo de la carta', () => {
      // Cubierto tipo: un cafe y algo de comer, que es a lo que se viene.
      const cubierto = medianaDe('cafes') + medianaDe('desayunos');
      const simbolos = Object.keys(BANDAS);
      const banda = simbolos.find((s) => cubierto <= BANDAS[s]);
      expect(banda, `un cubierto tipo sale por ${cubierto.toFixed(2)} €: toca declarar "${banda}"`)
        .toBe(ficha.priceRange);
    });
  });

  it('sigue sin declarar una valoracion propia', () => {
    // Decision deliberada: una valoracion que se pone el negocio a si mismo es
    // self-serving review para Google y publicidad no verificable para la
    // Directiva Omnibus. La media de Google se dice en el texto visible de
    // "El cafe", citando de donde sale y de cuando es.
    expect(ficha.aggregateRating).toBeUndefined();
    expect(ficha.review).toBeUndefined();
  });
});

describe('tarjeta al compartir el enlace', () => {
  // Un cafe de pueblo se comparte por WhatsApp, y lo que se pega ahi no es la
  // web: es lo que el rastreador saque de estas etiquetas. Estan escritas a mano
  // y ninguna se ve en pantalla, asi que se caen en silencio.
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const etiquetas = Object.fromEntries(
    [...html.matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[\w:]+)"\s+content="([^"]*)"/g)]
      .map(([, clave, valor]) => [clave, valor]),
  );

  it('promete una imagen grande y la da', () => {
    // twitter:card ya prometia una tarjeta con foto: sin og:image la vista
    // previa sale en gris, que es peor que no prometer nada.
    expect(etiquetas['twitter:card']).toBe('summary_large_image');
    expect(etiquetas['og:image']).toBeTruthy();
  });

  it('la imagen es una URL absoluta de un archivo que existe', () => {
    // El rastreador no esta en la pagina: una ruta relativa no la sabe resolver.
    const url = etiquetas['og:image'];
    expect(url.startsWith(`${negocio.web}images/`), `${url} no cuelga de la web`).toBe(true);
    const archivo = url.slice(`${negocio.web}images/`.length);
    expect(archivo).toBe(compartir.archivo);
    expect(existsSync(join(PUBLICO, archivo)), `falta ${archivo}`).toBe(true);
  });

  it('el tamano declarado es el que mide el recorte', () => {
    // Facebook reserva el hueco con estas dos cifras antes de bajar la imagen:
    // si no cuadran, la vista previa pega un salto al cargar.
    expect(Number(etiquetas['og:image:width'])).toBe(compartir.ancho);
    expect(Number(etiquetas['og:image:height'])).toBe(compartir.alto);
    expect(etiquetas['og:image:type']).toBe('image/jpeg');
  });

  it('el recorte es el apaisado que piden las redes', () => {
    // 1,91:1. Si se desvia, cada red recorta por su cuenta y se pierde justo lo
    // que se habia elegido ensenar.
    const proporcion = compartir.ancho / compartir.alto;
    expect(proporcion).toBeGreaterThan(1.87);
    expect(proporcion).toBeLessThan(1.95);
  });

  it('la imagen tiene un alt que la describe', () => {
    const alt = etiquetas['og:image:alt'];
    expect(alt?.trim()).toBeTruthy();
    // Repetir la descripcion de la pagina no describe la foto: quien lee la
    // tarjeta con un lector de pantalla ya tiene ese texto al lado.
    expect(alt).not.toBe(etiquetas['og:description']);
  });

  it('la tarjeta apunta a la misma direccion que la canonica', () => {
    expect(etiquetas['og:url']).toBe(negocio.web);
    expect(etiquetas['og:type']).toBe('website');
    expect(etiquetas['og:site_name']).toBe(negocio.nombre);
  });
});

describe('textos legales', () => {
  const IDIOMAS_LEGAL = { es: legalEs, en: legalEn, de: legalDe, ca: legalCa };
  const DOCUMENTOS = ['aviso', 'privacidad'];

  /** Los marcadores {x} que los textos pueden pedirle a business.json. */
  const MARCADORES = ['email', 'telefono', 'nombre', 'titular', 'organo', 'expediente'];

  /** Todas las cadenas de un documento, ya sean parrafos, listas o fichas. */
  const cadenasDe = (doc) => [
    doc.titulo,
    doc.entrada,
    ...doc.secciones.flatMap((s) => [
      s.titulo,
      ...s.bloques.flatMap((b) => {
        if (b.p) return [b.p];
        if (b.lista) return b.lista;
        if (b.datos) return b.datos.flat();
        return [];
      }),
    ]),
  ];

  /**
   * Esqueleto del documento: que bloques lleva cada seccion y de que tipo. Sin
   * esto una traduccion puede perder una seccion entera y nadie se entera hasta
   * que alguien lee el aleman.
   */
  const forma = (doc) =>
    doc.secciones.map((s) => s.bloques.map((b) => {
      const tipo = Object.keys(b)[0];
      if (tipo === 'datos') return `datos:${b.datos.length}`;
      if (tipo === 'lista') return `lista:${b.lista.length}`;
      if (tipo === 'identidad') return `identidad:${b.identidad}`;
      return tipo;
    }));

  it('existe el texto legal de cada idioma', () => {
    expect(Object.keys(IDIOMAS_LEGAL).sort()).toEqual([...IDIOMAS].sort());
  });

  it('los cuatro idiomas traen los dos documentos completos', () => {
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      expect(dic.actualizado, idioma).toBeTruthy();
      for (const doc of DOCUMENTOS) {
        expect(dic[doc]?.titulo, `${idioma} / ${doc}`).toBeTruthy();
        expect(dic[doc]?.entrada, `${idioma} / ${doc}`).toBeTruthy();
        expect(dic[doc]?.secciones?.length, `${idioma} / ${doc}`).toBeGreaterThan(0);
      }
    }
  });

  it('cada traduccion tiene las mismas secciones y bloques que el castellano', () => {
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      for (const doc of DOCUMENTOS) {
        expect(forma(dic[doc]), `${idioma} / ${doc}`).toEqual(forma(legalEs[doc]));
      }
    }
  });

  it('las etiquetas de la ficha de identificacion estan en los cuatro idiomas', () => {
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      for (const clave of Object.keys(legalEs.identidad)) {
        expect(dic.identidad[clave], `${idioma} no traduce "${clave}"`).toBeTruthy();
      }
    }
  });

  it('ningun texto se queda vacio', () => {
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      for (const doc of DOCUMENTOS) {
        for (const cadena of cadenasDe(dic[doc])) {
          expect(typeof cadena, `${idioma} / ${doc}`).toBe('string');
          expect(cadena.trim(), `${idioma} / ${doc}`).not.toBe('');
        }
      }
    }
  });

  it('los marcadores {x} son datos que el codigo sabe rellenar', () => {
    // Un {marcador} mal escrito no rompe nada: se publica tal cual en el aviso
    // legal, que es justo donde no puede salir un hueco sin rellenar.
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      const textos = [
        ...DOCUMENTOS.flatMap((doc) => cadenasDe(dic[doc])),
        dic.identidad.licenciaValor,
        dic.identidad.actividadValor,
      ];
      for (const texto of textos) {
        for (const [, clave] of texto.matchAll(/\{(\w+)\}/g)) {
          expect(MARCADORES, `${idioma} usa {${clave}}`).toContain(clave);
        }
      }
    }
  });

  it('cada fila de una ficha es una etiqueta y un valor', () => {
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      for (const doc of DOCUMENTOS) {
        for (const seccion of dic[doc].secciones) {
          for (const bloque of seccion.bloques) {
            if (!bloque.datos) continue;
            for (const fila of bloque.datos) {
              expect(fila.length, `${idioma} / ${seccion.titulo}`).toBe(2);
            }
          }
        }
      }
    }
  });

  it('la privacidad declara el unico dato que se guarda en el navegador', () => {
    // Si algun dia se guarda otra cosa, la declaracion deja de ser cierta.
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      const texto = cadenasDe(dic.privacidad).join(' ');
      expect(texto, `${idioma} no declara la clave`).toContain('diagon:idioma');
      expect(texto, `${idioma} no cita el art. 22.2 LSSI`).toContain('22.2');
    }
  });

  it('la privacidad explica que el mapa es una imagen propia', () => {
    // El mapa dejo de ser un iframe de Google: mientras lo sea una imagen, la
    // privacidad tiene que decirlo y citar de donde salen las teselas.
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      const texto = cadenasDe(dic.privacidad).join(' ');
      expect(texto, `${idioma} no cita OpenStreetMap`).toContain('OpenStreetMap');
      expect(texto, `${idioma} sigue declarando la clave del mapa`).not.toContain('diagon:mapa');
    }
  });

  it('el aviso legal atribuye el mapa a OpenStreetMap (ODbL)', () => {
    for (const [idioma, dic] of Object.entries(IDIOMAS_LEGAL)) {
      const texto = cadenasDe(dic.aviso).join(' ');
      expect(texto, `${idioma} no atribuye las teselas`).toContain('OpenStreetMap');
      expect(texto, `${idioma} no nombra la licencia`).toContain('ODbL');
    }
  });
});
