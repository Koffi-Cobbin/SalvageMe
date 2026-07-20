# SalvageMe Admin Panel — Design & Implementation Plan

A capability-gated admin interface for content moderation, user management, and platform
operations. Every section is **conditionally rendered** based on the capabilities returned by
`GET /admin/me/` — a user with no admin access sees nothing; a partial-access moderator sees only
the sections their role permits.

---

## 1. Auth & capability check

### First call after login

```
GET /admin/me/
```

Response shape:
```json
{
  "admin_role": { "id": 3, "name": "Content Moderator" },
  "capabilities": ["listings.remove_restore", "reports.resolve", "reports.view", "listings.view"],
  "can_access_admin": true
}
```

- Store this in a Zustand `adminStore` (similar to `session-store`).
- If `can_access_admin` is `false`, hide the admin nav link entirely and redirect `/admin/*` to
  home.
- Use the `capabilities` array to gate individual sections and action buttons — e.g. hide the
  "Roles" nav item unless `roles.manage` is present.

---

## 2. Navigation structure

```
/admin                         → Dashboard (requires dashboard.view)
/admin/users                   → Users (requires users.view)
/admin/listings                → Listings (requires listings.view)
/admin/categories              → Categories (requires categories.manage)
/admin/reports                 → Reports (requires reports.view)
/admin/exchanges               → Exchanges (requires exchanges.view)
/admin/requests                → Requests (requires requests.view)
/admin/ratings                 → Ratings (requires ratings.view)
/admin/dropoff-points          → Drop-off points (requires dropoff.view|dropoff.manage|dropoff.manage_all)
/admin/partner-applications    → Partner applications (requires partner_applications.review)
/admin/audit-log               → Audit log (requires auditlog.view)
/admin/roles                   → Roles & capabilities (requires roles.manage)
```

Each route is wrapped in an `AdminGuard` component that checks the required capability. A user
landing on a route they don't have access to sees a "You don't have permission to view this page"
message, not a 403.

---

## 3. Section specifications

### 3.1 Dashboard

**Capability:** `dashboard.view`  
**API:** `GET /admin/dashboard/`, `GET /admin/stats/history/`, `POST /admin/stats/recompute/`

**Page layout:**
- Row of 5 stat cards:
  - Open reports (links to `/admin/reports?status=open`)
  - Pending requests
  - Unverified users (links to `/admin/users?is_verified=false`)
  - Listings created today
  - Scheduled exchanges
- Trend chart — line chart of impact-stats history from `GET /admin/stats/history/`
  (total_listings, total_exchanges_completed over time).
- "Recompute stats" button (visible only with `stats.recompute`) calling
  `POST /admin/stats/recompute/` — shows a success toast with the new `computed_at` timestamp.

---

### 3.2 Users

**Capability:** `users.view` (base), `users.suspend` (suspend/reactivate), `users.edit` (edit
fields), `roles.manage` (assign admin role)

**API:**
- `GET /admin/users/` — filterable by `?role=`, `?is_verified=`, `?is_active=`
- `GET /admin/users/{id}/`
- `PATCH /admin/users/{id}/` — role, phone, is_verified
- `POST /admin/users/{id}/suspend/`
- `POST /admin/users/{id}/reactivate/`
- `POST /admin/users/{id}/assign-role/`

**Page layout:**
- Filter bar: role dropdown, verified toggle, active toggle, free-text search (client-side).
- Paginated table columns: Username | Email | Role | Verified | Active | Admin role | Joined |
  Actions.
- Row actions (shown only if the viewer holds the relevant capability):
  - **Suspend / Reactivate** — `users.suspend`
  - **Edit** — inline modal: change `role`, `phone`, `is_verified` — `users.edit`
  - **Assign role** — modal with role dropdown (fetched from `GET /admin/roles/`) and a null
    option to revoke — `roles.manage`
- Clicking a row opens a detail drawer with full profile + listings/request counts (counts can
  be derived client-side or from future endpoints).

**Error handling:**
- `400/already_suspended` → toast "User is already suspended."
- `400/already_active` → toast "User is already active."
- `400/last_role_manager` → toast "Can't revoke — this is the last role manager."

---

### 3.3 Listings

**Capability:** `listings.view` (view), `listings.remove_restore` (remove/restore),
`listings.delete_photo` (delete photo)

**API:**
- `GET /admin/listings/` — filterable by `?category=`, `?condition=`, `?status=`
- `GET /admin/listings/{id}/`
- `POST /admin/listings/{id}/remove/`
- `POST /admin/listings/{id}/restore/`
- `DELETE /admin/listings/{id}/photos/{photo_id}/`

