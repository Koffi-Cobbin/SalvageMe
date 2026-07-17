// Types mirror the real SalvageMe API — see API_REFERENCE.md. IDs are
// numeric on the wire; we keep them as strings in the frontend (Next.js
// dynamic route params are always strings anyway) and convert with Number()
// only where the API needs a numeric value in a request body (e.g. category).

export type UserRole = "donor" | "recipient" | "both";
export type ListingCondition = "new" | "good" | "fair" | "worn";
export type ListingStatus = "available" | "pending" | "claimed" | "removed";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";
export type ExchangeStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type ReportTargetType = "listing" | "user";
export type ReportReason = "spam" | "inappropriate" | "misrepresented" | "no_show" | "other";
export type ReportStatus = "open" | "resolved" | "dismissed";

/** Full shape — only ever returned for the authenticated user themself. */
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

/** PublicUserSerializer shape — no phone, no location, no avatarUrl. This is
 * what you get for `owner`, `requester`, `donor`, `recipient` anywhere else
 * in the API. Don't add fields here that aren't actually returned. */
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
  category?: string; // slug
  condition?: ListingCondition;
  gradeLevel?: string;
  q?: string;
  near?: { lat: number; lng: number };
  radiusKm?: number;
  pageSize?: number;
  cursorUrl?: string | null; // opaque `next`/`previous` URL, followed as-is
}

/** Cursor-paginated list response. `nextCursorUrl`/`previousCursorUrl` are
 * opaque full URLs returned by the API — never construct or parse them. */
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
  date: string | null; // ISO date, or null if unknown
}

export interface HealthStatus {
  status: "ok" | "degraded";
  database: boolean;
}

export interface AuthTokens {
  accessToken: string;
}

/** Every API error response shares this shape (see API_REFERENCE.md). */
export interface ApiError {
  status: number;
  detail: string | Record<string, string[]> | string[];
  code: string;
  errors?: Record<string, string[]>;
}
