# Higgsfield Video Generation Skill

## Credentials
- `HF_KEY` — format `KEY_ID:KEY_SECRET` (env var, set in cloud session)
- Alternatively: `HF_API_KEY_ID` + `HF_API_KEY_SECRET` séparément
- Never log, print, or commit credentials.

## SDK
Package: `@higgsfield/client` v0.2.6 (installed as devDependency)

```typescript
import { HiggsfieldClient } from '@higgsfield/client';
const hf = new HiggsfieldClient(); // lit HF_KEY depuis l'env automatiquement
```

## Modèle favori : Kling 3.0 Turbo ⭐

Endpoint : `kling-video/v3.0-turbo/text-to-video`

Meilleur rapport qualité/prix confirmé par estimation API (2026-10-29) :

| Modèle | Durée | Coût/clip | Efficacité |
|--------|-------|-----------|------------|
| **Kling 3.0 Turbo** ⭐ | 5s  | $0.476 | **10.5s/$1** |
| **Kling 3.0 Turbo** ⭐ | 10s | $0.952 | **10.5s/$1** |
| **Kling 3.0 Turbo** ⭐ | 15s | $1.428 | **10.5s/$1** |
| Kling 3.0 Standard | 5s  | $0.536 | 9.3s/$1 |
| Kling 3.0 Standard | 10s | $1.071 | 9.3s/$1 |
| Kling 3.0 Standard | 15s | $1.607 | 9.3s/$1 |
| Kling 3.0 Pro | 5s  | $0.714 | 7.0s/$1 |
| Kling 3.0 Pro | 15s | $2.142 | 7.0s/$1 |

> Le pricing est **linéaire** : choisir 5s ou 15s ne change pas le coût par seconde.
> Seedance, Wan 2.1, Kling 4.0 → endpoint 404 (non disponibles sur ce plan).

## Génération avec le modèle favori

```typescript
import { HiggsfieldClient, JobStatus } from '@higgsfield/client';

const hf = new HiggsfieldClient();

const jobSet = await hf.generate(
  'kling-video/v3.0-turbo/text-to-video',
  {
    prompt: 'A cinematic B2B dashboard, dark navy interface, African business context.',
    duration: 5,        // 5-15s — même coût/seconde
    aspect_ratio: '16:9',
  },
  { withPolling: true }
);

const url = jobSet.data.jobs[0]?.results?.min?.url;
```

## Script de génération
Entry point: `scripts/higgsfield-generate.ts`
Run: `npx tsx scripts/higgsfield-generate.ts [scene-name]`

## Estimation sans générer (gratuit)

```typescript
import axios from 'axios';
const [k, s] = (process.env.HF_KEY || '').split(':');
const r = await axios.post(
  'https://api.higgsfield.ai/estimate/kling-video/v3.0-turbo/text-to-video',
  { prompt: 'test', duration: 5, aspect_ratio: '16:9' },
  { headers: { 'hf-api-key': k, 'hf-secret': s, 'Content-Type': 'application/json' } }
);
// r.data.usd → "0.476"
```

## Budget $5 — ce qu'on peut générer

Avec $5 et Kling 3.0 Turbo 5s :
- **10 clips × 5s = 50 secondes** de vidéo AI pure
- Coût total : $4.76

Pour une vidéo de 5 minutes avec $5 :
- Générer 10 scènes clés de 5s chacune (les moments forts)
- Compléter avec transitions, titres animés, musique et visuels statiques en post-production
- Outils de montage recommandés : CapCut, DaVinci Resolve (gratuit)

## Lifecycle
1. POST → `jobSet.data.id`
2. Poll `GET /v1/generations/{id}` jusqu'à `status = completed` (géré par `withPolling: true`)
3. URL résultat : `jobs[0].results.min.url` (720p) ou `jobs[0].results.raw.url` (full HD)

## Statuts
- `queued` → `in_progress` → `completed` ✅
- `failed` | `canceled` | `nsfw` → erreur, **pas de débit** si failed/nsfw

## Sécurité
- Ne jamais logguer `HF_KEY`, `HF_API_KEY_ID` ou `HF_API_KEY_SECRET`
- Ne jamais committer les credentials
- Variables d'env côté serveur uniquement, jamais `NEXT_PUBLIC_`
