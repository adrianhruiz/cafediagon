/**
 * Genera design/mockup.html a partir de src/content/menu.json y las fotos de
 * assets-origen/. Es la maqueta de validacion de diseno previa a React: HTML y
 * CSS planos, sin dependencias, se abre haciendo doble clic.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const menu = JSON.parse(readFileSync(join(RAIZ, 'src', 'content', 'menu.json'), 'utf8'));

const FOTOS = '../assets-origen/posts';

/** Fotos elegidas de las 31 descargadas de Instagram. */
const IMG = {
  hero: `${FOTOS}/17-DEx8Xqxsd16.jpg`,
  juegos: `${FOTOS}/06-DJEJYueMzZM.jpg`,
  premio: `${FOTOS}/04-DbI8KKvIMd_.jpg`,
  local: `${FOTOS}/21-DEnfYHEMvoF.jpg`,
};

const GALERIA = [
  ['23-DE7ZG9oMwgJ.jpg', 'Quidditch: bowl de yogur, salmón ahumado, aguacate y surtido de panes'],
  ['31-DE7ZVD4MQtq.jpg', 'Minerva: tostada con salmón ahumado, aguacate y tomate'],
  ['29-DE7bVdWs2KN.jpg', 'Americano: gofre con fresas, plátano, nata, dulce de leche y nutella'],
  ['27-DJEmYZ8s3Al.jpg', 'Lupin: avena, chía, leche vegetal, yogur y fruta seca'],
  ['14-DFp1AKftK7J.jpg', 'Gryffindor: poké bowl de pollo con salsa teriyaki'],
  ['26-DFp0iubtyCs.jpg', 'Riddle: tabla con variedad de quesos'],
  ['28-DEz1WoGOYMW.jpg', 'Hogwarts: tostada de sobrasada asada con queso brie y miel'],
  ['20-DHX9LwbMjGt.jpg', 'Café con leche'],
  ['02-DJEmP64sTKw.jpg', 'Latte macchiato'],
  ['13-DFp03_QtlEy.jpg', 'Ensalada caprese'],
  ['19-DJEFrEEMS8v.jpg', 'Ensalada de remolacha y cítricos'],
  ['01-DJEGzscMJB-.jpg', 'Ensalada de cuscús'],
  ['22-DJJQgZgs7uC.jpg', 'Gazpacho de remolacha'],
  ['24-DE7Zd5jMkBE.jpg', 'Mini donuts glaseados'],
  ['25-DE7Yn7cMwq5.jpg', 'Overnight: bowl de avena reposado desde la noche anterior'],
  ['08-DJ6H3G-s4Pt.jpg', 'Variedad de tostadas'],
];

