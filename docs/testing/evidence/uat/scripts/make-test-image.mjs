import { chromium } from "playwright";
const b = await chromium.launch({ channel: "msedge" }); const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.setContent('<body style="margin:0;background:#9ca3af;display:grid;place-items:center;height:100vh;font:bold 80px sans-serif;color:#111">QA TEST IMAGE<br>please delete</body>');
await p.screenshot({ path: "qa-test.jpg", type: "jpeg", quality: 80 }); await b.close();
