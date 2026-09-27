import fs from "node:fs";
import { launch, watch, BASE, OUT } from "./lib.mjs";
import { newInbox, waitMail } from "./mail.mjs";

const role = process.argv[2] || "driver"; // driver | owner
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const log = watch(page);
const inbox = await newInbox(role === "driver" ? "pe-user-" : "pe-prov-");
const phone = "017" + String(Math.floor(10000000 + Math.random() * 89999999));
const password = process.env.TEST_PASSWORD;
console.log("inbox", inbox.address, "phone", phone);

await page.goto(BASE + "/register" + (role === "owner" ? "?role=owner" : ""), { waitUntil: "networkidle" });
const checkbox = page.locator('input[type="checkbox"]').first();
console.log("terms pre-checked:", await checkbox.isChecked().catch(() => "n/a"));
if (role === "owner") await page.getByRole("button", { name: /parking owner/i }).click().catch(() => {});

const inputs = page.locator("form input:not([type=checkbox])");
console.log("input count", await inputs.count());
await page.getByPlaceholder(/tanvir/i).fill("QA Test " + role);
await page.getByPlaceholder(/example\.com/i).fill(inbox.address);
await page.getByPlaceholder(/017/).fill(phone);
// 1) weak password per frontend hint (8 chars, upper, number)
await page.getByPlaceholder(/at least/i).fill("Abcdefg1");
await page.getByPlaceholder(/re-enter/i).fill("Abcdefg1");
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForTimeout(4000);
const weakMsg = await page.locator("body").innerText();
console.log("WEAK PW RESULT:", (weakMsg.match(/[^\n]*(password|characters|special)[^\n]*/gi) || []).slice(0, 6));
await page.screenshot({ path: OUT + `reg_${role}_weakpw.png`, fullPage: true });

// 2) mismatched confirm
await page.getByPlaceholder(/at least/i).fill(password);
await page.getByPlaceholder(/re-enter/i).fill(password + "x");
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForTimeout(1500);
console.log("MISMATCH:", ((await page.locator("body").innerText()).match(/[^\n]*(match)[^\n]*/gi) || []).slice(0, 3));

// 3) valid
await page.getByPlaceholder(/re-enter/i).fill(password);
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForTimeout(8000);
console.log("after register url:", page.url());
await page.screenshot({ path: OUT + `reg_${role}_after.png`, fullPage: true });
console.log("page text:", (await page.locator("body").innerText()).slice(0, 600));

const mail = await waitMail(inbox, (s, t) => /\b\d{6}\b/.test(t), 90000);
console.log("MAIL:", mail?.subject);
const code = mail?.text.match(/\b(\d{6})\b/)?.[1];
console.log("code", code);
if (code) {
  if (!page.url().includes("verify")) await page.goto(BASE + "/verify-otp", { waitUntil: "networkidle" });
  await page.screenshot({ path: OUT + `reg_${role}_verify.png`, fullPage: true });
  const otpInputs = page.locator("input");
  const n = await otpInputs.count();
  if (n >= 6) { for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill(code[i]); }
  else await otpInputs.first().fill(code);
  const btn = page.getByRole("button", { name: /verify|confirm|continue/i }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
  await page.waitForTimeout(6000);
  console.log("after verify url:", page.url());
  await page.screenshot({ path: OUT + `reg_${role}_verified.png`, fullPage: true });
}
console.log("FAILED:", [...new Set(log.failed.filter((s) => !s.includes("socket.io")))]);
fs.writeFileSync(OUT + `../acct_${role}.json`, JSON.stringify({ ...inbox, phone, password }, null, 2));
await ctx.storageState({ path: OUT + `../state_${role}.json` });
await browser.close();
