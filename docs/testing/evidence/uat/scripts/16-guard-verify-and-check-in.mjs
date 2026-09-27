// Guard: verify credential (ENTRY or EXIT) then continue and confirm.
import fs from "node:fs";
import { open } from "./sess.mjs";
import { OUT } from "./lib.mjs";
const cred = fs.readFileSync(OUT + "../cred.txt", "utf8").trim();
const s = await open("guard", { width: 390, height: 844 });
const p = s.page;
const flat = async () => (await p.locator("body").innerText()).replace(/\n+/g, " | ");
const api = []; p.on("response", async (r) => { if (r.url().includes("api/v1") && r.request().method() !== "GET") api.push(`${r.request().method()} ${r.status()} ${r.url().replace(/.*api\/v1/, "")} => ${(await r.text().catch(() => "")).slice(0, 260)}`); });
await s.go("/guard/scan"); await p.locator("#guard-credential").waitFor({ timeout: 60000 });
await p.locator("#guard-credential").fill(cred);
await p.getByRole("button", { name: /verify credential/i }).click(); await p.waitForTimeout(10000);
console.log("VERIFIED:", (await flat()).slice(0, 400));
const next = p.getByRole("button", { name: /continue to/i }).or(p.getByRole("link", { name: /continue to/i })).first();
console.log("NEXT:", await next.innerText());
await next.click(); await p.waitForTimeout(10000);
console.log("CONFIRM PAGE:", p.url(), (await flat()).slice(0, 700));
console.log((await s.fields()).join(" ;; "));
const cb = p.getByRole("checkbox"); for (let i = 0; i < await cb.count(); i++) await cb.nth(i).click();
const btn = p.getByRole("button").filter({ hasText: /confirm|check.?in|check.?out|allow|exit/i }).last();
console.log("BTN:", await btn.innerText()); await btn.click(); await p.waitForTimeout(10000);
const dlg = p.locator("[role=alertdialog],[role=dialog]");
if (await dlg.count()) { console.log("DLG", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 300)); await dlg.getByRole("button").filter({ hasNotText: /cancel|close/i }).last().click(); await p.waitForTimeout(8000); }
console.log("AFTER:", p.url(), (await flat()).slice(0, 700));
await s.shot("guard_after_confirm");
console.log(api.join("\n"));
await s.close();
