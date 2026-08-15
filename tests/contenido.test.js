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
import { formatos, imagenes } from '../src/content/imagenes.json';
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
});
