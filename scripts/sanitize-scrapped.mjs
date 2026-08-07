/**
 * Genera scrapped/ (la version que se versiona) a partir de scrapped-raw/, que
 * es el volcado crudo de Apify y se queda solo en local.
 *
 * El volcado trae datos personales de terceros: comentarios de otras cuentas
 * con su usuario, foto de perfil, texto y fecha, personas etiquetadas y algun
 * post que no es del cafe. Publicarlos en un repo publico es un tratamiento sin
 * base juridica, asi que se eliminan aqui. Lo demas (captions, hashtags,
 * fechas, URLs y metricas propias) se conserva porque sigue siendo util para
 * regenerar la galeria.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'scrapped-raw');
const DESTINO = join(RAIZ, 'scrapped');

/** Cuenta propia: lo suyo se conserva, lo de terceros se va. */
const PROPIA = 'cafediagon';

/** Campos que solo contienen datos de terceros. Se borran a cualquier nivel. */
const CAMPOS_FUERA = new Set([
  'latestComments',    // usuario, foto de perfil, texto y fecha de cada comentario
  'firstComment',      // texto del primer comentario ajeno
  'taggedUsers',       // personas etiquetadas en la foto
  'coauthorProducers', // cuentas coautoras del post
  'ownerProfilePicUrl',
]);

const quitados = { campos: 0, posts: [] };

function limpiar(valor) {
  // El filtro va dentro de limpiar y no solo en la raiz porque el volcado de
  // perfil trae posts anidados en latestPosts[], algunos de otras cuentas.
  if (Array.isArray(valor)) return valor.filter(esPropio).map(limpiar);
  if (valor === null || typeof valor !== 'object') return valor;

  const salida = {};
  for (const [clave, v] of Object.entries(valor)) {
    if (CAMPOS_FUERA.has(clave)) {
      quitados.campos++;
      continue;
    }
    // mentions es un array de nombres de usuario: solo sobrevive la cuenta propia.
    if (clave === 'mentions' && Array.isArray(v)) {
      salida[clave] = v.filter((m) => m === PROPIA);
      continue;
    }
    salida[clave] = limpiar(v);
  }
  return salida;
}

/** Descarta las entradas de nivel raiz que pertenecen a otras cuentas. */
function esPropio(entrada) {
  const duenyo = entrada?.ownerUsername ?? entrada?.username;
  if (duenyo === undefined || duenyo === PROPIA) return true;
  quitados.posts.push(`${duenyo}/${entrada.shortCode ?? entrada.id ?? '?'}`);
  return false;
}

mkdirSync(DESTINO, { recursive: true });

for (const fichero of readdirSync(ORIGEN).filter((f) => f.endsWith('.json'))) {
  // El export de Apify llega con BOM.
  const texto = readFileSync(join(ORIGEN, fichero), 'utf8').replace(/^﻿/, '');
  const crudo = JSON.parse(texto);
  const datos = limpiar(crudo);
  const cuenta = (v) => (Array.isArray(v) ? v.length : 1);

  writeFileSync(join(DESTINO, fichero), `${JSON.stringify(datos, null, 2)}\n`, 'utf8');
  console.log(`${fichero}: ${cuenta(crudo)} -> ${cuenta(datos)} entradas`);
}

console.log(`\nCampos de terceros eliminados: ${quitados.campos}`);
console.log(`Posts de otras cuentas descartados: ${quitados.posts.join(', ') || 'ninguno'}`);
