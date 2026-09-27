import { open } from "./sess.mjs";
const s = await open("admin");
const p = s.page;
await s.go("/admin/marketplace/rights");
await p.getByText("Green View House").first().waitFor({ timeout: 60000 });
const m = await p.locator("main").innerText();
const i = m.indexOf("QA TEST"); console.log("QA card:", i >= 0 ? m.slice(i - 100, i + 500) : "NOT FOUND", "\nHEAD:", m.slice(0, 600));
if (i >= 0) {
  await p.getByRole("button", { name: /^VERIFIED$/ }).first().click(); await p.waitForTimeout(2000);
  const dlg = p.locator("[role=dialog],[role=alertdialog]");
  if (await dlg.count()) { console.log("DLG", (await dlg.innerText()).slice(0, 500)); const ta = dlg.locator("textarea,input[type=text]").first(); if (await ta.isVisible().catch(()=>false)) await ta.fill("QA test verification"); await dlg.getByRole("button", { name: /confirm|verify|save|submit/i }).last().click(); }
  await p.waitForTimeout(8000);
  await s.go("/admin/marketplace/rights"); await p.getByText("Green View House").first().waitFor({ timeout: 60000 });
  const m2 = await p.locator("main").innerText(); const j = m2.indexOf("QA TEST"); console.log("AFTER:", m2.slice(j - 100, j + 300));
}
console.log(s.failed());
await s.close();
