import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import menu from '../src/content/menu.json';
import galeria from '../src/content/gallery.json';
import negocio from '../src/content/business.json';
import { formatos, imagenes } from '../src/content/imagenes.json';
import { IDIOMAS } from '../src/i18n/idioma.jsx';

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
  it('todos los derivados declarados existen en public/images', () => {
    for (const [nombre, datos] of Object.entries(imagenes)) {
      for (const w of datos.anchos) {
        for (const { ext } of formatos) {
          const archivo = `${nombre}-${w}.${ext}`;
          expect(existsSync(join(PUBLICO, archivo)), `falta ${archivo}`).toBe(true);
        }
      }
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

  it('el horario sigue pendiente y el codigo lo contempla', () => {
    // Cuando llegue, sera un array; hasta entonces null activa el aviso.
    expect(negocio.horario === null || Array.isArray(negocio.horario)).toBe(true);
  });
});
