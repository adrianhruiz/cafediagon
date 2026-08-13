import { formatos, imagenes } from '../content/imagenes.json';

/** El jpg no lleva <source>: es el src del <img>, o sea el ultimo respaldo. */
const RESPALDO = 'jpg';

/** Los que si llevan <source>, en orden de preferencia: avif antes que webp. */
const FUENTES = formatos.filter(({ ext }) => ext !== RESPALDO);

const base = import.meta.env.BASE_URL;

/**
 * Los srcset no dependen de nada que cambie en tiempo de ejecucion, pero se
 * rehacian en cada render: son 3 formatos por 2 anchos en 29 imagenes, y la
 * pagina entera se vuelve a pintar cada vez que se cambia de idioma.
 */
const cache = new Map();
function srcsetDe(nombre, anchos, ext) {
  const clave = `${nombre}.${ext}`;
  if (!cache.has(clave)) {
    cache.set(clave, anchos.map((w) => `${base}images/${nombre}-${w}.${ext} ${w}w`).join(', '));
  }
  return cache.get(clave);
}

/**
 * <picture> con avif, webp y respaldo jpg, generados por
 * scripts/optimize-images.mjs. El navegador se queda con el primer formato de
 * la lista que entienda, asi que casi todos cargan avif: pesa alrededor de un
 * tercio menos que el mismo webp.
 *
 * Fija width y height desde la relacion de aspecto real para que el navegador
 * reserve el hueco y la pagina no salte al cargar (CLS).
 *
 * prioridad es solo para el LCP: pide la foto por delante de todo lo demas y
 * hay una sola en la pagina. Para lo que se ve al entrar pero no es el LCP
 * esta ansioso, que quita el lazy sin robarle ancho de banda al hero.
 */
export default function Imagen({ nombre, alt, sizes = '100vw', prioridad = false, ansioso = false, className, ...resto }) {
  const datos = imagenes[nombre];
  if (!datos) {
    // Un nombre mal escrito debe cantar en desarrollo, no fallar en silencio.
    console.warn(`Imagen desconocida: ${nombre}`);
    return null;
  }

  const mayor = datos.anchos.at(-1);

  return (
    <picture>
      {FUENTES.map(({ ext, tipo }) => (
        <source key={ext} type={tipo} srcSet={srcsetDe(nombre, datos.anchos, ext)} sizes={sizes} />
      ))}
      {/* Del jpg solo se genera el ancho mas pequeño, asi que no lleva srcset
          ni sizes: no hay entre que elegir. */}
      <img
        src={`${base}images/${nombre}-${datos.respaldo}.${RESPALDO}`}
        alt={alt}
        width={mayor}
        height={Math.round(mayor / datos.ratio)}
        loading={prioridad || ansioso ? 'eager' : 'lazy'}
        // Nunca sync: descodificar en el hilo principal bloquea el pintado de
        // todo lo demas, tambien el de la foto que se quiere adelantar.
        decoding="async"
        fetchPriority={prioridad ? 'high' : undefined}
        className={className}
        {...resto}
      />
    </picture>
  );
}
