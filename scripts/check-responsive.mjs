/**
 * Comprueba una pagina en varios anchos y avisa de desbordamiento horizontal,
 * que es el fallo responsive mas habitual y el mas dificil de ver a ojo.
 *
 * Habla con Chrome por el DevTools Protocol, sin dependencias externas.
 *
 *   node scripts/check-responsive.mjs [ruta.html]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGINA = resolve(process.argv[2] ?? join(RAIZ, 'design', 'mockup.html'));
const SALIDA = join(RAIZ, 'design', 'capturas');

const ANCHOS = [
  { w: 320, h: 900, nombre: '320-movil-pequeno' },
  { w: 375, h: 900, nombre: '375-iphone-se' },
  { w: 390, h: 900, nombre: '390-iphone-14' },
  { w: 768, h: 1024, nombre: '768-tablet' },
  { w: 1280, h: 900, nombre: '1280-portatil' },
  { w: 1920, h: 1080, nombre: '1920-escritorio' },
];

const RUTAS_CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const chrome = RUTAS_CHROME.find((p) => existsSync(p));
if (!chrome) { console.error('No encuentro Chrome ni Edge.'); process.exit(1); }

const PUERTO = 9222 + (process.pid % 500);
const perfil = mkdtempSync(join(tmpdir(), 'diagon-'));
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`,
  '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera a que el puerto de depuracion responda. */
async function conectar() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PUERTO}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch { await esperar(250); }
  }
  throw new Error('Chrome no abrio el puerto de depuracion');
}

/** Cliente minimo del DevTools Protocol sobre el WebSocket nativo de Node. */
function cliente(ws) {
  let id = 0;
  const pendientes = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) {
      const { ok, ko } = pendientes.get(m.id);
      pendientes.delete(m.id);
      m.error ? ko(new Error(m.error.message)) : ok(m.result);
    }
  });
  return (method, params = {}, sessionId) => new Promise((ok, ko) => {
    const n = ++id;
    pendientes.set(n, { ok, ko });
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
}

/** Se evalua dentro de la pagina: localiza lo que sobresale del viewport. */
function sondaEnPagina() {
  const doc = document.documentElement;
  const ancho = doc.clientWidth;
  const culpables = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const desborda = Math.round(r.right - ancho);
    if (desborda <= 1) continue;
    // Un contenedor con scroll propio (la barra de filtros) no es un fallo.
    let scrollable = false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ov = getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll') { scrollable = true; break; }
    }
    if (scrollable) continue;
    culpables.push({
      sel: el.tagName.toLowerCase() +
        (el.id ? '#' + el.id : '') +
        (el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
      desborda,
      texto: (el.textContent || '').trim().slice(0, 45),
    });
  }
  // Solo el elemento mas externo de cada rama: el resto son consecuencia.
  culpables.sort((a, b) => b.desborda - a.desborda);
  // Tras el barrido de scroll, cualquier imagen sin cargar es un fallo real.
  const imgsRotas = [...document.images]
    .filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src'));
  return {
    scrollWidth: doc.scrollWidth,
    clientWidth: ancho,
    culpables: culpables.slice(0, 6),
    imgsRotas,
    totalImgs: document.images.length,
  };
}

/**
 * Fuerza la carga de todas las imagenes. El loading="lazy" no se dispara de
 * forma fiable en headless, asi que se desactiva para poder comprobar que todas
 * las rutas resuelven; una imagen rota sigue fallando igual.
 */
async function barrerEnPagina() {
  for (const i of document.images) i.loading = 'eager';
  const paso = window.innerHeight;
  for (let y = 0; y < document.documentElement.scrollHeight; y += paso) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 40));
  }
  window.scrollTo(0, 0);
  // Con tope: una imagen que no llega nunca no puede bloquear la comprobacion.
  await Promise.all([...document.images]
    .filter((i) => !i.complete)
    .map((i) => Promise.race([
      new Promise((r) => { i.onload = i.onerror = r; }),
      new Promise((r) => setTimeout(r, 5000)),
    ])));
  return true;
}

const ws = new WebSocket(await conectar());
await new Promise((r) => ws.addEventListener('open', r));
const enviar = cliente(ws);

const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
const s = (m, p) => enviar(m, p, sessionId);
await s('Page.enable');

mkdirSync(SALIDA, { recursive: true });
const url = pathToFileURL(PAGINA).href;
let fallos = 0;

console.log(`\n  ${PAGINA}\n`);
for (const { w, h, nombre } of ANCHOS) {
  await s('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 1, mobile: w < 768,
  });
  await s('Page.navigate', { url });
  await esperar(1200);

  await s('Runtime.evaluate', {
    expression: `(${barrerEnPagina})()`, awaitPromise: true, returnByValue: true,
  });

  const { result } = await s('Runtime.evaluate', {
    expression: `(${sondaEnPagina})()`, returnByValue: true,
  });
  const r = result.value;

  const { data } = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(SALIDA, `${nombre}.png`), Buffer.from(data, 'base64'));

  const desbordaPagina = r.scrollWidth - r.clientWidth;
  const ok = desbordaPagina <= 1 && r.imgsRotas.length === 0;
  if (!ok) fallos++;

  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${String(w).padStart(4)}px  ` +
    `scroll ${r.scrollWidth} / viewport ${r.clientWidth}` +
    (r.imgsRotas.length ? `  ·  ${r.imgsRotas.length} imagenes rotas` : ''));
  for (const c of r.culpables) {
    console.log(`         +${c.desborda}px  ${c.sel}${c.texto ? `  "${c.texto}"` : ''}`);
  }
  for (const i of r.imgsRotas.slice(0, 5)) console.log(`         rota: ${i}`);
}

console.log(`\n  capturas en design/capturas/`);
console.log(fallos ? `  ${fallos} de ${ANCHOS.length} anchos con problemas\n`
                   : `  los ${ANCHOS.length} anchos pasan\n`);

ws.close();
proc.kill();
process.exit(fallos ? 1 : 0);
