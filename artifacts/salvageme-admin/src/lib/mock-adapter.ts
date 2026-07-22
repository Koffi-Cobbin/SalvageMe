import type { ApiAdapter } from "./api-client";
import { ApiClientError } from "./api-client";
import type {
  AdminDashboard,
  AdminDropoffPoint,
  AdminMe,
  AdminReport,
  AdminRole,
  AdminUser,
  AuditLogEntry,
  BookRequest,
  Capability,
  Category,
  Exchange,
  ImpactStats,
  Listing,
  PartnerApplication,
  Rating,
  User,
} from "@/types";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const currentUser: User = {
  id: "1",
  username: "ama_boateng",
  email: "ama@example.com",
  role: "both",
  phone: "+233 20 000 0000",
  isVerified: true,
  avatarUrl: null,
  latitude: 5.6037,
  longitude: -0.187,
  dateJoined: "2026-02-10T00:00:00Z",
};

const categories: Category[] = [
  { id: "1", name: "Fiction", slug: "fiction" },
  { id: "2", name: "Textbooks", slug: "textbooks" },
  { id: "3", name: "Science", slug: "science" },
  { id: "4", name: "Mathematics", slug: "mathematics" },
];
const [catFiction, , catScience] = categories as [Category, Category, Category, Category];

const owners = {
  u2: { id: "2", username: "kwesi_mensah", role: "donor" as const, isVerified: true, dateJoined: "2026-01-01T00:00:00Z" },
  u3: { id: "3", username: "nana_adjei", role: "donor" as const, isVerified: false, dateJoined: "2026-01-05T00:00:00Z" },
};

