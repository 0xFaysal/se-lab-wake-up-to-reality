import fs from "node:fs";
import { chromium } from "playwright";
import { crawl, OUT, BASE } from "./lib.mjs";
const [role, ...routes] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, storageState: OUT + `../state_${role}.json` });
const p = await ctx.newPage(); await p.goto(BASE + routes[0], { waitUntil: "load" }); await p.waitForTimeout(4000);
const nav = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")))]);
await p.close();
const all = [...new Set([...routes, ...nav.filter((h) => h && h.startsWith(routes[0].split("/").slice(0,2).join("/")))])];
const res = await crawl(ctx, all, role);
fs.writeFileSync(OUT + `../${role}-results.json`, JSON.stringify(res, null, 2));
for (const x of res) {
  const f = [...new Set(x.failed.filter((s) => !s.includes("socket.io")))];
  const e = [...new Set(x.errors.filter((s) => !s.includes("404 ()") && !s.includes("401 ()")))];
  console.log(`${x.route} -> ${x.finalUrl} | ${x.h1} | overflow=${x.overflow}`);
  if (x.alerts.length) console.log("   ALERT:", x.alerts.join(" || "));
  f.forEach((s) => console.log("   F:", s)); e.forEach((s) => console.log("   E:", s));
}
await ctx.storageState({ path: OUT + `../state_${role}.json` });
await browser.close();
