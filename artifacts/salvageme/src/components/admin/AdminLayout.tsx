import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Flag, Users, BookOpen, RefreshCw, Inbox,
  Star, Tag, MapPin, Building2, History, Shield, ChevronLeft,
  Menu, X,
} from "lucide-react";
import { useAdminStore } from "@/lib/stores/admin-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  capability: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, capability: "dashboard.view", exact: true },
  { href: "/admin/reports", label: "Reports", icon: Flag, capability: "reports.view" },
  { href: "/admin/users", label: "Users", icon: Users, capability: "users.view" },
  { href: "/admin/listings", label: "Listings", icon: BookOpen, capability: "listings.view" },
  { href: "/admin/exchanges", label: "Exchanges", icon: RefreshCw, capability: "exchanges.view" },
  { href: "/admin/requests", label: "Requests", icon: Inbox, capability: "requests.view" },
  { href: "/admin/ratings", label: "Ratings", icon: Star, capability: "ratings.view" },
  { href: "/admin/categories", label: "Categories", icon: Tag, capability: "categories.manage" },
  { href: "/admin/dropoff-points", label: "Drop-off Points", icon: MapPin, capability: "dropoff.view" },
  { href: "/admin/partner-applications", label: "Partners", icon: Building2, capability: "partner_applications.review" },
  { href: "/admin/audit-log", label: "Audit Log", icon: History, capability: "auditlog.view" },
  { href: "/admin/roles", label: "Roles", icon: Shield, capability: "roles.manage" },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
        active
          ? "bg-terracotta-500 text-white"
          : "text-paper-300 hover:bg-ink-700 hover:text-white"
      }`}
    >
      <Icon size={17} className="shrink-0" />
      {item.label}
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const hasCapability = useAdminStore((s) => s.hasCapability);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => hasCapability(item.capability));

  function isActive(item: NavItem) {
    if (item.exact) return location === item.href;
    return location.startsWith(item.href);
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-900">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-ink-700 px-4 py-4">
        <Shield size={20} className="text-terracotta-400 shrink-0" />
        <span className="font-display text-sm font-semibold text-white">Admin Panel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-ink-700 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-paper-300 no-underline hover:bg-ink-700 hover:text-white transition-colors"
        >
          <ChevronLeft size={15} />
          Back to app
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-full w-56"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-paper-300 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-1.5 hover:bg-paper-200"
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display text-sm font-semibold text-ink-900">Admin Panel</span>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
