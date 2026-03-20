import { getAdminSupabase } from "@/app/lib/supabase/server";
import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";

export function isValidPublicAgentId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

function pickDetailPairValue(
  pairs: unknown,
  matcher: (label: string) => boolean
): string {
  if (!Array.isArray(pairs)) return "";
  for (const p of pairs) {
    if (!p || typeof p !== "object") continue;
    const label = String((p as { label?: unknown }).label ?? "");
    const value = String((p as { value?: unknown }).value ?? "").trim();
    if (value && matcher(label)) return value;
  }
  return "";
}

/**
 * Extract every `http(s)` URL from negocioRedes (commas, newlines, bullets, etc.).
 * Dedupes case-insensitively so icons match all links users paste in the publish form.
 */
function parseSocialUrls(raw: string): Array<{ label: string; url: string }> {
  const s = (raw ?? "").trim();
  if (!s) return [];
  const seen = new Set<string>();
  const out: Array<{ label: string; url: string }> = [];

  const pushUrl = (candidate: string) => {
    let u = candidate.replace(/[),.;:]+$/g, "").trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) {
        u = `https://${u}`;
      } else {
        return;
      }
    }
    const key = u.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ label: "Link", url: u });
  };

  const urlLike = /https?:\/\/[^\s<>"']+/gi;
  const matches = s.match(urlLike);
  if (matches) {
    for (const matched of matches) {
      pushUrl(matched);
    }
  }
  // Lines without a scheme (e.g. facebook.com/...) still saved in negocioRedes
  for (const line of s.split(/[\n\r,;]+/)) {
    const t = line.trim();
    if (!t || /^https?:\/\//i.test(t)) continue;
    if (/^[\w.-]+\.[a-z]{2,}/i.test(t)) {
      pushUrl(t);
    }
  }
  return out;
}

/** Merge `business_meta` from several listings (newest rows first): each key uses first non-empty value = prefers newest listing’s data. */
function mergeBusinessMetaPreferNewest(rows: Array<Record<string, unknown>>): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const row of rows) {
    const m = parseBusinessMeta(row.business_meta);
    if (!m) continue;
    for (const [k, v] of Object.entries(m)) {
      const t = (v ?? "").trim();
      if (t && merged[k] === undefined) merged[k] = t;
    }
  }
  return merged;
}

function normalizeWebsiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** First image URL for listing cards (matches mapListingToViewModel image normalization). */
function firstListingImageUrl(raw: unknown): string {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw) as unknown;
    } catch {
      v = [];
    }
  }
  if (!Array.isArray(v)) return "/logo.png";
  const u = v.find((x): x is string => typeof x === "string" && x.trim().length > 0);
  return u?.trim() || "/logo.png";
}

/** Active listings for this owner (shared identity); used on public agent profile only. */
export type PublicAgentListingSummary = {
  id: string;
  title: string;
  city: string | null;
  price: number | string | null;
  isFree: boolean;
  category: string | null;
  imageUrl: string;
  createdAt: string | null;
};

export type PublicAgentPageModel = {
  ownerId: string;
  /** From `profiles` when present */
  profile: {
    displayName: string | null;
    phone: string | null;
    homeCity: string | null;
  } | null;
  /** From latest business listing row when present */
  listingFallback: {
    businessName: string | null;
    city: string | null;
    streetAddress: string | null;
    neighborhood: string | null;
  } | null;
  /** Merged presentation (profile-first where noted, listing meta for business identity) */
  display: {
    agentName: string;
    agentRole: string | null;
    /** From `negocioLicencia` when set */
    agentLicense: string | null;
    businessName: string | null;
    agentPhotoUrl: string | null;
    logoUrl: string | null;
    officePhone: string | null;
    officePhoneTelDigits: string | null;
    agentEmail: string | null;
    website: string | null;
    socialLinks: Array<{ label: string; url: string }>;
    about: string | null;
    hours: string | null;
    /** From `negocioIdiomas` when set */
    languages: string | null;
    serviceAreaLines: string[];
    businessAddressLine: string | null;
    mapQuery: string | null;
  };
  /** All active listings for this owner (`listings.owner_id` = profile id). */
  listings: PublicAgentListingSummary[];
};

