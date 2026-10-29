import axios from 'axios';

const [apiKey, apiSecret] = (process.env.HF_KEY || '').split(':');
const headers = { 'hf-api-key': apiKey, 'hf-secret': apiSecret, 'Content-Type': 'application/json' };

// Test que Wan 3.0 accepte bien resolution + duration + génère
async function main() {
  console.log('=== Vérification paramètres Wan 3.0 ===\n');

  // Check estimate avec résolution explicite
  const variants = [
    { resolution: '480p', duration: 10 },
    { resolution: '720p', duration: 10 },
    { resolution: '480p', duration: 30 },
    { resolution: '720p', duration: 30 },
  ];

  for (const v of variants) {
    try {
      const r = await axios.post(
        'https://api.higgsfield.ai/estimate/alibaba/wan-3.0/text-to-video',
        { prompt: 'test', ...v, aspect_ratio: '16:9' },
        { headers }
      );
      const desc = r.data?.pricing_description ?? JSON.stringify(r.data);
      console.log(`  ${v.resolution} ${v.duration}s → ${desc?.slice(0, 80)}`);
    } catch (e: any) {
      console.log(`  ${v.resolution} ${v.duration}s → ERR ${e?.response?.status}: ${JSON.stringify(e?.response?.data)?.slice(0, 60)}`);
    }
  }

  // Récapitulatif Hailuo 2.3 vs Wan 3.0 (remise 60% jusqu'au 31/10)
  console.log('\n=== CLASSEMENT DÉFINITIF pour $7.01 (au 29/10/2026) ===');
  console.log('');
  console.log('Avec discount 60% actif (expire 31 oct) :');
  const w30_480 = 7.01 / 0.020;
  const w30_720 = 7.01 / 0.040;
  console.log(`  Wan 3.0 480p   $0.020/s → ${w30_480.toFixed(0)}s (${(w30_480/60).toFixed(1)} min) ← 5 min possible ✅`);
  console.log(`  Wan 3.0 720p   $0.040/s → ${w30_720.toFixed(0)}s (${(w30_720/60).toFixed(1)} min)`);
  console.log('');
  console.log('Modèles sans discount (permanents) :');
  const hailuo = Math.floor(7.01 / 0.476) * 10;
  const pixverse = Math.floor(7.01 / 0.204) * 4;
  const kling_t = Math.floor(7.01 / 0.476) * 5;
  console.log(`  Hailuo 2.3 Std $0.0476/s → ${hailuo}s (${(hailuo/60).toFixed(1)} min) ← meilleur permanent`);
  console.log(`  PixVerse V6    $0.0510/s → ${pixverse}s (${(pixverse/60).toFixed(1)} min)`);
  console.log(`  Kling 3.0 Turbo $0.095/s → ${kling_t}s (${(kling_t/60).toFixed(1)} min)`);
}

main().catch(console.error);
