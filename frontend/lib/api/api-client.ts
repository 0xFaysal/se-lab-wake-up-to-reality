import { ApiError, type ApiErrorPayload } from "./api-error";
import type { ApiSuccess } from "./api-types";
import { publicEnv } from "@/lib/config/public-env";

const API_BASE_URL = publicEnv.API_BASE_URL;
const DEFAULT_TIMEOUT_MS = 15_000;
let refreshPromise: Promise<boolean> | null = null;
export const AUTH_EXPIRED_EVENT = "parkease:auth-expired";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    }).then((response) => response.ok).catch(() => false).finally(() => { refreshPromise = null; });
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
    if (response.status === 401 && !didRefresh && !options.skipAuthRefresh && path !== "/auth/refresh") {
      if (await refreshSession()) return request<T>(path, options, true);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    if (response.status === 401 && didRefresh && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;
    const payload = await response.json() as ApiSuccess<T>;
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
