"use client";

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

export const LOCAL_SERVICIOS_PUBLISH_KEY = "leonix.clasificados.servicios.local_publish.v1";

export type LocalServiciosPublishEntry = {
  slug: string;
  businessName: string;
  city: string;
  publishedAt: string;
  /** Matches `BusinessTypePreset.internalGroup` when known */
  internalGroup?: string;
  /** Serialized `ServiciosBusinessProfile` */
  profileJson: string;
};

type Store = { bySlug: Record<string, LocalServiciosPublishEntry> };

function readStore(): Store {
  if (typeof window === "undefined") return { bySlug: {} };
  try {
    const raw = window.localStorage.getItem(LOCAL_SERVICIOS_PUBLISH_KEY);
    if (!raw) return { bySlug: {} };
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object" || !("bySlug" in v)) return { bySlug: {} };
    const bySlug = (v as Store).bySlug;
    if (!bySlug || typeof bySlug !== "object") return { bySlug: {} };
    return { bySlug };
  } catch {
    return { bySlug: {} };
  }
}

function writeStore(s: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_SERVICIOS_PUBLISH_KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

export function upsertLocalServiciosPublish(
  profile: ServiciosBusinessProfile,
  city: string,
  internalGroup?: string | null,
): LocalServiciosPublishEntry {
  const safe: ServiciosBusinessProfile = {
    ...profile,
    identity: { ...profile.identity },
  };
  delete safe.identity.leonixVerified;

  const slug = safe.identity.slug.trim() || "borrador";
  const entry: LocalServiciosPublishEntry = {
    slug,
    businessName: safe.identity.businessName.trim() || slug,
    city: city.trim(),
    publishedAt: new Date().toISOString(),
    ...(internalGroup ? { internalGroup } : {}),
    profileJson: JSON.stringify(safe),
  };
  const store = readStore();
  store.bySlug[slug] = entry;
  writeStore(store);
  return entry;
}

export function readLocalServiciosPublish(slug: string): LocalServiciosPublishEntry | null {
  const store = readStore();
  return store.bySlug[slug] ?? null;
}

export function listLocalServiciosPublishSummaries(): {
  slug: string;
  businessName: string;
  city: string;
  publishedAt: string;
  internalGroup?: string;
}[] {
  const store = readStore();
  return Object.values(store.bySlug)
    .map((e) => ({
      slug: e.slug,
      businessName: e.businessName,
      city: e.city,
      publishedAt: e.publishedAt,
      ...(e.internalGroup ? { internalGroup: e.internalGroup } : {}),
    }))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
