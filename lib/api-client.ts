import type {
  ApiError,
  AuthTokens,
  DropoffPoint,
  Exchange,
  ExchangeRequest,
  ImpactStats,
  Listing,
  ListingsQuery,
  Paginated,
  ReportPayload,
  User,
} from "@/types";
import { mockAdapter } from "./mock-adapter";

/**
 * ApiAdapter is the contract every implementation (mock or live) must
 * satisfy. Components and hooks only ever import `apiClient` below — never
 * an adapter directly — so swapping mock -> live is a one-line change.
 */
export interface ApiAdapter {
  login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }>;
  register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ user: User; tokens: AuthTokens }>;
  refresh(): Promise<AuthTokens>;
  me(): Promise<User>;
  updateMe(patch: Partial<Pick<User, "displayName" | "city">>): Promise<User>;

  listListings(query: ListingsQuery): Promise<Paginated<Listing>>;
  getListing(id: string): Promise<Listing>;
  createListing(input: Partial<Listing>): Promise<Listing>;
  updateListing(id: string, patch: Partial<Listing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;

  requestListing(listingId: string, message: string): Promise<ExchangeRequest>;
  acceptRequest(requestId: string): Promise<ExchangeRequest>;
  declineRequest(requestId: string): Promise<ExchangeRequest>;
  listRequests(): Promise<{ incoming: ExchangeRequest[]; sent: ExchangeRequest[] }>;

  scheduleExchange(
    exchangeId: string,
    input: { scheduledFor: string | null; isFlexible: boolean; dropoffPointId: string | null },
  ): Promise<Exchange>;
  completeExchange(exchangeId: string): Promise<Exchange>;
  cancelExchange(exchangeId: string): Promise<Exchange>;
  getExchange(id: string): Promise<Exchange>;

  listDropoffPoints(): Promise<DropoffPoint[]>;
  submitReport(payload: ReportPayload): Promise<void>;
  getImpactStats(): Promise<ImpactStats>;
}

export class ApiClientError extends Error implements ApiError {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;
  constructor(err: ApiError) {
    super(err.message);
    this.status = err.status;
    this.code = err.code;
    this.fieldErrors = err.fieldErrors;
  }
}

function createLiveAdapter(baseUrl: string): ApiAdapter {
  // Access token lives in memory only (never localStorage) per the auth
  // requirement; refresh token is an httpOnly cookie the browser sends
  // automatically, so no client-side handling of it is needed here.
  let accessToken: string | null = null;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && !path.startsWith("/auth/refresh")) {
      try {
        const tokens = await request<AuthTokens>("/auth/refresh/", { method: "POST" });
        accessToken = tokens.accessToken;
        return request<T>(path, init); // retry once
      } catch {
        throw new ApiClientError({ status: 401, code: "unauthenticated", message: "Session expired" });
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiClientError({
        status: res.status,
        code: body.code ?? "unknown_error",
        message: body.message ?? "Something went wrong. Please try again.",
        fieldErrors: body.fieldErrors,
      });
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  return {
    async login(email, password) {
      const result = await request<{ user: User; tokens: AuthTokens }>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      accessToken = result.tokens.accessToken;
      return result;
    },
    async register(input) {
      const result = await request<{ user: User; tokens: AuthTokens }>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(input),
      });
      accessToken = result.tokens.accessToken;
      return result;
    },
    async refresh() {
      const tokens = await request<AuthTokens>("/auth/refresh/", { method: "POST" });
      accessToken = tokens.accessToken;
      return tokens;
    },
    me: () => request("/users/me/"),
    updateMe: (patch) => request("/users/me/", { method: "PATCH", body: JSON.stringify(patch) }),

    listListings: (query) => {
      const params = new URLSearchParams();
      if (query.category) params.set("category", query.category);
      if (query.condition) params.set("condition", query.condition);
      if (query.gradeLevel) params.set("grade_level", query.gradeLevel);
      if (query.near) params.set("near", `${query.near.lat},${query.near.lng}`);
      if (query.radiusKm) params.set("radius", String(query.radiusKm));
      if (query.q) params.set("q", query.q);
      if (query.cursor) params.set("cursor", query.cursor);
      return request(`/listings/?${params.toString()}`);
    },
    getListing: (id) => request(`/listings/${id}/`),
    createListing: (input) => request("/listings/", { method: "POST", body: JSON.stringify(input) }),
    updateListing: (id, patch) =>
      request(`/listings/${id}/`, { method: "PATCH", body: JSON.stringify(patch) }),
    deleteListing: (id) => request(`/listings/${id}/`, { method: "DELETE" }),

    requestListing: (listingId, message) =>
      request(`/listings/${listingId}/request/`, { method: "POST", body: JSON.stringify({ message }) }),
    acceptRequest: (requestId) => request(`/requests/${requestId}/accept/`, { method: "POST" }),
    declineRequest: (requestId) => request(`/requests/${requestId}/decline/`, { method: "POST" }),
    listRequests: () => request("/requests/"),

    scheduleExchange: (exchangeId, input) =>
      request(`/exchanges/${exchangeId}/schedule/`, { method: "POST", body: JSON.stringify(input) }),
    completeExchange: (exchangeId) => request(`/exchanges/${exchangeId}/complete/`, { method: "POST" }),
    cancelExchange: (exchangeId) => request(`/exchanges/${exchangeId}/cancel/`, { method: "POST" }),
    getExchange: (id) => request(`/exchanges/${id}/`),

    listDropoffPoints: () => request("/dropoff-points/"),
    submitReport: (payload) => request("/reports/", { method: "POST", body: JSON.stringify(payload) }),
    getImpactStats: () => request("/stats/impact/"),
  };
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const mode = process.env.NEXT_PUBLIC_API_MODE ?? (baseUrl ? "live" : "mock");

// This is the ONLY export components/hooks should use.
export const apiClient: ApiAdapter = mode === "live" && baseUrl ? createLiveAdapter(baseUrl) : mockAdapter;