**Page layout:**
- Filter bar: category, condition, status (all statuses including `removed`).
- Paginated card grid or table: Title | Owner | Category | Condition | Status | Created |
  Actions.
- Status badge uses the same `ListingStatusBadge` component from the main app, with an extra
  `removed` style.
- Row actions:
  - **Remove** (if `available`, `listings.remove_restore`)
  - **Restore** (if `removed`, `listings.remove_restore`)
  - **View** → listing detail with image gallery + delete-photo buttons per image
    (`listings.delete_photo`).

**Error handling:**
- `400/invalid_transition` on restore → "Can only restore removed listings — this one is
  pending or claimed."
- `502` on photo delete → "Storage service unavailable — safe to retry."

---

### 3.4 Categories

**Capability:** `categories.manage`

**API:**
- `GET /admin/categories/`
- `POST /admin/categories/`
- `PATCH /admin/categories/{id}/`
- `DELETE /admin/categories/{id}/`

**Page layout:**
- Simple list (not paginated) with inline edit / delete per row.
- "Add category" button opens a small form: Name (slug auto-shown as preview, not editable).
- Delete shows a confirmation modal: "Listings in this category will need to be recategorised
  first."

**Error handling:**
- `400/category_in_use` → "Remove or recategorise all listings in this category before
  deleting it."
- `400/duplicate_name` on create → inline field error.

---

### 3.5 Reports

**Capability:** `reports.view` (view), `reports.resolve` (resolve/dismiss)

**API:**
- `GET /admin/reports/` — filterable by `?status=`, `?reason=`, `?target_type=`
- `GET /admin/reports/{id}/`
- `POST /admin/reports/{id}/resolve/`
- `POST /admin/reports/{id}/dismiss/`

**Page layout:**
- Default filter: `?status=open` (open reports queue).
- Table columns: ID | Target | Reason | Detail (truncated) | Filed | Status | Actions.
- Clicking a report row opens a detail panel showing the full `detail` text and a link to the
  target (listing or user) in another admin section.
- Row actions: **Resolve** and **Dismiss** (both require `reports.resolve`).
- On action, the row updates inline (status changes, action buttons disappear).

---

### 3.6 Exchanges

**Capability:** `exchanges.view` (view), `exchanges.force_override` (force-cancel/complete)

**API:**
- `GET /admin/exchanges/` — filterable by `?status=`
- `GET /admin/exchanges/{id}/`
- `POST /admin/exchanges/{id}/force-cancel/` (requires `reason`)
- `POST /admin/exchanges/{id}/force-complete/` (requires `reason`)

**Page layout:**
- Filter bar: status filter.
- Table columns: ID | Listing | Donor | Recipient | Status | Scheduled at | Completed at |
  Actions.
- Row actions (only for `scheduled` exchanges, `exchanges.force_override`):
  - **Force cancel** — opens a modal with a required `reason` textarea before confirming.
  - **Force complete** — same modal pattern.
- Every force-override is recorded in the audit log automatically.

**Error handling:**
- `400/invalid_transition` → "This exchange isn't in a state that can be force-overridden."

---

### 3.7 Requests

**Capability:** `requests.view` (read-only — no admin actions exist)

**API:**
- `GET /admin/requests/` — filterable by `?status=`
- `GET /admin/requests/{id}/`

**Page layout:**
- Read-only table: ID | Listing | Requester | Status | Message (truncated) | Created.
- No action buttons — accept/decline remains exclusively the listing owner's call.
- Clicking a row shows the full message and links to the related listing/user in their admin
  sections.

---

### 3.8 Ratings

**Capability:** `ratings.view` (read-only)

**API:**
- `GET /admin/ratings/` — filterable by `?score=`
- `GET /admin/ratings/{id}/`

**Page layout:**
- Table: ID | Rated user | Rated by | Exchange | Score (star display) | Comment | Created.
- Score filter: star buttons (1–5) that toggle `?score=N` filter.
- Useful for trust & safety review — no write actions.

---

### 3.9 Drop-off points

**Capability:** `dropoff.view` or `dropoff.manage` or `dropoff.manage_all` (scoped vs. global
determines what the list returns)

**API:**
- `GET /admin/dropoff-points/`
- `GET /admin/dropoff-points/{id}/`
- `POST /admin/dropoff-points/` — `dropoff.manage_all` only
- `PATCH /admin/dropoff-points/{id}/`
- `DELETE /admin/dropoff-points/{id}/`
- `POST /admin/dropoff-points/{id}/assign-managers/` — `dropoff.manage_all` only

**Page layout:**
- Card list with map pin icon, name, address, manager count.
- "Add drop-off point" button (visible only with `dropoff.manage_all`) opens a form with
  name, address, lat/lng fields, and coordinator user-id.
