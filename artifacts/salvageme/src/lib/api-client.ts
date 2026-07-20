import type {
  AuthTokens,
  BookRequest,
  Category,
  CounterpartContact,
  DropoffPoint,
  Exchange,
  HealthStatus,
  ImpactStats,
  Listing,
  ListingImage,
  ListingsQuery,
  Notification,
  Paginated,
  PartnerApplication,
  PartnerApplicationInput,
  PublicUser,
  Rating,
  ReportPayload,
  User,
} from "@/types";
import { mockAdapter } from "./mock-adapter";

export interface ApiAdapter {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  register(input: {
    username: string;
    password: string;
    email?: string;
    role?: "donor" | "recipient" | "both";
    phone?: string;
  }): Promise<{ user: User; tokens: AuthTokens }>;
  login(username: string, password: string): Promise<{ user: User; tokens: AuthTokens }>;
  refresh(): Promise<AuthTokens>;
  logout(): Promise<void>;
  /**
   * Set (or reset) a password using a uid+token from an invite / reset email.
   * Also marks the account is_verified = true on success.
   */
  setPassword(uid: string, token: string, newPassword: string): Promise<void>;

  // ── Users ────────────────────────────────────────────────────────────────────
  me(): Promise<User>;
  updateMe(
    patch: Partial<{
      email: string;
      role: User["role"];
      phone: string;
      latitude: number;
      longitude: number;
    }>,
  ): Promise<User>;

  // ── Categories ───────────────────────────────────────────────────────────────
  listCategories(): Promise<Category[]>;

