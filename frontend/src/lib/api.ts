const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// This file contains functions for making API requests to the backend, as well as TypeScript types for the data structures used in those requests and responses.
// The goal is to centralize all API-related code here, so that the rest of the app can just import and use these functions without worrying about the details of the API endpoints or request formatting.
export type TokenResponse = { access_token: string; token_type: string };

// Types for the main data structures used in the app, based on the backend API
export type Car = {
  id: string;
  household_id: string;
  registration_number: string;
  make?: string | null;
  model?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type RenewalKind = "INSURANCE" | "MOT" | "TAX";

export type RenewalOut = {
  id: string;
  car_id: string;
  kind: RenewalKind;
  valid_from: string; // ISO date
  valid_to: string; // ISO date
  provider?: string | null;
  reference?: string | null;
  cost_pence?: number | null;
  notes?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type RenewalCreate = {
  kind: RenewalKind;
  valid_from: string; // ISO date
  valid_to: string; // ISO date
  provider?: string | null;
  reference?: string | null;
  cost_pence?: number | null;
  notes?: string | null;
};

export type UpcomingRenewalOut = {
  car_id: string;
  car_registration_number: string;
  kind: RenewalKind;
  status: "missing" | "due" | "overdue";
  due_date?: string | null;
  days_until?: number | null;
  current_valid_to?: string | null;
};

export type ReminderPreferences = {
  preferences: Record<RenewalKind, number[]>;
};

export function getToken(): string | null {
  return localStorage.getItem("cartrack_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("cartrack_token", token);
  else localStorage.removeItem("cartrack_token");
}

// Helper function to make API requests with proper headers and error handling
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const isJson = (res.headers.get("content-type") ?? "").includes(
    "application/json",
  );
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      typeof body === "string" ? body : (body?.detail ?? "Request failed");
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  // auth
  signup: (email: string, password: string) =>
    request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // household
  createHousehold: (name: string) =>
    request("/api/households", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getCurrentHousehold: () => request("/api/households/current"),

  // cars
  listCars: (includeArchived = false) =>
    request<Car[]>(
      `/api/cars?include_archived=${includeArchived ? "true" : "false"}`,
    ),
  createCar: (payload: {
    registration_number: string;
    make?: string;
    model?: string;
  }) =>
    request<Car>("/api/cars", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCar: (id: string) => request<Car>(`/api/cars/${id}`),
  updateCar: (id: string, payload: any) =>
    request<Car>(`/api/cars/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  archiveCar: (id: string) =>
    request<Car>(`/api/cars/${id}/archive`, { method: "POST" }),
  unarchiveCar: (id: string) =>
    request<Car>(`/api/cars/${id}/unarchive`, { method: "POST" }),

  // renewals
  // get a renewal by ID (used for editing)
  getRenewal: (id: string) => request<RenewalOut>(`/api/renewals/${id}`),
  // update a renewal by ID
  updateRenewal: (id: string, payload: Partial<RenewalCreate>) =>
    request<RenewalOut>(`/api/renewals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listRenewals: (carId: string, kind?: RenewalKind) =>
    request<RenewalOut[]>(
      `/api/cars/${carId}/renewals${kind ? `?kind=${kind}` : ""}`,
    ),
  createRenewal: (carId: string, payload: RenewalCreate) =>
    request<RenewalOut>(`/api/cars/${carId}/renewals`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteRenewal: (renewalId: string) =>
    request<void>(`/api/renewals/${renewalId}`, { method: "DELETE" }),
  upcomingRenewals: (days = 60) =>
    request<UpcomingRenewalOut[]>(`/api/renewals/upcoming?days=${days}`),

  // settings
  getReminderPreferences: () =>
    request<ReminderPreferences>("/api/settings/reminders"),
  saveReminderPreferences: (prefs: ReminderPreferences) =>
    request<ReminderPreferences>("/api/settings/reminders", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),
};
