import type {
  AdminDashboard,
  AdminDropoffPoint,
  AdminMe,
  AdminReport,
  AdminRole,
  AdminUser,
  AuditLogEntry,
  AuthTokens,
  BookRequest,
  Capability,
  Category,
  Exchange,
  ImpactStats,
  Listing,
  Paginated,
  PartnerApplication,
  PublicUser,
  Rating,
  User,
} from "@/types";
import { mockAdapter } from "./mock-adapter";

/**
 * Private, trimmed copy of the ApiAdapter interface for the admin app.
 * Deliberately excludes every *public*-facing write path (creating a
 * listing, requesting a book, scheduling an exchange, etc.) — the admin app
 * never calls those directly, only their `admin*` counterparts. See
 * admin-app-isolation-plan.md §2/§5 for why this isn't shared with
 * artifacts/salvageme's copy.
 */
export interface ApiAdapter {
  // ── Auth (admin logs in as a normal user, then is granted capabilities) ──
  login(username: string, password: string): Promise<{ user: User; tokens: AuthTokens }>;
  refresh(): Promise<AuthTokens>;
  logout(): Promise<void>;
  me(): Promise<User>;

  // ── Categories (read-only, used by the admin listings filter) ───────────
  listCategories(): Promise<Category[]>;

  // ── Admin: me & capabilities ─────────────────────────────────────────────
  getAdminMe(): Promise<AdminMe>;
  listCapabilities(): Promise<Capability[]>;

  // ── Admin: roles ──────────────────────────────────────────────────────────
  listAdminRoles(): Promise<AdminRole[]>;
  createAdminRole(input: { name: string; description?: string; capabilities: string[] }): Promise<AdminRole>;
  updateAdminRole(id: string, patch: Partial<{ name: string; description: string; capabilities: string[] }>): Promise<AdminRole>;
  deleteAdminRole(id: string): Promise<void>;

  // ── Admin: users ──────────────────────────────────────────────────────────
  adminListUsers(query?: { role?: string; isVerified?: boolean; isActive?: boolean; cursorUrl?: string | null }): Promise<Paginated<AdminUser>>;
  adminUpdateUser(id: string, patch: { role?: string; phone?: string; isVerified?: boolean }): Promise<AdminUser>;
  adminSuspendUser(id: string): Promise<AdminUser>;
  adminReactivateUser(id: string): Promise<AdminUser>;
  adminAssignRole(userId: string, adminRoleId: string | null): Promise<AdminUser>;

  // ── Admin: listings ───────────────────────────────────────────────────────
  adminListListings(query?: { category?: string; condition?: string; status?: string; cursorUrl?: string | null }): Promise<Paginated<Listing>>;
  adminRemoveListing(id: string): Promise<void>;
  adminRestoreListing(id: string): Promise<void>;
  adminDeleteListingPhoto(listingId: string, photoId: string): Promise<void>;

  // ── Admin: categories ─────────────────────────────────────────────────────
  adminListCategories(): Promise<Category[]>;
  adminCreateCategory(input: { name: string; slug?: string }): Promise<Category>;
  adminUpdateCategory(id: string, patch: { name?: string; slug?: string }): Promise<Category>;
  adminDeleteCategory(id: string): Promise<void>;

  // ── Admin: reports ────────────────────────────────────────────────────────
  adminListReports(query?: { status?: string; reason?: string; targetType?: string; cursorUrl?: string | null }): Promise<Paginated<AdminReport>>;
  adminResolveReport(id: string): Promise<AdminReport>;
  adminDismissReport(id: string): Promise<AdminReport>;

  // ── Admin: audit log ──────────────────────────────────────────────────────
  adminListAuditLog(query?: { action?: string; targetType?: string; cursorUrl?: string | null }): Promise<Paginated<AuditLogEntry>>;

  // ── Admin: exchanges ─────────────────────────────────────────────────────
  adminListExchanges(query?: { status?: string; cursorUrl?: string | null }): Promise<Paginated<Exchange>>;
  adminForceCancelExchange(id: string, reason: string): Promise<Exchange>;
  adminForceCompleteExchange(id: string, reason: string): Promise<Exchange>;

  // ── Admin: requests ───────────────────────────────────────────────────────
  adminListRequests(query?: { status?: string; cursorUrl?: string | null }): Promise<Paginated<BookRequest>>;

