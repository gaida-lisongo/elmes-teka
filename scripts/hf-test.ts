import axios from 'axios';

const [apiKey, apiSecret] = (process.env.HF_KEY || '').split(':');
const headers = { 'hf-api-key': apiKey, 'hf-secret': apiSecret, 'Content-Type': 'application/json' };

const BASE = 'https://api.higgsfield.ai/estimate';

async function est(label: string, endpoint: string, body: object): Promise<{ usd: number } | null> {
  try {
    const r = await axios.post(`${BASE}/${endpoint}`, body, { headers });
    const usd = parseFloat(r.data?.usd ?? '-1');
    return { usd };
  } catch (e: any) {
    console.log(`  ERR ${label}: ${e?.response?.status} ${JSON.stringify(e?.response?.data)?.slice(0,80)}`);
    return null;
  }
}

async function main() {
  const BUDGET = 5;
  const TARGET_SECS = 300; // 5 minutes

  console.log('=== ESTIMATION COÛTS HIGGSFIELD — Budget $5 pour 5 minutes ===\n');

  // Test different durations on Kling 3.0
  const tests = [
    { label: 'Kling 3.0 Turbo  5s', ep: 'kling-video/v3.0-turbo/text-to-video', dur: 5 },
    { label: 'Kling 3.0 Turbo 10s', ep: 'kling-video/v3.0-turbo/text-to-video', dur: 10 },
    { label: 'Kling 3.0 Turbo 15s', ep: 'kling-video/v3.0-turbo/text-to-video', dur: 15 },
    { label: 'Kling 3.0 Std    5s', ep: 'kling-video/v3.0/std/text-to-video',   dur: 5 },
    { label: 'Kling 3.0 Std   10s', ep: 'kling-video/v3.0/std/text-to-video',   dur: 10 },
    { label: 'Kling 3.0 Std   15s', ep: 'kling-video/v3.0/std/text-to-video',   dur: 15 },
    { label: 'Kling 3.0 Pro    5s', ep: 'kling-video/v3.0/pro/text-to-video',   dur: 5 },
    { label: 'Kling 3.0 Pro   15s', ep: 'kling-video/v3.0/pro/text-to-video',   dur: 15 },
  ];

  // Also try Seedance with correct endpoint formats
  const seedanceTests = [
    { label: 'Seedance 2.5  15s HD', ep: 'seedance-2.5/standard/text-to-video', body: { prompt: 'test', duration: 15, resolution: '1080p', aspect_ratio: '16:9' } },
    { label: 'Seedance 2.5  15s',    ep: 'seedance/v2.5/text-to-video',          body: { prompt: 'test', duration: 15, resolution: '720p',  aspect_ratio: '16:9' } },
    { label: 'Wan 2.1 T2V  14s',    ep: 'wan/v2.1/text-to-video',               body: { prompt: 'test', duration: 14, aspect_ratio: '16:9' } },
  ];

  console.log('--- Kling (modèles confirmés) ---');
  const results: Array<{ label: string; dur: number; usd: number; secondsPerDollar: number; totalForTarget: number }> = [];

  for (const t of tests) {
    const r = await est(t.label, t.ep, { prompt: 'test', duration: t.dur, aspect_ratio: '16:9' });
    if (r && r.usd > 0) {
      const clips = Math.ceil(TARGET_SECS / t.dur);
      const totalCost = r.usd * clips;
      const secondsPerDollar = t.dur / r.usd;
      results.push({ label: t.label, dur: t.dur, usd: r.usd, secondsPerDollar, totalForTarget: totalCost });
      console.log(`  ${t.label.padEnd(22)} $${r.usd.toFixed(3)}/clip  ${secondsPerDollar.toFixed(1)}s/$1  → $${totalCost.toFixed(2)} pour 5min`);
    }
  }

  console.log('\n--- Autres modèles ---');
  for (const t of seedanceTests) {
    const r = await est(t.label, t.ep, t.body);
    if (r && r.usd > 0) {
      console.log(`  ${t.label.padEnd(22)} $${r.usd.toFixed(3)}/clip`);
    }
  }

  if (results.length > 0) {
    const best = results.sort((a, b) => b.secondsPerDollar - a.secondsPerDollar)[0];
    const maxSecsWithBudget = Math.floor(BUDGET / best.usd) * best.dur;

    console.log('\n=== RÉSULTAT ===');
    console.log(`Meilleur modèle : ${best.label}`);
    console.log(`  Coût/clip     : $${best.usd.toFixed(3)}`);
    console.log(`  Efficacité    : ${best.secondsPerDollar.toFixed(1)} secondes par dollar`);
    console.log(`  Avec $${BUDGET}   : ${Math.floor(BUDGET / best.usd)} clips × ${best.dur}s = ${maxSecsWithBudget}s (~${(maxSecsWithBudget/60).toFixed(1)} min)`);
    console.log(`  Pour 5 min    : besoin de $${best.totalForTarget.toFixed(2)} (${(best.totalForTarget/BUDGET).toFixed(1)}× le budget)`);
    console.log('\nConclusion : avec $5, production réaliste ≈ ' + maxSecsWithBudget + 's de vidéo AI');
    console.log('Pour 5 min de contenu : compléter avec transitions/titres/music en post-prod');
  }
}

main();