/** Juegos identificados en la foto de la estanteria. */
const JUEGOS = [
  'Exploding Kittens', 'Azul', 'Munchkin', 'Arkham Horror', 'Paleo',
  '7 Wonders Duel', 'The Mind', 'Virus!', 'Sushi Go!', 'Trio', 'Secret Hitler',
  'Las Leyendas de Andor', 'Smart 10', 'Pasapalabra', 'Pictionary', 'Dominó',
  'Monopoly', 'Trivial Pursuit Harry Potter', 'Memory Harry Potter', 'Uno',
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const producto = (p) => `
          <li class="plato${p.sinGluten ? ' plato--sg' : ''}">
            <div class="plato__cab">
              <h4 class="plato__nombre">${esc(p.nombre.es)}${p.sinGluten ? ' <span class="etq">sin gluten</span>' : ''}</h4>
              <span class="plato__linea"></span>
              <span class="plato__precio" title="Pendiente de recibir del café">—</span>
            </div>${p.descripcion.es ? `
            <p class="plato__desc">${esc(p.descripcion.es)}</p>` : ''}
          </li>`;

const categoria = (c) => `
      <section class="cat" id="cat-${c.id}" data-cat="${c.id}">
        <h3 class="cat__titulo">${esc(c.nombre.es)} <span class="cat__n">${c.productos.length}</span></h3>
        <ul class="cat__lista">${c.productos.map(producto).join('')}
        </ul>
      </section>`;

const total = menu.categorias.reduce((n, c) => n + c.productos.length, 0);

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagon Cafe · maqueta</title>
<style>
:root{
  --tinta:#202227; --tinta-2:#2B3439; --tinta-3:#3A3D45;
  --crema:#FAF7F0; --crema-2:#F1EADC; --crema-3:#E2D8C6;
  --cobre:#8A5A32; --cobre-claro:#C89A5B; --pergamino:#F8F7CD;
  --serif:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;
  --ancho:1180px; --r:4px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--crema);color:var(--tinta);font-family:var(--sans);
  font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
h1,h2,h3,h4{font-family:var(--serif);font-weight:400;line-height:1.15;margin:0;
  letter-spacing:-.01em}
h1,h2,h3,h4,p,li,span,a{overflow-wrap:break-word}
a{color:inherit}
.env{width:min(100% - 2.5rem,var(--ancho));margin-inline:auto}

/* ---------- aviso de maqueta ---------- */
.aviso{background:#8A2E2E;color:#fff;font-size:.82rem;text-align:center;
  padding:.55rem 1rem;letter-spacing:.02em}
.aviso b{font-weight:600}

/* ---------- cabecera ---------- */
.cab{position:sticky;top:0;z-index:50;background:var(--tinta);color:var(--crema);
  border-bottom:1px solid rgba(200,154,91,.22)}
.cab__in{display:flex;align-items:center;gap:1.5rem;min-height:72px}
.cab__logo{display:flex;align-items:center;gap:.7rem;text-decoration:none;flex-shrink:0}
.cab__logo img{width:44px;height:44px;border-radius:50%;object-fit:cover}
.cab__logo span{font-family:var(--serif);font-size:1.28rem;letter-spacing:.05em;
  color:var(--pergamino)}
.nav{display:flex;gap:1.6rem;margin-left:auto;list-style:none;padding:0;margin-block:0}
.nav a{text-decoration:none;font-size:.82rem;text-transform:uppercase;
  letter-spacing:.11em;color:var(--crema);opacity:.82;padding-block:.4rem;
  border-bottom:1px solid transparent}
.nav a:hover{opacity:1;border-color:var(--cobre-claro)}
.cab__lang{display:flex;gap:.15rem;margin-left:.5rem}
.cab__lang button{background:none;border:0;color:var(--crema);opacity:.55;
  font:inherit;font-size:.74rem;letter-spacing:.06em;cursor:pointer;padding:.3rem .42rem;
  text-transform:uppercase}
.cab__lang button[aria-current="true"]{opacity:1;color:var(--cobre-claro);
  border-bottom:1px solid var(--cobre-claro)}
.cab__tel{display:inline-flex;align-items:center;gap:.45rem;text-decoration:none;
  font-size:.85rem;color:var(--pergamino);white-space:nowrap}
.hamb{display:none;background:none;border:0;color:var(--crema);cursor:pointer;
  margin-left:auto;padding:.5rem;font-size:1.4rem;line-height:1}

/* ---------- hero ---------- */
.hero{position:relative;min-height:min(84vh,700px);display:grid;
  place-items:center;text-align:center;overflow:hidden;background:var(--tinta)}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
/* velo para que el texto se lea sobre una foto con mucho detalle */
.hero::after{content:"";position:absolute;inset:0;
  background:radial-gradient(ellipse at center,rgba(32,34,39,.72) 0%,rgba(32,34,39,.88) 70%)}
.hero__in{position:relative;z-index:1;padding:5rem 1.5rem;max-width:760px}
.hero__pre{font-size:clamp(.66rem,2.4vw,.76rem);letter-spacing:.28em;
  text-transform:uppercase;color:var(--cobre-claro);margin:0 0 1.4rem}
.hero h1{font-size:clamp(2rem,7.5vw,5.4rem);color:var(--pergamino);
  margin-bottom:1.2rem;overflow-wrap:break-word}
.hero p{color:rgba(250,247,240,.9);font-size:clamp(1rem,2.2vw,1.2rem);
  margin:0 auto 2.4rem;max-width:52ch}
.btns{display:flex;gap:.85rem;justify-content:center;flex-wrap:wrap}
.btn{display:inline-block;padding:.85rem 1.9rem;text-decoration:none;font-size:.8rem;
  letter-spacing:.13em;text-transform:uppercase;border:1px solid var(--cobre-claro);
  border-radius:var(--r);transition:background .18s,color .18s}
.btn--p{background:var(--cobre-claro);color:var(--tinta);font-weight:600}
.btn--p:hover{background:var(--pergamino);border-color:var(--pergamino)}
.btn--s{color:var(--pergamino)}
.btn--s:hover{background:rgba(200,154,91,.16)}

/* ---------- franja premio ---------- */
.premio{background:var(--tinta-2);color:var(--pergamino);text-align:center;
  padding:1.15rem 1.5rem;font-size:.88rem;letter-spacing:.03em}
.premio b{color:var(--cobre-claro);font-weight:600}

/* ---------- secciones ---------- */
.sec{padding:clamp(3.8rem,9vw,6.5rem) 0}
.sec--alt{background:var(--crema-2)}
.sec__pre{font-size:.74rem;letter-spacing:.28em;text-transform:uppercase;
  color:var(--cobre);margin:0 0 .9rem}
.sec h2{font-size:clamp(2rem,4.6vw,3.1rem);margin-bottom:1.4rem}
.sec__lead{max-width:60ch;color:var(--tinta-3);font-size:1.06rem}

/* ---------- sobre ---------- */
.sobre{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2rem,5vw,4.5rem);
  align-items:center}
