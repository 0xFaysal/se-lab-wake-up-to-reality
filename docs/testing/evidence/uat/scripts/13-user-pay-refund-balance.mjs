import { open } from "./sess.mjs";
const id = process.argv[2];
const s = await open("driver");
const p = s.page;
const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} => ${(await r.text().catch(() => "")).slice(0, 220)}`); });
await s.go(`/driver/bookings/${id}/payment`);
await p.locator("main").getByRole("button").filter({ hasText: /pay|confirm|refund balance/i }).first().waitFor({ timeout: 60000 });
const t = await p.locator("main").innerText(); console.log("PAY PAGE:", t.replace(/\n+/g, " | ").slice(0, 600));
const btn = p.locator("main").getByRole("button").filter({ hasText: /pay|confirm|refund balance/i }).first();
console.log("BUTTON:", await btn.innerText());
await btn.click(); await p.waitForTimeout(15000);
console.log("URL:", p.url());
if (p.url().includes("sslcommerz")) { console.log("went to gateway (unexpected)"); }
console.log((await p.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 400));
console.log(api.join("\n"));
await s.close();
