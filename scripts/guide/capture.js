const { open, BASE } = require('./lib');
const OUT = require('path').resolve(__dirname, '../../public/guide/shots');
const only = process.argv[2];

async function shot(page, id, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 900);
  const target = opts.selector ? page.locator(opts.selector).first() : page;
  await target.screenshot({ path: `${OUT}/${id}.jpg`, type: 'jpeg', quality: 78, fullPage: opts.fullPage ?? false });
  console.log('ok', id);
}
const go = async (page, path) => { await page.goto(BASE + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(600); };
const btn = (page, name) => page.getByRole('button', { name, exact: false }).first();
const dialog = (page) => page.locator('[role=dialog]').last();
const fillIn = async (page, index, value) => { await dialog(page).locator('input:not([type=checkbox]):not([type=file]), textarea').nth(index).fill(value); };

const T = {
  'dashboard': async (p) => { await go(p, '/dashboard'); await shot(p, 'tenant-dashboard'); },
  'referral': async (p) => { await go(p, '/dashboard'); await shot(p, 'tenant-referral', { selector: 'div.rounded-2xl:has-text("Parrainez")' }); },
  'notifications': async (p) => { await go(p, '/dashboard'); await p.locator('header button.relative.flex.h-11.w-11').nth(1).click(); await shot(p, 'tenant-notifications', { wait: 1500 }); },
  'annees': async (p) => { await go(p, '/annees'); await shot(p, 'tenant-annees'); },
  'annees-create': async (p) => { await go(p, '/annees'); await btn(p, 'Nouvel exercice').click(); await dialog(p).waitFor(); await fillIn(p, 0, '2027-01-01'); await fillIn(p, 1, '2027-12-31'); await fillIn(p, 2, '+243 81 234 5678'); await shot(p, 'tenant-annees-create', { wait: 2000 }); },
  'stores': async (p) => { await go(p, '/stores'); await shot(p, 'tenant-stores'); },
  'stores-create': async (p) => { await go(p, '/stores'); await btn(p, 'Nouveau point de vente').click(); await dialog(p).waitFor(); await fillIn(p, 0, 'Boutique Matonge'); await shot(p, 'tenant-stores-create'); },
  'stores-products': async (p) => { await go(p, '/stores'); await btn(p, 'Associer produits').click(); await dialog(p).waitFor(); await shot(p, 'tenant-stores-products', { wait: 1500 }); },
  'stores-capital': async (p) => { await go(p, '/stores'); await btn(p, 'Gerer les capitaux').click(); await dialog(p).waitFor(); await shot(p, 'tenant-stores-capital', { wait: 1500 }); },
  'stores-detail': async (p) => { await go(p, '/stores'); await btn(p, 'Voir').click(); await dialog(p).waitFor(); await shot(p, 'tenant-stores-detail', { wait: 1800 }); },
  'products': async (p) => { await go(p, '/products'); await shot(p, 'tenant-products'); },
  'products-create': async (p) => { await go(p, '/products'); await btn(p, 'Nouveau produit').click(); await dialog(p).waitFor(); await fillIn(p, 0, 'Pagne Wax 6 yards'); await fillIn(p, 1, 'Textile'); await shot(p, 'tenant-products-create'); },
  'agents': async (p) => { await go(p, '/agents'); await shot(p, 'tenant-agents'); },
  'agents-create': async (p) => { await go(p, '/agents'); await btn(p, 'Nouvel agent').click(); await dialog(p).waitFor(); await shot(p, 'tenant-agents-create', { wait: 1200 }); },
  'clients': async (p) => { await go(p, '/clients'); await shot(p, 'tenant-clients'); },
  'clients-promo': async (p) => { await go(p, '/clients'); await btn(p, 'Nouvelle promotion').click(); await dialog(p).waitFor(); await fillIn(p, 0, 'Clients fideles'); await shot(p, 'tenant-clients-promo'); },
  'clients-audience': async (p) => { await go(p, '/clients'); const link = p.locator('a[href^="/clients/"]').first(); if (await link.count()) { await link.click(); await p.waitForLoadState('networkidle'); await shot(p, 'tenant-clients-audience', { wait: 1500 }); } else console.log('skip audience'); },
  'stocks': async (p) => { await go(p, '/stocks'); await shot(p, 'tenant-stocks'); },
  'liquidites': async (p) => { await go(p, '/liquidites/2026'); await shot(p, 'tenant-liquidites'); },
  'liquidites-create': async (p) => { await go(p, '/liquidites/2026'); await btn(p, 'Ajouter').click(); await dialog(p).waitFor(); await shot(p, 'tenant-liquidites-create'); },
  'creances': async (p) => { await go(p, '/creances/2026'); await shot(p, 'tenant-creances'); },
  'dettes': async (p) => { await go(p, '/dettes/2026'); await shot(p, 'tenant-dettes'); },
  'fonds': async (p) => { await go(p, '/fonds'); await shot(p, 'tenant-fonds'); },
  'immobilisations': async (p) => { await go(p, '/immobilisations'); await shot(p, 'tenant-immobilisations'); },
  'immobilisations-create': async (p) => { await go(p, '/immobilisations'); await btn(p, 'Ajouter').click(); await dialog(p).waitFor(); await shot(p, 'tenant-immobilisations-create'); },
  'journal': async (p) => { await go(p, '/comptabilite/journal'); await shot(p, 'tenant-journal'); },
  'cloture': async (p) => { await go(p, '/comptabilite/cloture'); await shot(p, 'tenant-cloture'); },
};
const S = {
  'dashboard': async (p) => { await go(p, '/dashboard'); await shot(p, 'saler-dashboard'); },
  'ventes': async (p) => { await go(p, '/commandes/2026'); await shot(p, 'saler-ventes'); },
  'ventes-create': async (p) => { await go(p, '/commandes/2026'); await btn(p, 'Nouvelle vente').click(); await dialog(p).waitFor(); await shot(p, 'saler-ventes-create', { wait: 1500 }); },
  'depenses': async (p) => { await go(p, '/depenses/2026'); await shot(p, 'saler-depenses'); },
  'depenses-create': async (p) => { await go(p, '/depenses/2026'); await btn(p, 'Nouvelle depense').click(); await dialog(p).waitFor(); await shot(p, 'saler-depenses-create', { wait: 1200 }); },
  'stocks': async (p) => { await go(p, '/stocks/2026'); await shot(p, 'saler-stocks'); },
  'stocks-create': async (p) => { await go(p, '/stocks/2026'); await btn(p, 'Nouvelle demande').click(); await dialog(p).waitFor(); await shot(p, 'saler-stocks-create', { wait: 1200 }); },
};

(async () => {
  for (const [role, jobs] of [['tenant', T], ['saler', S]]) {
    const { browser, page } = await open(role);
    for (const [name, job] of Object.entries(jobs)) {
      if (only && !`${role}:${name}`.includes(only)) continue;
      try { await job(page); } catch (e) { console.log('FAIL', role, name, e.message.split('\n')[0]); }
    }
    await browser.close();
  }
  // Inscription (publique)
  if (!only || 'public'.includes(only)) {
    const { browser, page } = await open(null);
    await go(page, '/signup?ref=CLAUEFFEE6'); await shot(page, 'public-signup');
    await browser.close();
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
