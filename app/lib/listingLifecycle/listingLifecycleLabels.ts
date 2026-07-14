import type { ListingLifecycleResolved } from "./listingLifecycleTypes";

export type ListingLifecycleLang = "es" | "en";

export function formatLifecycleMoney(cents: number, lang: ListingLifecycleLang): string {
  const value = `$${(Math.max(0, cents) / 100).toFixed(2)}`;
  return lang === "es" ? value : value;
}

export function listingLifecycleStateLabel(state: ListingLifecycleResolved["lifecycleState"], lang: ListingLifecycleLang): string {
  const es = {
    pending_payment: "Pago pendiente",
    active: "Activo",
    expiring_soon: "Por vencer",
    expired: "Expirado",
    paused: "Pausado",
    suspended: "Suspendido",
    unknown: "Estado pendiente",
  } as const;
  const en = {
    pending_payment: "Pending payment",
    active: "Active",
    expiring_soon: "Expiring soon",
    expired: "Expired",
    paused: "Paused",
    suspended: "Suspended",
    unknown: "Status pending",
  } as const;
  return (lang === "es" ? es : en)[state];
}

export function listingLifecyclePrimaryLine(lifecycle: ListingLifecycleResolved, lang: ListingLifecycleLang): string {
  if (lifecycle.lifecycleState === "expiring_soon" && lifecycle.daysRemaining != null) {
    return lang === "es" ? `Vence en ${lifecycle.daysRemaining} días` : `Expires in ${lifecycle.daysRemaining} days`;
  }
  if (lifecycle.lifecycleState === "active" && lifecycle.daysRemaining != null) {
    return lang === "es" ? `${lifecycle.daysRemaining} días restantes` : `${lifecycle.daysRemaining} days remaining`;
  }
  return listingLifecycleStateLabel(lifecycle.lifecycleState, lang);
}

export function listingLifecycleExpirationLine(lifecycle: ListingLifecycleResolved, lang: ListingLifecycleLang): string | null {
  if (!lifecycle.expiresAtIso) return null;
  const label = new Date(lifecycle.expiresAtIso).toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return lang === "es" ? `Vence el ${label}` : `Expires ${label}`;
}

export function listingRenewalCtaLabel(lifecycle: ListingLifecycleResolved, lang: ListingLifecycleLang): string {
  const price = lifecycle.renewalPriceCents != null ? formatLifecycleMoney(lifecycle.renewalPriceCents, lang) : "$24.99";
  if (lifecycle.lifecycleState === "expired") {
    return lang === "es" ? `Renovar por ${price} / 30 días` : `Renew for ${price} / 30 days`;
  }
  return lang === "es" ? "Renovar anuncio" : "Renew listing";
}
