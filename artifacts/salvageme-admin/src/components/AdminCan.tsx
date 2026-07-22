import { useAdminStore } from "@/lib/stores/admin-store";

/**
 * Renders children only when the current admin has the given capability.
 * Use `fallback` to render something else (e.g. a disabled button) when they don't.
 */
export function AdminCan({
  capability,
  children,
  fallback = null,
}: {
  capability: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasCapability = useAdminStore((s) => s.hasCapability);
  return hasCapability(capability) ? <>{children}</> : <>{fallback}</>;
}
