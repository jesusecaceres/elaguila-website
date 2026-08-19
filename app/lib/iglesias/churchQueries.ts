import "server-only";

import { getServerSupabaseAnon } from "@/app/lib/supabase/server";
import { PUBLIC_CHURCH_COLUMNS, isPublicChurchEligible } from "./eligibility";
import { isPublicPrayerNetworkParticipant } from "./prayerNetworkRouting";
import { formatIglesiasServiceSummary } from "./copy";
import type { IglesiasNeedKey, IglesiasServiceLanguage, IglesiasUiLang } from "./taxonomy";
import type {
  ChurchMediaRow,
  ChurchMinistryRow,
  ChurchRow,
  ChurchServiceRow,
  ChurchSocials,
  IglesiasBrowseState,
  PublicChurchCard,
  PublicChurchProfile,
} from "./types";
import { iglesiasLocationMatches, iglesiasLocationTerm } from "./location";
import { iglesiasHasActiveFilters } from "./queryParams";

function asSocials(raw: unknown): ChurchSocials {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const pick = (k: string) => (typeof o[k] === "string" && o[k].trim() ? String(o[k]).trim() : undefined);
  return {
    facebook: pick("facebook"),
    instagram: pick("instagram"),
    youtube: pick("youtube"),
    tiktok: pick("tiktok"),
  };
}

function asLanguages(raw: unknown): IglesiasServiceLanguage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is IglesiasServiceLanguage => x === "es" || x === "en" || x === "bilingual");
}

function mapChurchRow(row: Record<string, unknown>): ChurchRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    short_description: (row.short_description as string | null) ?? null,
    mission: (row.mission as string | null) ?? null,
    church_type: (row.church_type as string | null) ?? null,
    denomination: (row.denomination as string | null) ?? null,
    approval_status: row.approval_status === "approved" || row.approval_status === "rejected" ? row.approval_status : "pending",
    is_active: row.is_active === true,
    verification_status: row.verification_status === "verified" ? "verified" : "unverified",
    prayer_network_enrolled: row.prayer_network_enrolled === true,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    zip: (row.zip as string | null) ?? null,
    address_line1: (row.address_line1 as string | null) ?? null,
    address_line2: (row.address_line2 as string | null) ?? null,
    public_location: row.public_location === true,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    languages: asLanguages(row.languages),
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    livestream_url: (row.livestream_url as string | null) ?? null,
    socials: asSocials(row.socials),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    published_at: (row.published_at as string | null) ?? null,
  };
}

function publicAddress(church: ChurchRow): string | null {
  if (!church.public_location) return null;
  const parts = [church.address_line1, church.city, church.state, church.zip].filter((p) => Boolean(p && String(p).trim()));
  return parts.length ? parts.join(", ") : null;
}

function pickCardImage(media: ChurchMediaRow[]): { url: string | null; alt: string; logo: string | null; hero: string | null } {
  const logo = media.find((m) => m.role === "logo") ?? null;
  const hero = media.find((m) => m.role === "hero") ?? null;
  const chosen = hero || logo;
  return {
    url: chosen?.url ?? null,
    alt: chosen?.alt_text ?? "",
    logo: logo?.url ?? null,
    hero: hero?.url ?? null,
  };
}

function nextServiceSummary(services: ChurchServiceRow[], lang: IglesiasUiLang): string | null {
  if (!services.length) return null;
  const sorted = [...services].sort((a, b) => a.sort_order - b.sort_order || a.day_of_week - b.day_of_week || a.starts_at.localeCompare(b.starts_at));
  const s = sorted[0];
  return formatIglesiasServiceSummary(s.day_of_week, s.starts_at, s.language, lang);
}

