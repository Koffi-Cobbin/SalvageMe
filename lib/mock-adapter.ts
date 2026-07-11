import type { ApiAdapter } from "./api-client";
import type {
  AuthTokens,
  DropoffPoint,
  Exchange,
  ExchangeRequest,
  ImpactStats,
  Listing,
  User,
} from "@/types";

// Simple in-memory dataset. Swapping to the live Django API requires no
// component changes — only flipping NEXT_PUBLIC_API_MODE to "live" and
// setting NEXT_PUBLIC_API_BASE_URL (see README).

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const currentUser: User = {
  id: "u_1",
  displayName: "Ama Boateng",
  avatarUrl: null,
  verified: true,
  memberSince: "2025-02-10T00:00:00Z",
  city: "Accra",
};

const owners = {
  u_2: { id: "u_2", displayName: "Kwesi Mensah", avatarUrl: null, verified: true },
  u_3: { id: "u_3", displayName: "Nana Adjei", avatarUrl: null, verified: false },
} satisfies Record<string, Pick<User, "id" | "displayName" | "avatarUrl" | "verified">>;

let listings: Listing[] = [
  {
    id: "l_1",
    title: "Complete Set — JHS Integrated Science (Grades 7-9)",
    description:
      "Three-year set, lightly used, all pages intact. A few pencil notes in the margins that erase easily. Great for a school library or a family with multiple kids moving through JHS.",
    category: "Science",
    condition: "good",
    gradeLevel: "middle_school",
    status: "available",
    images: [{ id: "img_1", url: "/mock/books-science.jpg", alt: "Stack of three integrated science textbooks" }],
    owner: owners.u_2,
    location: { city: "Accra", lat: 5.6037, lng: -0.187 },
    createdAt: "2026-06-20T09:00:00Z",
    updatedAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "l_2",
    title: "Beginner Reader Bundle (10 books)",
    description:
      "Ten early-reader storybooks, great condition, perfect for a home library or a community reading corner.",
    category: "Fiction",
    condition: "like_new",
    gradeLevel: "elementary",
    status: "pending",
    images: [{ id: "img_2", url: "/mock/books-reader.jpg", alt: "Ten colorful early reader storybooks" }],
    owner: owners.u_3,
    location: { city: "Kumasi", lat: 6.6885, lng: -1.6244 },
    createdAt: "2026-06-18T09:00:00Z",
    updatedAt: "2026-06-22T09:00:00Z",
  },
  {
    id: "l_3",
    title: "Intro to Algebra — Student Edition",
    description: "Single copy, some highlighting in chapters 1-3, otherwise clean. Cover slightly worn.",
    category: "Mathematics",
    condition: "fair",
    gradeLevel: "high_school",
    status: "claimed",
    images: [{ id: "img_3", url: "/mock/books-algebra.jpg", alt: "Algebra textbook with worn cover" }],
    owner: owners.u_2,
    location: { city: "Accra", lat: 5.56, lng: -0.2057 },
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-06-25T09:00:00Z",
  },
];

const requests: ExchangeRequest[] = [];
const exchanges: Exchange[] = [];

const dropoffPoints: DropoffPoint[] = [
  { id: "d_1", name: "Accra Central Library", address: "High St, Accra", lat: 5.5427, lng: -0.2062, hours: "Mon–Sat 9am–5pm" },
  { id: "d_2", name: "Kumasi Community Hub", address: "Adum, Kumasi", lat: 6.6928, lng: -1.6248, hours: "Mon–Fri 10am–6pm" },
];

export const mockAdapter: ApiAdapter = {
  async login(email) {
    await delay();
    const tokens: AuthTokens = { accessToken: "mock-token", accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString() };
    return { user: { ...currentUser }, tokens };
  },
  async register(input) {
    await delay();
    const user: User = { ...currentUser, displayName: input.displayName, verified: false };
    const tokens: AuthTokens = { accessToken: "mock-token", accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString() };
    return { user, tokens };
  },
  async refresh() {
    await delay(100);
    return { accessToken: "mock-token", accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString() };
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

  async listListings(query) {
    await delay();
    let results = [...listings];
    if (query.category) results = results.filter((l) => l.category === query.category);
    if (query.condition) results = results.filter((l) => l.condition === query.condition);
    if (query.gradeLevel) results = results.filter((l) => l.gradeLevel === query.gradeLevel);
    if (query.q) {
      const q = query.q.toLowerCase();
      results = results.filter((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    return { results, nextCursor: null };
  },
  async getListing(id) {
    await delay();
    const found = listings.find((l) => l.id === id);
    if (!found) throw Object.assign(new Error("Not found"), { status: 404 });
    return found;
  },
  async createListing(input) {
    await delay();
    const listing: Listing = {
      id: `l_${listings.length + 1}`,
      title: input.title ?? "Untitled listing",
      description: input.description ?? "",
      category: input.category ?? "Other",
      condition: input.condition ?? "good",
      gradeLevel: input.gradeLevel ?? "elementary",
      status: "available",
      images: input.images ?? [],
      owner: { id: currentUser.id, displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl, verified: currentUser.verified },
      location: input.location ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    listings = [listing, ...listings];
    return listing;
  },
  async updateListing(id, patch) {
    await delay();
    listings = listings.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l));
    return listings.find((l) => l.id === id)!;
  },
  async deleteListing(id) {
    await delay();
    listings = listings.filter((l) => l.id !== id);
  },

  async requestListing(listingId, message) {
    await delay();
    const listing = listings.find((l) => l.id === listingId)!;
    const req: ExchangeRequest = {
      id: `r_${requests.length + 1}`,
      listingId,
      listing: { id: listing.id, title: listing.title, images: listing.images, status: listing.status },
      requester: { id: currentUser.id, displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl },
      donor: listing.owner,
      status: "pending",
      message,
      createdAt: new Date().toISOString(),
    };
    requests.push(req);
    return req;
  },
  async acceptRequest(requestId) {
    await delay();
    const req = requests.find((r) => r.id === requestId)!;
    req.status = "accepted";
    exchanges.push({
      id: `e_${exchanges.length + 1}`,
      requestId: req.id,
      listing: req.listing,
      status: "scheduling",
      scheduledFor: null,
      isFlexible: true,
      dropoffPoint: null,
      rating: null,
      counterparty: req.requester,
    });
    return req;
  },
  async declineRequest(requestId) {
    await delay();
    const req = requests.find((r) => r.id === requestId)!;
    req.status = "declined";
    return req;
  },
  async listRequests() {
    await delay();
    return {
      incoming: requests.filter((r) => r.donor.id === currentUser.id),
      sent: requests.filter((r) => r.requester.id === currentUser.id),
    };
  },

  async scheduleExchange(exchangeId, input) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId)!;
    ex.scheduledFor = input.scheduledFor;
    ex.isFlexible = input.isFlexible;
    ex.dropoffPoint = dropoffPoints.find((d) => d.id === input.dropoffPointId) ?? null;
    ex.status = "scheduled";
    return ex;
  },
  async completeExchange(exchangeId) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId)!;
    ex.status = "completed";
    return ex;
  },
  async cancelExchange(exchangeId) {
    await delay();
    const ex = exchanges.find((e) => e.id === exchangeId)!;
    ex.status = "cancelled";
    return ex;
  },
  async getExchange(id) {
    await delay();
    const ex = exchanges.find((e) => e.id === id);
    if (!ex) throw Object.assign(new Error("Not found"), { status: 404 });
    return ex;
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
      booksExchanged: 4820,
      studentsReached: 1930,
      activeCommunities: 37,
      updatedAt: new Date().toISOString(),
    };
  },
};