.sobre img{border-radius:var(--r);aspect-ratio:4/5;object-fit:cover;width:100%}
.datos{list-style:none;padding:0;margin:2.2rem 0 0;display:grid;gap:.9rem}
.datos li{display:flex;gap:.85rem;align-items:baseline;font-size:.96rem}
.datos b{font-family:var(--serif);font-size:1.5rem;color:var(--cobre);
  min-width:3.4rem;line-height:1}

/* ---------- carta ---------- */
.filtros{display:flex;gap:.4rem;flex-wrap:wrap;margin:2rem 0 3rem;
  padding-bottom:.4rem}
.filtros button{font:inherit;font-size:.78rem;letter-spacing:.07em;
  text-transform:uppercase;background:none;border:1px solid var(--crema-3);
  color:var(--tinta-3);padding:.5rem 1rem;border-radius:100px;cursor:pointer;
  white-space:nowrap;transition:.15s}
.filtros button:hover{border-color:var(--cobre)}
.filtros button[aria-pressed="true"]{background:var(--tinta);color:var(--pergamino);
  border-color:var(--tinta)}
.cat{margin-bottom:3.4rem;scroll-margin-top:90px}
.cat[hidden]{display:none}
.cat__titulo{font-size:1.7rem;padding-bottom:.6rem;margin-bottom:1.4rem;
  border-bottom:1px solid var(--crema-3);display:flex;align-items:baseline;gap:.7rem}
.cat__n{font-family:var(--sans);font-size:.72rem;color:var(--tinta-3);opacity:.6;
  letter-spacing:.06em}
.cat__lista{list-style:none;padding:0;margin:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:1.5rem 3rem}
.plato__cab{display:flex;align-items:baseline;gap:.6rem}
.plato__nombre{font-size:1.06rem;font-family:var(--sans);font-weight:600;
  letter-spacing:.01em}
