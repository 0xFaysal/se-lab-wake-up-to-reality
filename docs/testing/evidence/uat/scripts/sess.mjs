import { chromium } from "playwright";
import { OUT, BASE, watch } from "./lib.mjs";
export async function open(role, vp = { width: 1366, height: 850 }) {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: vp, storageState: OUT + `../state_${role}.json` });
  const page = await ctx.newPage();
  const log = watch(page);
  const shot = (n) => page.screenshot({ path: OUT + `${role}_${n}.png`, fullPage: true });
  const text = async () => (await page.locator("main").innerText().catch(() => page.locator("body").innerText()));
  const fields = () => page.evaluate(() => [...document.querySelectorAll("input,select,textarea,button")].filter(e=>e.offsetParent).map((e) => `${e.tagName.toLowerCase()}[${e.type||""}] name=${e.name||""} ph=${e.placeholder||""} label=${(e.labels?.[0]?.innerText||e.getAttribute("aria-label")||e.innerText||"").trim().slice(0,40)} val=${(e.value||"").slice(0,30)}`));
  const close = async () => { await ctx.storageState({ path: OUT + `../state_${role}.json` }); await browser.close(); };
  const failed = () => [...new Set(log.failed.filter((s) => !s.includes("socket.io")))];
  return { browser, ctx, page, log, shot, text, fields, close, failed, go: async (p) => { await page.goto(BASE + p, { waitUntil: "load", timeout: 60000 }); await page.waitForTimeout(3000); } };
}
