// Pay a booking through the SSLCOMMERZ sandbox with the published test card.
import { open } from "./sess.mjs";
const id = process.argv[2];
const s = await open("driver");
const p = s.page;
await s.go(`/driver/bookings/${id}/payment`);
const btn = p.locator("main").getByRole("button").filter({ hasText: /sslcommerz/i }).first();
await btn.waitFor({ timeout: 60000 });
console.log("BUTTON:", await btn.innerText());
await btn.click();
await p.waitForURL(/sslcommerz/, { timeout: 60000 }); await p.waitForTimeout(5000);
if (!p.url().includes("sandbox.sslcommerz.com")) { console.log("NOT SANDBOX, abort", p.url()); process.exit(1); }
await p.locator("#ccnum").fill("4111111111111111");
await p.locator("#expiry").fill("12/28");
await p.locator("input[name=cvc]").fill("111");
await p.locator("input[name=name]").fill("QA Test");
await p.getByRole("button", { name: /^pay /i }).first().click();
await p.waitForTimeout(12000);
const otp = p.locator("input[name=pan], input[name=otp]").first();
if (await otp.isVisible().catch(() => false)) await otp.fill("111111");
await p.locator("input[value=Success]").first().click();
await p.waitForURL(/parkease-bd\.vercel\.app/, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(12000);
console.log("RETURN:", p.url());
console.log((await p.locator("main").innerText().catch(() => "")).replace(/\n+/g, " | ").slice(0, 300));
await s.close();
