/**
 * Acceso al almacenamiento local del navegador.
 *
 * Aqui solo se guardan preferencias que ha elegido el visitante (idioma y mapa),
 * nunca datos que identifiquen a nadie: por eso no hay cookies ni hace falta
 * banner. Todo va envuelto en try/catch porque localStorage revienta en modo
 * privado y con el almacenamiento bloqueado, y ninguna de estas preferencias
 * vale lo bastante como para romper la pagina.
 */

export function leer(clave, almacen = globalThis.localStorage) {
  try {
    return almacen?.getItem(clave) ?? null;
  } catch {
    return null;
  }
}

export function guardar(clave, valor, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(clave, valor);
  } catch {
    // Modo privado: la preferencia solo dura esta visita.
  }
}

export function borrar(clave, almacen = globalThis.localStorage) {
  try {
    almacen?.removeItem(clave);
  } catch {
    // Si no se pudo guardar, tampoco hay nada que borrar.
  }
}
