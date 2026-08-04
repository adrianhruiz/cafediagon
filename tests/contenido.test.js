import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import menu from '../src/content/menu.json';
import galeria from '../src/content/gallery.json';
import negocio from '../src/content/business.json';
import imagenes from '../src/content/imagenes.json';
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

  it('los precios son null o un numero positivo', () => {
    for (const p of productos) {
      if (p.precio !== null) {
        expect(typeof p.precio).toBe('number');
        expect(p.precio).toBeGreaterThan(0);
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
        for (const ext of ['webp', 'jpg']) {
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
