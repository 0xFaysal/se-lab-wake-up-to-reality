const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl || "http://localhost:4000/api/v1";

let parsedApiBaseUrl: URL;
try {
  parsedApiBaseUrl = new URL(apiBaseUrl);
} catch {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL");
}

if (!["http:", "https:"].includes(parsedApiBaseUrl.protocol)) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS");
}

if (configuredApiBaseUrl && process.env.NODE_ENV === "production" && parsedApiBaseUrl.protocol !== "https:") {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must use the deployed backend's HTTPS URL in production (for example, https://api.example.com/api/v1)");
}

export const publicEnv = {
  API_BASE_URL: "/api/v1",
} as const;