export async function listPublicChurches(browse: IglesiasBrowseState, uiLang: IglesiasUiLang): Promise<PublicChurchCard[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  const supabase = getServerSupabaseAnon();
  let query = supabase.from("churches").select(PUBLIC_CHURCH_COLUMNS).order("published_at", { ascending: false });

  if (browse.q) {
    const q = browse.q.replace(/[%*,()]/g, " ").trim();
    if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,city.ilike.%${q}%`);
  }
  if (browse.language) {
    query = query.contains("languages", [browse.language]);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    return [];
  }

  const churches = data.map((row) => mapChurchRow(row as Record<string, unknown>)).filter(isPublicChurchEligible);
  const locationTerm = iglesiasLocationTerm(browse.city, browse.zip);
  const located = locationTerm ? churches.filter((c) => iglesiasLocationMatches(c, locationTerm)) : churches;
  if (!located.length) return [];

  const ids = located.map((c) => c.id);
  const [{ data: ministryRows }, { data: serviceRows }, { data: mediaRows }] = await Promise.all([
    supabase.from("church_ministries").select("id, church_id, need_key, display_note, is_active, sort_order").in("church_id", ids),
    supabase.from("church_services").select("id, church_id, day_of_week, starts_at, label, language, mode, is_active, sort_order").in("church_id", ids),
    supabase.from("church_media").select("id, church_id, role, url, alt_text, sort_order, is_active").in("church_id", ids),
  ]);

  const ministriesByChurch = new Map<string, ChurchMinistryRow[]>();
  for (const raw of ministryRows ?? []) {
    const row = raw as ChurchMinistryRow;
    const list = ministriesByChurch.get(row.church_id) ?? [];
    list.push(row);
    ministriesByChurch.set(row.church_id, list);
  }
  const servicesByChurch = new Map<string, ChurchServiceRow[]>();
  for (const raw of serviceRows ?? []) {
    const row = raw as ChurchServiceRow;
    const list = servicesByChurch.get(row.church_id) ?? [];
    list.push(row);
    servicesByChurch.set(row.church_id, list);
  }
  const mediaByChurch = new Map<string, ChurchMediaRow[]>();
  for (const raw of mediaRows ?? []) {
    const row = raw as ChurchMediaRow;
    const list = mediaByChurch.get(row.church_id) ?? [];
    list.push(row);
    mediaByChurch.set(row.church_id, list);
  }

  let cards: PublicChurchCard[] = located.map((church) => {
    const media = mediaByChurch.get(church.id) ?? [];
    const img = pickCardImage(media);
    const ministries = (ministriesByChurch.get(church.id) ?? []).filter((m) => m.is_active);
    return {
      id: church.id,
      slug: church.slug,
      name: church.name,
      denomination: church.denomination,
      churchType: church.church_type,
      city: church.city,
      state: church.state,
      languages: church.languages,
      phone: church.phone,
      publicLocation: church.public_location,
      addressLine1: publicAddress(church),
      logoUrl: img.logo,
      heroUrl: img.hero,
      imageAlt: img.alt,
      needKeys: ministries.sort((a, b) => a.sort_order - b.sort_order).map((m) => m.need_key as IglesiasNeedKey).slice(0, 4),
      nextServiceSummary: nextServiceSummary(servicesByChurch.get(church.id) ?? [], uiLang),
    };
  });

  if (browse.need) {
    cards = cards.filter((c) => c.needKeys.includes(browse.need as IglesiasNeedKey));
  }

  return cards;
}

export async function getPublicChurchBySlug(slug: string, uiLang: IglesiasUiLang): Promise<PublicChurchProfile | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;

  const supabase = getServerSupabaseAnon();
  const { data, error } = await supabase.from("churches").select(PUBLIC_CHURCH_COLUMNS).eq("slug", clean).maybeSingle();
  if (error || !data) return null;

  const church = mapChurchRow(data as Record<string, unknown>);
  if (!isPublicChurchEligible(church)) return null;

  const [{ data: ministryRows }, { data: serviceRows }, { data: mediaRows }, { data: teamRow }] = await Promise.all([
    supabase.from("church_ministries").select("id, church_id, need_key, display_note, is_active, sort_order").eq("church_id", church.id),
    supabase.from("church_services").select("id, church_id, day_of_week, starts_at, label, language, mode, is_active, sort_order").eq("church_id", church.id),
    supabase.from("church_media").select("id, church_id, role, url, alt_text, sort_order, is_active").eq("church_id", church.id),
    supabase
      .from("church_prayer_teams")
      .select("church_id, enabled, status, accepts_private_requests")
      .eq("church_id", church.id)
      .maybeSingle(),
  ]);

  const ministries = ((ministryRows ?? []) as ChurchMinistryRow[]).filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const services = ((serviceRows ?? []) as ChurchServiceRow[]).filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order || a.day_of_week - b.day_of_week);
  const media = ((mediaRows ?? []) as ChurchMediaRow[]).filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const img = pickCardImage(media);

  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination,
    churchType: church.church_type,
    city: church.city,
    state: church.state,
    languages: church.languages,
    phone: church.phone,
    publicLocation: church.public_location,
    addressLine1: publicAddress(church),
    logoUrl: img.logo,
    heroUrl: img.hero,
    imageAlt: img.alt,
    needKeys: ministries.map((m) => m.need_key).slice(0, 4),
    nextServiceSummary: nextServiceSummary(services, uiLang),
    shortDescription: church.short_description,
    mission: church.mission,
    zip: church.zip,
    addressLine2: church.public_location ? church.address_line2 : null,
    website: church.website,
    email: church.email,
    whatsapp: church.whatsapp,
    livestreamUrl: church.livestream_url,
    socials: church.socials,
    services,
    ministries,
    gallery: media.filter((m) => m.role === "gallery"),
    prayerNetworkParticipant: isPublicPrayerNetworkParticipant({
      churchApproved: church.approval_status === "approved",
      churchActive: church.is_active,
      published: Boolean(church.published_at),
      teamEnabled: teamRow?.enabled === true,
      teamStatus: String(teamRow?.status ?? ""),
      acceptsPrivate: teamRow?.accepts_private_requests === true,
    }),
  };
}

export function shouldHideDiscoveryRail(cards: PublicChurchCard[], browse: IglesiasBrowseState): boolean {
  return cards.length === 0 && !iglesiasHasActiveFilters(browse);
}
