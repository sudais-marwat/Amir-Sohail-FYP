const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}