const listings: Listing[] = [
  {
    id: "1",
    owner: owners.u2,
    title: "Complete Set — JHS Integrated Science (Grades 7-9)",
    description: "Three-year set, lightly used, all pages intact.",
    category: catScience,
    gradeLevel: "7th-9th grade",
    condition: "good",
    status: "available",
    images: [],
    distanceKm: null,
    createdAt: "2026-06-20T09:00:00Z",
    updatedAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "2",
    owner: owners.u3,
    title: "Beginner Reader Bundle (10 books)",
    description: "Ten early-reader storybooks, great condition.",
    category: catFiction,
    gradeLevel: "Elementary",
    condition: "new",
    status: "pending",
    images: [],
    distanceKm: null,
    createdAt: "2026-06-18T09:00:00Z",
    updatedAt: "2026-06-22T09:00:00Z",
  },
  {
    id: "4",
    owner: owners.u2,
    title: "Removed: Old Geography Textbook",
    description: "Removed by moderator.",
    category: catScience,
    gradeLevel: null,
    condition: "worn",
    status: "removed",
    images: [],
    distanceKm: null,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
];

const exchanges: Exchange[] = [];
const requests: BookRequest[] = [];

function notFound(): never {
  throw new ApiClientError(404, "not_found", "Not found");
}

export const mockAdapter: ApiAdapter = {
  async login() {
    await delay();
    return { user: currentUser, tokens: { accessToken: "mock-token" } };
  },
  async refresh() {
    await delay(100);
    return { accessToken: "mock-token" };
  },
  async logout() {
    await delay(100);
  },
  async me() {
    await delay(100);
    return currentUser;
  },

  async listCategories() {
    await delay(100);
    return categories;
  },

  async getAdminMe(): Promise<AdminMe> {
    await delay(100);
    return {
      adminRole: { id: "1", name: "Super Admin" },
      canAccessAdmin: true,
      capabilities: [
        "dashboard.view", "stats.recompute",
        "users.view", "users.suspend", "users.edit",
        "listings.view", "listings.remove_restore", "listings.delete_photo",
        "categories.manage",
        "reports.view", "reports.resolve",
        "exchanges.view", "exchanges.force_override",
        "requests.view",
        "ratings.view",
        "dropoff.view", "dropoff.manage", "dropoff.manage_all",
        "partner_applications.review",
        "auditlog.view",
        "roles.manage",
      ],
    };
  },

  async listCapabilities(): Promise<Capability[]> {
    await delay(100);
    return [
      { code: "dashboard.view", description: "View the admin dashboard" },
      { code: "stats.recompute", description: "Trigger impact stats recomputation" },
      { code: "users.view", description: "View all user accounts" },
      { code: "users.suspend", description: "Suspend and reactivate users" },
      { code: "users.edit", description: "Edit user fields (role, phone, verified)" },
      { code: "listings.view", description: "View all listings including removed" },
      { code: "listings.remove_restore", description: "Remove and restore listings" },
      { code: "listings.delete_photo", description: "Delete listing photos" },
      { code: "categories.manage", description: "Create, edit and delete categories" },
      { code: "reports.view", description: "View moderation reports" },
      { code: "reports.resolve", description: "Resolve and dismiss reports" },
      { code: "exchanges.view", description: "View all exchanges" },
      { code: "exchanges.force_override", description: "Force-cancel or force-complete exchanges" },
      { code: "requests.view", description: "View all book requests" },
      { code: "ratings.view", description: "View all ratings" },
      { code: "dropoff.view", description: "View drop-off points" },
      { code: "dropoff.manage", description: "Manage own drop-off points" },
      { code: "dropoff.manage_all", description: "Manage all drop-off points and assign managers" },
      { code: "partner_applications.review", description: "Approve and reject partner applications" },
      { code: "auditlog.view", description: "View the admin audit log" },
      { code: "roles.manage", description: "Create, edit and delete admin roles" },
    ];
  },

  async listAdminRoles(): Promise<AdminRole[]> {
    await delay();
    return [
      {
        id: "1", name: "Super Admin", description: "Full access to all admin functions.",
        capabilities: ["dashboard.view", "stats.recompute", "users.view", "users.suspend", "users.edit", "listings.view", "listings.remove_restore", "listings.delete_photo", "categories.manage", "reports.view", "reports.resolve", "exchanges.view", "exchanges.force_override", "requests.view", "ratings.view", "dropoff.view", "dropoff.manage", "dropoff.manage_all", "partner_applications.review", "auditlog.view", "roles.manage"],
        isProtected: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "2", name: "Content Moderator", description: "Reviews listings and user reports.",
        capabilities: ["dashboard.view", "listings.view", "listings.remove_restore", "reports.view", "reports.resolve", "users.view", "auditlog.view"],
        isProtected: false, createdAt: "2026-02-01T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z",
      },
      {
        id: "3", name: "Partner Manager", description: "Manages drop-off points and partner applications.",
        capabilities: ["dashboard.view", "dropoff.view", "dropoff.manage", "dropoff.manage_all", "partner_applications.review"],
        isProtected: false, createdAt: "2026-03-01T00:00:00Z", updatedAt: "2026-03-01T00:00:00Z",
      },
    ];
  },
  async createAdminRole(input): Promise<AdminRole> {
    await delay();
    return { id: String(Date.now()), name: input.name, description: input.description ?? "", capabilities: input.capabilities, isProtected: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },
  async updateAdminRole(id, patch): Promise<AdminRole> {
    await delay();
    return { id, name: patch.name ?? "Updated Role", description: patch.description ?? "", capabilities: patch.capabilities ?? [], isProtected: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: new Date().toISOString() };
  },
  async deleteAdminRole() { await delay(); },

  async adminListUsers() {
    await delay();
    const users: AdminUser[] = [
      { id: "1", username: "ama_boateng", email: "ama@example.com", phone: "+233201234567", role: "both", isVerified: true, isActive: true, adminRole: { id: "1", name: "Super Admin" }, dateJoined: "2026-02-10T00:00:00Z" },
      { id: "2", username: "kwesi_mensah", email: "kwesi@example.com", phone: null, role: "donor", isVerified: true, isActive: true, adminRole: null, dateJoined: "2026-01-01T00:00:00Z" },
      { id: "3", username: "nana_adjei", email: "nana@example.com", phone: "+233209876543", role: "donor", isVerified: false, isActive: true, adminRole: null, dateJoined: "2026-01-05T00:00:00Z" },
      { id: "4", username: "abena_ofori", email: "abena@example.com", phone: null, role: "recipient", isVerified: true, isActive: false, adminRole: null, dateJoined: "2026-03-12T00:00:00Z" },
      { id: "5", username: "kofi_asante", email: "kofi@example.com", phone: "+233557654321", role: "both", isVerified: true, isActive: true, adminRole: { id: "3", name: "Partner Manager" }, dateJoined: "2026-04-01T00:00:00Z" },
    ];
    return { results: users, nextCursorUrl: null, previousCursorUrl: null };
  },
  async adminUpdateUser(id, patch): Promise<AdminUser> {
    await delay();
    return { id, username: "updated_user", email: "updated@example.com", phone: patch.phone ?? null, role: (patch.role as any) ?? "both", isVerified: patch.isVerified ?? true, isActive: true, adminRole: null, dateJoined: "2026-01-01T00:00:00Z" };
  },
  async adminSuspendUser(id): Promise<AdminUser> {
    await delay();
    return { id, username: "suspended_user", email: "user@example.com", phone: null, role: "both", isVerified: true, isActive: false, adminRole: null, dateJoined: "2026-01-01T00:00:00Z" };
  },
  async adminReactivateUser(id): Promise<AdminUser> {
    await delay();
    return { id, username: "active_user", email: "user@example.com", phone: null, role: "both", isVerified: true, isActive: true, adminRole: null, dateJoined: "2026-01-01T00:00:00Z" };
  },
  async adminAssignRole(userId): Promise<AdminUser> {
    await delay();
    return { id: userId, username: "user", email: "user@example.com", phone: null, role: "both", isVerified: true, isActive: true, adminRole: { id: "2", name: "Content Moderator" }, dateJoined: "2026-01-01T00:00:00Z" };
  },

  async adminListListings() {
    await delay();
    return { results: listings, nextCursorUrl: null, previousCursorUrl: null };
  },
  async adminRemoveListing(id) {
    await delay();
    const l = listings.find((x) => x.id === id);
    if (l) l.status = "removed";
  },
  async adminRestoreListing(id) {
    await delay();
    const l = listings.find((x) => x.id === id);
    if (l) l.status = "available";
  },
  async adminDeleteListingPhoto() { await delay(); },

  async adminListCategories() { await delay(); return categories; },
  async adminCreateCategory(input): Promise<Category> {
    await delay();
    const cat: Category = { id: String(Date.now()), name: input.name, slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-") };
    categories.push(cat);
    return cat;
  },
  async adminUpdateCategory(id, patch): Promise<Category> {
    await delay();
    return { id, name: patch.name ?? "Updated", slug: patch.slug ?? "updated" };
  },
  async adminDeleteCategory() { await delay(); },

  async adminListReports() {
    await delay();
    const reports: AdminReport[] = [
      { id: "1", targetType: "listing", targetId: "4", reason: "inappropriate", detail: "This book listing contains inappropriate content in the description.", status: "open", createdAt: "2026-07-18T10:00:00Z" },
      { id: "2", targetType: "user", targetId: "3", reason: "spam", detail: "User is posting duplicate listings rapidly.", status: "open", createdAt: "2026-07-17T14:30:00Z" },
      { id: "3", targetType: "listing", targetId: "2", reason: "misrepresented", detail: "Condition listed as new but photos show heavy wear.", status: "resolved", createdAt: "2026-07-15T09:00:00Z" },
      { id: "4", targetType: "user", targetId: "4", reason: "no_show", detail: "Failed to show up for exchange twice.", status: "dismissed", createdAt: "2026-07-10T16:00:00Z" },
    ];
    return { results: reports, nextCursorUrl: null, previousCursorUrl: null };
  },
  async adminResolveReport(id): Promise<AdminReport> {
    await delay();
    return { id, targetType: "listing", targetId: "1", reason: "inappropriate", detail: "Resolved.", status: "resolved", createdAt: "2026-07-18T10:00:00Z" };
  },
  async adminDismissReport(id): Promise<AdminReport> {
    await delay();
    return { id, targetType: "listing", targetId: "1", reason: "spam", detail: "Dismissed.", status: "dismissed", createdAt: "2026-07-18T10:00:00Z" };
  },

  async adminListAuditLog() {
    await delay();
    const entries: AuditLogEntry[] = [
      { id: "1", actor: "1", actorUsername: "ama_boateng", action: "listing.remove", targetType: "listing", targetId: "4", metadata: { reason: "inappropriate content" }, createdAt: "2026-07-18T11:00:00Z" },
      { id: "2", actor: "1", actorUsername: "ama_boateng", action: "report.resolve", targetType: "report", targetId: "3", metadata: {}, createdAt: "2026-07-15T09:05:00Z" },
      { id: "3", actor: "1", actorUsername: "ama_boateng", action: "user.suspend", targetType: "user", targetId: "4", metadata: { reason: "no_show" }, createdAt: "2026-07-12T14:00:00Z" },
      { id: "4", actor: "1", actorUsername: "ama_boateng", action: "category.create", targetType: "category", targetId: "5", metadata: { name: "Languages" }, createdAt: "2026-07-10T10:00:00Z" },
      { id: "5", actor: "1", actorUsername: "ama_boateng", action: "role.assign", targetType: "user", targetId: "5", metadata: { role: "Partner Manager" }, createdAt: "2026-07-01T09:00:00Z" },
    ];
    return { results: entries, nextCursorUrl: null, previousCursorUrl: null };
  },

  async adminListExchanges() {
    await delay();
    return { results: exchanges, nextCursorUrl: null, previousCursorUrl: null };
  },
  async adminForceCancelExchange(id): Promise<Exchange> {
    await delay();
    const ex = exchanges.find((e) => e.id === id);
    if (ex) ex.status = "cancelled";
    return ex ?? notFound();
  },
  async adminForceCompleteExchange(id): Promise<Exchange> {
    await delay();
    const ex = exchanges.find((e) => e.id === id);
    if (ex) { ex.status = "completed"; ex.completedAt = new Date().toISOString(); }
    return ex ?? notFound();
  },

  async adminListRequests() {
    await delay();
    return { results: requests, nextCursorUrl: null, previousCursorUrl: null };
  },

  async adminListRatings() {
    await delay();
    const mockRatings: Rating[] = [
      { id: "1", ratedUserId: "2", ratedById: "1", exchangeId: "1", score: 5, comment: "Great experience, very kind donor.", createdAt: "2026-07-10T12:00:00Z" },
      { id: "2", ratedUserId: "1", ratedById: "2", exchangeId: "1", score: 4, comment: "Smooth exchange.", createdAt: "2026-07-10T12:30:00Z" },
    ];
    return { results: mockRatings, nextCursorUrl: null, previousCursorUrl: null };
  },

  async adminListDropoffPoints(): Promise<AdminDropoffPoint[]> {
    await delay();
    return [
      { id: "1", name: "Accra Central Library", address: "High St, Accra", latitude: 5.5427, longitude: -0.2062, coordinator: "5", managers: [{ id: "5", username: "kofi_asante" }, { id: "2", username: "kwesi_mensah" }] },
      { id: "2", name: "Kumasi Community Hub", address: "Adum, Kumasi", latitude: 6.6928, longitude: -1.6248, coordinator: null, managers: [{ id: "3", username: "nana_adjei" }] },
    ];
  },
  async adminCreateDropoffPoint(input): Promise<AdminDropoffPoint> {
    await delay();
    return { id: String(Date.now()), name: input.name, address: input.address, latitude: input.latitude, longitude: input.longitude, coordinator: null, managers: [] };
  },
  async adminUpdateDropoffPoint(id, patch): Promise<AdminDropoffPoint> {
    await delay();
    return { id, name: patch.name ?? "Updated Point", address: patch.address ?? "Address", latitude: patch.latitude ?? 5.5, longitude: patch.longitude ?? -0.2, coordinator: null, managers: [] };
  },
  async adminDeleteDropoffPoint() { await delay(); },
  async adminAssignDropoffManagers(id): Promise<AdminDropoffPoint> {
    await delay();
    return { id, name: "Drop-off Point", address: "Address", latitude: 5.5, longitude: -0.2, coordinator: null, managers: [{ id: "2", username: "kwesi_mensah" }] };
  },

  async adminGetDashboard(): Promise<AdminDashboard> {
    await delay();
    return { openReportsCount: 2, pendingRequestsCount: requests.filter((r) => r.status === "pending").length, unverifiedUsersCount: 1, listingsCreatedToday: 2, scheduledExchangesCount: exchanges.filter((e) => e.status === "scheduled").length };
  },
  async adminGetStatsHistory() {
    await delay();
    const history: ImpactStats[] = [
      { totalListings: 8, totalExchangesCompleted: 3, totalActiveDonors: 15, totalActiveRecipients: 22, computedAt: "2026-07-01T00:00:00Z" },
      { totalListings: 12, totalExchangesCompleted: 5, totalActiveDonors: 19, totalActiveRecipients: 27, computedAt: "2026-07-08T00:00:00Z" },
      { totalListings: 18, totalExchangesCompleted: 9, totalActiveDonors: 23, totalActiveRecipients: 31, computedAt: "2026-07-15T00:00:00Z" },
      { totalListings: listings.length, totalExchangesCompleted: exchanges.filter((e) => e.status === "completed").length, totalActiveDonors: 23, totalActiveRecipients: 31, computedAt: new Date().toISOString() },
    ];
    return { results: history, nextCursorUrl: null, previousCursorUrl: null };
  },
  async adminRecomputeStats(): Promise<ImpactStats> {
    await delay(800);
    return { totalListings: listings.length, totalExchangesCompleted: exchanges.filter((e) => e.status === "completed").length, totalActiveDonors: 24, totalActiveRecipients: 32, computedAt: new Date().toISOString() };
  },

  async adminListPartnerApplications() {
    await delay();
    const apps: PartnerApplication[] = [
      { id: "1", applicantName: "Grace Osei", applicantEmail: "grace@bookbridge.gh", applicantPhone: "+233244112233", organizationName: "BookBridge Ghana", message: "We operate a small community library in Tema and would love to serve as a drop-off point.", proposedDropoffName: "Tema Community Library", proposedDropoffAddress: "Community 1, Tema", emailVerifiedAt: "2026-07-15T10:00:00Z", status: "pending", rejectionReason: "", createdAt: "2026-07-15T09:50:00Z" },
      { id: "2", applicantName: "Bernard Tetteh", applicantEmail: "bernard@readmore.gh", applicantPhone: null, organizationName: null, message: "I run a small reading club and can store books.", proposedDropoffName: null, proposedDropoffAddress: null, emailVerifiedAt: "2026-06-20T08:00:00Z", status: "approved", rejectionReason: "", createdAt: "2026-06-20T07:55:00Z" },
    ];
    return { results: apps, nextCursorUrl: null, previousCursorUrl: null };
  },
  async adminApprovePartnerApplication(id): Promise<PartnerApplication> {
    await delay();
    return { id, applicantName: "Grace Osei", applicantEmail: "grace@bookbridge.gh", applicantPhone: null, organizationName: "BookBridge Ghana", message: null, proposedDropoffName: "Tema Community Library", proposedDropoffAddress: "Community 1, Tema", emailVerifiedAt: "2026-07-15T10:00:00Z", status: "approved", rejectionReason: "", createdAt: "2026-07-15T09:50:00Z" };
  },
  async adminRejectPartnerApplication(id): Promise<PartnerApplication> {
    await delay();
    return { id, applicantName: "Grace Osei", applicantEmail: "grace@example.com", applicantPhone: null, organizationName: null, message: null, proposedDropoffName: null, proposedDropoffAddress: null, emailVerifiedAt: null, status: "rejected", rejectionReason: "Insufficient information provided.", createdAt: "2026-07-15T09:50:00Z" };
  },
};
