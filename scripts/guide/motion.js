// Motion design injecté dans la page enregistrée : curseur, onde de clic, anneau, sous-titres, écran-titre.
const OVERLAY = `
(() => {
  if (window.__etMotion) return; window.__etMotion = true;
  const css = document.createElement('style');
  css.textContent = \`
  #et-cursor{position:fixed;z-index:2147483647;width:22px;height:22px;pointer-events:none;left:0;top:0;transition:transform .55s cubic-bezier(.22,1,.36,1);}
  #et-cursor svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}
  .et-ripple{position:fixed;z-index:2147483646;width:16px;height:16px;border-radius:50%;background:rgba(34,197,94,.55);pointer-events:none;animation:etRip .7s ease-out forwards}
  @keyframes etRip{to{transform:scale(5);opacity:0}}
  .et-ring{position:fixed;z-index:2147483645;border:3px solid #22C55E;border-radius:12px;pointer-events:none;box-shadow:0 0 0 6px rgba(34,197,94,.18);animation:etRing 1.1s ease-in-out infinite}
  @keyframes etRing{50%{box-shadow:0 0 0 14px rgba(34,197,94,0)}}
  #et-caption{position:fixed;z-index:2147483646;left:50%;top:22px;transform:translateX(-50%) translateY(-20px);opacity:0;max-width:80%;
    background:rgba(16,43,80,.94);color:#fff;font:600 20px/1.35 Poppins,Outfit,Arial,sans-serif;padding:14px 22px;border-radius:14px;
    border-left:5px solid #22C55E;box-shadow:0 12px 30px rgba(0,0,0,.3);transition:all .45s ease;text-align:left}
  #et-caption.on{opacity:1;transform:translateX(-50%) translateY(0)}
  #et-caption small{display:block;font-weight:500;font-size:13px;color:#93C5FD;margin-bottom:2px;letter-spacing:.06em;text-transform:uppercase}
  #et-title{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
    background:radial-gradient(circle at 30% 20%,#1B4A8C 0%,#102B50 60%,#0B1E39 100%);color:#fff;font-family:Poppins,Outfit,Arial,sans-serif;transition:opacity .6s}
  #et-title .k{font-size:16px;letter-spacing:.3em;text-transform:uppercase;color:#4ADE80;animation:etUp .7s ease both}
  #et-title .t{font-size:46px;font-weight:700;text-align:center;max-width:80%;animation:etUp .7s .15s ease both}
  #et-title .s{font-size:20px;color:#CBD5E1;text-align:center;max-width:70%;animation:etUp .7s .3s ease both}
  #et-title .bar{width:0;height:4px;background:#22C55E;border-radius:4px;animation:etBar 1.6s .4s ease forwards}
  @keyframes etUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes etBar{to{width:180px}}\`;
  document.documentElement.appendChild(css);
  const c = document.createElement('div'); c.id='et-cursor';
  c.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="#fff" stroke="#102B50" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.documentElement.appendChild(c);
  const cap = document.createElement('div'); cap.id='et-caption'; document.documentElement.appendChild(cap);
  const pos = JSON.parse(sessionStorage.getItem('etCursor') || '[683,430]');
  c.style.transform = 'translate(' + pos[0] + 'px,' + pos[1] + 'px)';
})();`;

async function install(page) {
  await page.addInitScript(OVERLAY);
  await page.evaluate(OVERLAY).catch(() => {});
}
const sleep = (page, ms) => page.waitForTimeout(ms);

async function caption(page, text, step) {
  await page.evaluate(([t, s]) => {
    const el = document.getElementById('et-caption'); if (!el) return;
    el.classList.remove('on');
    setTimeout(() => { el.innerHTML = (s ? '<small>' + s + '</small>' : '') + t; el.classList.add('on'); }, 250);
  }, [text, step || '']);
  await sleep(page, 700);
}
async function hideCaption(page) { await page.evaluate(() => document.getElementById('et-caption')?.classList.remove('on')); }

async function moveTo(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) return null;
  const x = box.x + Math.min(box.width / 2, 60), y = box.y + box.height / 2;
  await page.evaluate(([x, y]) => {
    const c = document.getElementById('et-cursor'); if (c) c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    sessionStorage.setItem('etCursor', JSON.stringify([x, y]));
  }, [x, y]);
  await sleep(page, 650);
  return { box, x, y };
}
async function ring(page, locator, ms = 1300) {
  const box = await locator.boundingBox(); if (!box) return;
  await page.evaluate((b) => {
    const r = document.createElement('div'); r.className = 'et-ring'; r.id = 'et-ring';
    Object.assign(r.style, { left: (b.x - 6) + 'px', top: (b.y - 6) + 'px', width: (b.width + 12) + 'px', height: (b.height + 12) + 'px' });
    document.documentElement.appendChild(r);
  }, box);
  await sleep(page, ms);
  await page.evaluate(() => document.querySelectorAll('.et-ring').forEach((n) => n.remove()));
}
async function click(page, locator, { highlight = true } = {}) {
  const at = await moveTo(page, locator); if (!at) throw new Error('élément introuvable');
  if (highlight) await ring(page, locator, 1100);
  await page.evaluate(([x, y]) => { const d = document.createElement('div'); d.className = 'et-ripple'; d.style.left = (x - 8) + 'px'; d.style.top = (y - 8) + 'px'; document.documentElement.appendChild(d); setTimeout(() => d.remove(), 800); }, [at.x, at.y]);
  await locator.click();
  await sleep(page, 900);
}
async function type(page, locator, text) {
  await moveTo(page, locator);
  await locator.click();
  await locator.pressSequentially(text, { delay: 55 });
  await sleep(page, 400);
}
async function title(page, kicker, text, sub, ms = 3200) {
  await page.evaluate(([k, t, s]) => {
    document.getElementById('et-title')?.remove();
    const el = document.createElement('div'); el.id = 'et-title';
    el.innerHTML = '<div class="k">' + k + '</div><div class="t">' + t + '</div><div class="bar"></div><div class="s">' + s + '</div>';
    document.documentElement.appendChild(el);
  }, [kicker, text, sub]);
  await sleep(page, ms);
  await page.evaluate(() => { const el = document.getElementById('et-title'); if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 650); } });
  await sleep(page, 700);
}
module.exports = { install, caption, hideCaption, moveTo, ring, click, type, title, sleep };