.plato__linea{flex:1;border-bottom:1px dotted var(--crema-3);transform:translateY(-.22em)}
.plato__precio{font-family:var(--serif);font-size:1.06rem;color:var(--cobre);
  white-space:nowrap;background:repeating-linear-gradient(45deg,
    rgba(138,90,50,.09) 0 5px,transparent 5px 10px);padding:.1rem .7rem;
  border-radius:var(--r);border:1px dashed rgba(138,90,50,.35)}
.plato__desc{margin:.3rem 0 0;font-size:.9rem;color:var(--tinta-3);line-height:1.5}
.etq{font-family:var(--sans);font-size:.6rem;letter-spacing:.09em;
  text-transform:uppercase;background:var(--crema-3);color:var(--tinta-3);
  padding:.16rem .42rem;border-radius:100px;vertical-align:middle;font-weight:600}

/* ---------- juegos ---------- */
.juegos{background:var(--tinta);color:var(--crema)}
.juegos .sec__pre{color:var(--cobre-claro)}
.juegos h2{color:var(--pergamino)}
.juegos .sec__lead{color:rgba(250,247,240,.78)}
.juegos__gr{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2rem,5vw,4rem);
  align-items:center}
.juegos img{border-radius:var(--r);aspect-ratio:3/4;object-fit:cover;width:100%}
.chips{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:2rem;list-style:none;padding:0}
.chips li{border:1px solid rgba(200,154,91,.32);color:var(--pergamino);
  padding:.34rem .85rem;border-radius:100px;font-size:.8rem}
.chips li:last-child{border-style:dashed;opacity:.7}

/* ---------- galeria ---------- */
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.7rem}
.gal figure{margin:0;position:relative;overflow:hidden;border-radius:var(--r);
  aspect-ratio:1;background:var(--crema-3)}
.gal img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.gal figure:hover img{transform:scale(1.05)}
.gal figcaption{position:absolute;inset:auto 0 0 0;padding:2.2rem .9rem .8rem;
  background:linear-gradient(transparent,rgba(32,34,39,.88));color:#fff;
  font-size:.78rem;opacity:0;transition:opacity .25s;line-height:1.35}
.gal figure:hover figcaption{opacity:1}

/* ---------- donde ---------- */
.donde{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2rem,5vw,4rem)}
.mapa{background:var(--crema-3);border-radius:var(--r);min-height:340px;
  display:grid;place-items:center;color:var(--tinta-3);font-size:.85rem;
  border:1px dashed var(--tinta-3);text-align:center;padding:1.5rem}
.info{list-style:none;padding:0;margin:1.8rem 0 0;display:grid;gap:1.4rem}
.info h4{font-family:var(--sans);font-size:.72rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--cobre);margin-bottom:.35rem;font-weight:600}
.info a{color:var(--tinta)}
.pdte{color:#8A2E2E;font-size:.86rem;background:rgba(138,46,46,.07);
  border:1px dashed rgba(138,46,46,.4);padding:.4rem .7rem;border-radius:var(--r);
  display:inline-block}

/* ---------- pie ---------- */
.pie{background:var(--tinta);color:rgba(250,247,240,.7);padding:3.5rem 0 2rem;
  font-size:.87rem}
.pie__gr{display:flex;gap:2rem;justify-content:space-between;flex-wrap:wrap;
  padding-bottom:2.2rem;border-bottom:1px solid rgba(200,154,91,.18)}
.pie h4{font-family:var(--serif);color:var(--pergamino);font-size:1.15rem;
  margin-bottom:.7rem}
.pie a{color:rgba(250,247,240,.7)}
.pie a:hover{color:var(--cobre-claro)}
.pie__bajo{padding-top:1.5rem;display:flex;justify-content:space-between;
  gap:1rem;flex-wrap:wrap;font-size:.78rem;opacity:.65}

