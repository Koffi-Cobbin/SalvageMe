// Types mirror the Django REST Framework contract described in the spec.
// Keep these as the single source of truth — components must not redefine
// shapes locally.

export type ListingCondition = "new" | "like_new" | "good" | "fair" | "worn";
export type ListingStatus = "available" | "pending" | "claimed";
export type GradeLevel =
  | "pre_k"
  | "elementary"
  | "middle_school"
  | "high_school"
  | "college"
  | "adult_education";

export interface User {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  memberSince: string; // ISO date
  city: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: ListingCondition;
  gradeLevel: GradeLevel;
  status: ListingStatus;
  images: { id: string; url: string; alt: string }[];
  owner: Pick<User, "id" | "displayName" | "avatarUrl" | "verified">;
  location: { city: string; lat: number; lng: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingsQuery {
  category?: string;
  condition?: ListingCondition;
  gradeLevel?: GradeLevel;
  near?: { lat: number; lng: number };
  radiusKm?: number;
  q?: string;
  cursor?: string | null;
}

export interface Paginated<T> {
  results: T[];
  nextCursor: string | null;
}

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface ExchangeRequest {
  id: string;
  listingId: string;
  listing: Pick<Listing, "id" | "title" | "images" | "status">;
  requester: Pick<User, "id" | "displayName" | "avatarUrl">;
  donor: Pick<User, "id" | "displayName" | "avatarUrl">;
  status: RequestStatus;
  message: string;
  createdAt: string;
}

export type ExchangeStatus = "scheduling" | "scheduled" | "completed" | "cancelled";

export interface DropoffPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
}

export interface Exchange {
  id: string;
  requestId: string;
  listing: Pick<Listing, "id" | "title" | "images">;
  status: ExchangeStatus;
  scheduledFor: string | null; // ISO datetime, null if "flexible"
  isFlexible: boolean;
  dropoffPoint: DropoffPoint | null;
  rating: { score: number; comment: string } | null;
  counterparty: Pick<User, "id" | "displayName" | "avatarUrl">;
}

export interface ImpactStats {
  booksExchanged: number;
  studentsReached: number;
  activeCommunities: number;
  updatedAt: string;
}

export interface ReportPayload {
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  detail?: string;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