export async function loadPublicAgentPageData(ownerId: string): Promise<PublicAgentPageModel | null> {
  const id = ownerId.trim();
  if (!isValidPublicAgentId(id)) return null;

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch {
    return null;
  }

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name, phone, home_city")
    .eq("id", id)
    .maybeSingle();

  if (profileErr) {
    // Continue with listing-only if profile query fails
  }

  const profile =
    profileRow && typeof profileRow === "object"
      ? {
          displayName: (profileRow.display_name as string | null)?.trim() || null,
          phone: (profileRow.phone as string | null)?.trim() || null,
          homeCity: (profileRow.home_city as string | null)?.trim() || null,
        }
      : null;

  const listingSelect =
    "business_name, business_meta, city, detail_pairs, category, seller_type, status, created_at, contact_email, contact_phone";

  let listing: Record<string, unknown> | null = null;
  let meta: Record<string, string> = {};

  /** Prefer Bienes Raíces + business listings for identity: BR negocio saves here; a newer Rentas business row must not wipe this meta. */
  const { data: brBusinessRows } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("owner_id", id)
    .eq("seller_type", "business")
    .eq("category", "bienes-raices")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  if (Array.isArray(brBusinessRows) && brBusinessRows.length > 0) {
    listing = brBusinessRows[0] as Record<string, unknown>;
    meta = mergeBusinessMetaPreferNewest(brBusinessRows as Record<string, unknown>[]);
  } else {
    const { data: bizListing } = await supabase
      .from("listings")
      .select(listingSelect)
      .eq("owner_id", id)
      .eq("seller_type", "business")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bizListing && typeof bizListing === "object") {
      listing = bizListing as Record<string, unknown>;
      meta = parseBusinessMeta(listing.business_meta) ?? {};
    } else {
      const { data: anyListing } = await supabase
        .from("listings")
        .select(listingSelect)
        .eq("owner_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anyListing && typeof anyListing === "object") {
        listing = anyListing as Record<string, unknown>;
        meta = parseBusinessMeta(listing.business_meta) ?? {};
      }
    }
  }

  if (!profile && !listing) return null;

  if (Object.keys(meta).length === 0 && listing) {
    meta = parseBusinessMeta(listing.business_meta) ?? {};
  }
  const city = (listing?.city as string | undefined)?.trim() || null;
  const detailPairs = listing?.detail_pairs;
  const streetAddress = pickDetailPairValue(detailPairs, (lab) =>
    /direcci[oó]n|address/i.test(lab)
  );
  const neighborhood = pickDetailPairValue(detailPairs, (lab) => /vecindad|neighborhood/i.test(lab));

  const businessNameCol = (listing?.business_name as string | undefined)?.trim() || null;
  const businessName = businessNameCol || (meta.negocioNombre ?? "").trim() || null;

  /** Saved application fields first; profile display name last so it never masks `negocioNombre` / business column. */
  const agentName =
    (meta.negocioAgente ?? "").trim() ||
    businessName ||
    profile?.displayName?.trim() ||
    "";

  const agentRole = (meta.negocioCargo ?? "").trim() || null;
  const agentLicense = (meta.negocioLicencia ?? "").trim() || null;
  const languages = (meta.negocioIdiomas ?? "").trim() || null;
  const zonasServicioRaw = (meta.negocioZonasServicio ?? "").trim();
  const agentPhotoUrl = (meta.negocioFotoAgenteUrl ?? "").trim() || null;
  const logoUrl = (meta.negocioLogoUrl ?? "").trim() || null;
  const listingContactPhone = (listing?.contact_phone as string | undefined)?.trim() || null;
  const listingContactEmail = (listing?.contact_email as string | undefined)?.trim() || null;
  const phoneMainFmt = (meta.negocioTelOficina ?? "").trim();
  const phoneExt = (meta.negocioTelExtension ?? "").trim();
  const profilePhone = profile?.phone?.trim() || null;
  /** Saved office line in meta wins; then listing contact_phone (publish flow stores office digits there). */
  const officePhone = phoneMainFmt
    ? phoneExt
      ? `${phoneMainFmt} · Ext. ${phoneExt}`
      : phoneMainFmt
    : listingContactPhone || profilePhone || null;
  const mainDigits = phoneMainFmt ? digitsOnly(phoneMainFmt).slice(0, 10) : "";
  const listingDigits = listingContactPhone ? digitsOnly(listingContactPhone).slice(0, 10) : "";
  const profileDigits = profilePhone ? digitsOnly(profilePhone).slice(0, 10) : "";
  const officePhoneTelDigits =
    mainDigits.length === 10
      ? mainDigits
      : listingDigits.length === 10
        ? listingDigits
        : profileDigits.length === 10
          ? profileDigits
          : null;
  /** Meta email wins; else listing row contact_email (aligned with publish insert). */
  const agentEmail = (meta.negocioEmail ?? "").trim() || listingContactEmail || null;
  const websiteRaw = (meta.negocioSitioWeb ?? "").trim();
  const website = websiteRaw ? normalizeWebsiteUrl(websiteRaw) : null;
  const rawSocials = (meta.negocioRedes ?? "").trim();
  const socialLinks = parseSocialUrls(rawSocials);
  const about = (meta.negocioDescripcion ?? "").trim() || null;
  const hours = (meta.negocioHorario ?? "").trim() || null;

  const serviceAreaLines: string[] = [];
  const serviceSeen = new Set<string>();
  const pushArea = (raw: string | null | undefined) => {
    const t = (raw ?? "").trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (serviceSeen.has(k)) return;
    serviceSeen.add(k);
    serviceAreaLines.push(t);
  };

  // Service areas: explicit publisher-entered list in business_meta wins; infer only if absent.
  if (zonasServicioRaw) {
    const parts = zonasServicioRaw.split(/[,;\n\r]+/);
    for (const part of parts) {
      pushArea(part);
    }
  } else {
    pushArea(profile?.homeCity ?? null);
    pushArea(city);
    pushArea(neighborhood);
  }

  const businessAddressLine =
    streetAddress && city
      ? `${streetAddress}, ${city}`
      : streetAddress || city || null;

  const mapQuery =
    businessAddressLine ||
    (streetAddress ? streetAddress : null) ||
    (city ? city : null) ||
    (profile?.homeCity ?? null);

  const listingFallback = listing
    ? {
        businessName,
        city,
        streetAddress: streetAddress || null,
        neighborhood: neighborhood || null,
      }
    : null;

  let listings: PublicAgentListingSummary[] = [];
  const { data: listingRows, error: listingsErr } = await supabase
    .from("listings")
    .select("id, title, city, price, is_free, category, images, created_at")
    .eq("owner_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (!listingsErr && Array.isArray(listingRows)) {
    listings = listingRows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const lid = typeof r.id === "string" ? r.id : null;
        if (!lid) return null;
        const title = typeof r.title === "string" ? r.title.trim() : "";
        const cat = typeof r.category === "string" ? r.category.trim() : null;
        const cityVal = typeof r.city === "string" ? r.city.trim() : null;
        const isFree = r.is_free === true;
        const createdAt = typeof r.created_at === "string" ? r.created_at : null;
        return {
          id: lid,
          title: title || "",
          city: cityVal,
          price: r.price as number | string | null,
          isFree,
          category: cat,
          imageUrl: firstListingImageUrl(r.images),
          createdAt,
        } satisfies PublicAgentListingSummary;
      })
      .filter((x): x is PublicAgentListingSummary => x != null);
  }

  return {
    ownerId: id,
    profile,
    listingFallback,
    display: {
      agentName,
      agentRole,
      agentLicense,
      businessName,
      agentPhotoUrl,
      logoUrl,
      officePhone,
      officePhoneTelDigits,
      agentEmail,
      website,
      socialLinks,
      about,
      hours,
      languages,
      serviceAreaLines,
      businessAddressLine,
      mapQuery,
    },
    listings,
  };
}
