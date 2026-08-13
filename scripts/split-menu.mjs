/**
 * Reparte src/content/menu.json en un menu.<idioma>.json por idioma, que es lo
 * que carga la web.
 *
 * La carta en los cuatro idiomas son 53 KB minificados y tres cuartas partes
 * son texto que ese visitante no va a leer nunca. Cada recorte se queda en 24 KB.
 *
 * Lo llama scripts/build-menu.mjs al final, asi que con `npm run menu` se hace
 * todo de una vez. Se puede ejecutar suelto (`npm run menu:idiomas`) cuando se
 * toca menu.json a mano y no se quiere rehacer la carta desde el export del TPV,
 * que sobrescribiria el cambio.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENIDO = join(RAIZ, 'src', 'content');

const RESPALDO = 'es';

/**
 * Deja de un campo {es,en,de,ca} solo la clave que la web acabaria pintando en
 * ese idioma: la suya si la tiene, y si no el castellano de respaldo. Se
 * conserva la forma de objeto a proposito, porque es lo que mira <Campo> para
 * marcar con lang="es" lo que no esta traducido (WCAG 3.1.2). Un objeto vacio
 * significa que ese campo no existe en ningun idioma.
 */
const soloIdioma = (campo, idioma) => {
  if (campo == null) return campo;
  for (const l of [idioma, RESPALDO]) {
    if (campo[l] != null && campo[l] !== '') return { [l]: campo[l] };
  }
  return {};
};

/** La carta recortada a un solo idioma. */
export const recortar = (menu, idioma) => ({
  idioma,
  avisoPrecios: menu.avisoPrecios,
  categorias: menu.categorias.map((c) => ({
    id: c.id,
    nombre: soloIdioma(c.nombre, idioma),
    productos: c.productos.map((p) => ({
      ...p,
      nombre: soloIdioma(p.nombre, idioma),
      descripcion: soloIdioma(p.descripcion, idioma),
    })),
  })),
});

export function partir(menu) {
  for (const idioma of menu.idiomas) {
    // Sin sangrado: este si lo baja el navegador y los saltos de linea pesan.
    writeFileSync(join(CONTENIDO, `menu.${idioma}.json`),
      JSON.stringify(recortar(menu, idioma)) + '\n');
  }
  return menu.idiomas;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const menu = JSON.parse(readFileSync(join(CONTENIDO, 'menu.json'), 'utf8'));
  console.log(`carta repartida en ${partir(menu).join(', ')}`);
}
