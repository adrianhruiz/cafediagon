import imagenes from '../content/imagenes.json';

/**
 * <picture> con webp y respaldo jpg, generados por scripts/optimize-images.mjs.
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
      <source type="image/webp" srcSet={srcset('webp')} sizes={sizes} />
      <img
        src={`${base}images/${nombre}-${mayor}.jpg`}
        srcSet={srcset('jpg')}
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
