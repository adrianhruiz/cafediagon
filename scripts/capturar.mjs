/**
 * Capturas del viewport real (sin captureBeyondViewport), que renderiza bien
 * los elementos sticky. Util para revisar el aspecto, no la maquetacion.
 *
 *   node scripts/capturar.mjs <url> [ancho] [alto] [scrollY] [nombre]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [url, ancho = 390, alto = 844, scrollY = 0, nombre = 'captura'] = process.argv.slice(2);
const SALIDA = join(RAIZ, 'design', 'capturas');

const RUTAS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const chrome = RUTAS.find(existsSync);
if (!chrome || !url) { console.error('Uso: node scripts/capturar.mjs <url> [ancho] [alto] [scrollY] [nombre]'); process.exit(1); }

const PUERTO = 9800 + (process.pid % 400);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PUERTO}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'diagon-'))}`, '--disable-gpu',
  '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/version`)).json()).webSocketDebuggerUrl; }
  catch { await esperar(250); }
}

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pend = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
});
const enviar = (method, params = {}, sessionId) =>
  new Promise((ok) => { const n = ++id; pend.set(n, ok); ws.send(JSON.stringify({ id: n, method, params, sessionId })); });

const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
const s = (m, p) => enviar(m, p, sessionId);

await s('Page.enable');
await s('Emulation.setDeviceMetricsOverride', {
  width: +ancho, height: +alto, deviceScaleFactor: 1, mobile: +ancho < 768,
});
await s('Page.navigate', { url });
await esperar(2000);
await s('Runtime.evaluate', {
  expression: `(async()=>{for(const i of document.images)i.loading='eager';
    window.scrollTo(0,${+scrollY});await new Promise(r=>setTimeout(r,1200));})()`,
  awaitPromise: true,
});

const { data } = await s('Page.captureScreenshot', { format: 'png' });
mkdirSync(SALIDA, { recursive: true });
const destino = join(SALIDA, `${nombre}.png`);
writeFileSync(destino, Buffer.from(data, 'base64'));
console.log(destino);

ws.close();
proc.kill();
