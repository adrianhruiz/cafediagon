import imagenes from '../content/imagenes.json';

/** El jpg no lleva <source>: es el src del <img>, o sea el ultimo respaldo. */
const RESPALDO = 'jpg';

/**
 * <picture> con avif, webp y respaldo jpg, generados por
 * scripts/optimize-images.mjs. El navegador se queda con el primer formato de
 * la lista que entienda, asi que casi todos cargan avif: pesa alrededor de un
 * tercio menos que el mismo webp.
 *
 * Fija width y height desde la relacion de aspecto real para que el navegador
 * reserve el hueco y la pagina no salte al cargar (CLS).
 */
export default function Imagen({ nombre, alt, sizes = '100vw', prioridad = false, className, ...resto }) {
  const datos = imagenes[nombre];
  if (!datos) {
    // Un nombre mal escrito debe cantar en desarrollo, no fallar en silencio.
    console.warn(`Imagen desconocida: ${nombre}`);
    return null;
  }

  const base = import.meta.env.BASE_URL;
  const srcset = (ext) => datos.anchos.map((w) => `${base}images/${nombre}-${w}.${ext} ${w}w`).join(', ');
  const mayor = datos.anchos.at(-1);

  return (
    <picture>
      {datos.formatos.filter(({ ext }) => ext !== RESPALDO).map(({ ext, tipo }) => (
        <source key={ext} type={tipo} srcSet={srcset(ext)} sizes={sizes} />
      ))}
      <img
        src={`${base}images/${nombre}-${mayor}.${RESPALDO}`}
        srcSet={srcset(RESPALDO)}
        sizes={sizes}
        alt={alt}
        width={mayor}
        height={Math.round(mayor / datos.ratio)}
        loading={prioridad ? 'eager' : 'lazy'}
        decoding={prioridad ? 'sync' : 'async'}
        fetchPriority={prioridad ? 'high' : undefined}
        className={className}
        {...resto}
      />
    </picture>
  );
}
