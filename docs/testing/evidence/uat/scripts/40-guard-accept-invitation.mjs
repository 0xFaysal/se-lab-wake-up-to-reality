import { open } from "./sess.mjs";
const s = await open("guard", { width: 390, height: 844 });
const p = s.page;
await s.go("/guard"); await p.waitForTimeout(5000); await p.getByText("Review invitations").click(); await p.waitForTimeout(10000); console.log("URL", p.url(), (await s.fields()).join(" ;; "));
console.log("ASSIGNMENTS:", (await p.locator("body").innerText()).slice(0, 900));
const acc = p.getByRole("button", { name: /^accept/i }).first();
if (await acc.isVisible().catch(()=>false)) {
  await acc.click(); await p.waitForTimeout(2500);
  const dlg = p.locator("[role=dialog],[role=alertdialog]");
  if (await dlg.count()) { console.log("DLG:", (await dlg.innerText()).slice(0, 500)); const cb = dlg.getByRole("checkbox"); for (let i = 0; i < await cb.count(); i++) await cb.nth(i).click(); await dlg.getByRole("button", { name: /accept|confirm/i }).last().click(); }
  await p.waitForTimeout(8000);
  console.log("AFTER ACCEPT:", (await p.locator("body").innerText()).slice(0, 600));
}
console.log(s.failed());
await s.close();
