// Usage: node ap3.mjs <rowText> <action: Hold|Release|Approve|Reject|Mark paid> [note]
import { open } from "./sess.mjs";
const [rowText, action, note = "QA test"] = process.argv.slice(2);
const s = await open("admin");
const p = s.page;
const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} ${(r.request().postData() || "").slice(0, 160)} => ${(await r.text().catch(() => "")).slice(0, 200)}`); });
await s.go("/admin/marketplace/payouts"); await p.getByText(rowText).first().waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
const note1 = p.getByPlaceholder(/admin note/i).first();
if (await note1.isVisible().catch(() => false)) await note1.fill(note);
await p.getByRole("button", { name: new RegExp("^" + action + "$", "i") }).first().click(); await p.waitForTimeout(2500);
const dlg = p.locator("[role=alertdialog],[role=dialog]");
if (await dlg.count()) {
  console.log("DLG:", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 500));
  const fields = dlg.locator("input:visible, textarea:visible");
  for (let i = 0; i < await fields.count(); i++) { const f = fields.nth(i); if (!(await f.inputValue())) await f.fill(/ref/i.test((await f.getAttribute("name")) + (await f.getAttribute("placeholder"))) ? "BKASH-TRX-QA123" : note); }
  await dlg.getByRole("button").filter({ hasNotText: /cancel|close/i }).last().click();
}
await p.waitForTimeout(9000);
await s.go("/admin/marketplace/payouts"); await p.getByText(rowText).first().waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
const t = await p.locator("body").innerText(); const i = t.indexOf(rowText);
console.log("ROW NOW:", t.slice(i, i + 220).replace(/\n+/g, " | "));
console.log(api.join("\n"));
await s.close();