- Each card has an **Edit** button (shown if the viewer manages it or holds `manage_all`) and a
  **Delete** button (same gate).
- Detail view shows the full manager list with an **Assign managers** panel
  (`dropoff.manage_all` only): multi-user search → replace the full manager list on save.

**Important:** the manager list replacement is total (not additive) — UI should show the full
current list and let the admin add/remove before saving once.

---

### 3.10 Partner applications

**Capability:** `partner_applications.review`

**API:**
- `GET /admin/partner-applications/` — filterable by `?status=`
- `GET /admin/partner-applications/{id}/`
- `POST /admin/partner-applications/{id}/approve/`
- `POST /admin/partner-applications/{id}/reject/`

**Page layout:**
- Default filter: `?status=pending`.
- Table: ID | Applicant | Email | Organisation | Drop-off proposed | Submitted | Status |
  Actions.
- Row actions for `pending` applications:
  - **Approve** — modal with:
    - Role selector (dropdown fetched from `GET /admin/roles/`) — required.
    - "Also create drop-off point" checkbox (default checked, only shown if the application
      includes proposed drop-off fields).
  - **Reject** — modal with a required free-text `reason` textarea.
- On approval, the modal explains what will happen: "This will grant the selected role to
  {name}'s account{and create a new drop-off point at {address}}."

**Error handling:**
- `400/already_reviewed` → "This application has already been reviewed."
- `400/email_not_verified` → "The applicant hasn't verified their email yet — wait for them to
  complete that step."

---

### 3.11 Audit log

**Capability:** `auditlog.view` (read-only)

**API:**
- `GET /admin/audit-log/` — filterable by `?action=`, `?target_type=`
- `GET /admin/audit-log/{id}/`

**Page layout:**
- Newest-first table: Timestamp | Actor | Action | Target type | Target ID | Metadata
  (collapsed JSON viewer on row click).
- Filter bar: action dropdown (list of known action strings), target type dropdown.
- The `metadata` field varies by action type — display it as a collapsible `<pre>` block rather
  than trying to interpret every shape.

---

### 3.12 Roles & capabilities

**Capability:** `roles.manage`

**API:**
- `GET /admin/roles/`
- `POST /admin/roles/`
- `PATCH /admin/roles/{id}/`
- `DELETE /admin/roles/{id}/`
- `GET /admin/capabilities/` — full vocabulary for the checkbox list

**Page layout:**
- List of roles with name, description, capability count, protected badge.
- "Add role" button opens a form: Name, Description, Capabilities (checkbox grid grouped by
  domain — users, listings, reports, etc., fetched from `GET /admin/capabilities/`).
- Editing a protected role shows the capabilities section as disabled (greyed out) with a
  tooltip explaining why.
- Delete shows a confirmation modal; blocked with an inline error for `role_protected` and
  `role_in_use` codes.

---

## 4. Shared UI patterns

| Pattern | Detail |
|---|---|
| **Capability gate** | `<AdminCan capability="users.suspend">` wrapper — renders children or null |
| **Paginated table** | Reusable component with cursor-based next/prev buttons |
| **Action modal** | Confirm dialog with optional textarea (`reason` field) for destructive actions |
| **Status badge** | Extend the existing `Badge` component with admin-specific statuses |
| **Toast** | Use the existing `ToastHost` / `useToastStore` for success/error feedback |
| **Filter bar** | URL-driven filters using wouter `useSearch()` + `useLocation()` |

---

## 5. State management

- `useAdminStore` (Zustand) — holds `{ capabilities, canAccessAdmin, adminRole }` from
  `GET /admin/me/`, fetched once on admin navigation.
- Individual section data via TanStack Query (same `queryClient` as the main app).
- All mutation calls invalidate their relevant query keys on success.

---

## 6. Implementation order (suggested)

1. `adminStore` + `GET /admin/me/` + `AdminGuard` + nav scaffold
2. Dashboard — easiest read-only page; confirms the auth plumbing works
3. Reports — highest-value moderation screen
4. Listings (remove/restore, delete photo)
5. Users (suspend/reactivate/edit)
6. Exchanges (force-override)
7. Partner applications
8. Drop-off points
9. Categories (CRUD)
10. Requests, Ratings (read-only)
11. Audit log
12. Roles & capabilities (most complex — requires `GET /admin/capabilities/` to build the
    checkbox grid)

---

## 7. Admin API client additions needed

The following methods need to be added to `ApiAdapter` (and both the live adapter and
mock adapter) before building the admin pages:

