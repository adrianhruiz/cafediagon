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
   (`4.5`, no `"4,50 €"` — el formato lo pone la web según el idioma).

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

Español, inglés, alemán y catalán. El idioma se detecta del navegador y se
recuerda en el navegador del visitante.

Los textos de interfaz están en `src/i18n/`. Los nombres y descripciones de los
platos vienen del TPV, que los tiene traducidos al 66 %; lo que falte cae al
castellano automáticamente.

Un test comprueba que los cuatro idiomas tengan exactamente las mismas claves,
así que si añades un texto a uno tienes que añadirlo a los cuatro.

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

`assets-origen/` guarda los originales descargados de Instagram junto con
`manifest.json` (pie, fecha y likes de cada uno). **No los borres**: las URLs
del CDN de Instagram caducan y no se pueden volver a descargar.

`npm run imagenes` genera de ahí los webp y jpg de `public/images/` en varios
anchos. Para añadir una foto, déjala en `assets-origen/posts/`, ejecuta el
comando y añádela a `gallery.json`.

## Despliegue

Automático a GitHub Pages al hacer merge a `main`. Los tests se pasan en cada
pull request.

El repositorio sigue git flow: se trabaja en ramas `feature/` que salen de
`develop`, y `main` es lo que está publicado.
