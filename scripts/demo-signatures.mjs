// node scripts/demo-signatures.mjs
// Renders a handwritten-style signature PNG for each demo person and uploads it to the storage bucket
// (SUPABASE_URL / SUPABASE_BUCKET) under demo/signatures/<slug>.png. Seed data points at these URLs.
// Needs Playwright's Chromium (npx playwright-core install chromium).
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("dotenv").config();
const { chromium } = require(`${process.env.HOME}/myprojects/demo-videos/recorder/node_modules/playwright-core`);

export const PEOPLE = [
  "Mette Jensen", "Lars Nielsen", "Sofie Hansen", "Mads Pedersen", "Freja Andersen",
  "Rasmus Christensen", "Ida Larsen", "Oliver Sørensen", "Nordlys Logistik", "Hansen Ejendomme",
];
export const slug = (name) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/[^a-z]+/g, "-");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET } = process.env;
const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
});
const page = await browser.newPage({ viewport: { width: 600, height: 220 }, deviceScaleFactor: 2 });
await page.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=block" rel="stylesheet"></head>
<body style="margin:0;background:transparent"><canvas id="c" width="600" height="220"></canvas></body></html>`);
await page.evaluate(() => document.fonts.load('96px "Mrs Saint Delafield"'));

for (const name of PEOPLE) {
  const png = await page.evaluate((n) => {
    const c = document.getElementById("c"), g = c.getContext("2d");
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "#1e2a6b";
    let size = 104;
    do { g.font = `${size}px "Mrs Saint Delafield"`; size -= 4; } while (g.measureText(n).width > 540);
    g.textBaseline = "middle";
    g.fillText(n, (c.width - g.measureText(n).width) / 2, 118);
    return c.toDataURL("image/png").split(",")[1];
  }, name);
  const key = `demo/signatures/${slug(name)}.png`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`, {
    method: "POST",
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "image/png", "x-upsert": "true" },
    body: Buffer.from(png, "base64"),
  });
  if (!r.ok) throw new Error(`${key}: ${r.status} ${await r.text()}`);
  console.log(`✓ ${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`);
}
await browser.close();