```typescript
// Admin: me
getAdminMe(): Promise<{ adminRole: { id: number; name: string } | null; capabilities: string[]; canAccessAdmin: boolean }>;

// Admin: roles
listAdminRoles(): Promise<AdminRole[]>;
createAdminRole(input: { name: string; description?: string; capabilities: string[] }): Promise<AdminRole>;
updateAdminRole(id: string, patch: Partial<{ name: string; description: string; capabilities: string[] }>): Promise<AdminRole>;
deleteAdminRole(id: string): Promise<void>;
listCapabilities(): Promise<{ code: string; description: string }[]>;

// Admin: users
adminListUsers(query?: { role?: string; isVerified?: boolean; isActive?: boolean; cursorUrl?: string }): Promise<Paginated<AdminUser>>;
adminGetUser(id: string): Promise<AdminUser>;
adminUpdateUser(id: string, patch: Partial<{ role: string; phone: string; isVerified: boolean }>): Promise<AdminUser>;
adminSuspendUser(id: string): Promise<AdminUser>;
adminReactivateUser(id: string): Promise<AdminUser>;
adminAssignRole(userId: string, adminRoleId: number | null): Promise<AdminUser>;

// Admin: listings
adminListListings(query?: { category?: string; condition?: string; status?: string; cursorUrl?: string }): Promise<Paginated<Listing>>;
adminGetListing(id: string): Promise<Listing>;
adminRemoveListing(id: string): Promise<void>;
adminRestoreListing(id: string): Promise<void>;
adminDeleteListingPhoto(listingId: string, photoId: string): Promise<void>;

// Admin: categories
adminListCategories(): Promise<Category[]>;
adminCreateCategory(input: { name: string; slug?: string }): Promise<Category>;
adminUpdateCategory(id: string, patch: Partial<{ name: string; slug: string }>): Promise<Category>;
adminDeleteCategory(id: string): Promise<void>;

// Admin: reports
adminListReports(query?: { status?: string; reason?: string; targetType?: string; cursorUrl?: string }): Promise<Paginated<AdminReport>>;
adminGetReport(id: string): Promise<AdminReport>;
adminResolveReport(id: string): Promise<AdminReport>;
adminDismissReport(id: string): Promise<AdminReport>;

// Admin: audit log
adminListAuditLog(query?: { action?: string; targetType?: string; cursorUrl?: string }): Promise<Paginated<AuditLogEntry>>;
adminGetAuditLogEntry(id: string): Promise<AuditLogEntry>;

// Admin: exchanges
adminListExchanges(query?: { status?: string; cursorUrl?: string }): Promise<Paginated<Exchange>>;
adminGetExchange(id: string): Promise<Exchange>;
adminForceCancelExchange(id: string, reason: string): Promise<Exchange>;
adminForceCompleteExchange(id: string, reason: string): Promise<Exchange>;

// Admin: requests
adminListRequests(query?: { status?: string; cursorUrl?: string }): Promise<Paginated<BookRequest>>;
adminGetRequest(id: string): Promise<BookRequest>;

// Admin: ratings
adminListRatings(query?: { score?: number; cursorUrl?: string }): Promise<Paginated<Rating>>;
adminGetRating(id: string): Promise<Rating>;

// Admin: drop-off points
adminListDropoffPoints(): Promise<AdminDropoffPoint[]>;
adminGetDropoffPoint(id: string): Promise<AdminDropoffPoint>;
adminCreateDropoffPoint(input: { name: string; address: string; latitude: number; longitude: number; coordinator?: number }): Promise<AdminDropoffPoint>;
adminUpdateDropoffPoint(id: string, patch: Partial<{ name: string; address: string; latitude: number; longitude: number; coordinator: number }>): Promise<AdminDropoffPoint>;
adminDeleteDropoffPoint(id: string): Promise<void>;
adminAssignDropoffManagers(dropoffId: string, userIds: number[]): Promise<AdminDropoffPoint>;

// Admin: dashboard & stats
adminGetDashboard(): Promise<AdminDashboard>;
adminGetStatsHistory(query?: { cursorUrl?: string }): Promise<Paginated<ImpactStats>>;
adminRecomputeStats(): Promise<ImpactStats>;

// Admin: partner applications
adminListPartnerApplications(query?: { status?: string; cursorUrl?: string }): Promise<Paginated<PartnerApplication>>;
adminGetPartnerApplication(id: string): Promise<PartnerApplication>;
adminApprovePartnerApplication(id: string, input: { adminRoleId: number; assignDropoffManager?: boolean }): Promise<PartnerApplication>;
adminRejectPartnerApplication(id: string, reason: string): Promise<PartnerApplication>;
```

These admin-specific types (`AdminUser`, `AdminRole`, `AdminReport`, `AuditLogEntry`,
`AdminDropoffPoint`, `AdminDashboard`) should be added to `src/types/index.ts` before
implementation begins.
