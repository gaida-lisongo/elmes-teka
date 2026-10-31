import { createHiggsfieldClient } from '@higgsfield/client/v2';
import fs from 'node:fs';
import os from 'node:os';
const TMP_ROOT = process.env.GUIDE_TMP || `${os.tmpdir()}/elmes-guide`;
fs.mkdirSync(`${TMP_ROOT}/higgsfield`, { recursive: true });
import { execFileSync } from 'node:child_process';
const scenes = JSON.parse(fs.readFileSync(new URL('./storyboard.json', import.meta.url), 'utf8'));
const only = process.argv.slice(2);
const hf = createHiggsfieldClient({ maxPollTime: 20 * 60 * 1000 });
const results = {};
const [keyId, keySecret] = (process.env.HF_KEY || '').split(':');
async function waitFor(requestId) {
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    const r = await fetch(`https://api.higgsfield.ai/requests/${requestId}/status`, { headers: { 'hf-api-key': keyId, 'hf-secret': keySecret } });
    const data = await r.json().catch(() => ({}));
    if (['completed', 'failed', 'nsfw'].includes(data.status)) return data;
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  throw new Error(`Toujours en cours après 20 min : ${requestId}`);
}
await Promise.all(scenes.filter(s => !only.length || only.includes(s.name)).map(async (s) => {
  try {
    // Demande sans attente : l'identifiant est noté avant tout, la génération étant payante.
    const sent = await hf.subscribe('alibaba/wan-3.0/text-to-video', { input: { prompt: s.prompt, duration: 5, aspect_ratio: '16:9', resolution: '720p' }, withPolling: false });
    fs.appendFileSync(`${TMP_ROOT}/higgsfield/requests.txt`, `${s.name} ${sent.request_id}\n`);
    const res = await waitFor(sent.request_id);
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