  // ── Listings ──────────────────────────────────────────────────────────────────
  listListings(query: ListingsQuery): Promise<Paginated<Listing>>;
  getListing(id: string): Promise<Listing>;
  createListing(input: {
    title: string;
    description: string;
    categoryId: string;
    condition: Listing["condition"];
    gradeLevel?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<Listing>;
  updateListing(id: string, patch: Partial<Parameters<ApiAdapter["createListing"]>[0]>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  /** POST /listings/{id}/photos/ — field name "file", JPEG/PNG/WebP, max 8 MB. */
  uploadListingPhoto(listingId: string, file: File): Promise<ListingImage>;

  // ── Book requests ─────────────────────────────────────────────────────────────
  requestListing(listingId: string, message?: string): Promise<BookRequest>;
  listRequests(): Promise<Paginated<BookRequest>>;
  getRequest(id: string): Promise<BookRequest>;
  acceptRequest(requestId: string): Promise<BookRequest>;
  declineRequest(requestId: string): Promise<BookRequest>;

  // ── Exchanges ─────────────────────────────────────────────────────────────────
  listExchanges(): Promise<Paginated<Exchange>>;
  getExchange(id: string): Promise<Exchange>;
  scheduleExchange(
    exchangeId: string,
    input: { scheduledAt: string; dropoffPointId?: string | null },
  ): Promise<Exchange>;
  completeExchange(exchangeId: string): Promise<Exchange>;
  cancelExchange(exchangeId: string): Promise<Exchange>;
  rateExchange(exchangeId: string, input: { score: number; comment?: string }): Promise<Rating>;

  // ── Drop-off points ───────────────────────────────────────────────────────────
  listDropoffPoints(): Promise<DropoffPoint[]>;

  // ── Reports ───────────────────────────────────────────────────────────────────
  submitReport(payload: ReportPayload): Promise<void>;

  // ── Notifications ─────────────────────────────────────────────────────────────
  listNotifications(query?: {
    isRead?: boolean;
    category?: string;
    cursorUrl?: string | null;
  }): Promise<Paginated<Notification>>;
  getNotification(id: string): Promise<Notification>;
  /** GET /notifications/unread-count/ — returns the count integer. */
  getUnreadNotificationCount(): Promise<number>;
  /** POST /notifications/{id}/read/ */
  markNotificationRead(id: string): Promise<Notification>;
  /** POST /notifications/mark-all-read/ — returns how many were marked. */
  markAllNotificationsRead(): Promise<{ markedRead: number }>;
  deleteNotification(id: string): Promise<void>;

  // ── Partner applications ──────────────────────────────────────────────────────
  submitPartnerApplication(input: PartnerApplicationInput): Promise<PartnerApplication>;

  // ── Stats / health ────────────────────────────────────────────────────────────
  getImpactStats(): Promise<ImpactStats>;
  getHealth(): Promise<HealthStatus>;
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  errors?: Record<string, string[]>;
  constructor(status: number, code: string, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

// ── wire → app shape mapping ──────────────────────────────────────────────────

function toPublicUser(u: any): PublicUser {
  return {
    id: String(u.id),
    username: u.username,
    role: u.role,
    isVerified: u.is_verified,
    dateJoined: u.date_joined,
  };
}

function toUser(u: any): User {
  return {
    id: String(u.id),
    username: u.username,
    email: u.email ?? null,
    role: u.role,
    phone: u.phone ?? null,
    isVerified: u.is_verified,
    avatarUrl: u.avatar_url ?? null,
    latitude: u.latitude ?? null,
    longitude: u.longitude ?? null,
    dateJoined: u.date_joined,
  };
}

function toCategory(c: any): Category {
  return { id: String(c.id), name: c.name, slug: c.slug };
}

function toListingImage(i: any): ListingImage {
  return { id: String(i.id), url: i.url, order: i.order ?? 0 };
}

function toListing(l: any): Listing {
  return {
    id: String(l.id),
    owner: toPublicUser(l.owner),
    title: l.title,
    description: l.description,
    category: toCategory(l.category),
    gradeLevel: l.grade_level ?? null,
    condition: l.condition,
    status: l.status,
    images: (l.images ?? []).map(toListingImage),
    distanceKm: l.distance_km ?? null,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

function toBookRequest(r: any): BookRequest {
  return {
    id: String(r.id),
    listingId: String(r.listing),
    listingTitle: r.listing_title ?? "",
    requester: toPublicUser(r.requester),
    status: r.status,
    message: r.message ?? "",
    createdAt: r.created_at,
  };
}

function toDropoffPoint(d: any): DropoffPoint {
  return {
    id: String(d.id),
    name: d.name,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
  };
}

function toCounterpartContact(c: any): CounterpartContact {
  return {
    username: c.username,
    phone: c.phone ?? null,
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
  };
}

function toExchange(e: any): Exchange {
  return {
    id: String(e.id),
    listingId: String(e.listing),
    listingTitle: e.listing_title ?? "",
    donor: toPublicUser(e.donor),
    recipient: toPublicUser(e.recipient),
    dropoffPoint: e.dropoff_point ? toDropoffPoint(e.dropoff_point) : null,
    status: e.status,
    scheduledAt: e.scheduled_at ?? null,
    completedAt: e.completed_at ?? null,
    counterpartContact: e.counterpart_contact ? toCounterpartContact(e.counterpart_contact) : null,
  };
}

function toRating(r: any): Rating {
  return {
    id: String(r.id),
    ratedUserId: String(r.rated_user),
    ratedById: String(r.rated_by),
    exchangeId: String(r.exchange),
    score: r.score,
    comment: r.comment ?? "",
    createdAt: r.created_at,
  };
}

function toNotification(n: any): Notification {
  return {
    id: String(n.id),
    category: n.category,
    title: n.title,
    body: n.body,
    targetType: n.target_type ?? null,
    targetId: n.target_id != null ? String(n.target_id) : null,
    isRead: n.is_read,
    readAt: n.read_at ?? null,
    createdAt: n.created_at,
  };
}

function toPartnerApplication(p: any): PartnerApplication {
  return {
    id: String(p.id),
    applicantName: p.applicant_name,
    applicantEmail: p.applicant_email,
    applicantPhone: p.applicant_phone ?? null,
    organizationName: p.organization_name ?? null,
    message: p.message ?? null,
    proposedDropoffName: p.proposed_dropoff_name ?? null,
    proposedDropoffAddress: p.proposed_dropoff_address ?? null,
    emailVerifiedAt: p.email_verified_at ?? null,
    status: p.status,
    rejectionReason: p.rejection_reason ?? "",
    createdAt: p.created_at,
  };
}

function toImpactStats(s: any): ImpactStats {
  return {
    totalListings: s.total_listings,
    totalExchangesCompleted: s.total_exchanges_completed,
    totalActiveDonors: s.total_active_donors,
    totalActiveRecipients: s.total_active_recipients,
    computedAt: s.computed_at,
  };
}

function toPaginated<T>(body: any, map: (x: any) => T): Paginated<T> {
  return {
    results: (body.results ?? []).map(map),
    nextCursorUrl: body.next ?? null,
    previousCursorUrl: body.previous ?? null,
  };
}

// ── live adapter ──────────────────────────────────────────────────────────────

function createLiveAdapter(baseUrl: string, healthBaseUrl: string): ApiAdapter {
  let accessToken: string | null = null;

  async function raw(url: string, init: RequestInit = {}, isRetry = false): Promise<Response> {
    const res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && !isRetry && !url.includes("/auth/refresh/") && !url.includes("/auth/login/")) {
      const refreshRes = await fetch(`${baseUrl}/auth/refresh/`, { method: "POST", credentials: "include" });
      if (refreshRes.ok) {
        const body = await refreshRes.json();
        accessToken = body.access;
        return raw(url, init, true);
      }
    }
    return res;
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const res = await raw(url, init);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = typeof body.detail === "string" ? body.detail : "Something went wrong. Please try again.";
      throw new ApiClientError(res.status, body.code ?? "unknown_error", detail, body.errors);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  return {
    // ── Auth ──────────────────────────────────────────────────────────────────
    async register(input) {
      const body = await request<any>("/auth/register/", { method: "POST", body: JSON.stringify(input) });
      accessToken = body.access;
      return { user: toUser(body.user), tokens: { accessToken: body.access } };
    },
    async login(username, password) {
      const body = await request<any>("/auth/login/", { method: "POST", body: JSON.stringify({ username, password }) });
      accessToken = body.access;
      return { user: toUser(body.user), tokens: { accessToken: body.access } };
    },
    async refresh() {
      const body = await request<any>("/auth/refresh/", { method: "POST" });
      accessToken = body.access;
      return { accessToken: body.access };
    },
    async logout() {
      await request("/auth/logout/", { method: "POST" });
      accessToken = null;
    },
    async setPassword(uid, token, newPassword) {
      await request("/auth/set-password/", {
        method: "POST",
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
    },

    // ── Users ──────────────────────────────────────────────────────────────────
    me: async () => toUser(await request("/users/me/")),
    updateMe: async (patch) => {
      const body: Record<string, unknown> = {};
      if (patch.email !== undefined) body.email = patch.email;
      if (patch.role !== undefined) body.role = patch.role;
      if (patch.phone !== undefined) body.phone = patch.phone;
      // latitude and longitude must be sent together — the backend ignores a lone value.
      if (patch.latitude !== undefined && patch.longitude !== undefined) {
        body.latitude = patch.latitude;
        body.longitude = patch.longitude;
      }
      return toUser(await request("/users/me/", { method: "PATCH", body: JSON.stringify(body) }));
    },

    // ── Categories ────────────────────────────────────────────────────────────
    listCategories: async () => (await request<any[]>("/categories/")).map(toCategory),

    // ── Listings ──────────────────────────────────────────────────────────────
    async listListings(query) {
      if (query.cursorUrl) {
        return toPaginated(await request<any>(query.cursorUrl), toListing);
      }
      const params = new URLSearchParams();
      if (query.category) params.set("category", query.category);
      if (query.condition) params.set("condition", query.condition);
      if (query.gradeLevel) params.set("grade_level", query.gradeLevel);
      if (query.q) params.set("q", query.q);
      // API expects ?near=lat,lng (single comma-separated param), not ?lat=&lng= separately.
      if (query.near) params.set("near", `${query.near.lat},${query.near.lng}`);
      // API expects ?radius=N (km), not ?radius_km=N.
      if (query.radiusKm) params.set("radius", String(query.radiusKm));
      if (query.pageSize) params.set("page_size", String(query.pageSize));
      const qs = params.toString();
      return toPaginated(await request<any>(`/listings/${qs ? `?${qs}` : ""}`), toListing);
    },
    getListing: async (id) => toListing(await request(`/listings/${id}/`)),
    async createListing(input) {
      return toListing(
        await request("/listings/", {
          method: "POST",
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            category: Number(input.categoryId),
            condition: input.condition,
            grade_level: input.gradeLevel,
            latitude: input.latitude,
            longitude: input.longitude,
          }),
        }),
      );
    },
    async updateListing(id, patch) {
      const body: Record<string, unknown> = {};
      if (patch.title !== undefined) body.title = patch.title;
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.categoryId !== undefined) body.category = Number(patch.categoryId);
      if (patch.condition !== undefined) body.condition = patch.condition;
      if (patch.gradeLevel !== undefined) body.grade_level = patch.gradeLevel;
      return toListing(await request(`/listings/${id}/`, { method: "PATCH", body: JSON.stringify(body) }));
    },
    deleteListing: async (id) => request(`/listings/${id}/`, { method: "DELETE" }),
    async uploadListingPhoto(listingId, file) {
      const form = new FormData();
      // Field name must be "file" (not "image") per the API spec.
      form.append("file", file);
      // Endpoint is /photos/, not /images/.
      return toListingImage(await request(`/listings/${listingId}/photos/`, { method: "POST", body: form }));
    },

    // ── Book requests ─────────────────────────────────────────────────────────
    requestListing: async (listingId, message) =>
      toBookRequest(
        await request(`/listings/${listingId}/request/`, {
          method: "POST",
          body: JSON.stringify({ message: message ?? "" }),
        }),
      ),
    listRequests: async () => toPaginated(await request<any>("/requests/"), toBookRequest),
    getRequest: async (id) => toBookRequest(await request(`/requests/${id}/`)),
    acceptRequest: async (requestId) =>
      toBookRequest(await request(`/requests/${requestId}/accept/`, { method: "POST" })),
    declineRequest: async (requestId) =>
      toBookRequest(await request(`/requests/${requestId}/decline/`, { method: "POST" })),

    // ── Exchanges ─────────────────────────────────────────────────────────────
    listExchanges: async () => toPaginated(await request<any>("/exchanges/"), toExchange),
    getExchange: async (id) => toExchange(await request(`/exchanges/${id}/`)),
    scheduleExchange: async (exchangeId, input) =>
      toExchange(
        await request(`/exchanges/${exchangeId}/schedule/`, {
          method: "POST",
          body: JSON.stringify({
            scheduled_at: input.scheduledAt,
            dropoff_point: input.dropoffPointId ? Number(input.dropoffPointId) : undefined,
          }),
        }),
      ),
    completeExchange: async (exchangeId) =>
      toExchange(await request(`/exchanges/${exchangeId}/complete/`, { method: "POST" })),
    cancelExchange: async (exchangeId) =>
      toExchange(await request(`/exchanges/${exchangeId}/cancel/`, { method: "POST" })),
    rateExchange: async (exchangeId, input) =>
      toRating(
        await request(`/exchanges/${exchangeId}/rate/`, {
          method: "POST",
          body: JSON.stringify({ score: input.score, comment: input.comment }),
        }),
      ),

    // ── Drop-off points ───────────────────────────────────────────────────────
    listDropoffPoints: async () => (await request<any[]>("/dropoff-points/")).map(toDropoffPoint),

    // ── Reports ───────────────────────────────────────────────────────────────
    submitReport: (payload) =>
      request("/reports/", {
        method: "POST",
        body: JSON.stringify({
          target_type: payload.targetType,
          target_id: Number(payload.targetId),
          reason: payload.reason,
          detail: payload.detail,
        }),
      }),

    // ── Notifications ─────────────────────────────────────────────────────────
    async listNotifications(query = {}) {
      if (query.cursorUrl) {
        return toPaginated(await request<any>(query.cursorUrl), toNotification);
      }
      const params = new URLSearchParams();
      if (query.isRead !== undefined) params.set("is_read", String(query.isRead));
      if (query.category) params.set("category", query.category);
      const qs = params.toString();
      return toPaginated(await request<any>(`/notifications/${qs ? `?${qs}` : ""}`), toNotification);
    },
    getNotification: async (id) => toNotification(await request(`/notifications/${id}/`)),
    async getUnreadNotificationCount() {
      const body = await request<any>("/notifications/unread-count/");
      return body.count as number;
    },
    async markNotificationRead(id) {
      return toNotification(await request(`/notifications/${id}/read/`, { method: "POST" }));
    },
    async markAllNotificationsRead() {
      const body = await request<any>("/notifications/mark-all-read/", { method: "POST" });
      return { markedRead: body.marked_read as number };
    },
    deleteNotification: async (id) => request(`/notifications/${id}/`, { method: "DELETE" }),

    // ── Partner applications ──────────────────────────────────────────────────
    async submitPartnerApplication(input) {
      return toPartnerApplication(
        await request("/partner-applications/", {
          method: "POST",
          body: JSON.stringify({
            applicant_name: input.applicantName,
            applicant_email: input.applicantEmail,
            applicant_phone: input.applicantPhone,
            organization_name: input.organizationName,
            message: input.message,
            proposed_dropoff_name: input.proposedDropoffName,
            proposed_dropoff_address: input.proposedDropoffAddress,
            proposed_latitude: input.proposedLatitude,
            proposed_longitude: input.proposedLongitude,
          }),
        }),
      );
    },

    // ── Stats / health ────────────────────────────────────────────────────────
    getImpactStats: async () => toImpactStats(await request("/stats/impact/")),
    getHealth: async () => request(`${healthBaseUrl}/health/`),
  };
}

const baseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "https://salvageme.pythonanywhere.com/api/v1"
).replace(/\/$/, "");
const healthBaseUrl = baseUrl.replace(/\/api\/v1$/, "/api");
// Default to "mock" so the dev preview works without CORS config on the backend.
// Set VITE_API_MODE=live (Replit secret) to switch to the real Django backend.
const mode = import.meta.env.VITE_API_MODE ?? "mock";

export const apiClient: ApiAdapter = mode === "mock" ? mockAdapter : createLiveAdapter(baseUrl, healthBaseUrl);
