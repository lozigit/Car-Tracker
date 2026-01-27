const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export type TokenResponse = { access_token: string; token_type: string };

export function getToken(): string | null {
  return localStorage.getItem("cartrack_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("cartrack_token", token);
  else localStorage.removeItem("cartrack_token");
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof body === "string" ? body : (body?.detail ?? "Request failed");
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  signup: (email: string, password: string) =>
    request("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  createHousehold: (name: string) =>
    request("/api/households", { method: "POST", body: JSON.stringify({ name }) }),
  getCurrentHousehold: () => request("/api/households/current"),

  listCars: (includeArchived = false) =>
    request(`/api/cars?include_archived=${includeArchived ? "true" : "false"}`),
  createCar: (payload: { registration_number: string; make?: string; model?: string }) =>
    request("/api/cars", { method: "POST", body: JSON.stringify(payload) }),
  getCar: (id: string) => request(`/api/cars/${id}`),
  updateCar: (id: string, payload: any) =>
    request(`/api/cars/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  archiveCar: (id: string) => request(`/api/cars/${id}/archive`, { method: "POST" }),
  unarchiveCar: (id: string) => request(`/api/cars/${id}/unarchive`, { method: "POST" }),
};
