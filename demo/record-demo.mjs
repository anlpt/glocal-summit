// Records a narrated-by-motion demo of the whole app to demo/video/*.webm.
// Requires the dev server running on http://localhost:5173.
// Run: node demo/record-demo.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = resolve(__dirname, 'video');
const BASE = 'http://localhost:5173';
const SIZE = { width: 1440, height: 900 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: SIZE,
  deviceScaleFactor: 2,
  recordVideo: { dir: VIDEO_DIR, size: SIZE },
});
const page = await ctx.newPage();

// Inject a visible cursor + click ripple so the video reads as a real demo.
await page.addInitScript(() => {
  const style = document.createElement('style');
  style.textContent = `
    #demo-cursor{position:fixed;z-index:99999;width:22px;height:22px;margin:-11px 0 0 -11px;
      border-radius:50%;background:rgba(204,32,39,.35);border:2px solid #cc2027;
      pointer-events:none;transition:transform .12s ease-out,left .35s cubic-bezier(.16,1,.3,1),top .35s cubic-bezier(.16,1,.3,1);left:-100px;top:-100px}
    .demo-ripple{position:fixed;z-index:99998;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;
      background:rgba(204,32,39,.5);pointer-events:none;animation:demo-rip .5s ease-out forwards}
    @keyframes demo-rip{to{transform:scale(4);opacity:0}}`;
  document.documentElement.appendChild(style);
  const dot = document.createElement('div');
  dot.id = 'demo-cursor';
  const add = () => document.body && document.body.appendChild(dot);
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
  window.__moveCursor = (x, y) => { dot.style.left = x + 'px'; dot.style.top = y + 'px'; };
  window.__clickAt = (x, y) => {
    dot.style.transform = 'scale(.7)';
    setTimeout(() => (dot.style.transform = 'scale(1)'), 130);
    const r = document.createElement('div');
    r.className = 'demo-ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r); setTimeout(() => r.remove(), 500);
  };
});

const beat = (ms = 1100) => page.waitForTimeout(ms);

// Move the fake cursor to an element, then click it (with ripple).
async function show(locator, { pause = 900 } = {}) {
  await locator.first().waitFor({ state: 'visible', timeout: 8000 });
  const box = await locator.first().boundingBox();
  if (box) {
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.evaluate(([x, y]) => window.__moveCursor?.(x, y), [x, y]);
    await beat(450);
    await page.evaluate(([x, y]) => window.__clickAt?.(x, y), [x, y]);
  }
  await locator.first().click();
  await beat(pause);
}

async function main() {
  // ---------- 1. Participant login ----------
  await page.goto(BASE);
  await beat(2200);
  await page.getByPlaceholder('Your name').fill('Clinton Moore');
  await beat(300);
  await page.getByPlaceholder('Your country').fill('United States');
  await beat(300);
  await page.getByPlaceholder('you@institution.edu').fill('clinton.moore@undp.org');
  await beat(700);
  await show(page.getByRole('button', { name: 'Continue' }), { pause: 1500 });

  // ---------- 2. Select research units (multi, across groups) ----------
  await show(page.getByRole('button', { name: 'Governance & Policy Planning Lab', exact: true }));
  await show(page.getByRole('button', { name: 'New Economy Lab', exact: true }));
  await show(page.getByRole('button', { name: 'Living Lab', exact: true }));
  await show(page.getByRole('button', { name: 'AI Art & Branding Lab', exact: true }));
  await beat(500);
  await show(page.getByRole('button', { name: 'Save my selections' }), { pause: 1600 });

  // Seed a full room of votes so the live view is rich.
  await page.evaluate(() => {
    const labs = JSON.parse(localStorage.getItem('gs_labs'));
    const parts = JSON.parse(localStorage.getItem('gs_participants'));
    const sels = []; let id = 1;
    for (const p of parts) {
      const n = 1 + Math.floor(Math.random() * 4);
      const pool = [...labs].sort(() => Math.random() - 0.5).slice(0, n);
      for (const l of pool) sels.push({ id: id++, participant_id: p.id, lab_id: l.id, created_at: new Date().toISOString() });
    }
    localStorage.setItem('gs_selections', JSON.stringify(sels));
  });

  // ---------- 3. Live view — all four styles + detail drawer ----------
  await page.goto(BASE + '/live');
  await beat(2600); // bubbles
  await show(page.getByRole('tab', { name: 'Bar race' }), { pause: 2400 });
  await show(page.getByRole('tab', { name: 'Treemap' }), { pause: 2400 });
  await show(page.getByRole('tab', { name: 'Leaderboard' }), { pause: 1600 });
  await show(page.locator('.board__row').first(), { pause: 2800 }); // detail drawer
  await show(page.getByRole('button', { name: 'Close' }), { pause: 900 });
  await show(page.getByRole('tab', { name: 'Bubbles' }), { pause: 1800 });

  // ---------- 4. Admin CMS ----------
  await page.goto(BASE + '/admin');
  await beat(1400);
  await page.locator('input').first().fill('admin');
  await beat(300);
  await page.locator('input[type=password]').fill('123');
  await beat(600);
  await show(page.getByRole('button', { name: 'Enter' }), { pause: 2000 }); // overview
  await show(page.getByRole('button', { name: 'Groups & Units' }), { pause: 2400 });
  await show(page.getByRole('button', { name: 'Participants' }), { pause: 2600 });
  await show(page.getByRole('button', { name: 'Selections' }), { pause: 2600 });
  await beat(800);
}

try {
  await main();
} catch (e) {
  console.error('Demo error:', e.message);
} finally {
  await ctx.close(); // finalizes the video
  await browser.close();
  const video = await page.video()?.path();
  console.log('VIDEO_PATH=' + (video || 'none'));
}
