import { chromium } from "playwright";
import { OUT, BASE, watch } from "./lib.mjs";
const browser = await chromium.launch({ channel: "msedge" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: OUT + "../state_guard.json" });
for (const r of ["/guard", "/guard/assignments", "/guard/bookings", "/guard/scan", "/guard/notifications", "/guard/profile", "/guard/account/security", "/guard/account/sessions"]) {
  const p = await ctx.newPage(); const log = watch(p);
  await p.goto(BASE + r, { waitUntil: "load" }); await p.waitForTimeout(7000);
  const t = (await p.locator("body").innerText()).replace(/\n+/g, " | ");
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  console.log(`${r} -> ${p.url().replace(BASE, "")} overflow=${overflow}\n   ${t.slice(0, 260)}`);
  const f = [...new Set(log.failed.filter(x => !x.includes("socket.io")))]; if (f.length) console.log("   F:", f);
  await p.screenshot({ path: OUT + "guard" + r.replace(/\//g, "_") + ".png", fullPage: true });
  if (r === "/guard/scan") {
    await p.locator("#guard-credential").fill("not-a-real-credential"); await p.getByRole("button", { name: /verify|check|resolve/i }).first().click().catch(()=>{}); await p.waitForTimeout(5000);
    console.log("   bad credential ->", ((await p.locator("body").innerText()).match(/[^\n]*(invalid|not found|expired|could not|unable)[^\n]*/gi) || []).slice(0, 3), [...new Set(log.failed.filter(x => !x.includes("socket.io")))].slice(-1));
  }
  await p.close();
}
await ctx.storageState({ path: OUT + "../state_guard.json" });
await browser.close();
