# Diagon Cafe

Web de [Diagon Cafe](https://www.instagram.com/cafediagon/), cafetería de
especialidad con juegos de mesa en Cala Rajada (Capdepera, Mallorca).

Una sola página, sin servidor ni base de datos. React + Vite + CSS plano.

## Poner en marcha

```bash
npm install
npm run dev        # http://localhost:5173/cafediagon/
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila a `dist/` |
| `npm test` | Tests unitarios (Vitest) |
| `npm run menu` | Regenera la carta desde el export del TPV |
| `npm run menu:idiomas` | Reparte `menu.json` en un fichero por idioma (lo que carga la web) |
| `npm run fotos` | Prepara las fotos nuevas del café (HEIC del Drive → `assets-origen/fotos/`) |
| `npm run mapa` | Redibuja el mapa de «Dónde estamos» con teselas de OpenStreetMap |
| `npm run imagenes` | Regenera `public/images/` desde `assets-origen/` |
| `npm run check` | Comprueba la maquetación en 6 anchos de pantalla |

## Cambiar el contenido

Casi todo se toca sin tocar código, editando JSON:

- **`src/content/business.json`** — dirección, teléfono, email, horario
- **`src/content/gallery.json`** — qué fotos salen en la galería y su texto alternativo
- **`src/i18n/*.json`** — todos los textos de la web, un archivo por idioma

### Añadir el horario

Hoy `horario` está a `null` y la web muestra un aviso invitando a preguntar.
Para publicarlo, sustitúyelo por una lista:

```json
"horario": [
  { "dias": "Lunes a viernes", "horas": "8:00 – 18:00" },
  { "dias": "Sábado y domingo", "horas": "9:00 – 18:00" }
]
```

### Añadir los precios

La carta se genera desde el export de traducciones del TPV que está en
`assets-origen/carta/`. **Ese export no trae precios**, así que todos los
productos salen con «Consultar» y la carta muestra un aviso.

Cuando haya precios, hay dos caminos:

1. Si el TPV puede exportarlos, añade la columna y adapta `scripts/build-menu.mjs`.
2. Si no, edita `src/content/menu.json` a mano y pon el número en `precio`
   (`4.5`, no `"4,50 €"` — el formato lo pone la web según el idioma). Después
   ejecuta `npm run menu:idiomas`: la web no carga `menu.json`, sino un recorte
   por idioma que sale de él. No uses `npm run menu`, que rehace `menu.json`
   desde el export del TPV y se llevaría por delante el cambio.

En cuanto un solo producto tenga precio, el aviso desaparece solo.

### Actualizar la carta desde el TPV

Exporta de nuevo las cuatro pestañas de la hoja a `assets-origen/carta/` y
ejecuta `npm run menu`.

Ten en cuenta dos cosas:

- **El TPV no exporta a qué categoría pertenece cada producto.** La relación está
  en el mapa `CATEGORIA` de `scripts/build-menu.mjs`. Los productos nuevos hay
  que añadirlos ahí, o el script avisa de que se han quedado fuera.
- **Las erratas se corrigen en el script**, no en el JSON generado (mapas
  `ERRATAS` y `ERRATAS_DESC`). Conviene arreglarlas también en el TPV: si no,
  vuelven en cada export.

## Idiomas

Español, inglés, alemán y catalán. El idioma sale, por este orden, del parámetro
`?lang=` de la URL, de lo que el visitante haya elegido antes y del idioma del
navegador.

`?lang=de` es lo que hace que un enlace se pueda compartir en un idioma
concreto: al pulsar el selector, el idioma se escribe en la barra de direcciones
con `replaceState` (sin llenar el historial y sin tocar el hash, que es la ruta
de las páginas legales). `index.html` declara un `hreflang` por idioma con esa
misma URL, y un test comprueba que estén los cuatro.

Los textos de interfaz están en `src/i18n/`. Los nombres y descripciones de los
platos vienen del TPV, que los tiene traducidos al 66 %; lo que falte cae al
castellano automáticamente.

Un test comprueba que los cuatro idiomas tengan exactamente las mismas claves,
así que si añades un texto a uno tienes que añadirlo a los cuatro.

## Qué se guarda en el navegador

Ninguna cookie y ninguna petición a terceros. Una sola clave en `localStorage`,
a través de `src/almacen.js` (que envuelve todo en `try/catch`: en modo privado
revienta y ninguna preferencia vale una página rota):

- `diagon:idioma` — solo se escribe si el visitante pulsa el selector. El idioma
  detectado del navegador **no** se guarda: no es una elección suya y la política
  de privacidad dice "el idioma que has elegido".

Si se guarda algo más, hay que declararlo en los cuatro `legal.*.json`: un test
comprueba que la política de privacidad nombre cada clave.

## El mapa

El mapa de «Dónde estamos» es una imagen servida por la propia web, no el iframe
de Google Maps. El iframe manda la IP del visitante a Google y escribe en su
navegador antes de que consienta nada (art. 22.2 LSSI): o se pedía permiso con
un botón —fricción para lo que casi todo el mundo quiere, ver dónde cae el
café—, o había que montar banner de cookies.

`npm run mapa` descarga las teselas de OpenStreetMap, las pega, planta la
chincheta y deja `assets-origen/mapa/mapa.jpg`; después `npm run imagenes` genera
los derivados. **Solo hay que ejecutarlo si cambia la dirección del café**: el
jpg vive en el repositorio porque la política de uso de OSM no admite que un
build pida teselas en cada despliegue.

La atribución (licencia ODbL) va quemada en la esquina de la imagen y repetida
como enlace bajo el mapa. Si el mapa deja de recortarse o se cambia por otra
cosa, las dos tienen que seguir ahí.

## Accesibilidad

El contraste de la paleta no se revisa a ojo: `tests/contraste.test.js` calcula
los ratios de WCAG sobre los tokens de `src/styles/tokens.css` y falla si un par
baja de 4,5:1 (texto) o de 3:1 (bordes de control y anillo de foco). Si se
inventa una combinación nueva de colores, hay que añadirla a la lista de pares
del test; si no, nadie la comprueba.

Dos cosas que conviene no deshacer sin pensarlo:

- **El botón del menú va antes que el `<nav>` en el DOM** (`Cabecera.jsx`). Si se
  mueve detrás, al abrir el menú con el teclado el foco se salta los enlaces.
- **Las fotos de la galería llevan `alt=""` a propósito**: el pie de la figura
  dice lo mismo y está siempre a la vista, así que con `alt` el lector de
  pantalla leería cada foto dos veces.

## Comprobar que se ve bien

```bash
npm run build
npx vite preview --port 4173
npm run check http://localhost:4173/cafediagon/
```

Mide el desbordamiento horizontal y las imágenes rotas en 320, 375, 390, 768,
1280 y 1920 px, y deja las capturas en `design/capturas/`.

## Fotos

Hay dos orígenes, y los dos se guardan en el repositorio:

- `assets-origen/posts/`: los originales descargados de Instagram, con
  `manifest.json` (pie, fecha y likes de cada uno). **No los borres**: las URLs
  del CDN de Instagram caducan y no se pueden volver a descargar.
- `assets-origen/fotos/`: las que manda el café por Drive, ya reducidas a
  1600 px y sin EXIF.

`npm run imagenes` genera de ahí los avif, webp y jpg de `public/images/` en
varios anchos. Para añadir una foto a la galería, déjala en el origen que le
toque, ejecuta el comando y añádela a `gallery.json` con su alt en los cuatro
idiomas.

### Fotos nuevas del café

Llegan por Drive, en HEIC de iPhone y a 1-7 MB cada una. No se suben tal cual:

```bash
# 1. deja los archivos del Drive en assets-origen/fotos-crudas/ (esa carpeta
#    no se guarda en git: la copia buena es la del Drive)
# 2. ponle nombre a cada uno en assets-origen/fotos-nombres.json
npm run fotos       # HEIC -> jpg de 1600 px sin EXIF, en assets-origen/fotos/
npm run imagenes    # y de ahi los derivados de public/images/
```

`npm run fotos` falla si alguna foto cruda no aparece en
`fotos-nombres.json`, ni como nombre ni como descarte: así ninguna acaba
publicada como `IMG_0640` ni se cuela una que no debería salir. Los descartes
llevan escrito el motivo (clientes reconocibles, texto quemado en la imagen…).

El EXIF de una foto de móvil lleva las coordenadas del local y la hora exacta;
`npm run fotos` no lo copia a la versión que se publica.

## Despliegue

Automático a GitHub Pages al hacer merge a `main`. Los tests se pasan en cada
pull request.

El repositorio sigue git flow: se trabaja en ramas `feature/` que salen de
`develop`, y `main` es lo que está publicado.
