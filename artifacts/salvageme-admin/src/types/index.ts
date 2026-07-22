// Private copy, trimmed to only what the admin app needs. Mirrors the wire
// format documented in API_REFERENCE.md. IDs are numeric on the wire; kept as
// strings here and converted with Number() only where the API needs a
// numeric value in a request body.
//
// This file intentionally does NOT import from, or stay byte-identical with,
// artifacts/salvageme/src/types/index.ts — see admin-app-isolation-plan.md §5
// for how contract changes are ported across by hand.

export type UserRole = "donor" | "recipient" | "both";
export type ListingCondition = "new" | "good" | "fair" | "worn";
export type ListingStatus = "available" | "pending" | "claimed" | "removed";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";
export type ExchangeStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type ReportTargetType = "listing" | "user";
export type ReportReason = "spam" | "inappropriate" | "misrepresented" | "no_show" | "other";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  phone: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  dateJoined: string;
}

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  isVerified: boolean;
  dateJoined: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ListingImage {
  id: string;
  url: string;
  order: number;
}

export interface Listing {
  id: string;
  owner: PublicUser;
  title: string;
  description: string;
  category: Category;
  gradeLevel: string | null;
  condition: ListingCondition;
  status: ListingStatus;
  images: ListingImage[];
  distanceKm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  results: T[];
  nextCursorUrl: string | null;
  previousCursorUrl: string | null;
}

export interface BookRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  requester: PublicUser;
  status: RequestStatus;
  message: string;
  createdAt: string;
}

export interface DropoffPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Exchange {
  id: string;
  listingId: string;
  listingTitle: string;
  donor: PublicUser;
  recipient: PublicUser;
  dropoffPoint: DropoffPoint | null;
  status: ExchangeStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  // counterpartContact is never populated for admin-only exchange views (it's
  // computed the same way as the public endpoint, but admin pages don't
  // display raw contact info), kept only for type-shape compatibility.
  counterpartContact: {
    username: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface Rating {
  id: string;
  ratedUserId: string;
  ratedById: string;
  exchangeId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface ImpactStats {
  totalListings: number;
  totalExchangesCompleted: number;
  totalActiveDonors: number;
  totalActiveRecipients: number;
  computedAt: string;
}

export interface ApiError {
  status: number;
  detail: string | Record<string, string[]> | string[];
  code: string;
  errors?: Record<string, string[]>;
}

export type PartnerApplicationStatus = "pending" | "approved" | "rejected";

export interface PartnerApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  organizationName: string | null;
  message: string | null;
  proposedDropoffName: string | null;
  proposedDropoffAddress: string | null;
  emailVerifiedAt: string | null;
  status: PartnerApplicationStatus;
  rejectionReason: string;
  createdAt: string;
}

// ── Admin-only types ──────────────────────────────────────────────────────

export interface AdminMe {
  adminRole: { id: string; name: string } | null;
  capabilities: string[];
  canAccessAdmin: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Capability {
  code: string;
  description: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  adminRole: { id: string; name: string } | null;
  dateJoined: string;
}

export interface AdminReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminDropoffPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  coordinator: string | null;
  managers: { id: string; username: string }[];
}

export interface AdminDashboard {
  openReportsCount: number;
  pendingRequestsCount: number;
  unverifiedUsersCount: number;
  listingsCreatedToday: number;
  scheduledExchangesCount: number;
}
