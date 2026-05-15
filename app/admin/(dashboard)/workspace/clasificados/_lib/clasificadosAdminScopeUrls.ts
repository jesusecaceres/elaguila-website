/**
 * Build admin workspace URLs that preserve search params while toggling `scope`
 * (`live` = public/live rows only; omit scope for the full category operational queue).
 */
export type AdminScopeParam = "live";

const SCOPE_KEY = "scope";

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

/** Keys commonly used across Clasificados admin queue GET forms — preserve when switching scope. */
export function appendPreservedSearchParams(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  scope: AdminScopeParam | null,
  /** Extra keys to copy from `searchParams` (e.g. slug, leonix_ad_id on vertical pages). */
  extraKeys: string[] = [],
): string {
  const sp = searchParams ?? {};
  const u = new URLSearchParams();
  const keys = new Set<string>([
    "q",
    "status",
    "owner",
    "limit",
    "category",
    "slug",
    "id",
    "leonix_ad_id",
    "owner_user_id",
    "leonix_branch",
    "leonix_operation",
    "leonix_propiedad",
    "lang",
    ...extraKeys,
  ]);
  for (const key of keys) {
    if (key === SCOPE_KEY) continue;
    const raw = firstString(sp[key]);
    if (raw != null && String(raw).trim() !== "") {
      u.set(key, String(raw).trim());
    }
  }
  if (scope) {
    u.set(SCOPE_KEY, scope);
  }
  const qs = u.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function parseAdminScope(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AdminScopeParam | null {
  const raw = firstString(searchParams?.[SCOPE_KEY])?.trim().toLowerCase();
  return raw === "live" ? "live" : null;
}
