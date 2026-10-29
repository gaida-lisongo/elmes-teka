/**
 * Higgsfield video generation utility for ELMES-TEKA promo content.
 * Usage: npx tsx scripts/higgsfield-generate.ts
 *
 * Credentials loaded from env: HF_API_KEY_ID + HF_API_KEY_SECRET
 */

import { HiggsfieldClient, JobStatus } from '@higgsfield/client';

const SCENES: Array<{ name: string; prompt: string; duration: number }> = [
  {
    name: 'hero-dashboard',
    prompt:
      'Cinematic close-up of a modern B2B CRM dashboard on a dark navy blue screen. ' +
      'Clean data tables with green success badges, blue KPI cards glowing softly. ' +
      'A hand scrolls through real-time sales metrics. Professional, minimal, African business context. ' +
      'Camera slowly zooms in. 4K, smooth motion.',
    duration: 5,
  },
  {
    name: 'multi-store',
    prompt:
      'Split screen showing three boutiques in a Congolese market, each with a tablet displaying ' +
      'the ELMES-TEKA app. Real-time sales notifications appear simultaneously on all screens. ' +
      'Modern, professional, energetic. Camera pans across the screens. Clean UI visible.',
    duration: 5,
  },
  {
    name: 'entrepreneur-success',
    prompt:
      'African entrepreneur in a well-lit office, smiling confidently at a laptop showing ' +
      'a financial dashboard. Charts in green, positive trend lines. Modern Kinshasa skyline visible ' +
      'through window. Professional attire. Warm but professional lighting. Slow push-in.',
    duration: 5,
  },
];

async function generate(sceneName?: string) {
  const apiKey = process.env.HF_API_KEY_ID;
  const apiSecret = process.env.HF_API_KEY_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Missing HF_API_KEY_ID or HF_API_KEY_SECRET env vars');
    process.exit(1);
  }

  const hf = new HiggsfieldClient({ apiKey, apiSecret });

  const scenes = sceneName
    ? SCENES.filter((s) => s.name === sceneName)
    : SCENES.slice(0, 1); // By default generate only first scene (budget safety)

  for (const scene of scenes) {
    console.log(`\nGenerating: ${scene.name}`);
    console.log(`Prompt: ${scene.prompt.slice(0, 80)}...`);

    try {
      const jobSet = await hf.generate(
        'kling-video/v3.0-turbo/text-to-video', // favori: 10.5s/$1, meilleur rapport qualité/prix
        {
          prompt: scene.prompt,
          duration: scene.duration,
          aspect_ratio: '16:9',
        },
        { withPolling: true }
      );

      const job = jobSet.data.jobs[0];
      if (!job) {
        console.error(`No job returned for ${scene.name}`);
        continue;
      }

      if (job.status === JobStatus.COMPLETED && job.results) {
        const url = job.results.min?.url ?? job.results.raw?.url;
        console.log(`✓ ${scene.name} → ${url}`);
      } else if (job.status === JobStatus.FAILED) {
        console.error(`✗ ${scene.name} → generation failed (no credit charge)`);
      } else if (job.status === JobStatus.NSFW) {
        console.error(`✗ ${scene.name} → content moderated (no credit charge)`);
      } else {
        console.log(`? ${scene.name} → status: ${job.status}`);
      }
    } catch (err) {
      console.error(`Error generating ${scene.name}:`, err);
    }
  }

  hf.close();
}

const target = process.argv[2]; // optional: pass scene name as arg
generate(target).catch(console.error);
