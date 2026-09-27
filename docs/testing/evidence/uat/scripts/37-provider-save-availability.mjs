import { open } from "./sess.mjs";
const s = await open("owner");
const p = s.page;
const reqs = []; p.on("request", r => { if (r.method()==="PUT" && r.url().includes("availability")) reqs.push(r.postData()?.slice(0,160)); });
await s.go("/provider/properties/795fd2b7-c729-436d-9442-36581085ee2f");
await p.getByRole("button", { name: /^activate$/i }).waitFor({ timeout: 60000 });
await p.getByRole("button", { name: /^availability$/i }).first().click(); await p.waitForTimeout(4000);
const cbs = p.getByRole("checkbox"); const n = await cbs.count(); console.log("checkboxes", n);
for (let i = 0; i < n; i++) { const c = cbs.nth(i); const lbl = await c.evaluate(e => e.closest("label")?.innerText || ""); if (/day$/.test(lbl.trim())) { if ((await c.getAttribute("aria-checked")) !== "true") await c.click(); } }
await p.getByRole("button", { name: /save availability/i }).click(); await p.waitForTimeout(8000);
console.log("PUT body:", reqs);
await p.getByRole("button", { name: /^activate$/i }).click(); await p.waitForTimeout(8000);
console.log(s.failed().filter(f => !f.includes("/terms")));
await s.go("/provider/properties/795fd2b7-c729-436d-9442-36581085ee2f");
await p.getByText("LISTINGS").waitFor({ timeout: 60000 });
const m = await p.locator("main").innerText();
console.log(m.slice(m.indexOf("LISTINGS"), m.indexOf("LISTINGS") + 150));
await s.close();