  // ── Admin: ratings ────────────────────────────────────────────────────────
  adminListRatings(query?: { score?: number; cursorUrl?: string | null }): Promise<Paginated<Rating>>;

  // ── Admin: drop-off points ────────────────────────────────────────────────
  adminListDropoffPoints(): Promise<AdminDropoffPoint[]>;
  adminCreateDropoffPoint(input: { name: string; address: string; latitude: number; longitude: number; coordinator?: number }): Promise<AdminDropoffPoint>;
  adminUpdateDropoffPoint(id: string, patch: Partial<{ name: string; address: string; latitude: number; longitude: number; coordinator: number }>): Promise<AdminDropoffPoint>;
  adminDeleteDropoffPoint(id: string): Promise<void>;
  adminAssignDropoffManagers(id: string, userIds: number[]): Promise<AdminDropoffPoint>;

  // ── Admin: dashboard & stats ──────────────────────────────────────────────
  adminGetDashboard(): Promise<AdminDashboard>;
  adminGetStatsHistory(cursorUrl?: string | null): Promise<Paginated<ImpactStats>>;
  adminRecomputeStats(): Promise<ImpactStats>;

  // ── Admin: partner applications ───────────────────────────────────────────
  adminListPartnerApplications(query?: { status?: string; cursorUrl?: string | null }): Promise<Paginated<PartnerApplication>>;
  adminApprovePartnerApplication(id: string, input: { adminRoleId: number; assignDropoffManager?: boolean }): Promise<PartnerApplication>;
  adminRejectPartnerApplication(id: string, reason: string): Promise<PartnerApplication>;
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
    images: (l.images ?? []).map((i: any) => ({ id: String(i.id), url: i.url, order: i.order ?? 0 })),
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

function toDropoffPoint(d: any) {
  return {
    id: String(d.id),
    name: d.name,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
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
    counterpartContact: e.counterpart_contact
      ? {
          username: e.counterpart_contact.username,
          phone: e.counterpart_contact.phone ?? null,
          latitude: e.counterpart_contact.latitude ?? null,
          longitude: e.counterpart_contact.longitude ?? null,
        }
      : null,
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

function toAdminUser(u: any): AdminUser {
  return {
    id: String(u.id),
    username: u.username,
    email: u.email ?? "",
    phone: u.phone ?? null,
    role: u.role,
    isVerified: u.is_verified,
    isActive: u.is_active,
    adminRole: u.admin_role ? { id: String(u.admin_role.id), name: u.admin_role.name } : null,
    dateJoined: u.date_joined,
  };
}

function toAdminReport(r: any): AdminReport {
  return {
    id: String(r.id),
    targetType: r.target_type,
    targetId: String(r.target_id),
    reason: r.reason,
    detail: r.detail ?? "",
    status: r.status,
    createdAt: r.created_at,
  };
}

function toAuditLogEntry(e: any): AuditLogEntry {
  return {
    id: String(e.id),
    actor: String(e.actor),
    actorUsername: e.actor_username,
    action: e.action,
    targetType: e.target_type,
    targetId: String(e.target_id),
    metadata: e.metadata ?? {},
    createdAt: e.created_at,
  };
}

function toAdminDropoffPoint(d: any): AdminDropoffPoint {
  return {
    id: String(d.id),
    name: d.name,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
    coordinator: d.coordinator != null ? String(d.coordinator) : null,
    managers: (d.managers ?? []).map((m: any) => ({ id: String(m.id), username: m.username })),
  };
}

function toAdminRole(r: any): AdminRole {
  return {
    id: String(r.id),
    name: r.name,
    description: r.description ?? "",
    capabilities: r.capabilities ?? [],
    isProtected: r.is_protected ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toAdminDashboard(d: any): AdminDashboard {
  return {
    openReportsCount: d.open_reports_count,
    pendingRequestsCount: d.pending_requests_count,
    unverifiedUsersCount: d.unverified_users_count,
    listingsCreatedToday: d.listings_created_today,
    scheduledExchangesCount: d.scheduled_exchanges_count,
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

function createLiveAdapter(baseUrl: string): ApiAdapter {
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
    me: async () => toUser(await request("/users/me/")),

    listCategories: async () => (await request<any[]>("/categories/")).map(toCategory),

    async getAdminMe() {
      const b = await request<any>("/admin/me/");
      return {
        adminRole: b.admin_role ? { id: String(b.admin_role.id), name: b.admin_role.name } : null,
        capabilities: b.capabilities ?? [],
        canAccessAdmin: b.can_access_admin ?? false,
      };
    },
    async listCapabilities() {
      return (await request<any[]>("/admin/capabilities/")).map((c) => ({ code: c.code, description: c.description }));
    },

    listAdminRoles: async () => (await request<any[]>("/admin/roles/")).map(toAdminRole),
    async createAdminRole(input) {
      return toAdminRole(await request("/admin/roles/", { method: "POST", body: JSON.stringify({ name: input.name, description: input.description, capabilities: input.capabilities }) }));
    },
    async updateAdminRole(id, patch) {
      const body: Record<string, unknown> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.capabilities !== undefined) body.capabilities = patch.capabilities;
      return toAdminRole(await request(`/admin/roles/${id}/`, { method: "PATCH", body: JSON.stringify(body) }));
    },
    deleteAdminRole: async (id) => request(`/admin/roles/${id}/`, { method: "DELETE" }),

    async adminListUsers(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toAdminUser);
      const p = new URLSearchParams();
      if (query.role) p.set("role", query.role);
      if (query.isVerified !== undefined) p.set("is_verified", String(query.isVerified));
      if (query.isActive !== undefined) p.set("is_active", String(query.isActive));
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/users/${qs ? `?${qs}` : ""}`), toAdminUser);
    },
    async adminUpdateUser(id, patch) {
      const body: Record<string, unknown> = {};
      if (patch.role !== undefined) body.role = patch.role;
      if (patch.phone !== undefined) body.phone = patch.phone;
      if (patch.isVerified !== undefined) body.is_verified = patch.isVerified;
      return toAdminUser(await request(`/admin/users/${id}/`, { method: "PATCH", body: JSON.stringify(body) }));
    },
    adminSuspendUser: async (id) => toAdminUser(await request(`/admin/users/${id}/suspend/`, { method: "POST" })),
    adminReactivateUser: async (id) => toAdminUser(await request(`/admin/users/${id}/reactivate/`, { method: "POST" })),
    async adminAssignRole(userId, adminRoleId) {
      return toAdminUser(await request(`/admin/users/${userId}/assign-role/`, { method: "POST", body: JSON.stringify({ admin_role: adminRoleId !== null ? Number(adminRoleId) : null }) }));
    },

    async adminListListings(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toListing);
      const p = new URLSearchParams();
      if (query.category) p.set("category", query.category);
      if (query.condition) p.set("condition", query.condition);
      if (query.status) p.set("status", query.status);
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/listings/${qs ? `?${qs}` : ""}`), toListing);
    },
    adminRemoveListing: async (id) => request(`/admin/listings/${id}/remove/`, { method: "POST" }),
    adminRestoreListing: async (id) => request(`/admin/listings/${id}/restore/`, { method: "POST" }),
    adminDeleteListingPhoto: async (listingId, photoId) => request(`/admin/listings/${listingId}/photos/${photoId}/`, { method: "DELETE" }),

    adminListCategories: async () => (await request<any[]>("/admin/categories/")).map(toCategory),
    async adminCreateCategory(input) {
      return toCategory(await request("/admin/categories/", { method: "POST", body: JSON.stringify({ name: input.name, slug: input.slug }) }));
    },
    async adminUpdateCategory(id, patch) {
      return toCategory(await request(`/admin/categories/${id}/`, { method: "PATCH", body: JSON.stringify(patch) }));
    },
    adminDeleteCategory: async (id) => request(`/admin/categories/${id}/`, { method: "DELETE" }),

    async adminListReports(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toAdminReport);
      const p = new URLSearchParams();
      if (query.status) p.set("status", query.status);
      if (query.reason) p.set("reason", query.reason);
      if (query.targetType) p.set("target_type", query.targetType);
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/reports/${qs ? `?${qs}` : ""}`), toAdminReport);
    },
    adminResolveReport: async (id) => toAdminReport(await request(`/admin/reports/${id}/resolve/`, { method: "POST" })),
    adminDismissReport: async (id) => toAdminReport(await request(`/admin/reports/${id}/dismiss/`, { method: "POST" })),

    async adminListAuditLog(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toAuditLogEntry);
      const p = new URLSearchParams();
      if (query.action) p.set("action", query.action);
      if (query.targetType) p.set("target_type", query.targetType);
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/audit-log/${qs ? `?${qs}` : ""}`), toAuditLogEntry);
    },

