/**
 * Génère TOUS les visuels du site à partir des modèles 3D (lib/three/models.js) :
 *   public/sequence/frame_0001.webp ... (séquence pilotée par le scroll)
 *   public/video/beans-loop.mp4 / .webm / -poster.jpg (vidéo en boucle)
 *   public/images/products/*.webp, public/images/bags/*.webp, public/og.jpg
 *
 * Usage :
 *   npm run render:assets                    -> tout régénérer
 *   node scripts/render-assets.mjs sequence  -> seulement la séquence
 *   node scripts/render-assets.mjs product:latte --frames=0 --out=./preview
 *
 * Pré-requis : `npx playwright install chromium` et ffmpeg (pour la vidéo).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const ALL_JOBS = [
  'product:espresso',
  'product:cappuccino',
  'product:latte',
  'product:coldbrew',
  'bag:ethiopia',
  'bag:colombia',
  'bag:brazil',
  'og',
  'sequence',
  'beans-loop',
];

const args = process.argv.slice(2);
const opt = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v = 'true'] = a.slice(2).split('=');
    return [k, v];
  })
);
const jobs = args.filter((a) => !a.startsWith('--'));
const selected = jobs.length ? jobs : ALL_JOBS;
const onlyFrames = opt.frames ? opt.frames.split(',').map(Number) : null;
const previewDir = opt.out ? path.resolve(opt.out) : null;

/* --- mini serveur statique (les modules ES ne marchent pas en file://) --- */
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text());
});
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.goto(`http://localhost:${PORT}/scripts/render/index.html`);
await page.waitForFunction(() => window.KAHWA_READY === true, null, { timeout: 60000 });

function save(dataUrl, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

function outFile(jobName, i, ext) {
  const pad = String(i + 1).padStart(4, '0');
  const slug = jobName.replace(':', '-');
  if (previewDir) return path.join(previewDir, `${slug}_${pad}.${ext}`);
  if (jobName === 'sequence') return path.join(PUBLIC, 'sequence', `frame_${pad}.webp`);
  if (jobName === 'beans-loop') return path.join(ROOT, '.render-tmp', 'beans-loop', `f_${pad}.jpg`);
  if (jobName.startsWith('product:')) return path.join(PUBLIC, 'images', 'products', `${jobName.split(':')[1]}.webp`);
  if (jobName.startsWith('bag:')) return path.join(PUBLIC, 'images', 'bags', `${jobName.split(':')[1]}.webp`);
  if (jobName === 'og') return path.join(PUBLIC, 'og.jpg');
  throw new Error('sortie inconnue ' + jobName);
}

for (const name of selected) {
  const t0 = Date.now();
  const { frames } = await page.evaluate((n) => window.KAHWA.setup(n), name);
  const list = onlyFrames ? onlyFrames.filter((f) => f < frames) : [...Array(frames).keys()];
  for (const i of list) {
    const dataUrl = await page.evaluate((k) => window.KAHWA.frame(k), i);
    const ext = dataUrl.startsWith('data:image/webp') ? 'webp' : dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    save(dataUrl, outFile(name, i, ext));
    if (list.length > 1 && i % 10 === 0) process.stdout.write(`\r${name}: ${i + 1}/${frames}`);
  }
  console.log(`\r${name}: ${list.length} image(s) en ${((Date.now() - t0) / 1000).toFixed(1)} s`);

  // Encodage vidéo
  if (name === 'beans-loop' && !previewDir && !onlyFrames) {
    const src = path.join(ROOT, '.render-tmp', 'beans-loop', 'f_%04d.jpg');
    const outDir = path.join(PUBLIC, 'video');
    fs.mkdirSync(outDir, { recursive: true });
    const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });
    ff(['-framerate', '30', '-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', path.join(outDir, 'beans-loop.mp4')]);
    ff(['-framerate', '30', '-i', src, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-an', path.join(outDir, 'beans-loop.webm')]);
    fs.copyFileSync(path.join(ROOT, '.render-tmp', 'beans-loop', 'f_0001.jpg'), path.join(outDir, 'beans-loop-poster.jpg'));
    fs.rmSync(path.join(ROOT, '.render-tmp'), { recursive: true, force: true });
    console.log('vidéo encodée -> public/video/');
  }
}

await browser.close();
server.close();
