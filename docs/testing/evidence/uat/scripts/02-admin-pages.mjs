import fs from "node:fs";
import { launch, watch, login, crawl, report, OUT } from "./lib.mjs";

const { browser, ctx } = await launch();
const page = await ctx.newPage();
const log = watch(page);
const landed = await login(page, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
console.log("LOGIN landed:", landed, log.failed);
await page.screenshot({ path: OUT + "admin_after_login.png" });
const nav = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")))]);
console.log("NAV:", nav.join(" "));
await page.close();

const routes = process.argv[2] ? process.argv.slice(2) : [
  "/admin", "/admin/analytics", "/admin/users", "/admin/users/new", "/admin/drivers", "/admin/providers",
  "/admin/managers", "/admin/guards", "/admin/properties", "/admin/properties/pending", "/admin/marketplace",
  "/admin/marketplace/listings", "/admin/marketplace/rights", "/admin/marketplace/right-batches",
  "/admin/marketplace/right-amendments", "/admin/marketplace/disputes", "/admin/marketplace/payouts",
  "/admin/earnings", "/admin/refunds", "/admin/finance/reconciliation", "/admin/parking-operations",
  "/admin/communications/campaigns", "/admin/communications/campaigns/new", "/admin/communications/deliveries",
  "/admin/communications/templates", "/admin/account/security", "/admin/account/sessions",
  ...nav.filter((h) => h && h.startsWith("/admin")),
];
const res = await crawl(ctx, [...new Set(routes)], "admin");
fs.writeFileSync(OUT + "../admin-results.json", JSON.stringify(res, null, 2));
report(res);
await browser.close();