    async adminListExchanges(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toExchange);
      const p = new URLSearchParams();
      if (query.status) p.set("status", query.status);
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/exchanges/${qs ? `?${qs}` : ""}`), toExchange);
    },
    adminForceCancelExchange: async (id, reason) =>
      toExchange(await request(`/admin/exchanges/${id}/force-cancel/`, { method: "POST", body: JSON.stringify({ reason }) })),
    adminForceCompleteExchange: async (id, reason) =>
      toExchange(await request(`/admin/exchanges/${id}/force-complete/`, { method: "POST", body: JSON.stringify({ reason }) })),

    async adminListRequests(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toBookRequest);
      const p = new URLSearchParams();
      if (query.status) p.set("status", query.status);
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/requests/${qs ? `?${qs}` : ""}`), toBookRequest);
    },

    async adminListRatings(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toRating);
      const p = new URLSearchParams();
      if (query.score !== undefined) p.set("score", String(query.score));
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/ratings/${qs ? `?${qs}` : ""}`), toRating);
    },

    adminListDropoffPoints: async () => (await request<any[]>("/admin/dropoff-points/")).map(toAdminDropoffPoint),
    async adminCreateDropoffPoint(input) {
      return toAdminDropoffPoint(await request("/admin/dropoff-points/", { method: "POST", body: JSON.stringify({ name: input.name, address: input.address, latitude: input.latitude, longitude: input.longitude, coordinator: input.coordinator }) }));
    },
    async adminUpdateDropoffPoint(id, patch) {
      return toAdminDropoffPoint(await request(`/admin/dropoff-points/${id}/`, { method: "PATCH", body: JSON.stringify(patch) }));
    },
    adminDeleteDropoffPoint: async (id) => request(`/admin/dropoff-points/${id}/`, { method: "DELETE" }),
    async adminAssignDropoffManagers(id, userIds) {
      return toAdminDropoffPoint(await request(`/admin/dropoff-points/${id}/assign-managers/`, { method: "POST", body: JSON.stringify({ user_ids: userIds }) }));
    },

    adminGetDashboard: async () => toAdminDashboard(await request("/admin/dashboard/")),
    async adminGetStatsHistory(cursorUrl) {
      return toPaginated(await request<any>(cursorUrl ?? "/admin/stats/history/"), toImpactStats);
    },
    adminRecomputeStats: async () => toImpactStats(await request("/admin/stats/recompute/", { method: "POST" })),

    async adminListPartnerApplications(query = {}) {
      if (query.cursorUrl) return toPaginated(await request<any>(query.cursorUrl), toPartnerApplication);
      const p = new URLSearchParams();
      if (query.status) p.set("status", query.status);
      const qs = p.toString();
      return toPaginated(await request<any>(`/admin/partner-applications/${qs ? `?${qs}` : ""}`), toPartnerApplication);
    },
    async adminApprovePartnerApplication(id, input) {
      return toPartnerApplication(await request(`/admin/partner-applications/${id}/approve/`, { method: "POST", body: JSON.stringify({ admin_role: input.adminRoleId, assign_dropoff_manager: input.assignDropoffManager }) }));
    },
    async adminRejectPartnerApplication(id, reason) {
      return toPartnerApplication(await request(`/admin/partner-applications/${id}/reject/`, { method: "POST", body: JSON.stringify({ reason }) }));
    },
  };
}

const baseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "https://salvageme.pythonanywhere.com/api/v1"
).replace(/\/$/, "");
// Default to "mock" so the dev preview works without CORS config on the backend.
// Set VITE_API_MODE=live to switch to the real Django backend.
const mode = import.meta.env.VITE_API_MODE ?? "mock";

export const apiClient: ApiAdapter = mode === "mock" ? mockAdapter : createLiveAdapter(baseUrl);
