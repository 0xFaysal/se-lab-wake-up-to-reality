import { open } from "./sess.mjs";
const s = await open("driver");
const p = s.page;
await s.go("/driver/vehicles");
// empty submit validation
await p.getByRole("button", { name: /^add vehicle$/i }).click(); await p.waitForTimeout(1500);
console.log("EMPTY SUBMIT:", ((await s.text()).match(/[^\n]*(required|must|invalid|please)[^\n]*/gi) || []).slice(0,6));
await p.getByPlaceholder("e.g. Toyota").fill("Toyota");
await p.getByPlaceholder("e.g. Corolla").fill("Axio");
const reg = "Dhaka Metro GA 1" + Math.floor(1000+Math.random()*8999).toString().replace(/(\d)(\d{3})/, "$1-$2");
await p.getByPlaceholder(/Dhaka Metro/).fill(reg);
await p.getByPlaceholder("e.g. White").fill("White");
const cb = p.getByText(/set as my default/i); await cb.click().catch(()=>{});
await p.getByRole("button", { name: /^add vehicle$/i }).click(); await p.waitForTimeout(4000);
console.log("REG", reg);
console.log((await s.text()).slice(0, 700));
console.log("FAILED", s.failed());
await s.shot("vehicle_added");
// duplicate reg as same user
await p.getByPlaceholder("e.g. Toyota").fill("Toyota");
await p.getByPlaceholder("e.g. Corolla").fill("Axio");
await p.getByPlaceholder(/Dhaka Metro/).fill(reg.toLowerCase());
await p.getByPlaceholder("e.g. White").fill("Black");
await p.getByRole("button", { name: /^add vehicle$/i }).click(); await p.waitForTimeout(4000);
console.log("DUP:", ((await s.text()).match(/[^\n]*(already|exists|duplicate|registered)[^\n]*/gi) || []).slice(0,4), s.failed().slice(-1));
await s.close();
