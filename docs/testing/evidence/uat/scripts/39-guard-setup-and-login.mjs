import fs from "node:fs";
import { chromium } from "playwright";
import { OUT, BASE, watch } from "./lib.mjs";
import { waitMail } from "./mail.mjs";
const a = JSON.parse(fs.readFileSync(OUT + "../acct_guard.json"));
const m = await waitMail(a, (s) => /Guard account/i.test(s), 30000);
const link = m.text.match(/https:\/\/parkease-bd\.vercel\.app\/reset-password\?token=[\w-]+/)[0];
const browser = await chromium.launch({ channel: "msedge" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // guard = mobile
const p = await ctx.newPage(); const log = watch(p);
await p.goto(link, { waitUntil: "load" }); await p.waitForTimeout(4000);
console.log("SETUP PAGE:", (await p.locator("body").innerText()).slice(0, 400));
const pw = p.locator("input[type=password]");
console.log("pw fields", await pw.count());
for (let i = 0; i < await pw.count(); i++) await pw.nth(i).fill(a.password);
await p.getByRole("button", { name: /set|reset|save|continue|update|create/i }).first().click(); await p.waitForTimeout(8000);
console.log("after setup:", p.url(), (await p.locator("body").innerText()).slice(0, 300));
// login
await p.goto(BASE + "/login", { waitUntil: "load" }); await p.waitForTimeout(2000);
await p.locator("input").first().fill(a.address); await p.locator("input[type=password]").fill(a.password);
await p.getByRole("button", { name: /^sign in$/i }).click(); await p.waitForTimeout(9000);
console.log("after login:", p.url());
console.log((await p.locator("body").innerText()).slice(0, 700));
await p.screenshot({ path: OUT + "guard_after_login.png", fullPage: true });
await ctx.storageState({ path: OUT + "../state_guard.json" });
console.log(log.failed.filter(f => !f.includes("socket.io")));
await browser.close();
