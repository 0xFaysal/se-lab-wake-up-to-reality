import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const BASE = "https://parkease-bd.vercel.app";
export const API = "https://parkease-api.vercel.app/api/v1";
export const OUT = fileURLToPath(new URL("./shots/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });

export async function launch(viewport = { width: 1366, height: 850 }) {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport });
  return { browser, ctx };
}

export function watch(page) {
  const log = { errors: [], failed: [] };
  page.on("console", (m) => m.type() === "error" && log.errors.push(m.text().slice(0, 240)));
  page.on("pageerror", (e) => log.errors.push("PAGEERROR " + e.message.slice(0, 240)));
  page.on("response", async (res) => {
    if (res.status() >= 400 && !res.url().includes("/auth/me") && !res.url().includes("/auth/refresh")) {
      let body = "";
      try { body = (await res.text()).slice(0, 200); } catch {}
      log.failed.push(`${res.request().method()} ${res.status()} ${res.url().replace(API, "API").slice(0, 140)} ${body}`);
    }
  });
  return log;
}

export async function login(page, email, password) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"], input[name="identifier"], input[name="email"], input').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /sign in|log in|login/i }).first().click();
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle").catch(() => {});
  return page.url();
}

export async function crawl(ctx, routes, prefix) {
  const results = [];
  for (const r of routes) {
    const page = await ctx.newPage();
    const log = watch(page);
    let status;
    try {
      const resp = await page.goto(BASE + r, { waitUntil: "load", timeout: 60000 });
      status = resp?.status();
    } catch (e) { log.errors.push("NAV " + e.message.slice(0, 100)); }
    await page.waitForTimeout(4500);
    const h1 = await page.locator("h1").first().innerText({ timeout: 2000 }).catch(() => "");
    const text = await page.locator("body").innerText().catch(() => "");
    const alerts = (text.match(/(something went wrong|failed to load|error[^\n]{0,80}|unable to[^\n]{0,80}|not found[^\n]{0,60}|forbidden[^\n]{0,60})/gi) || []).slice(0, 5);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => null);
    const buttons = await page.evaluate(() => [...document.querySelectorAll("main button, main a[href]")].map((b) => (b.innerText || b.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 40)).filter(Boolean)).catch(() => []);
    await page.screenshot({ path: OUT + prefix + r.replace(/[\/\[\]?=&]/g, "_") + ".png", fullPage: true }).catch(() => {});
    results.push({ route: r, status, finalUrl: page.url().replace(BASE, ""), h1, alerts, overflow, buttons: [...new Set(buttons)].slice(0, 40), ...log });
    await page.close();
  }
  return results;
}

export function report(results) {
  for (const x of results) {
    console.log(`\n${x.route} -> ${x.status} ${x.finalUrl} | h1="${(x.h1 || "").slice(0, 60)}" overflow=${x.overflow}`);
    if (x.alerts.length) console.log("   ALERT:", x.alerts.join(" || "));
    for (const e of [...new Set(x.errors)]) console.log("   E:", e);
    for (const f of [...new Set(x.failed)]) console.log("   F:", f);
    console.log("   BTN:", x.buttons.join(" | ").slice(0, 400));
  }
}
