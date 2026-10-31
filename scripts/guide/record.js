const TMP_ROOT = process.env.GUIDE_TMP || require('path').join(require('os').tmpdir(), 'elmes-guide');
const { chromium } = require('playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');
const M = require('./motion');
const BASE = 'https://elmes-teka.vercel.app';
const RAW = require('path').join(TMP_ROOT, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const VP = { width: 1280, height: 800 };
const dlg = (p) => p.locator('[role=dialog]').last();
const B = (p, name) => p.locator(`button:has-text("${name}")`).first();
const go = async (p, path) => { await p.goto(BASE + path, { waitUntil: 'networkidle' }); await M.install(p); await p.waitForTimeout(700); };
const safe = async (label, fn) => { try { await fn(); } catch (e) { console.log('  step fail', label, e.message.split('\n')[0]); } };

const SCENES = {
  vente: { role: 'saler', run: async (p) => {
    await go(p, '/commandes/2026');
    await M.title(p, 'Vendeur', 'Enregistrer une vente', 'Client, articles, facture : en 30 secondes');
    await M.caption(p, 'Vos ventes : chiffre d’affaires, panier moyen et statut de chaque vente', 'Étape 1 · L’écran des ventes');
    await safe('stats', () => M.ring(p, p.locator('text=PANIER MOYEN').first().locator('xpath=..'), 1600));
    await M.click(p, B(p, 'Nouvelle vente'));
    await M.caption(p, 'Recherchez le client par nom ou téléphone… ou créez-le en 2 secondes', 'Étape 2 · Le client');
    await safe('client', async () => { await M.type(p, dlg(p).locator('input').first(), 'Marie'); await p.waitForTimeout(1500); await M.click(p, dlg(p).getByText('Marie-Claire Nsimba').first()); });
    await M.caption(p, 'Ajoutez les articles : le stock disponible est vérifié automatiquement', 'Étape 3 · Les articles');
    await safe('produit', async () => { await M.type(p, p.locator('input[placeholder*="Rechercher un produit"]'), 'Chaise'); await p.waitForTimeout(1800); await M.click(p, dlg(p).getByText('Chaise de bureau', { exact: false }).first()); });
    await p.waitForTimeout(800);
    await M.caption(p, 'Contrôlez le résumé : réduction du client appliquée automatiquement', 'Étape 4 · Validation');
    await safe('resume', () => M.click(p, B(p, 'Voir le resume')));
    await safe('valider', () => M.ring(p, B(p, 'Valider la vente'), 1800));
    await M.caption(p, '« Valider la vente » : le stock baisse et le gestionnaire est prévenu en temps réel. Puis « Facture » pour le client.', 'Résultat');
    await p.waitForTimeout(2600);
  } },
  exercice: { role: 'tenant', run: async (p) => {
    await go(p, '/annees');
    await M.title(p, 'Gestionnaire', 'Ouvrir son exercice', 'L’abonnement annuel payé par Mobile Money');
    await M.caption(p, 'Chaque année de gestion est un exercice : en attente, actif ou clôturé', 'Étape 1 · Vos exercices');
    await p.waitForTimeout(1200);
    await M.click(p, B(p, 'Nouvel exercice'));
    await M.caption(p, 'Choisissez l’année : l’exercice va du 1er janvier au 31 décembre', 'Étape 2 · La période');
    await safe('dates', async () => { const i = dlg(p).locator('input[type=date]'); await M.moveTo(p, i.nth(0)); await i.nth(0).fill('2027-01-01'); await M.moveTo(p, i.nth(1)); await i.nth(1).fill('2027-12-31'); });
    await M.caption(p, 'Votre numéro Mobile Money et, si vous en avez un, votre code promo', 'Étape 3 · Le paiement');
    await safe('phone', () => M.type(p, dlg(p).locator('input[placeholder*="243"]').first(), '0812345678'));
    await safe('prix', () => M.ring(p, dlg(p).getByText('Abonnement annuel').locator('xpath=..'), 1800));
    await safe('payer', () => M.ring(p, B(p, 'Creer et payer'), 1600));
    await M.caption(p, 'Validez la demande reçue sur votre téléphone : l’exercice s’active tout seul dès la confirmation', 'Résultat');
    await p.waitForTimeout(2600);
  } },
  article: { role: 'tenant', run: async (p) => {
    await go(p, '/products');
    await M.title(p, 'Gestionnaire', 'Créer ses articles', 'Un catalogue unique, des prix en USD et en CDF');
    await M.caption(p, 'Votre catalogue : catégories, prix, historique des ventes par article', 'Étape 1 · Le catalogue');
    await p.waitForTimeout(1200);
    await M.click(p, B(p, 'Nouveau produit'));
    await M.caption(p, 'Désignation, catégorie et prix : le vendeur ne pourra pas les modifier', 'Étape 2 · La fiche article');
    await safe('designation', () => M.type(p, dlg(p).locator('input').nth(0), 'Pagne Wax 6 yards'));
    await safe('categorie', () => M.type(p, dlg(p).locator('input').nth(1), 'Textile'));
    await safe('enregistrer', () => M.ring(p, dlg(p).locator('button').last(), 1500));
    await M.caption(p, 'Associez ensuite l’article aux boutiques qui le vendent, puis approvisionnez le stock', 'Et après ?');
    await p.waitForTimeout(2400);
  } },
  'points-de-vente': { role: 'tenant', run: async (p) => {
    await go(p, '/stores');
    await M.title(p, 'Gestionnaire', 'Gérer ses points de vente', 'Chaque boutique : ses vendeurs, ses articles, son stock');
    await M.caption(p, 'Toutes vos boutiques et leurs actions', 'Étape 1 · Vos boutiques');
    await p.waitForTimeout(1000);
    await M.click(p, B(p, 'Voir'));
    await M.caption(p, 'La fiche : vendeurs, articles en stock, chiffre d’affaires et résultat', 'Étape 2 · Suivre une boutique');
    await p.waitForTimeout(2600);
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    await M.click(p, B(p, 'Associer produits'));
    await M.caption(p, 'Choisissez l’exercice et les articles vendus dans cette boutique', 'Étape 3 · Associer les articles');
    await p.waitForTimeout(2600);
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    await safe('capitaux', () => M.ring(p, B(p, 'Gerer les capitaux'), 1500));
    await M.caption(p, '« Gérer les capitaux » : le capital investi, pour mesurer la rentabilité', 'Étape 4 · Le capital');
    await p.waitForTimeout(2200);
  } },
  agents: { role: 'tenant', run: async (p) => {
    await go(p, '/agents');
    await M.title(p, 'Gestionnaire', 'Ajouter ses vendeurs', 'Un compte par vendeur, une boutique par vendeur');
    await M.caption(p, 'Vos agents, leur boutique et leur statut', 'Étape 1 · Vos agents');
    await p.waitForTimeout(1200);
    await M.click(p, B(p, 'Nouvel agent'));
    await M.caption(p, 'Recherchez un utilisateur existant ou créez son compte : pseudo, téléphone, e-mail, mot de passe', 'Étape 2 · Le compte');
    await p.waitForTimeout(2800);
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    await safe('suspendre', () => M.ring(p, B(p, 'Suspendre'), 1500));
    await M.caption(p, 'Un vendeur qui part ? Suspendez-le : son historique reste intact', 'Bon à savoir');
    await p.waitForTimeout(2200);
  } },
  depense: { role: 'saler', run: async (p) => {
    await go(p, '/depenses/2026');
    await M.title(p, 'Vendeur et gestionnaire', 'Déclarer une dépense', 'Le vendeur déclare, le gestionnaire valide');
    await M.caption(p, 'Les dépenses de la boutique et leur statut', 'Étape 1 · Vos dépenses');
    await p.waitForTimeout(1200);
    await M.click(p, B(p, 'Nouvelle depense'));
    await M.caption(p, 'Une ligne par dépense : libellé, montant, observation', 'Étape 2 · La déclaration');
    await safe('libelle', () => M.type(p, dlg(p).locator('input[placeholder*="Libelle"]').first(), 'Transport marchandises'));
    await safe('montant', () => M.type(p, dlg(p).locator('input[placeholder="Montant"]').first(), '15000'));
    await safe('envoyer', () => M.ring(p, dlg(p).locator('button').last(), 1500));
    await M.caption(p, 'Le gestionnaire reçoit la demande dans sa cloche de notifications et l’approuve', 'Résultat');
    await p.waitForTimeout(2600);
  } },
  stock: { role: 'saler', run: async (p) => {
    await go(p, '/stocks/2026');
    await M.title(p, 'Vendeur et gestionnaire', 'Approvisionner le stock', 'Aucune entrée en stock sans validation');
    await M.caption(p, 'Vos demandes d’approvisionnement et leur statut', 'Étape 1 · Vos demandes');
    await p.waitForTimeout(1200);
    await M.click(p, B(p, 'Nouvelle demande'));
    await M.caption(p, 'Sélectionnez les articles et les quantités, ajoutez un motif', 'Étape 2 · La demande');
    await p.waitForTimeout(2800);
    await M.caption(p, 'Le stock de la boutique ne change qu’après validation du gestionnaire', 'Résultat');
    await p.waitForTimeout(2400);
  } },
  supervision: { role: 'tenant', run: async (p) => {
    await go(p, '/dashboard');
    await M.title(p, 'Gestionnaire', 'Superviser en temps réel', 'Toutes vos boutiques sur un seul écran');
    await M.caption(p, 'Les chiffres du jour : ventes, dépenses, résultat', 'Étape 1 · Le tableau de bord');
    await safe('kpi', () => M.ring(p, p.getByText('CA du jour').locator('xpath=..'), 1500));
    await M.caption(p, 'Les demandes à valider arrivent dans la cloche', 'Étape 2 · Les notifications');
    await safe('cloche', () => M.click(p, p.locator('header button.relative.flex.h-11.w-11').nth(1)));
    await p.waitForTimeout(2200);
    await p.keyboard.press('Escape'); await p.mouse.click(700, 500); await p.waitForTimeout(500);
    await M.caption(p, 'Parrainez d’autres entrepreneurs et payez moins votre abonnement', 'Étape 3 · Le parrainage');
    await safe('parrain', async () => { const card = p.locator('div.rounded-2xl:has-text("Parrainez")').first(); await card.scrollIntoViewIfNeeded(); await M.ring(p, card, 1800); });
    await safe('wa', () => M.ring(p, p.getByText('Partager sur WhatsApp'), 1400));
    await p.waitForTimeout(1400);
  } },
};

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  for (const name of names) {
    const sc = SCENES[name];
    const ctx = await browser.newContext({ storageState: require('path').join(TMP_ROOT, `${sc.role}.json`), viewport: VP, locale: 'fr-FR', timezoneId: 'Africa/Kinshasa', recordVideo: { dir: RAW, size: VP } });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch {} });
    const p = await ctx.newPage();
    const t0 = Date.now();
    // L'écran-titre marque le début utile de la vidéo
    const origTitle = M.title;
    let start = 0;
    M.title = async (...args) => { if (!start) start = (Date.now() - t0) / 1000; return origTitle(...args); };
    console.log('rec', name);
    try { await sc.run(p); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); }
    M.title = origTitle;
    const v = p.video();
    await ctx.close();
    const src = await v.path();
    // Coupe le chargement initial (avant l'écran-titre) puis encode en H.264
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(Math.max(0, start + 0.15)), '-i', src, '-c:v', 'libx264', '-preset', 'medium', '-crf', '26', '-pix_fmt', 'yuv420p', '-r', '30', '-an', `${RAW}/${name}.mp4`]);
    fs.unlinkSync(src);
    console.log('  ->', name + '.mp4');
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
