# Higgsfield Video Generation Skill

## Credentials
- `HF_API_KEY_ID` — API Key ID (env var, set in cloud session)
- `HF_API_KEY_SECRET` — API Key Secret (env var, set in cloud session)
- Never log, print, or commit credentials.

## SDK
Package: `@higgsfield/client` v0.2.6 (installed as devDependency)

```typescript
import { HiggsfieldClient } from '@higgsfield/client';

const hf = new HiggsfieldClient({
  apiKey: process.env.HF_API_KEY_ID,
  apiSecret: process.env.HF_API_KEY_SECRET,
});
```

## Generate a video (with polling)
```typescript
const jobSet = await hf.generate(
  'kling-video/v3.0/std/text-to-video',   // endpoint slug
  {
    prompt: 'A cinematic B2B dashboard, dark navy interface...',
    duration: 5,
    aspect_ratio: '16:9',
  },
  { withPolling: true }   // waits for completion
);

const url = jobSet.data.jobs[0]?.results?.min?.url;
console.log('Video URL:', url);
```

## Generation script
Entry point: `scripts/higgsfield-generate.ts`
Run with: `npx tsx scripts/higgsfield-generate.ts`

## Recommended models (low-cost first)
| Endpoint | Description | Cost |
|---|---|---|
| `kling-video/v3.0/std/text-to-video` | Standard, 5-15s, 720p | cheapest |
| `kling-video/v3.0-turbo/text-to-video` | Turbo, fast | low |
| `bytedance/seedance-2.5/text-to-video` | Best quality | high |

## Lifecycle
1. POST to endpoint → returns `jobSet.data.id`
2. Poll `GET /v1/generations/{id}` until `status = completed`
3. Result at `jobs[0].results.min.url` (low-res) or `jobs[0].results.raw.url` (full)

## Statuses
- `queued` → `in_progress` → `completed` ✅
- `failed` | `canceled` | `nsfw` → error, no credit charge for nsfw/failed

## Budget tracking
With 10 credits: prefer `std` (Standard) over `pro` or `seedance`.
Kling Standard 5s ≈ 1-2 credits. Never generate without knowing the cost first.
