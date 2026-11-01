# Comparatif modèles OpenRouter — Novembre 2026
## Pour ELMES-TEKA : conseil commercial en français

Date : 1er novembre 2026  
Source : https://openrouter.ai/collections/free-models + https://openrouter.ai/discover

---

## Modèles retenus (gratuits)

| ID | Paramètres actifs | Contexte | Forces | Usage ELMES |
|---|---|---|---|---|
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 55B actifs / 550B total | 1M tokens | Raisonnement complexe, agentic, multilingue, #1 usage OpenRouter | Analyses, dossier financement |
| `nvidia/nemotron-3.5-lightning:free` | 3B actifs / 30B total | 1M tokens | Très rapide (292 tok/s), faible latence | Chat quotidien |
| `thinkingmachines/inkling:free` | 41B actifs / 975B total | 1M tokens | Multilingue, conversationnel, instruction-following | Alternatif chat |
| `thinkingmachines/inkling-small:free` | 12B actifs / 276B total | 1M tokens | Léger, multilingue, MoE | Alternatif léger |
| `google/gemma-4-26b-a4b-it:free` | 4B actifs / 26B total | 262K tokens | Google, multimodal, Apache 2.0 | Alternatif |
| `openrouter/free` | variable | variable | Auto-route vers le meilleur modèle free disponible | Fallback ultime |

---

## Modèle payant de secours (si quota free dépassé)

| ID | Prix input /M | Prix output /M | Contexte | Note |
|---|---|---|---|---|
| `qwen/qwen3.5-flash-02-23` | ~$0.01 | ~$0.03 | 1M tokens | Qwen Flash, très peu cher |

---

## Limites des modèles :free

- **Sans crédit** : 20 req/min, 50 req/jour
- **Avec $10 minimum** sur le compte OpenRouter : 1 000 req/jour
- Les tentatives échouées comptent dans le quota

> Pour lever la limite à 1 000 req/jour : recharger une seule fois $10 sur
> le compte OpenRouter. C'est un coût opérationnel unique, pas récurrent.

---

## Calcul de charge ELMES-TEKA

Un tenant Premium dispose de 100 crédits inclus par exercice :
- Chat (2 crédits) → 50 appels LLM max
- Analyse (5 crédits) → 20 appels LLM max
- Dossier (10 crédits) → 10 appels LLM max

Avec 100 tenants Premium actifs simultanément (scénario très optimiste au démarrage) :
- Maximum 100 × 50 = 5 000 appels/jour
- Largement dans les 1 000 req/jour du plan $10

En pratique les crédits sont consommés sur une année entière, donc le débit réel
est nettement inférieur à 100 req/jour pour toute la base Premium.

---

## Modèles écartés

| Raison | Modèles |
|---|---|
| Orientés coding uniquement | `qwen/qwen3-coder:free`, `cohere/north-mini-code:free`, `recursive/flint-v1.0:free` |
| Trop petits pour le français commercial | `liquid/lfm-2.5-2.6b:free` (66K ctx), `openai/gpt-oss-20b:free` (non vérifié) |
| Coût trop élevé | `openai/gpt-6.1-terra` ($1/M), `moonshotai/kimi-k3.1-pro` ($2/M) |
| IDs fantômes (créés par session IA précédente) | `openai/gpt-6-luna`, `z-ai/glm-5.3-flash`, `deepseek/deepseek-v4.1-flash-1017` |

---

## Configuration dans llm-client.ts

```typescript
const MODEL_DEFAULTS = {
  chat:     process.env.AI_MODEL_CHAT     ?? "nvidia/nemotron-3.5-lightning:free",
  analysis: process.env.AI_MODEL_ANALYSIS ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  dossier:  process.env.AI_MODEL_DOSSIER  ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  fallback: process.env.AI_MODEL_FALLBACK ?? "openrouter/free",
}
```
