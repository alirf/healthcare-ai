/**
 * lib/api-config.ts
 *
 * Minimal API helper extracted to its own module so the new diagnosis
 * service file can import it without a circular dependency on
 * visit-service.ts.
 *
 * If your project already has lib/api-config.ts, just copy the
 * `apiFetch` function below into it (or keep this file as-is and import
 * from here).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface ApiFetchOptions extends RequestInit {
  // If true, send credentials (cookies) — needed if your Gateway uses
  // cookie-based JWT. Defaults to true.
  withCredentials?: boolean;
}

/**
 * Wrapper around fetch that:
 *   - prepends NEXT_PUBLIC_API_BASE_URL (if set)
 *   - injects the JWT from localStorage as Authorization: Bearer ...
 *   - sets Content-Type: application/json for POST/PUT/PATCH
 *   - throws on non-2xx with the server's detail message
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    withCredentials = true,
    headers: extraHeaders = {},
    body,
    ...rest
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  // JSON body — set Content-Type only if caller didn't override
  if (body && !(headers["Content-Type"] ?? headers["content-type"])) {
    headers["Content-Type"] = "application/json";
  }

  // JWT injection — adjust if your app stores the token elsewhere
  if (typeof window !== "undefined") {
    const token =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("token") ??
      window.sessionStorage.getItem("auth_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const resp = await fetch(url, {
    ...rest,
    headers,
    body,
    credentials: withCredentials ? "include" : "same-origin",
  });

  if (!resp.ok) {
    let detail: string;
    try {
      const errBody = await resp.json();
      detail = errBody.detail ?? errBody.message ?? resp.statusText;
    } catch {
      detail = resp.statusText;
    }
    throw new Error(`API ${resp.status}: ${detail}`);
  }

  // Some endpoints return 201 with body; some 200 with body; some 204
  if (resp.status === 204) {
    return undefined as unknown as T;
  }

  return resp.json() as Promise<T>;
}
