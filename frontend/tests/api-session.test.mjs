import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { ApiError } from "../lib/api/api-error.ts";

const clientUrl = new URL("../lib/api/api-client.ts", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === clientUrl) {
      if (specifier === "@/lib/config/public-env") {
        return { shortCircuit: true, url: "data:text/javascript,export const publicEnv = { API_BASE_URL: 'https://unit.invalid/api/v1' };" };
      }
      if (specifier === "./api-error") {
        return { shortCircuit: true, url: new URL("../lib/api/api-error.ts", import.meta.url).href };
      }
    }
    return nextResolve(specifier, context);
  },
});
const { apiClient, setClientTokens, clearClientTokens, getClientAccessToken, getClientRefreshToken, AUTH_EXPIRED_EVENT } = await import(clientUrl);

function setup(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events = new EventTarget();
  const expired = [];
  events.addEventListener(AUTH_EXPIRED_EVENT, () => expired.push(true));
  Object.defineProperty(globalThis, "window", { configurable: true, value: events });
  clearClientTokens();
  setClientTokens({ accessToken: "unit-access", refreshToken: "unit-refresh" });
  t.after(() => {
    clearClientTokens();
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else delete globalThis.window;
  });
  return expired;
}

const rejection = () => Response.json({ success: false, error: { code: "AUTH_UNAUTHORIZED", message: "Expired" } }, { status: 401 });
const renewed = () => Response.json({ success: true, data: { accessToken: "unit-renewed-access", refreshToken: "unit-renewed-refresh" } });

for (const action of ["logout", "account-switch"]) {
  test(`pending refresh cannot restore or overwrite tokens after ${action}`, async (t) => {
    const expired = setup(t);
    let release;
    let notifyStarted;
    const started = new Promise((resolve) => { notifyStarted = resolve; });
    const delayed = new Promise((resolve) => { release = resolve; });
    t.mock.method(globalThis, "fetch", async (url) => {
      if (!url.endsWith("/auth/refresh")) return rejection();
      notifyStarted();
      return delayed;
    });
    const request = apiClient.get("/auth/me");
    const rejected = assert.rejects(request, { code: "AUTH_SESSION_CHANGED" });
    await started;
    clearClientTokens();
    if (action === "account-switch") setClientTokens({ accessToken: "other-access", refreshToken: "other-refresh" });
    release(renewed());
    await rejected;
    assert.equal(getClientAccessToken(), action === "logout" ? null : "other-access");
    assert.equal(getClientRefreshToken(), action === "logout" ? null : "other-refresh");
    assert.equal(expired.length, 0);
  });
}

test("old protected response is rejected after a session switch", async (t) => {
  setup(t);
  let release;
  t.mock.method(globalThis, "fetch", () => new Promise((resolve) => { release = resolve; }));
  const request = apiClient.get("/private-records");
  const rejected = assert.rejects(request, { code: "AUTH_SESSION_CHANGED" });
  setClientTokens({ accessToken: "other-access", refreshToken: "other-refresh" });
  release(Response.json({ success: true, data: { owner: "previous-user" } }));
  await rejected;
  assert.equal(getClientAccessToken(), "other-access");
});

test("actual API request renews expired access once and retries using the new token", async (t) => {
  const expired = setup(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(url);
    if (url.endsWith("/auth/refresh")) return renewed();
    if (options.headers.get("Authorization") === "Bearer unit-access") return rejection();
    assert.equal(options.headers.get("Authorization"), "Bearer unit-renewed-access");
    return Response.json({ success: true, data: { user: { id: "test-user" } } });
  });
  assert.equal((await apiClient.get("/auth/me")).user.id, "test-user");
  assert.equal(calls.filter((url) => url.endsWith("/auth/refresh")).length, 1);
  assert.equal(calls.length, 3);
  assert.equal(expired.length, 0);
});

for (const status of [403, 429, 500, 503]) {
  test(`refresh HTTP ${status} does not erase a valid refresh token or log out`, async (t) => {
    const expired = setup(t);
    t.mock.method(globalThis, "fetch", async (url) => url.endsWith("/auth/refresh")
      ? Response.json({ error: { message: "Temporarily unavailable" } }, { status })
      : rejection());
    await assert.rejects(apiClient.get("/auth/me"), (error) => error instanceof ApiError && error.status === status);
    assert.equal(getClientAccessToken(), "unit-access");
    assert.equal(getClientRefreshToken(), "unit-refresh");
    assert.equal(expired.length, 0);
  });
}

test("refresh network failure preserves credentials and permits a subsequent retry", async (t) => {
  const expired = setup(t);
  let unavailable = true;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/refresh")) {
      if (unavailable) throw new TypeError("Unit network failure");
      return renewed();
    }
    return options.headers.get("Authorization") === "Bearer unit-access" ? rejection() : Response.json({ success: true, data: { ok: true } });
  });
  await assert.rejects(apiClient.get("/auth/me"), TypeError);
  assert.equal(getClientRefreshToken(), "unit-refresh");
  assert.equal(expired.length, 0);
  unavailable = false;
  assert.equal((await apiClient.get("/auth/me")).ok, true);
});

test("malformed successful refresh response is retryable, not a logout", async (t) => {
  const expired = setup(t);
  t.mock.method(globalThis, "fetch", async (url) => url.endsWith("/auth/refresh") ? new Response("not JSON") : rejection());
  await assert.rejects(apiClient.get("/auth/me"), (error) => error instanceof ApiError && error.code === "AUTH_REFRESH_RESPONSE_INVALID");
  assert.equal(getClientRefreshToken(), "unit-refresh");
  assert.equal(expired.length, 0);
});

test("actual refresh authentication rejection clears credentials and emits expiry", async (t) => {
  const expired = setup(t);
  t.mock.method(globalThis, "fetch", async () => rejection());
  await assert.rejects(apiClient.get("/auth/me"), (error) => error instanceof ApiError && error.status === 401);
  assert.equal(getClientAccessToken(), null);
  assert.equal(getClientRefreshToken(), null);
  assert.equal(expired.length, 1);
});

test("refresh has a bounded deadline without erasing credentials", async (t) => {
  const expired = setup(t);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let refreshStarted;
  const started = new Promise((resolve) => { refreshStarted = resolve; });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (!url.endsWith("/auth/refresh")) return rejection();
    refreshStarted();
    return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
  });
  const result = apiClient.get("/auth/me");
  const rejected = assert.rejects(result, (error) => error instanceof ApiError && error.code === "REQUEST_TIMEOUT");
  await started;
  t.mock.timers.tick(15_000);
  await rejected;
  assert.equal(getClientRefreshToken(), "unit-refresh");
  assert.equal(expired.length, 0);
});

test("concurrent expired requests share one refresh request", async (t) => {
  setup(t);
  let releaseRefresh;
  let refreshStarted;
  let count = 0;
  const started = new Promise((resolve) => { refreshStarted = resolve; });
  const response = new Promise((resolve) => { releaseRefresh = resolve; });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/refresh")) { count += 1; refreshStarted(); return response; }
    return options.headers.get("Authorization") === "Bearer unit-access" ? rejection() : Response.json({ success: true, data: { ok: true } });
  });
  const first = apiClient.get("/auth/me");
  const second = apiClient.get("/users/me/sessions");
  await started;
  releaseRefresh(renewed());
  const results = await Promise.all([first, second]);
  assert.equal(results.every((result) => result.ok), true);
  assert.equal(count, 1);
});