@media(max-width:900px){
  .sobre,.juegos__gr,.donde{grid-template-columns:1fr}
  .sobre img,.juegos img{aspect-ratio:16/10;max-height:420px}
  .nav,.cab__tel,.cab__lang{display:none}
  .hamb{display:block}
}
@media(max-width:560px){
  body{font-size:16px}
  .cat__lista{grid-template-columns:1fr;gap:1.3rem}
  .gal{grid-template-columns:1fr 1fr;gap:.45rem}
  .filtros{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
  .hero__in{padding:4rem 1.2rem}
  .btn{padding:.8rem 1.4rem;font-size:.75rem}
}
</style>
</head>
<body>

<p class="aviso">Maqueta de validación · ${total} platos reales del TPV ·
  <b>los precios y los horarios están pendientes</b> y se muestran como hueco</p>

<header class="cab">
  <div class="env cab__in">
    <a class="cab__logo" href="#"><img src="../assets-origen/logo-hd.jpg" alt="">
      <span>DIAGON</span></a>
    <ul class="nav">
      <li><a href="#sobre">El café</a></li>
      <li><a href="#carta">Carta</a></li>
      <li><a href="#juegos">Juegos</a></li>
      <li><a href="#galeria">Galería</a></li>
      <li><a href="#donde">Dónde estamos</a></li>
    </ul>
    <div class="cab__lang">
      <button aria-current="true">ES</button><button>EN</button>
      <button>DE</button><button>CA</button>
    </div>
    <a class="cab__tel" href="tel:+34628505887">📞 628 50 58 87</a>
    <button class="hamb" aria-label="Menú">☰</button>
  </div>
</header>

<section class="hero">
  <img src="${IMG.hero}" alt="Interior de Diagon Cafe">
  <div class="hero__in">
    <p class="hero__pre">Cala Rajada · Mallorca</p>
    <h1>Café de especialidad<br>y juegos de mesa</h1>
    <p>Un lugar acogedor para disfrutar de buen café, comida hecha con cariño y
       momentos especiales alrededor de una mesa.</p>
    <div class="btns">
      <a class="btn btn--p" href="#carta">Ver la carta</a>
      <a class="btn btn--s" href="#donde">Cómo llegar</a>
    </div>
  </div>
</section>

<p class="premio">🏆 <b>Restaurant Guru 2026</b> — Mejor Coffee House de Cala Rajada</p>

<section class="sec" id="sobre">
  <div class="env sobre">
    <div>
      <p class="sec__pre">El café</p>
      <h2>Un rincón con magia<br>en Cala Rajada</h2>
      <p class="sec__lead">Abrimos en enero de 2025 con una idea sencilla: crear un
        sitio donde todo el mundo se sienta bienvenido. Café de especialidad tratado
        con respeto, comida preparada cada día y cientos de juegos de mesa para que
        te quedes el rato que quieras.</p>
      <ul class="datos">
        <li><b>4,7</b> <span>de valoración media en Google, sobre 67 reseñas</span></li>
        <li><b>+200</b> <span>juegos de mesa disponibles sin coste</span></li>
        <li><b>2026</b> <span>Mejor Coffee House de Cala Rajada según Restaurant Guru</span></li>
      </ul>
    </div>
    <img src="${IMG.local}" alt="El local de Diagon Cafe">
  </div>
</section>

<section class="sec sec--alt" id="carta">
  <div class="env">
    <p class="sec__pre">La carta</p>
    <h2>Qué vas a encontrar</h2>
    <p class="sec__lead">${total} platos y bebidas repartidos en
      ${menu.categorias.length} categorías. Los desayunos, tostadas y bowls llevan
      nombre propio.</p>

    <div class="filtros" id="filtros">
      <button aria-pressed="true" data-f="todo">Todo</button>
      ${menu.categorias.map((c) => `<button aria-pressed="false" data-f="${c.id}">${esc(c.nombre.es)}</button>`).join('\n      ')}
    </div>
${menu.categorias.map(categoria).join('')}
  </div>
</section>

<section class="sec juegos" id="juegos">
  <div class="env juegos__gr">
    <img src="${IMG.juegos}" alt="Estantería con los juegos de mesa del café">
    <div>
      <p class="sec__pre">Juegos de mesa</p>
      <h2>Coge uno<br>y quédate a jugar</h2>
      <p class="sec__lead">Nuestra estantería está abierta a todo el mundo y no cuesta
        nada. Desde partidas rápidas de cartas hasta juegos de mesa para toda la tarde.
        Si no sabes cuál elegir, pregúntanos.</p>
      <ul class="chips">
        ${JUEGOS.map((j) => `<li>${esc(j)}</li>`).join('\n        ')}
        <li>y muchos más</li>
      </ul>
    </div>
  </div>
</section>

<section class="sec" id="galeria">
  <div class="env">
    <p class="sec__pre">Galería</p>
    <h2>El café por dentro</h2>
    <div class="gal" style="margin-top:2.5rem">
      ${GALERIA.map(([f, alt]) => `<figure><img src="${FOTOS}/${f}" alt="${esc(alt)}" loading="lazy"><figcaption>${esc(alt)}</figcaption></figure>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec sec--alt" id="donde">
  <div class="env donde">
    <div>
      <p class="sec__pre">Dónde estamos</p>
      <h2>Te esperamos</h2>
      <ul class="info">
        <li><h4>Dirección</h4>
          <a href="https://maps.app.goo.gl/d2g11FBeK4i8gxYLA">Carrer de Méndez Núñez, 17 (bajo)<br>
          07590 Cala Rajada, Capdepera · Mallorca</a></li>
        <li><h4>Horario</h4>
          <span class="pdte">Pendiente — nos falta el horario real</span></li>
        <li><h4>Teléfono</h4><a href="tel:+34628505887">+34 628 50 58 87</a></li>
        <li><h4>Email</h4><a href="mailto:cafeteriadiagon@gmail.com">cafeteriadiagon@gmail.com</a></li>
        <li><h4>Instagram</h4><a href="https://www.instagram.com/cafediagon/">@cafediagon</a></li>
      </ul>
    </div>
    <div class="mapa">Aquí irá el mapa de Google incrustado<br>
      <small>(en la maqueta no se carga para no depender de internet)</small></div>
  </div>
</section>

<footer class="pie">
  <div class="env">
    <div class="pie__gr">
      <div><h4>Diagon Cafe</h4>
        Carrer de Méndez Núñez, 17<br>07590 Cala Rajada, Mallorca</div>
      <div><h4>Contacto</h4>
        <a href="tel:+34628505887">+34 628 50 58 87</a><br>
        <a href="mailto:cafeteriadiagon@gmail.com">cafeteriadiagon@gmail.com</a></div>
      <div><h4>Síguenos</h4><a href="https://www.instagram.com/cafediagon/">Instagram</a></div>
    </div>
    <div class="pie__bajo">
      <span>© ${new Date().getFullYear()} Diagon Cafe</span>
      <span>Maqueta generada el ${new Date().toISOString().slice(0, 10)}</span>
    </div>
  </div>
</footer>

<script>
// Filtro de categorias. En React esto sera estado del componente Carta.
const filtros = document.getElementById('filtros');
const cats = [...document.querySelectorAll('.cat')];
filtros.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  filtros.querySelectorAll('button').forEach((b) =>
    b.setAttribute('aria-pressed', String(b === btn)));
  const f = btn.dataset.f;
  cats.forEach((c) => { c.hidden = f !== 'todo' && c.dataset.cat !== f; });
});
</script>
</body>
</html>
`;

writeFileSync(join(RAIZ, 'design', 'mockup.html'), html);
console.log(`design/mockup.html — ${total} platos, ${menu.categorias.length} categorias, ${GALERIA.length} fotos`);
