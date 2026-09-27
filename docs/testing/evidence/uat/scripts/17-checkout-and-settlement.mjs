// User requests checkout, then Guard confirms exit; prints settlement.
import { open } from "./sess.mjs";
const id = "e3dbd0db-b7fd-4225-9584-1e0791e12771";
const log = (a) => a.join("\n");
{
  const s = await open("driver"); const p = s.page;
  const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} => ${(await r.text().catch(() => "")).slice(0, 160)}`); });
  await s.go(`/driver/bookings/${id}`);
  await p.getByRole("button", { name: /request checkout/i }).waitFor({ timeout: 60000 });
  await p.getByRole("button", { name: /request checkout/i }).click(); await p.waitForTimeout(8000);
  console.log("USER AFTER REQUEST:", (await p.getByRole("main").first().innerText()).replace(/\n+/g, " | ").slice(0, 200));
  console.log(log(api));
  await s.close();
}
{
  const s = await open("guard", { width: 390, height: 844 }); const p = s.page;
  const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} => ${(await r.text().catch(() => "")).slice(0, 400)}`); });
  await s.go(`/guard/bookings/${id}/active`); await p.waitForTimeout(10000);
  console.log("GUARD ACTIVE:", (await p.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 500));
  await p.getByRole("button", { name: /confirm vehicle exit/i }).click(); await p.waitForTimeout(3000);
  const dlg = p.locator("[role=alertdialog],[role=dialog]");
  if (await dlg.count()) { console.log("DLG:", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 400)); await dlg.getByRole("button").filter({ hasNotText: /cancel|close|back/i }).last().click(); }
  await p.waitForTimeout(12000);
  console.log("GUARD AFTER:", p.url(), (await p.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 600));
  console.log(log(api));
  await s.close();
}
{
  const s = await open("driver"); const p = s.page;
  await s.go(`/driver/bookings/${id}`); await p.waitForTimeout(12000);
  const t = (await p.getByRole("main").first().innerText()).replace(/\n+/g, " | ");
  console.log("USER BOOKING:", t.slice(0, 120));
  const i = t.indexOf("Final settlement"); console.log("SETTLEMENT:", i >= 0 ? t.slice(i, i + 600) : t.slice(-700));
  await s.close();
}
