import type { ApiAdapter } from "./api-client";
import { ApiClientError } from "./api-client";
import type {
  BookRequest,
  Category,
  DropoffPoint,
  Exchange,
  ImpactStats,
  Listing,
  ListingImage,
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
const [catFiction, , catScience, catMath] = categories as [Category, Category, Category, Category];

const owners = {
  u2: { id: "2", username: "kwesi_mensah", role: "donor" as const, isVerified: true, dateJoined: "2026-01-01T00:00:00Z" },
  u3: { id: "3", username: "nana_adjei", role: "donor" as const, isVerified: false, dateJoined: "2026-01-05T00:00:00Z" },
};

let listings: Listing[] = [
  {
    id: "1",
    owner: owners.u2,
    title: "Complete Set — JHS Integrated Science (Grades 7-9)",
    description: "Three-year set, lightly used, all pages intact. A few pencil notes in the margins that erase easily.",
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
    description: "Ten early-reader storybooks, great condition, perfect for a home library.",
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
    id: "3",
    owner: owners.u2,
    title: "Intro to Algebra — Student Edition",
    description: "Single copy, some highlighting in chapters 1-3, otherwise clean.",
    category: catMath,
    gradeLevel: "9th-10th grade",
    condition: "fair",
    status: "claimed",
    images: [],
    distanceKm: null,
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-06-25T09:00:00Z",
  },
];

let requests: BookRequest[] = [];
let exchanges: Exchange[] = [];
const ratings: Rating[] = [];

const dropoffPoints: DropoffPoint[] = [
  { id: "1", name: "Accra Central Library", address: "High St, Accra", latitude: 5.5427, longitude: -0.2062 },
  { id: "2", name: "Kumasi Community Hub", address: "Adum, Kumasi", latitude: 6.6928, longitude: -1.6248 },
];

function notFound(): never {
  throw new ApiClientError(404, "not_found", "Not found");
}

export const mockAdapter: ApiAdapter = {
  async register(input) {
    await delay();
    const user: User = { ...currentUser, username: input.username, role: input.role ?? "both", isVerified: false };
    return { user, tokens: { accessToken: "mock-token" } };
  },
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
  async updateMe(patch) {
    await delay();
    Object.assign(currentUser, patch);
    return currentUser;
  },

  async listCategories() {
    await delay(100);
    return categories;
  },

  async listListings(query) {
    await delay();
    let results = [...listings];
    if (query.category) results = results.filter((l) => l.category.slug === query.category);
    if (query.condition) results = results.filter((l) => l.condition === query.condition);
    if (query.gradeLevel) results = results.filter((l) => l.gradeLevel === query.gradeLevel);
    if (query.q) {
      const q = query.q.toLowerCase();
      results = results.filter((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    return { results, nextCursorUrl: null, previousCursorUrl: null };
  },
  async getListing(id) {
    await delay();
    const found = listings.find((l) => l.id === id);
    if (!found) notFound();
    return found;
  },
  async createListing(input) {
    await delay();
    const category = categories.find((c) => c.id === input.categoryId) ?? catFiction;
    const listing: Listing = {
      id: String(listings.length + 1),
      owner: { id: currentUser.id, username: currentUser.username, role: currentUser.role, isVerified: currentUser.isVerified, dateJoined: currentUser.dateJoined },
      title: input.title,
      description: input.description,
      category,
      gradeLevel: input.gradeLevel ?? null,
      condition: input.condition,
      status: "available",
      images: [],
      distanceKm: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    listings = [listing, ...listings];
    return listing;
  },
  async updateListing(id, patch) {
    await delay();
    listings = listings.map((l) => {
      if (l.id !== id) return l;
      const category = patch.categoryId ? categories.find((c) => c.id === patch.categoryId) ?? l.category : l.category;
      return { ...l, ...patch, category, updatedAt: new Date().toISOString() } as Listing;
    });
    const found = listings.find((l) => l.id === id);
    if (!found) notFound();
    return found;
  },
  async deleteListing(id) {
    await delay();
    listings = listings.map((l) => (l.id === id ? { ...l, status: "removed" } : l));
  },
  async uploadListingPhoto(listingId, file) {
    await delay();
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) notFound();
    const image: ListingImage = {
      id: `img-${Date.now()}`,
      url: URL.createObjectURL(file),
      order: listing.images.length,
    };
    listing.images = [...listing.images, image];
    return image;
  },

  async requestListing(listingId, message) {
    await delay();
    const listing = listings.find((l) => l.id === listingId);
    if (!listing || listing.status !== "available") {
      throw new ApiClientError(400, "listing_unavailable", "This listing isn't available.");
    }
    const existing = requests.find((r) => r.listingId === listingId && r.requester.id === currentUser.id && r.status === "pending");
    if (existing) throw new ApiClientError(400, "duplicate_request", "You already have a pending request.");
    const req: BookRequest = {
      id: String(requests.length + 1),
      listingId,
      listingTitle: listing.title,
      requester: { id: currentUser.id, username: currentUser.username, role: currentUser.role, isVerified: currentUser.isVerified, dateJoined: currentUser.dateJoined },
      status: "pending",
      message: message ?? "",
      createdAt: new Date().toISOString(),
    };
    requests = [...requests, req];
    listing.status = "pending";
    return req;
  },
  async listRequests() {
    await delay();
    return { results: requests, nextCursorUrl: null, previousCursorUrl: null };
  },
  async getRequest(id) {
    await delay();
    const found = requests.find((r) => r.id === id);
    if (!found) notFound();
    return found;
  },
  async acceptRequest(requestId) {
    await delay();
    const req = requests.find((r) => r.id === requestId);
    if (!req) notFound();
    if (req.status !== "pending") throw new ApiClientError(400, "invalid_transition", "Request already handled.");
    req.status = "accepted";
    const listing = listings.find((l) => l.id === req.listingId);
    const exchange: Exchange = {
      id: String(exchanges.length + 1),
      listingId: req.listingId,
      listingTitle: req.listingTitle,
      donor: { id: currentUser.id, username: currentUser.username, role: currentUser.role, isVerified: currentUser.isVerified, dateJoined: currentUser.dateJoined },
      recipient: req.requester,
      dropoffPoint: null,
      status: "scheduled",
      scheduledAt: null,
      completedAt: null,
      counterpartContact: null,
    };
    exchanges = [...exchanges, exchange];
    if (listing) listing.status = "pending";
    return req;
  },
  async declineRequest(requestId) {
    await delay();
    const req = requests.find((r) => r.id === requestId);
    if (!req) notFound();
    if (req.status !== "pending") throw new ApiClientError(400, "invalid_transition", "Request already handled.");
    req.status = "declined";
    const listing = listings.find((l) => l.id === req.listingId);
    if (listing) listing.status = "available";
    return req;
  },

  async listExchanges() {
    await delay();
    return { results: exchanges, nextCursorUrl: null, previousCursorUrl: null };
  },
  async getExchange(id) {
    await delay();
    const found = exchanges.find((e) => e.id === id);
    if (!found) notFound();
    return found;
  },
  async scheduleExchange(exchangeId, input) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId);
    if (!ex) notFound();
    ex.scheduledAt = input.scheduledAt;
    if (input.dropoffPointId) {
      ex.dropoffPoint = dropoffPoints.find((d) => d.id === input.dropoffPointId) ?? null;
    }
    return ex;
  },
  async completeExchange(exchangeId) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId);
    if (!ex) notFound();
    ex.status = "completed";
    ex.completedAt = new Date().toISOString();
    const listing = listings.find((l) => l.id === ex.listingId);
    if (listing) listing.status = "claimed";
    return ex;
  },
  async cancelExchange(exchangeId) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId);
    if (!ex) notFound();
    ex.status = "cancelled";
    const listing = listings.find((l) => l.id === ex.listingId);
    if (listing) listing.status = "available";
    return ex;
  },
  async rateExchange(exchangeId, input) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId);
    if (!ex) notFound();
    const rating: Rating = {
      id: String(ratings.length + 1),
      ratedUserId: ex.donor.id === currentUser.id ? ex.recipient.id : ex.donor.id,
      ratedById: currentUser.id,
      exchangeId,
      score: input.score,
      comment: input.comment ?? "",
      createdAt: new Date().toISOString(),
    };
    ratings.push(rating);
    return rating;
  },

  async listDropoffPoints() {
    await delay();
    return dropoffPoints;
  },
  async submitReport() {
    await delay();
  },
  async getImpactStats(): Promise<ImpactStats> {
    await delay();
    return {
      totalListings: listings.length,
      totalExchangesCompleted: exchanges.filter((e) => e.status === "completed").length,
      totalActiveDonors: 23,
      totalActiveRecipients: 31,
      computedAt: new Date().toISOString(),
    };
  },
  async getHealth() {
    await delay(50);
    return { status: "ok", database: true };
  },
};
