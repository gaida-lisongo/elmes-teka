# Higgsfield Video Generation Skill

## Credentials
- `HF_KEY` — format `KEY_ID:KEY_SECRET` (env var, set in cloud session)
- Never log, print, or commit credentials.

## SDK
Package: `@higgsfield/client` v0.2.6 (installed as devDependency)

```typescript
import { HiggsfieldClient } from '@higgsfield/client';
const hf = new HiggsfieldClient(); // lit HF_KEY depuis l'env automatiquement
```

---

## Modèle favori #1 : Wan 3.0 480p ⭐ (URGENT — 60% OFF expire 31 oct 2026)

Endpoint : `alibaba/wan-3.0/text-to-video`

Avec la remise 60% OFF active :
- **$0.020/s** (liste $0.050/s, -60%)
- **351 secondes = 5 min 50s pour $7**
- Max 30s/clip → 11 clips × 30s = 330s avec $6.60

```typescript
const jobSet = await hf.generate(
  'alibaba/wan-3.0/text-to-video',
  {
    prompt: 'Cinematic African entrepreneur at laptop, CRM dashboard, Kinshasa skyline...',
    duration: 30,         // max par clip = plus efficace
    aspect_ratio: '16:9',
    resolution: '480p',   // $0.020/s avec 60% OFF
  },
  { withPolling: true }
);
```

> ⚠️ Le discount 60% expire le **31 octobre 2026**. Après : prix revient à $0.050/s.

---

## Modèle favori #2 : Hailuo 2.3 Standard ⭐ (meilleur permanent)

Endpoint : `minimax/hailuo-2.3/standard/text-to-video`

Prix permanent confirmé :
- **$0.0476/s** (via estimate API)
- **140 secondes (2.3 min) pour $7**
- Max ~10s/clip (estimate confirmé sur 10s)

```typescript
const jobSet = await hf.generate(
  'minimax/hailuo-2.3/standard/text-to-video',
  {
    prompt: 'Cinematic B2B dashboard, dark navy interface, smooth pan...',
    duration: 10,
    aspect_ratio: '16:9',
  },
  { withPolling: true }
);
```

---

## Classement complet (budget $7.01, au 29/10/2026)

### Avec discount 60% OFF (expire 31 oct 2026)

| Modèle | Endpoint | Résolution | Prix/s | Secondes pour $7 |
|--------|----------|-----------|--------|-----------------|
| **Wan 3.0** ⭐ | `alibaba/wan-3.0/text-to-video` | 480p | **$0.020** | **351s (5.8 min)** |
| Wan 3.0 | même | 720p | $0.040 | 175s (2.9 min) |
| Wan 3.0 Prime | `alibaba/wan-3.0-prime/text-to-video` | — | ~$0.027 | ~259s |

### Permanents (sans discount)

| Modèle | Endpoint | Prix/s (confirmé) | Secondes pour $7 |
|--------|----------|--------------------|-----------------|
| **Hailuo 2.3 Std** ⭐ | `minimax/hailuo-2.3/standard/text-to-video` | **$0.0476** | **140s (2.3 min)** |
| PixVerse V6 | `pixverse/v6/text-to-video` | $0.0510 | 136s |
| Wan 2.6 | `wan/v2.6/text-to-video` | $0.0850 | 80s |
| Wan 2.7 | `wan/v2.7/text-to-video` | $0.0850 | 80s |
| Kling 3.0 Turbo | `kling-video/v3.0-turbo/text-to-video` | $0.0952 | 70s |
| Kling 3.0 Std | `kling-video/v3.0/std/text-to-video` | $0.1072 | 65s |

### Modèles disponibles mais coûteux
- Kling 4.0: $0.1998/s → 35s pour $7
- Happy Horse 1.1: $0.1530/s → 45s

---

## Découverte des endpoints

L'API `/models` retourne tous les 91 slugs disponibles :

```typescript
const r = await axios.get('https://api.higgsfield.ai/models', {
  headers: { 'hf-api-key': KEY_ID, 'hf-secret': KEY_SECRET }
});
// r.data.items[i].slug → le vrai endpoint
```

L'endpoint `/estimate/{slug}` retourne soit `{"usd": "0.476"}` soit
`{"type": "description", "pricing_description": "Priced per second..."}` (cas Wan 3.0).

---

## Script de génération

Entry point: `scripts/higgsfield-generate.ts`
Run: `npx tsx scripts/higgsfield-generate.ts [scene-name]`

Modèle par défaut : `alibaba/wan-3.0/text-to-video` à 480p

---

## Lifecycle
1. POST → `jobSet.data.id`
2. Poll `GET /v1/generations/{id}` (géré par `withPolling: true`)
3. URL : `jobs[0].results.min.url` (720p) ou `jobs[0].results.raw.url` (full)

## Statuts
- `queued` → `in_progress` → `completed` ✅
- `failed` | `nsfw` → **pas de débit**

## Sécurité
- Ne jamais logguer ou committer `HF_KEY`
- Variables d'env côté serveur uniquement, jamais `NEXT_PUBLIC_`
