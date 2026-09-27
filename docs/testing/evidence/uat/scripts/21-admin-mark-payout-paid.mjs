import { open } from "./sess.mjs";
const s = await open("admin");
const p = s.page;
const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} ${(r.request().postData() || "").slice(0, 160)} => ${(await r.text().catch(() => "")).slice(0, 160)}`); });
await s.go("/admin/marketplace/payouts"); await p.getByText("QA Test driver").first().waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
await p.getByPlaceholder("Auditable admin note").first().fill("QA test manual bKash transfer"); await p.getByPlaceholder("Bank or MFS transfer reference").first().fill("BKASH-TRX-QA123"); await p.waitForTimeout(500);
await p.getByRole("button", { name: /confirm transfer paid/i }).first().click(); await p.waitForTimeout(2500);
const dlg = p.locator("[role=alertdialog],[role=dialog]");
if (await dlg.count()) { console.log("DLG:", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 300)); await dlg.getByRole("button").filter({ hasNotText: /cancel|close/i }).last().click(); }
await p.waitForTimeout(9000);
await s.go("/admin/marketplace/payouts"); await p.getByText("QA Test driver").first().waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
const t = await p.locator("body").innerText(); const i = t.indexOf("QA Test driver");
console.log("ROW NOW:", t.slice(i, i + 260).replace(/\n+/g, " | "));
console.log(api.join("\n"));
await s.close();
