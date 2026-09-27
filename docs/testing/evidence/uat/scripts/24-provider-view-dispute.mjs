import { open } from "./sess.mjs";
const s = await open("owner"); const p = s.page;
const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} => ${(await r.text().catch(() => "")).slice(0, 250)}`); });
await s.go("/provider/disputes"); await p.waitForTimeout(15000);
console.log("LIST:", (await p.getByRole("main").first().innerText()).replace(/\n+/g, " | ").slice(0, 500));
const link = await p.evaluate(() => [...document.querySelectorAll("main a[href]")].map(a => a.getAttribute("href")).find(h => /disputes\/[0-9a-f-]{36}/.test(h)));
console.log("link", link);
if (link) {
  await s.go(link); await p.waitForTimeout(12000);
  console.log("DETAIL:", (await p.getByRole("main").first().innerText()).replace(/\n+/g, " | ").slice(0, 700));
  console.log((await s.fields()).join(" ;; "));
  const ta = p.locator("main textarea").first();
  if (await ta.isVisible().catch(() => false)) {
    await ta.fill("QA test Provider response: we saw the error too and agree the User should be refunded.");
    await p.locator("main").getByRole("button").filter({ hasText: /respond|submit|send/i }).last().click(); await p.waitForTimeout(9000);
    console.log("AFTER:", (await p.getByRole("main").first().innerText()).replace(/\n+/g, " | ").slice(0, 500));
  }
}
console.log(api.join("\n"));
await s.close();
