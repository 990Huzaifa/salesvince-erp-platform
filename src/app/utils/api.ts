import { buildApiUrl } from "./helper";
import { getAuthToken } from "./auth";

type ApiJsonInit = RequestInit & {
  auth?: boolean;
};

export async function apiJson<T>(path: string, init: ApiJsonInit = {}) {
  const headers = new Headers(init.headers);
  const authEnabled = init.auth !== false;

  if (authEnabled) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  });

  const raw = await response.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: unknown }).message || "")
        : typeof data === "object" && data !== null && "error" in data
          ? String((data as { error?: unknown }).error || "")
          : "";

    throw new Error(message || `Request failed (${response.status})`);
  }

  return data as T;
}
