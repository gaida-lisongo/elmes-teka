const { chromium } = require('playwright');
const BASE = 'https://elmes-teka.vercel.app';
const ACCOUNTS = {
  tenant: { email: 'claude-agent-tenant@elmes-test.dev', pass: process.env.CLAUDE_AGENT_TENANT_PASS },
  saler: { email: 'claude-agent-saler@elmes-test.dev', pass: process.env.CLAUDE_AGENT_SALER_PASS },
};
async function open(role, viewport = { width: 1366, height: 860 }) {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'fr-FR', timezoneId: 'Africa/Kinshasa' });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch {} });
  const page = await ctx.newPage();
  if (role) {
    const a = ACCOUNTS[role];
    await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
    await page.locator('form input:not([type=password])').first().fill(a.email);
    await page.waitForTimeout(800);
    await page.locator('input[type=password]').fill(a.pass);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL(/dashboard/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  }
  return { browser, ctx, page };
}
module.exports = { open, BASE };
