/**
 * Higgsfield video generation for ELMES-TEKA brand content.
 * Usage: npx tsx scripts/higgsfield-generate.ts [scene-name]
 *
 * Credentials: HF_KEY=KEY_ID:KEY_SECRET (or HF_CREDENTIALS, or HF_API_KEY + HF_API_SECRET)
 */

import { HiggsfieldClient, JobStatus } from '@higgsfield/client';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const SCENES: Array<{
  name: string;
  prompt: string;
  duration: number;
  aspect_ratio?: string;
  resolution?: string;
}> = [
  {
    name: 'brand-icon',
    prompt:
      'Minimal 2D motion design animation on a very dark navy background. ' +
      'A perfect blue rounded square with three white vertical bars of ascending height rising smoothly from the bottom — ' +
      'shortest bar on the right, tallest on the left, like a growing bar chart. ' +
      'Clean, flat, geometric. Professional brand logo animation. No text, no people.',
    duration: 5,
    aspect_ratio: '1:1',
    resolution: '480p',
  },
  {
    name: 'entrepreneur-kinshasa',
    prompt:
      'Cinematic documentary footage. Confident African businesswoman in her 30s wearing a colorful kitenge blouse, ' +
      'checking her smartphone at a well-organized market boutique in Kinshasa DRC. ' +
      'The phone screen shows a dark blue CRM dashboard with green sales numbers. ' +
      'Warm golden morning light, colorful fabric bolts in background. ' +
      'She smiles as a sales notification appears. Slow cinematic push-in. 4K, warm color grading.',
    duration: 8,
    aspect_ratio: '16:9',
    resolution: '480p',
  },
  {
    name: 'hero-ambient',
    prompt:
      'Abstract minimal motion design. Dark navy blue background. ' +
      'Soft glowing blue particles and light rays flowing slowly, like data streams. ' +
      'Professional technology atmosphere. No text, no faces. Seamless loop-friendly motion.',
    duration: 6,
    aspect_ratio: '16:9',
    resolution: '480p',
  },
];

type GeneratedVideo = { name: string; url: string; duration: number };

async function generate(sceneName?: string) {
  // HiggsfieldClient reads HF_KEY or HF_CREDENTIALS from env automatically
  const hf = new HiggsfieldClient();

  const scenes = sceneName
    ? SCENES.filter(s => s.name === sceneName)
    : SCENES.slice(0, 2);

  if (scenes.length === 0) {
    console.error(`Scene "${sceneName}" not found. Available: ${SCENES.map(s => s.name).join(', ')}`);
    process.exit(1);
  }

  const results: GeneratedVideo[] = [];

  for (const scene of scenes) {
    const cost = (scene.duration * 0.020).toFixed(3);
    console.log(`\n⏳ Generating: ${scene.name} (${scene.duration}s, est. $${cost})`);
    console.log(`Prompt: ${scene.prompt.slice(0, 100)}...`);

    try {
      const jobSet = await hf.generate(
        'alibaba/wan-3.0/text-to-video',
        {
          prompt: scene.prompt,
          duration: scene.duration,
          aspect_ratio: scene.aspect_ratio ?? '16:9',
          resolution: scene.resolution ?? '480p',
        },
        { withPolling: true }
      );

      const job = jobSet.data.jobs[0];
      if (!job) {
        console.error(`  No job returned`);
        continue;
      }

      if (job.status === JobStatus.COMPLETED && job.results) {
        const url = job.results.min?.url ?? job.results.raw?.url ?? '';
        console.log(`✅ ${scene.name} → ${url}`);
        results.push({ name: scene.name, url, duration: scene.duration });
      } else if (job.status === JobStatus.FAILED) {
        console.error(`✗ ${scene.name} → failed (no charge)`);
      } else if (job.status === JobStatus.NSFW) {
        console.error(`✗ ${scene.name} → NSFW (no charge)`);
      } else {
        console.log(`? ${scene.name} → status: ${job.status}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number; responseData?: unknown };
      console.error(`  Error: ${e?.message} (${e?.statusCode}) — ${JSON.stringify(e?.responseData ?? '')?.slice(0, 200)}`);
    }
  }

  if (results.length > 0) {
    const outputDir = path.join(process.cwd(), 'public', 'videos');
    mkdirSync(outputDir, { recursive: true });
    const manifest = path.join(outputDir, 'generated-manifest.json');
    writeFileSync(manifest, JSON.stringify(results, null, 2));
    console.log(`\n📄 Manifest → ${manifest}`);
    results.forEach(r => console.log(`  ${r.name}: ${r.url}`));
  }

  hf.close();
}

const target = process.argv[2];
generate(target).catch(console.error);
