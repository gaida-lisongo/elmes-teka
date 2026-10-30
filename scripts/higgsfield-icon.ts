/**
 * ELMES-TEKA brand icon generation — Higgsfield direct API call.
 * Run: npx tsx scripts/higgsfield-icon.ts
 */
import { writeFileSync, createWriteStream, mkdirSync } from 'fs';
import https from 'https';
import path from 'path';

const HF_KEY = process.env.HF_KEY ?? '';
if (!HF_KEY) { console.error('HF_KEY env var not set'); process.exit(1); }
const [KEY_ID, KEY_SECRET] = HF_KEY.split(':');

const BASE = 'https://api.higgsfield.ai';
const HEADERS: Record<string, string> = {
  'hf-api-key': KEY_ID,
  'hf-secret': KEY_SECRET,
  'Content-Type': 'application/json',
};

async function api(method: string, urlOrPath: string, body?: unknown) {
  const url = urlOrPath.startsWith('http') ? urlOrPath : `${BASE}${urlOrPath}`;
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${urlOrPath} → ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, res => { res.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }).on('error', reject);
  });
}

async function main() {
  console.log('🎨 Generating ELMES-TEKA brand icon…');

  const prompt =
    'Minimal flat 2D animation on dark navy #070B18 background. ' +
    'A rounded blue square icon with three ascending white vertical bars — ' +
    'bar chart growing upward, shortest on right, tallest on left. ' +
    'Clean geometric shapes, professional brand logo, no text, no people. ' +
    'Square 1:1 format. Smooth subtle animation, premium fintech aesthetic.';

  const init = await api('POST', '/alibaba/wan-3.0/text-to-video', {
    prompt,
    duration: 5,
    aspect_ratio: '1:1',
    resolution: '480p',
  });

  console.log('Init response:', JSON.stringify(init).slice(0, 400));

  const statusUrl: string = init?.status_url ?? '';
  const reqId: string = init?.request_id ?? '';
  if (!statusUrl) { console.error('No status_url'); process.exit(1); }
  console.log(`✓ Request: ${reqId}`);

  // Poll
  let tries = 0;
  let finalResp: Record<string, unknown> | null = null;
  while (tries < 72) {
    await sleep(5000);
    tries++;
    const poll = await api('GET', statusUrl);
    const status: string = String(poll?.status ?? 'unknown');
    process.stdout.write(`  ${tries}. ${status}         \r`);
    if (status === 'completed' || status === 'succeeded') { finalResp = poll; break; }
    if (status === 'failed' || status === 'nsfw' || status === 'error') {
      console.error(`\n✗ ${status} — no charge`);
      process.exit(1);
    }
  }
  if (!finalResp) { console.error('\n✗ Timeout'); process.exit(1); }

  console.log('\n✅ Full result:');
  console.log(JSON.stringify(finalResp, null, 2).slice(0, 1000));

  // Try to find the video URL anywhere in the response
  const text = JSON.stringify(finalResp);
  const videoMatch = text.match(/"url"\s*:\s*"(https:\/\/[^"]+\.mp4[^"]*)"/);
  const posterMatch = text.match(/"(?:poster|thumbnail|preview|image)"\s*:\s*"(https:\/\/[^"]+)"/);

  const videoUrl = videoMatch?.[1] ?? '';
  const posterUrl = posterMatch?.[1] ?? '';
  console.log(`\nVideo : ${videoUrl}`);
  console.log(`Poster: ${posterUrl}`);

  const outDir = path.join(process.cwd(), 'public', 'videos');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, 'brand-icon-manifest.json'),
    JSON.stringify({ name: 'brand-icon', video: videoUrl, poster: posterUrl, raw: finalResp }, null, 2)
  );

  if (videoUrl) {
    console.log('Downloading video…');
    const dest = path.join(outDir, 'brand-icon.mp4');
    await download(videoUrl, dest);
    console.log(`Saved: ${dest}`);
  }

  console.log('Done. Manifest: public/videos/brand-icon-manifest.json');
}

main().catch(console.error);
