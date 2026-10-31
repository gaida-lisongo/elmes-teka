import { createHiggsfieldClient } from '@higgsfield/client/v2';
import fs from 'node:fs';
import os from 'node:os';
const TMP_ROOT = process.env.GUIDE_TMP || `${os.tmpdir()}/elmes-guide`;
fs.mkdirSync(`${TMP_ROOT}/higgsfield`, { recursive: true });
import { execFileSync } from 'node:child_process';
const scenes = JSON.parse(fs.readFileSync(new URL('./storyboard.json', import.meta.url), 'utf8'));
const only = process.argv.slice(2);
const hf = createHiggsfieldClient();
const results = {};
await Promise.all(scenes.filter(s => !only.length || only.includes(s.name)).map(async (s) => {
  try {
    const res = await hf.subscribe('alibaba/wan-3.0/text-to-video', { input: { prompt: s.prompt, duration: 5, aspect_ratio: '16:9', resolution: '720p' } });
    const url = res?.video?.url || res?.videos?.[0]?.url || res?.output?.url || JSON.stringify(res).match(/https:[^"]+\.mp4[^"]*/)?.[0];
    const job = { status: res?.status };
    console.log(s.name, res?.status, url ? 'url ok' : 'no url ' + JSON.stringify(res).slice(0, 300));
    if (url) {
      // On garde l'URL avant de télécharger : la génération est déjà payée.
      fs.appendFileSync(`${TMP_ROOT}/higgsfield/urls.txt`, `${s.name} ${url}\n`);
      console.log(s.name, 'host', new URL(url).host);
      execFileSync('curl', ['-sS', '-L', '--fail', '-m', '120', '-o', `${TMP_ROOT}/higgsfield/${s.name}.mp4`, url]);
      results[s.name] = 'ok';
    } else results[s.name] = job?.status ?? 'unknown';
  } catch (e) { console.log(s.name, 'ERR', e.message); results[s.name] = 'error'; }
}));
console.log(JSON.stringify(results));
