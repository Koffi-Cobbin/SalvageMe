// Types mirror the real SalvageMe API — see API_REFERENCE.md. IDs are
// numeric on the wire; we keep them as strings in the frontend and convert
// with Number() only where the API needs a numeric value in a request body.

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

export interface ListingsQuery {
  category?: string;
  condition?: ListingCondition;
  gradeLevel?: string;
  q?: string;
  near?: { lat: number; lng: number };
  radiusKm?: number;
  pageSize?: number;
  cursorUrl?: string | null;
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

export interface CounterpartContact {
  username: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
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
  counterpartContact: CounterpartContact | null;
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

export interface ReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail?: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  date: string | null;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  database: boolean;
}

export interface AuthTokens {
  accessToken: string;
}

export interface ApiError {
  status: number;
  detail: string | Record<string, string[]> | string[];
  code: string;
  errors?: Record<string, string[]>;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export type NotificationCategory =
  | "request_received"
  | "request_accepted"
  | "request_declined"
  | "exchange_scheduled"
  | "exchange_completed"
  | "exchange_reminder"
  | "report_resolved"
  | "partner_application_ready"
  | "partner_application_approved"
  | "partner_application_rejected"
  | "role_assigned"
  | "system";

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  /** The type of object this notification links to, e.g. "exchange", "request". */
  targetType: string | null;
  targetId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ── Partner applications ───────────────────────────────────────────────────────

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

export interface PartnerApplicationInput {
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  organizationName?: string;
  message?: string;
  proposedDropoffName?: string;
  proposedDropoffAddress?: string;
  proposedLatitude?: number;
  proposedLongitude?: number;
}
