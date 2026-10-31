# Captures et vidéos du guide

Ces scripts produisent les médias de `/guide` à partir de la **plateforme réelle** (production),
avec les comptes de démonstration `claude-agent-tenant@elmes-test.dev` et `claude-agent-saler@elmes-test.dev`.
Aucun formulaire n'est validé : rien n'est créé en base.

Variables nécessaires (jamais committées) : `CLAUDE_AGENT_TENANT_PASS`, `CLAUDE_AGENT_SALER_PASS`,
et `HF_KEY` pour Higgsfield. `GUIDE_TMP` change le dossier de travail (par défaut `$TMPDIR/elmes-guide`).

| Étape | Commande | Résultat |
|-------|----------|----------|
| Captures d'écran | `node scripts/guide/capture.js` | `public/guide/shots/*.jpg` |
| Sessions de démo | `node scripts/guide/states.js` | sessions gestionnaire et vendeur |
| Démonstrations | `node scripts/guide/record.js [scène…]` | enregistrements avec motion design |
| Plans d'ambiance | `node scripts/guide/higgsfield.mjs [scène…]` | plans Higgsfield (Wan 3.0, 5 s, 720p), storyboard dans `storyboard.json` |
| Montage | `node scripts/guide/montage.js [scène…]` | `public/guide/videos/*.mp4` + affiche `.jpg` |

`motion.js` contient le motion design injecté dans la page enregistrée : écran-titre, curseur, onde de clic,
anneau de mise en évidence et sous-titres. Le montage enchaîne plan d'ambiance (s'il existe), démonstration réelle
et carte de fin, en fondus.
