const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function api(path, { body, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login")
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(data.message || "The request failed. Please try again.");
  }
  return data;
}
