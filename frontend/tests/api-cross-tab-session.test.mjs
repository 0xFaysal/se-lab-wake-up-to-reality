import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/api/api-client.ts", import.meta.url), "utf8");
let instance = 0;
async function clientInstance() {
  const rewritten = source
    .replace('import { publicEnv } from "@/lib/config/public-env";', "const publicEnv = { API_BASE_URL: 'https://unit.invalid/api/v1' };")
    .replace('from "./api-error"', `from ${JSON.stringify(new URL("../lib/api/api-error.ts", import.meta.url).href)}`);
  const { outputText } = ts.transpileModule(rewritten, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(`${outputText}\n// instance ${instance++}`).toString("base64")}`);
}

function browserEnvironment(t) {
  const saved = new Map();
  const values = new Map();
  const events = new EventTarget();
  let queue = Promise.resolve();
  let acquisitions = 0;
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const locks = {
    request: (_name, options, callback) => {
      acquisitions += 1;
      const result = queue.then(() => {
        if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
        return callback();
      });
      queue = result.catch(() => undefined);
      return result;
    },
  };
  for (const [key, value] of Object.entries({ window: events, localStorage: storage, navigator: { locks } })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  t.after(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { events, storage, acquired: () => acquisitions };
}

const expired = () => Response.json({ error: { code: "AUTH_UNAUTHORIZED", message: "Expired" } }, { status: 401 });
const renewed = () => Response.json({ success: true, data: { accessToken: "renewed-access", refreshToken: "renewed-refresh" } });

test("independent browser clients share rotation instead of replaying a refresh token", async (t) => {
  const browser = browserEnvironment(t);
  const first = await clientInstance();
  const second = await clientInstance();
  first.setClientTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
  assert.equal(second.getClientAccessToken(), "old-access");
  assert.equal(second.getClientRefreshToken(), "old-refresh");
  let refreshCount = 0;
  let staleRequests = 0;
  let notifyBoth;
  let release;
  const bothStarted = new Promise((resolve) => { notifyBoth = resolve; });
  const refreshResponse = new Promise((resolve) => { release = resolve; });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/refresh")) {
      refreshCount += 1;
      assert.equal(JSON.parse(options.body).refreshToken, "old-refresh");
      await refreshResponse;
      return renewed();
    }
    if (options.headers.get("Authorization") === "Bearer old-access") {
      staleRequests += 1;
      if (staleRequests === 2) notifyBoth();
      return expired();
    }
    assert.equal(options.headers.get("Authorization"), "Bearer renewed-access");
    return Response.json({ success: true, data: { ok: true } });
  });
  const responses = [first.apiClient.get("/auth/me"), second.apiClient.get("/users/me/sessions")];
  await bothStarted;
  release();
  assert.deepEqual(await Promise.all(responses), [{ ok: true }, { ok: true }]);
  assert.equal(refreshCount, 1);
  assert.equal(browser.acquired(), 2);
  assert.equal(second.getClientRefreshToken(), "renewed-refresh");
});

test("another tab's account switch rejects old responses without overwriting new credentials", async (t) => {
  browserEnvironment(t);
  const first = await clientInstance();
  const second = await clientInstance();
  first.setClientTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
  let release;
  t.mock.method(globalThis, "fetch", () => new Promise((resolve) => { release = resolve; }));
  const pending = second.apiClient.get("/private-records");
  const rejected = assert.rejects(pending, { code: "AUTH_SESSION_CHANGED" });
  first.setClientTokens({ accessToken: "other-access", refreshToken: "other-refresh" });
  release(Response.json({ success: true, data: { owner: "old-user" } }));
  await rejected;
  assert.equal(second.getClientAccessToken(), "other-access");
});

test("another tab's logout prevents an in-flight refresh restoring credentials", async (t) => {
  browserEnvironment(t);
  const first = await clientInstance();
  const second = await clientInstance();
  first.setClientTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
  let release;
  let started;
  const refreshing = new Promise((resolve) => { started = resolve; });
  t.mock.method(globalThis, "fetch", (url) => {
    if (!url.endsWith("/auth/refresh")) return Promise.resolve(expired());
    started();
    return new Promise((resolve) => { release = resolve; });
  });
  const pending = second.apiClient.get("/auth/me");
  const rejected = assert.rejects(pending, { code: "AUTH_SESSION_CHANGED" });
  await refreshing;
  first.clearClientTokens();
  release(renewed());
  await rejected;
  assert.equal(second.getClientAccessToken(), null);
  assert.equal(second.getClientRefreshToken(), null);
});

test("session notifications distinguish identity changes from normal token rotation", async (t) => {
  const browser = browserEnvironment(t);
  const first = await clientInstance();
  const second = await clientInstance();
  first.setClientTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
  let changes = 0;
  const unsubscribe = second.subscribeClientSessionChanges(() => { changes += 1; });
  const storageEvent = (key) => {
    const event = new Event("storage");
    Object.defineProperties(event, { key: { value: key }, storageArea: { value: browser.storage } });
    browser.events.dispatchEvent(event);
  };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/refresh")) return renewed();
    return options.headers.get("Authorization") === "Bearer old-access"
      ? expired() : Response.json({ success: true, data: { ok: true } });
  });
  await first.apiClient.get("/auth/me");
  storageEvent("parkease_access_token");
  storageEvent("parkease_refresh_token");
  assert.equal(changes, 0);
  assert.equal(second.getClientAccessToken(), "renewed-access");
  first.setClientTokens({ accessToken: "other-access", refreshToken: "other-refresh" });
  storageEvent("parkease_session_version");
  assert.equal(changes, 1);
  assert.equal(second.getClientAccessToken(), "other-access");
  first.clearClientTokens();
  storageEvent("parkease_session_version");
  assert.equal(changes, 2);
  assert.equal(second.getClientAccessToken(), null);
  unsubscribe();
  first.setClientTokens({ accessToken: "last-access", refreshToken: "last-refresh" });
  storageEvent("parkease_session_version");
  assert.equal(changes, 2);
});
