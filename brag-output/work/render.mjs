// Frame renderer: drives the stage's renderAt(t) over the Chrome DevTools Protocol.
// usage: node render.mjs <outDir> all|t1,t2,... [fps=30] [dur=21.25] [format=jpeg]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [OUT, WHICH = 'all', FPS = '30', DUR = '21.25', FMT = 'jpeg'] = process.argv.slice(2);
const URL_ = 'http://127.0.0.1:8765/brag-output/work/stage/index.html';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9334', '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'brag-')), 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { await (await fetch('http://127.0.0.1:9334/json/version')).json(); break; } catch { await sleep(200); } }
const tgt = await (await fetch('http://127.0.0.1:9334/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  else if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.type + ' ' + m.params.args.map((a) => a.value || a.description).join(' '));
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result?.result?.value; };
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: URL_ });
for (let i = 0; i < 100; i++) { await sleep(200); try { if (await ev('!!window.stageReady')) break; } catch {} }
await ev('window.stageReady');
const times = WHICH === 'all' ? Array.from({ length: Math.round(Number(DUR) * Number(FPS)) }, (_, f) => f / Number(FPS)) : WHICH.split(',').map(Number);
const t0 = Date.now();
for (let n = 0; n < times.length; n++) {
  const t = times[n];
  await ev(`renderAt(${t})`);
  const r = await send('Page.captureScreenshot', FMT === 'png' ? { format: 'png' } : { format: 'jpeg', quality: 95 });
  const name = WHICH === 'all' ? `f_${String(n).padStart(4, '0')}.${FMT === 'png' ? 'png' : 'jpg'}` : `t_${t.toFixed(2)}.jpg`;
  writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64'));
  if (WHICH === 'all' && n % 60 === 0) console.log(`frame ${n}/${times.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
console.log('done', times.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
console.log('LOGS:', logs.length ? logs.join('\n') : 'none');
ws.close(); chrome.kill(); process.exit(0);
