const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Render's free tier sleeps and can take ~30-60s to wake. Keep the client
// timeout comfortably above that so the first request after a sleep still
// succeeds instead of failing while the server is spinning up.
const DEFAULT_TIMEOUT_MS = 90000;

export function apiUrl(path) {
  return `${API_URL}${path}`;
}

export function authHeaders() {
  const token = localStorage.getItem("hadaf_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const headers = { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) };
  Object.assign(headers, authHeaders());

  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The server is taking longer than usual to respond. It may be waking up — please try again in a moment.");
    }
    throw new Error("Could not reach the server. Please check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// Fire-and-forget ping to wake a sleeping backend as early as possible.
export function warmUp() {
  api("/health", { timeoutMs: 120000 }).catch(() => {});
}
