import { chromium } from "playwright";
import { OUT, BASE, watch } from "./lib.mjs";
const browser = await chromium.launch({ channel: "msedge" });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, storageState: OUT + "../state_manager.json" });
const p0 = await ctx.newPage(); const l0 = watch(p0);
await p0.goto(BASE + "/manager/dashboard", { waitUntil: "load" }); await p0.waitForTimeout(8000);
await p0.getByRole("button", { name: /^accept/i }).first().click(); await p0.waitForTimeout(2500);
const dlg = p0.locator("[role=dialog],[role=alertdialog]");
if (await dlg.count()) { const cb = dlg.getByRole("checkbox"); for (let i = 0; i < await cb.count(); i++) await cb.nth(i).click(); await dlg.getByRole("button", { name: /accept|confirm/i }).last().click(); }
await p0.waitForTimeout(10000);
console.log("AFTER ACCEPT:", (await p0.locator("main").innerText()).slice(0, 400).replace(/\n+/g, " | "), l0.failed.filter(x=>!x.includes("socket.io")));
const nav = await p0.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter(h => h && h.startsWith("/manager")))]);
await p0.close();
for (const r of nav) {
  const p = await ctx.newPage(); const log = watch(p);
  await p.goto(BASE + r, { waitUntil: "load" }); await p.waitForTimeout(9000);
  const t = (await p.locator("main").innerText().catch(()=> "")).replace(/\n+/g, " | ");
  console.log(`${r} -> ${p.url().replace(BASE, "")}\n   ${t.slice(0, 220)}`);
  const f = [...new Set(log.failed.filter(x => !x.includes("socket.io")))]; if (f.length) console.log("   F:", f);
  await p.screenshot({ path: OUT + "manager" + r.replace(/[\/\[\]]/g, "_") + ".png", fullPage: true });
  await p.close();
}
await browser.close();
