// Review + Provider reply + Provider earnings + payout request.
import { open } from "./sess.mjs";
const id = "e3dbd0db-b7fd-4225-9584-1e0791e12771";
const flat = async (p) => (await p.getByRole("main").first().innerText().catch(() => p.locator("body").innerText())).replace(/\n+/g, " | ");
const watch = (p, api) => p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} ${(r.request().postData() || "").slice(0, 120)} => ${(await r.text().catch(() => "")).slice(0, 200)}`); });
{ // User review
  const s = await open("driver"); const p = s.page; const api = []; watch(p, api);
  await s.go(`/driver/bookings/${id}/review`); await p.waitForTimeout(10000);
  console.log("REVIEW PAGE:", (await flat(p)).slice(0, 300));
  console.log((await s.fields()).join(" ;; "));
  const star = p.getByRole("button", { name: /4|four/i }).or(p.getByRole("radio", { name: /4/ })).first();
  if (await star.isVisible().catch(() => false)) await star.click();
  const ta = p.locator("main textarea").first(); if (await ta.isVisible().catch(() => false)) await ta.fill("QA test review: easy entry, guard was quick.");
  await p.locator("main").getByRole("button").filter({ hasText: /submit|post|save/i }).last().click().catch((e) => console.log("no submit", e.message.slice(0, 60)));
  await p.waitForTimeout(8000);
  console.log("AFTER REVIEW:", (await flat(p)).slice(0, 300)); console.log(api.join("\n"));
  await s.close();
}
{ // Provider reply + earnings
  const s = await open("owner"); const p = s.page; const api = []; watch(p, api);
  await s.go("/provider/reviews"); await p.waitForTimeout(12000);
  console.log("PROVIDER REVIEWS:", (await flat(p)).slice(0, 400));
  const ta = p.locator("main textarea").first();
  if (await ta.isVisible().catch(() => false)) { await ta.fill("Thank you for parking with us! (QA test reply)"); await p.locator("main").getByRole("button").filter({ hasText: /reply|send|post/i }).first().click(); await p.waitForTimeout(8000); console.log("AFTER REPLY:", (await flat(p)).slice(0, 400)); }
  else { const btn = p.locator("main").getByRole("button").filter({ hasText: /reply/i }).first(); if (await btn.isVisible().catch(() => false)) { await btn.click(); await p.waitForTimeout(1500); await p.locator("textarea").first().fill("Thank you for parking with us! (QA test reply)"); await p.getByRole("button").filter({ hasText: /send|post|save|submit|reply/i }).last().click(); await p.waitForTimeout(8000); console.log("AFTER REPLY:", (await flat(p)).slice(0, 400)); } }
  await s.go("/provider/earnings"); await p.waitForTimeout(12000);
  console.log("EARNINGS:", (await flat(p)).slice(0, 900));
  console.log(api.join("\n"));
  await s.close();
}
