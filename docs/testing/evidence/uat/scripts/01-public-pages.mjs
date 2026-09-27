import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "https://parkease-bd.vercel.app";
import { fileURLToPath } from "node:url";
const OUT = fileURLToPath(new URL("./shots/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });

const routes = [
  "/", "/parking", "/about", "/how-it-works", "/privacy", "/safety",
  "/cancellation-policy", "/support", "/login", "/register", "/forgot-password",
  "/reset-password", "/verify-otp", "/driver/dashboard", "/admin", "/nonexistent-page-xyz",
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (const vp of [{ name: "desktop", width: 1366, height: 850 }, { name: "mobile", width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const r of routes) {
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
    page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 200)));
    page.on("response", (res) => { if (res.status() >= 400) failed.push(`${res.status()} ${res.url().slice(0, 120)}`); });
    let status = null;
    try {
      const resp = await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 45000 });
      status = resp?.status();
    } catch (e) { errors.push("NAV " + e.message.slice(0, 120)); }
    await page.waitForTimeout(800);
    const title = await page.title().catch(() => "");
    const h1 = await page.locator("h1").first().innerText().catch(() => "");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => null);
    const brokenImgs = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.slice(0, 100))).catch(() => []);
    const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))).catch(() => []);
    const name = `${vp.name}${r.replace(/[\/\[\]]/g, "_") || "_home"}.png`;
    await page.screenshot({ path: OUT + name, fullPage: vp.name === "desktop" }).catch(() => {});
    results.push({ vp: vp.name, route: r, status, finalUrl: page.url().replace(BASE, ""), title, h1, overflow, brokenImgs, errors: [...new Set(errors)], failed: [...new Set(failed)], links: vp.name === "desktop" ? [...new Set(links)] : undefined });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + "../public-results.json", JSON.stringify(results, null, 2));
for (const x of results) {
  console.log(`[${x.vp}] ${x.route} -> ${x.status} ${x.finalUrl} | h1="${x.h1.slice(0, 60)}" overflow=${x.overflow} errs=${x.errors.length} failed=${x.failed.length} brokenImg=${x.brokenImgs.length}`);
  for (const e of x.errors) console.log("   E:", e);
  for (const f of x.failed) console.log("   F:", f);
}
