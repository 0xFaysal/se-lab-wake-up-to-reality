// Runs the Postman system test collection stage by stage with Newman and
// saves the results as test evidence.
//
//   node scripts/qa/run-postman-tests.mjs            (about 3 minutes)
//   node scripts/qa/run-postman-tests.mjs --with-slow (adds the 6-minute hold-expiry check)
//
// Needs: the API on http://localhost:4000 (started with NODE_TLS_REJECT_UNAUTHORIZED=0
// so it accepts Mailpit's self-signed certificate), PostgreSQL, Redis and Mailpit,
// and the demo seed (npm run db:seed:demo). The Admin password comes from
// QA_ADMIN_PASSWORD, or SEED_ADMIN_PASSWORD in backend/.env.
//
// Output: docs/testing/evidence/postman/postman-run.log and postman-results.json
import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const postmanDir = path.resolve(backendDir, "../docs/testing/postman");
const evidenceDir = path.resolve(backendDir, "../docs/testing/evidence/postman");
const collection = path.join(postmanDir, "ParkEase-System-Tests.postman_collection.json");
const baseEnvironment = path.join(postmanDir, "ParkEase-Local.postman_environment.json");
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "parkease-postman-"));
const runtimeEnvironment = path.join(workDir, "environment.json");

const stages = [
  "01 Accounts & authentication",
  "01a Registration fields (1 of 6)",
  "01b Registration fields (2 of 6)",
  "01c Registration fields (3 of 6)",
  "01d Registration fields (4 of 6)",
  "01e Registration fields (5 of 6)",
  "01f Registration fields (6 of 6)",
  "02 Properties & Admin review",
  "02b Properties: approval & re-verification",
  "03 Parking spaces, rights & listings",
  "04 Search & suggestions (public, no login)",
  "05 Vehicles, booking & payment",
  "06 Manager",
  "07 Guard",
  "08 Reviews, disputes & notifications",
  "08b Payout accounts & payout requests",
  "08c Admin payout review & ledger",
  "08d Admin moderation",
  "08e Admin Property control, role isolation & closures",
];
if (process.argv.includes("--with-slow")) stages.push("09 Hold expiry (slow, about 6 minutes)");

const adminPassword = process.env.QA_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
if (!adminPassword) throw new Error("Set QA_ADMIN_PASSWORD (or SEED_ADMIN_PASSWORD in backend/.env)");

function helper(...args) {
  const result = spawnSync(process.execPath, [path.join(backendDir, "scripts/qa/postman-helper.mjs"), ...args], { cwd: backendDir, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

// The suite registers accounts, pays and changes Admin data, so it must only
// ever reach local services. Refuse to start if any target is not localhost.
const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const environmentFile = JSON.parse(fs.readFileSync(baseEnvironment, "utf8"));
for (const key of ["host", "api", "mailpit"]) {
  const value = environmentFile.values.find((v) => v.key === key)?.value;
  let hostname;
  try {
    hostname = new URL(value).hostname;
  } catch {
    throw new Error(`Postman environment "${key}" is not a valid URL: ${value}`);
  }
  if (!localHosts.has(hostname)) throw new Error(`Postman environment "${key}" must point to localhost, not ${hostname}`);
}

fs.mkdirSync(evidenceDir, { recursive: true });
// The Admin password goes into the temporary environment file instead of the
// command line, so the shell never sees it.
for (const entry of environmentFile.values) if (entry.key === "adminPassword") entry.value = adminPassword;
fs.writeFileSync(runtimeEnvironment, JSON.stringify(environmentFile, null, 2));
const log = [`# ParkEase BD Postman system test run`, `# Started ${new Date().toISOString()} | Node ${process.version}`, ""];
const results = [];

for (const [index, stage] of stages.entries()) {
  const before = [helper("reset-rate-limits")];
  if (stage.startsWith("02b")) {
    const run = JSON.parse(fs.readFileSync(runtimeEnvironment, "utf8")).values.find((v) => v.key === "run").value;
    before.push(helper("attach-test-images", run));
  }
  const report = path.join(workDir, `stage-${index}.json`);
  // Quote every argument: folder names contain spaces and "&", and on Windows
  // npx only runs through a shell.
  const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
  const newman = spawnSync([
    "npx", "--yes", "newman@6", "run", quote(collection),
    "--environment", quote(runtimeEnvironment), "--export-environment", quote(runtimeEnvironment),
    "--folder", quote(stage),
    "--reporters", "cli,json", "--reporter-json-export", quote(report),
    "--color", "off", "--disable-unicode",
  ].join(" "), { cwd: backendDir, encoding: "utf8", shell: true });
  if (!fs.existsSync(report)) throw new Error(`Newman produced no report for "${stage}":\n${newman.stdout ?? ""}\n${newman.stderr ?? ""}`);
  log.push(`==== ${stage}`, ...before.map((line) => `(helper) ${line}`), newman.stdout, newman.stderr ?? "");

  const run = JSON.parse(fs.readFileSync(report, "utf8")).run;
  // Newman repeats an item's assertions once per pm.sendRequest call it makes,
  // so keep one row per request + assertion.
  const seen = new Set();
  for (const execution of run.executions) {
    for (const assertion of execution.assertions ?? []) {
      const key = `${execution.item.name}|${assertion.assertion}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        stage,
        request: execution.item.name,
        status: execution.response?.code ?? null,
        assertion: assertion.assertion,
        result: assertion.skipped ? "skipped" : assertion.error ? "failed" : "passed",
        ...(assertion.error ? { error: assertion.error.message } : {}),
      });
    }
  }
  const stats = run.stats.assertions;
  console.log(`${stage.padEnd(58)} ${stats.total - stats.failed}/${stats.total} assertions passed`);
}

const env = JSON.parse(fs.readFileSync(runtimeEnvironment, "utf8")).values;
const runId = env.find((v) => v.key === "run")?.value;
fs.writeFileSync(path.join(evidenceDir, "postman-run.log"), log.join("\n").replace(/\x1b\[[0-9;]*m/g, ""));
fs.writeFileSync(path.join(evidenceDir, "postman-results.json"), JSON.stringify({ runId, finishedAt: new Date().toISOString(), results }, null, 2) + "\n");
fs.rmSync(workDir, { recursive: true, force: true });
const failed = results.filter((r) => r.result === "failed").length;
console.log(`\nRun ${runId}: ${results.length} assertions, ${failed} failed, ${results.filter((r) => r.result === "skipped").length} skipped.`);
console.log(`Evidence written to ${path.relative(process.cwd(), evidenceDir)}`);
if (failed > 0) process.exitCode = 1;
