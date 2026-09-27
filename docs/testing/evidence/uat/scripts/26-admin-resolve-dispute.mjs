import { open } from "./sess.mjs";
const s = await open("admin"); const p = s.page;
const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} ${(r.request().postData()||"").slice(0,200)} => ${(await r.text().catch(() => "")).slice(0, 200)}`); });
await s.go("/admin/marketplace/disputes"); await p.getByText("PKMUIZP6JKA3BB23").first().waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
await p.getByPlaceholder("Mandatory resolution note").first().fill("QA test resolution: cancellation failed because of a server error (reported to the team). No refund possible from the Admin screen for SSLCOMMERZ payments.");
await p.getByRole("button", { name: /^resolve$/i }).first().click(); await p.waitForTimeout(3000);
const dlg = p.locator("[role=alertdialog],[role=dialog]");
if (await dlg.count()) { console.log("DLG:", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 500)); console.log((await s.fields()).join(" ;; ")); await dlg.getByRole("button").filter({ hasNotText: /cancel|close/i }).last().click(); await p.waitForTimeout(8000); }
await s.go("/admin/marketplace/disputes"); await p.getByText("PKMUIZP6JKA3BB23").first().waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
const t = (await p.getByRole("main").first().innerText()).replace(/\n+/g, " | "); const i = t.indexOf("PKMUIZP6JKA3BB23"); console.log("ROW:", t.slice(i, i + 300));
console.log(api.join("\n"));
await s.close();
