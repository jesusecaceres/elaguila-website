import type { User } from "@supabase/supabase-js";

export type DashboardPasswordMode =
  | "no_email"
  | "email_unverified"
  | "oauth_create"
  | "password_change"
  | "recovery";

const OAUTH_PROVIDERS = new Set(["google", "facebook", "apple"]);

export function getOAuthProviderIds(user: User): string[] {
  const fromIdentities = (user.identities ?? [])
    .map((i) => i.provider)
    .filter((p): p is string => typeof p === "string" && OAUTH_PROVIDERS.has(p));

  const unique = [...new Set(fromIdentities)];
  if (unique.length > 0) return unique;

  const appProviders = user.app_metadata?.providers;
  if (Array.isArray(appProviders)) {
    return appProviders.filter(
      (p): p is string => typeof p === "string" && OAUTH_PROVIDERS.has(p)
    );
  }

  return [];
}

export function userHasEmailPasswordIdentity(user: User): boolean {
  return (user.identities ?? []).some((i) => i.provider === "email");
}

export function resolveDashboardPasswordMode(
  user: User,
  recoveryMode: boolean
): DashboardPasswordMode {
  const email = user.email?.trim() ?? "";
  if (!email) return "no_email";

  if (!user.email_confirmed_at) return "email_unverified";

  if (recoveryMode) return "recovery";

  if (!userHasEmailPasswordIdentity(user) && getOAuthProviderIds(user).length > 0) {
    return "oauth_create";
  }

  return "password_change";
}

export function formatOAuthProviderNames(
  providerIds: string[],
  lang: "es" | "en"
): string {
  const labels: Record<string, { es: string; en: string }> = {
    google: { es: "Google", en: "Google" },
    facebook: { es: "Facebook", en: "Facebook" },
    apple: { es: "Apple", en: "Apple" },
  };

  const names = providerIds
    .map((id) => labels[id]?.[lang] ?? id)
    .filter(Boolean);

  if (names.length === 0) {
    return lang === "es" ? "Google o Facebook" : "Google or Facebook";
  }
  if (names.length === 1) return names[0]!;
  if (names.length === 2) {
    return lang === "es"
      ? `${names[0]} y ${names[1]}`
      : `${names[0]} and ${names[1]}`;
  }
  const last = names[names.length - 1]!;
  const rest = names.slice(0, -1).join(", ");
  return lang === "es" ? `${rest} y ${last}` : `${rest}, and ${last}`;
}
