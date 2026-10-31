const TMP_ROOT = process.env.GUIDE_TMP || require('path').join(require('os').tmpdir(), 'elmes-guide');
// Montage : plan d'ambiance Higgsfield (si présent) → démonstration réelle → carte de fin.
const { chromium } = require('playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');
const RAW = require('path').join(TMP_ROOT, 'raw'), HF = require('path').join(TMP_ROOT, 'higgsfield'), OUT = require('path').resolve(__dirname, '../../public/guide/videos'), TMP = require('path').join(TMP_ROOT, 'cards');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const LOGO = 'data:image/svg+xml;base64,' + fs.readFileSync(require('path').resolve(__dirname, '../../public/images/logo/logo-horizontal-blanc.svg')).toString('base64');
const VIDEOS = {
  vente: ['ventes', 'Enregistrer une vente'],
  exercice: ['exercice-et-abonnement', 'Ouvrir son exercice'],
  article: ['articles', 'Créer ses articles'],
  'points-de-vente': ['points-de-vente', 'Gérer ses points de vente'],
  agents: ['agents', 'Ajouter ses vendeurs'],
  depense: ['depenses', 'Déclarer une dépense'],
  stock: ['stocks', 'Approvisionner le stock'],
  supervision: ['tableau-de-bord', 'Superviser en temps réel'],
};
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const font = "font-family:'DejaVu Sans',Arial,sans-serif";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const card = async (html, file, transparent) => { await page.setContent(`<html><body style="margin:0;${transparent ? 'background:transparent' : ''}">${html}</body></html>`); await page.screenshot({ path: file, omitBackground: !!transparent }); };
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VIDEOS);
  for (const name of names) {
    const [slug, title] = VIDEOS[name];
    const rec = `${RAW}/${name}.mp4`;
    if (!fs.existsSync(rec)) { console.log('skip', name); continue; }
    await card(`<div style="position:absolute;left:56px;bottom:56px;${font};color:#fff">
      <img src="${LOGO}" style="height:34px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))"/>
      <div style="margin-top:14px;display:inline-block;background:rgba(16,43,80,.88);border-left:6px solid #22C55E;padding:14px 22px;border-radius:10px;font-size:32px;font-weight:bold">${title}</div>
      <div style="margin-top:8px;font-size:16px;letter-spacing:.2em;text-transform:uppercase;color:#4ADE80;text-shadow:0 1px 4px rgba(0,0,0,.6)">Centre de formation ELMES-TEKA</div></div>`, `${TMP}/${name}-lower.png`, true);
    await card(`<div style="width:1280px;height:800px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;${font};color:#fff;background:radial-gradient(circle at 30% 20%,#1B4A8C 0%,#102B50 60%,#0B1E39 100%)">
      <img src="${LOGO}" style="height:56px"/>
      <div style="font-size:34px;font-weight:bold">Retrouvez ce parcours pas à pas</div>
      <div style="width:160px;height:4px;background:#22C55E;border-radius:4px"></div>
      <div style="font-size:24px;color:#CBD5E1">elmes-teka.vercel.app/guide/${slug}</div></div>`, `${TMP}/${name}-end.png`);

    const hf = `${HF}/${name}.mp4`;
    const hasHf = fs.existsSync(hf);
    const recD = dur(rec), X = 0.6, END = 3.2, HFD = 5;
    const inputs = [], filters = [];
    let last, offset;
    if (hasHf) {
      inputs.push('-i', hf, '-loop', '1', '-t', String(HFD), '-i', `${TMP}/${name}-lower.png`);
      filters.push(`[0:v]scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,setsar=1,fps=30,trim=0:${HFD},setpts=PTS-STARTPTS,format=yuv420p[a0]`);
      filters.push(`[1:v]format=rgba,fade=in:st=0.5:d=0.7:alpha=1,fps=30[lt]`);
      filters.push(`[a0][lt]overlay=0:0:shortest=1,format=yuv420p[a]`);
      inputs.push('-i', rec);
      filters.push(`[2:v]fps=30,setsar=1,format=yuv420p[b]`);
      filters.push(`[a][b]xfade=transition=fade:duration=${X}:offset=${HFD - X}[ab]`);
      last = 'ab'; offset = HFD - X + recD - X;
      inputs.push('-loop', '1', '-t', String(END), '-i', `${TMP}/${name}-end.png`);
      filters.push(`[3:v]fps=30,setsar=1,format=yuv420p[e]`);
    } else {
      inputs.push('-i', rec, '-loop', '1', '-t', String(END), '-i', `${TMP}/${name}-end.png`);
      filters.push(`[0:v]fps=30,setsar=1,format=yuv420p[ab]`);
      filters.push(`[1:v]fps=30,setsar=1,format=yuv420p[e]`);
      last = 'ab'; offset = recD - X;
    }
    filters.push(`[${last}][e]xfade=transition=fade:duration=${X}:offset=${offset.toFixed(2)}[out]`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', `${OUT}/${name}.mp4`]);
    // Affiche : une image de la démonstration réelle
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(Math.min(recD - 1, 7)), '-i', rec, '-frames:v', '1', '-q:v', '4', `${OUT}/${name}.jpg`]);
    console.log('montage', name, hasHf ? '(avec plan Higgsfield)' : '(sans plan Higgsfield)', dur(`${OUT}/${name}.mp4`).toFixed(1) + 's', (fs.statSync(`${OUT}/${name}.mp4`).size / 1e6).toFixed(1) + 'MB');
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
