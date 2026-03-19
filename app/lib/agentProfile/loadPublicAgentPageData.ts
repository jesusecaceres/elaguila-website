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

function parseSocialUrls(raw: string): Array<{ label: string; url: string }> {
  const s = (raw ?? "").trim();
  if (!s) return [];
  const out: Array<{ label: string; url: string }> = [];
  const urlLike = /https?:\/\/[^\s,]+/gi;
  const parts = s.split(/[,;]|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const urlMatch = part.match(urlLike);
    const url = urlMatch ? urlMatch[0] : "";
    if (url && /^https?:\/\//i.test(url)) {
      const labelPart = part.replace(urlLike, "").replace(/^[:\s]+|[:\s]+$/g, "").trim();
      out.push({ label: labelPart || "Link", url });
    } else if (/^https?:\/\//i.test(part)) {
      out.push({ label: "Link", url: part });
    }
  }
  if (out.length === 0 && /https?:\/\//i.test(s)) {
    const m = s.match(urlLike);
    if (m) m.forEach((u) => out.push({ label: "Link", url: u }));
  }
  return out;
}

function normalizeWebsiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

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
    businessName: string | null;
    agentPhotoUrl: string | null;
    logoUrl: string | null;
    officePhone: string | null;
    website: string | null;
    socialLinks: Array<{ label: string; url: string }>;
    about: string | null;
    hours: string | null;
    serviceAreaLines: string[];
    businessAddressLine: string | null;
    mapQuery: string | null;
  };
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
    "business_name, business_meta, city, detail_pairs, category, seller_type, status, created_at";

  let listing: Record<string, unknown> | null = null;
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
    }
  }

  if (!profile && !listing) return null;

  const meta = parseBusinessMeta(listing?.business_meta as string | null | undefined);
  const city = (listing?.city as string | undefined)?.trim() || null;
  const detailPairs = listing?.detail_pairs;
  const streetAddress = pickDetailPairValue(detailPairs, (lab) =>
    /direcci[oó]n|address/i.test(lab)
  );
  const neighborhood = pickDetailPairValue(detailPairs, (lab) => /vecindad|neighborhood/i.test(lab));

  const businessNameCol = (listing?.business_name as string | undefined)?.trim() || null;
  const businessName = businessNameCol || null;

  const agentName =
    (meta?.negocioAgente ?? "").trim() ||
    profile?.displayName?.trim() ||
    businessName ||
    "";

  const agentRole = (meta?.negocioCargo ?? "").trim() || null;
  const agentPhotoUrl = (meta?.negocioFotoAgenteUrl ?? "").trim() || null;
  const logoUrl = (meta?.negocioLogoUrl ?? "").trim() || null;
  const officePhone =
    (meta?.negocioTelOficina ?? "").trim() || profile?.phone?.trim() || null;
  const websiteRaw = (meta?.negocioSitioWeb ?? "").trim();
  const website = websiteRaw ? normalizeWebsiteUrl(websiteRaw) : null;
  const rawSocials = (meta?.negocioRedes ?? "").trim();
  const socialLinks = parseSocialUrls(rawSocials);
  const about = (meta?.negocioDescripcion ?? "").trim() || null;
  const hours = (meta?.negocioHorario ?? "").trim() || null;

  const serviceSet = new Set<string>();
  if (profile?.homeCity) serviceSet.add(profile.homeCity);
  if (city) serviceSet.add(city);
  if (neighborhood) serviceSet.add(neighborhood);
  const serviceAreaLines = [...serviceSet].filter(Boolean);

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

  return {
    ownerId: id,
    profile,
    listingFallback,
    display: {
      agentName,
      agentRole,
      businessName,
      agentPhotoUrl,
      logoUrl,
      officePhone,
      website,
      socialLinks,
      about,
      hours,
      serviceAreaLines,
      businessAddressLine,
      mapQuery,
    },
  };
}
