import { ApiError, isAuthenticationFailure, type ApiErrorPayload } from "./api-error";
import type { ApiSuccess } from "./api-types";
import { publicEnv } from "@/lib/config/public-env";

const API_BASE_URL = publicEnv.API_BASE_URL;
const DEFAULT_TIMEOUT_MS = 15_000;
let refreshPromise: Promise<boolean> | null = null;
export const AUTH_EXPIRED_EVENT = "parkease:auth-expired";

const ACCESS_TOKEN_KEY = "parkease_access_token";
const REFRESH_TOKEN_KEY = "parkease_refresh_token";
const SESSION_VERSION_KEY = "parkease_session_version";
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemorySessionVersion: string | null = null;
let sessionGeneration = 0;

function sessionVersion(): string | null {
  if (typeof window !== "undefined") {
    try { return localStorage.getItem(SESSION_VERSION_KEY); } catch { /* Storage may be unavailable. */ }
  }
  return inMemorySessionVersion;
}

function rotateSessionVersion() {
  inMemorySessionVersion = crypto.randomUUID();
  if (typeof window !== "undefined") {
    try { localStorage.setItem(SESSION_VERSION_KEY, inMemorySessionVersion); } catch { /* Keep in-memory session guards. */ }
  }
}

function sessionStamp() {
  return { generation: sessionGeneration, version: sessionVersion() };
}

export function subscribeClientSessionChanges(onChange: () => void) {
  let previousVersion = sessionVersion();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SESSION_VERSION_KEY) return;
    try { if (event.storageArea !== localStorage) return; } catch { return; }
    const nextVersion = sessionVersion();
    if (nextVersion === previousVersion) return;
    previousVersion = nextVersion;
    sessionGeneration += 1;
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function setClientTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  sessionGeneration += 1;
  writeClientTokens(tokens);
  rotateSessionVersion();
}

function assertCurrentSession(stamp: ReturnType<typeof sessionStamp>) {
  if (stamp.generation !== sessionGeneration || stamp.version !== sessionVersion()) {
    throw new ApiError("Your session changed. Please retry.", 409, "AUTH_SESSION_CHANGED");
  }
}

function writeClientTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  if (tokens.accessToken) {
    inMemoryAccessToken = tokens.accessToken;
    if (typeof window !== "undefined") {
      try { localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken); } catch { /* ignore */ }
    }
  }
  if (tokens.refreshToken) {
    inMemoryRefreshToken = tokens.refreshToken;
    if (typeof window !== "undefined") {
      try { localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken); } catch { /* ignore */ }
    }
  }
}

export function clearClientTokens() {
  sessionGeneration += 1;
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch { /* ignore */ }
  }
  rotateSessionVersion();
}

export function getClientAccessToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      inMemoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch { /* ignore */ }
  }
  return inMemoryAccessToken;
}

export function getClientRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      inMemoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch { /* ignore */ }
  }
  return inMemoryRefreshToken;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
}

async function refreshSession(failedAccessToken: string | null): Promise<boolean> {
  if (!refreshPromise) {
    const generation = sessionStamp();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const performRefresh = async () => {
      assertCurrentSession(generation);
      // Another tab may have rotated the tokens while this request waited for the lock.
      const currentAccessToken = getClientAccessToken();
      if (currentAccessToken && currentAccessToken !== failedAccessToken) return true;
      const refreshToken = getClientRefreshToken();
      const headers = new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
      });
      if (refreshToken) {
        headers.set("x-refresh-token", refreshToken);
      }
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers,
        body: JSON.stringify({ refreshToken: refreshToken ?? undefined }),
      });
      assertCurrentSession(generation);
      if (!response.ok) {
        const error = await parseError(response);
        assertCurrentSession(generation);
        if (isAuthenticationFailure(error)) return false;
        throw error;
      }
      try {
        const payload = (await response.json()) as ApiSuccess<{
          accessToken?: string;
          refreshToken?: string;
        }>;
        assertCurrentSession(generation);
        if (payload.success !== true || !payload.data) {
          throw new ApiError("Unable to renew your session. Please retry.", 502, "AUTH_REFRESH_RESPONSE_INVALID");
        }
        if (payload.data?.accessToken) {
          writeClientTokens({
            accessToken: payload.data.accessToken,
            refreshToken: payload.data.refreshToken,
          });
        }
        return true;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError("Unable to renew your session. Please retry.", 502, "AUTH_REFRESH_RESPONSE_INVALID");
      }
    };
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    const coordinatedRefresh = async (): Promise<boolean> => locks
      ? await locks.request(`parkease:auth-refresh:${API_BASE_URL}`, { signal: controller.signal }, performRefresh)
      : performRefresh();
    refreshPromise = coordinatedRefresh().catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("Session check timed out. Please retry.", 408, "REQUEST_TIMEOUT");
      }
      throw error;
    }).finally(() => { clearTimeout(timeout); refreshPromise = null; });
  }
  return refreshPromise;
}

async function parseError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  let payload: { error?: ApiErrorPayload; meta?: { requestId?: string } } = {};
  try { payload = await response.json(); } catch { /* Non-JSON upstream error. */ }
  return new ApiError(
    payload.error?.message ?? `Request failed with status ${response.status}`,
    response.status,
    payload.error?.code,
    payload.meta?.requestId ?? requestId,
    payload.error?.details,
  );
}

async function request<T>(path: string, options: RequestOptions = {}, didRefresh = false): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !isFormData) headers.set("Content-Type", "application/json");

  const accessToken = getClientAccessToken();
  const generation = sessionStamp();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const requestBody: BodyInit | null | undefined = options.body === undefined
      ? undefined
      : isFormData ? options.body as FormData : JSON.stringify(options.body);
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      signal: options.signal ?? controller.signal,
      headers,
      body: requestBody,
    });
    assertCurrentSession(generation);
    if (response.status === 401 && !didRefresh && !options.skipAuthRefresh && path !== "/auth/refresh") {
      const refreshed = await refreshSession(accessToken);
      assertCurrentSession(generation);
      if (refreshed) return request<T>(path, options, true);
      clearClientTokens();
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    if (response.status === 401 && didRefresh && typeof window !== "undefined") {
      clearClientTokens();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;
    const payload = await response.json() as ApiSuccess<T>;
    assertCurrentSession(generation);
    return payload.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 408, "REQUEST_TIMEOUT");
    }
    throw error;
  } finally { clearTimeout(timeout); }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};
