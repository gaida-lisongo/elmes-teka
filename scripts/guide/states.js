const TMP_ROOT = process.env.GUIDE_TMP || require('path').join(require('os').tmpdir(), 'elmes-guide');
// Ouvre une session par rôle et la garde pour les enregistrements vidéo.
const fs = require('fs');
const { open } = require('./lib');
(async () => {
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  for (const role of ['tenant', 'saler']) {
    const o = await open(role);
    await o.ctx.storageState({ path: require('path').join(TMP_ROOT, `${role}.json`) });
    await o.browser.close();
    console.log('session', role);
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
