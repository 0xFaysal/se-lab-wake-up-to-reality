import fs from "node:fs";
import { chromium } from "playwright";
import { OUT, BASE } from "./lib.mjs";
export async function relogin(role, email, password) {
  const acct = email ? { address: email, password } : JSON.parse(fs.readFileSync(OUT + `../acct_${role}.json`, "utf8"));
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  const p = await ctx.newPage();
  await p.goto(BASE + "/login", { waitUntil: "load" }); await p.waitForTimeout(2000);
  await p.locator("input").first().fill(acct.address);
  await p.locator('input[type="password"]').fill(acct.password);
  await p.getByText(/remember this device/i).click().catch(() => {});
  await p.getByRole("button", { name: /^sign in$/i }).click(); await p.waitForURL(u => !u.toString().includes("/login"), { timeout: 45000 }).catch(()=>{});
  await p.waitForTimeout(7000);
  const url = p.url();
  await ctx.storageState({ path: OUT + `../state_${role}.json` });
  await browser.close();
  return url;
}
if (process.argv[2]) console.log(process.argv[2], "->", await relogin(process.argv[2], process.argv[3], process.argv[4]));
