/**
 * Resolve saved listing keys from `user_saved_listings` and legacy `saved_listings` (dashboard Guardados)
 * to dashboard rows with correct detail links.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardSavedResolved = {
  listing_id: string;
  title: string;
  city: string | null;
  category: string | null;
  thumb: string | null;
  price: number | string | null;
  href: string;
};

function firstImageThumb(images: unknown): string | null {
  const im = images;
  if (!Array.isArray(im) || im.length === 0) return null;
  const first = im[0];
  if (typeof first === "string" && first.trim()) return first.trim();
  if (first && typeof first === "object") {
    const u = (first as Record<string, unknown>).url ?? (first as Record<string, unknown>).src;
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  return null;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function isLeonixAdId(s: string): boolean {
  return /^[A-Z]+-\d{4}-\d{6}$/.test(s.trim());
}

export async function resolveSavedListingsForDashboard(
  sb: SupabaseClient,
  savedIds: string[],
  lang: "es" | "en"
): Promise<DashboardSavedResolved[]> {
  const q = `lang=${lang}`;
  const order = new Map(savedIds.map((id, i) => [id, i]));
  const results: DashboardSavedResolved[] = [];

  for (const rawId of savedIds) {
    const id = rawId.trim();
    let resolved: DashboardSavedResolved | null = null;

    if (isUuid(id)) {
      const { data: l } = await sb
        .from("listings")
        .select("id, title, city, category, images, price")
        .eq("id", id)
        .maybeSingle();
      if (l) {
        const row = l as {
          id: string;
          title?: string | null;
          city?: string | null;
          category?: string | null;
          images?: unknown;
          price?: number | string | null;
        };
        resolved = {
          listing_id: id,
          title: row.title || id,
          city: row.city ?? null,
          category: row.category ?? null,
          thumb: firstImageThumb(row.images),
          price: row.price ?? null,
          href: `/clasificados/anuncio/${encodeURIComponent(row.id)}?${q}`,
        };
      }
      if (!resolved) {
        const { data: s1 } = await sb
          .from("servicios_public_listings")
          .select("slug, leonix_ad_id, business_name, city, profile_json")
          .eq("id", id)
          .maybeSingle();
        if (s1) {
          const s = s1 as {
            slug: string;
            leonix_ad_id?: string | null;
            business_name?: string;
            city?: string | null;
            profile_json?: { hero?: { logoUrl?: string; coverImageUrl?: string } };
          };
          const hero = s.profile_json?.hero;
          resolved = {
            listing_id: id,
            title: s.business_name || s.slug,
            city: s.city ?? null,
            category: "servicios",
            thumb: hero?.logoUrl || hero?.coverImageUrl || null,
            price: null,
            href: `/clasificados/servicios/${encodeURIComponent(s.slug)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: e1 } = await sb
          .from("empleos_public_listings")
          .select("slug, title, company_name, city, state")
          .eq("id", id)
          .maybeSingle();
        if (e1) {
          const e = e1 as { slug: string; title?: string; company_name?: string; city?: string; state?: string };
          resolved = {
            listing_id: id,
            title: e.title || e.company_name || e.slug,
            city: [e.city, e.state].filter(Boolean).join(", ") || null,
            category: "empleos",
            thumb: null,
            price: null,
            href: `/clasificados/empleos/${encodeURIComponent(e.slug)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: a1 } = await sb
          .from("autos_classifieds_listings")
          .select("id, leonix_ad_id, listing_payload")
          .eq("id", id)
          .eq("status", "active")
          .maybeSingle();
        if (a1) {
          const r = a1 as { id: string; leonix_ad_id?: string | null; listing_payload?: Record<string, unknown> };
          const p = r.listing_payload ?? {};
          const title = String((p as { vehicleTitle?: string }).vehicleTitle ?? "").trim() || "Auto";
          const city = String((p as { city?: string }).city ?? "");
          const state = String((p as { state?: string }).state ?? "");
          const price = (p as { price?: number }).price ?? null;
          const img = (p as { images?: string[] }).images;
          const thumb = Array.isArray(img) && typeof img[0] === "string" ? img[0] : null;
          resolved = {
            listing_id: id,
            title,
            city: [city, state].filter(Boolean).join(", ") || null,
            category: "autos",
            thumb,
            price,
            href: `/clasificados/autos/vehiculo/${encodeURIComponent(r.id)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: r1 } = await sb
          .from("restaurantes_public_listings")
          .select("slug, business_name, city_canonical, hero_image_url")
          .eq("id", id)
          .maybeSingle();
        if (r1) {
          const r = r1 as { slug: string; business_name?: string; city_canonical?: string; hero_image_url?: string | null };
          resolved = {
            listing_id: id,
            title: r.business_name || r.slug,
            city: r.city_canonical ?? null,
            category: "restaurantes",
            thumb: r.hero_image_url ?? null,
            price: null,
            href: `/clasificados/restaurantes/${encodeURIComponent(r.slug)}?${q}`,
          };
        }
      }
    } else if (isLeonixAdId(id)) {
      const { data: l } = await sb
        .from("listings")
        .select("id, title, city, category, images, price")
        .eq("leonix_ad_id", id)
        .maybeSingle();
      if (l) {
        const row = l as {
          id: string;
          title?: string | null;
          city?: string | null;
          category?: string | null;
          images?: unknown;
          price?: number | string | null;
        };
        resolved = {
          listing_id: id,
          title: row.title || id,
          city: row.city ?? null,
          category: row.category ?? null,
          thumb: firstImageThumb(row.images),
          price: row.price ?? null,
          href: `/clasificados/anuncio/${encodeURIComponent(row.id)}?${q}`,
        };
      }
      if (!resolved) {
        const { data: s1 } = await sb
          .from("servicios_public_listings")
          .select("slug, leonix_ad_id, business_name, city, profile_json")
          .eq("leonix_ad_id", id)
          .maybeSingle();
        if (s1) {
          const s = s1 as {
            slug: string;
            business_name?: string;
            city?: string | null;
            profile_json?: { hero?: { logoUrl?: string; coverImageUrl?: string } };
          };
          const hero = s.profile_json?.hero;
          resolved = {
            listing_id: id,
            title: s.business_name || s.slug,
            city: s.city ?? null,
            category: "servicios",
            thumb: hero?.logoUrl || hero?.coverImageUrl || null,
            price: null,
            href: `/clasificados/servicios/${encodeURIComponent(s.slug)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: e1 } = await sb
          .from("empleos_public_listings")
          .select("slug, title, company_name, city, state")
          .eq("leonix_ad_id", id)
          .maybeSingle();
        if (e1) {
          const e = e1 as { slug: string; title?: string; company_name?: string; city?: string; state?: string };
          resolved = {
            listing_id: id,
            title: e.title || e.company_name || e.slug,
            city: [e.city, e.state].filter(Boolean).join(", ") || null,
            category: "empleos",
            thumb: null,
            price: null,
            href: `/clasificados/empleos/${encodeURIComponent(e.slug)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: a1 } = await sb
          .from("autos_classifieds_listings")
          .select("id, listing_payload")
          .eq("leonix_ad_id", id)
          .eq("status", "active")
          .maybeSingle();
        if (a1) {
          const r = a1 as { id: string; listing_payload?: Record<string, unknown> };
          const p = r.listing_payload ?? {};
          const title = String((p as { vehicleTitle?: string }).vehicleTitle ?? "").trim() || "Auto";
          const city = String((p as { city?: string }).city ?? "");
          const state = String((p as { state?: string }).state ?? "");
          const price = (p as { price?: number }).price ?? null;
          const img = (p as { images?: string[] }).images;
          const thumb = Array.isArray(img) && typeof img[0] === "string" ? img[0] : null;
          resolved = {
            listing_id: id,
            title,
            city: [city, state].filter(Boolean).join(", ") || null,
            category: "autos",
            thumb,
            price,
            href: `/clasificados/autos/vehiculo/${encodeURIComponent(r.id)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: r1 } = await sb
          .from("restaurantes_public_listings")
          .select("slug, business_name, city_canonical, hero_image_url")
          .eq("leonix_ad_id", id)
          .maybeSingle();
        if (r1) {
          const r = r1 as { slug: string; business_name?: string; city_canonical?: string; hero_image_url?: string | null };
          resolved = {
            listing_id: id,
            title: r.business_name || r.slug,
            city: r.city_canonical ?? null,
            category: "restaurantes",
            thumb: r.hero_image_url ?? null,
            price: null,
            href: `/clasificados/restaurantes/${encodeURIComponent(r.slug)}?${q}`,
          };
        }
      }
    } else {
      const { data: s1 } = await sb
        .from("servicios_public_listings")
        .select("slug, business_name, city, profile_json")
        .eq("slug", id)
        .maybeSingle();
      if (s1) {
        const s = s1 as {
          slug: string;
          business_name?: string;
          city?: string | null;
          profile_json?: { hero?: { logoUrl?: string; coverImageUrl?: string } };
        };
        const hero = s.profile_json?.hero;
        resolved = {
          listing_id: id,
          title: s.business_name || s.slug,
          city: s.city ?? null,
          category: "servicios",
          thumb: hero?.logoUrl || hero?.coverImageUrl || null,
          price: null,
          href: `/clasificados/servicios/${encodeURIComponent(s.slug)}?${q}`,
        };
      }
      if (!resolved) {
        const { data: e1 } = await sb
          .from("empleos_public_listings")
          .select("slug, title, company_name, city, state")
          .eq("slug", id)
          .maybeSingle();
        if (e1) {
          const e = e1 as { slug: string; title?: string; company_name?: string; city?: string; state?: string };
          resolved = {
            listing_id: id,
            title: e.title || e.company_name || e.slug,
            city: [e.city, e.state].filter(Boolean).join(", ") || null,
            category: "empleos",
            thumb: null,
            price: null,
            href: `/clasificados/empleos/${encodeURIComponent(e.slug)}?${q}`,
          };
        }
      }
      if (!resolved) {
        const { data: r1 } = await sb
          .from("restaurantes_public_listings")
          .select("slug, business_name, city_canonical, hero_image_url")
          .eq("slug", id)
          .maybeSingle();
        if (r1) {
          const r = r1 as { slug: string; business_name?: string; city_canonical?: string; hero_image_url?: string | null };
          resolved = {
            listing_id: id,
            title: r.business_name || r.slug,
            city: r.city_canonical ?? null,
            category: "restaurantes",
            thumb: r.hero_image_url ?? null,
            price: null,
            href: `/clasificados/restaurantes/${encodeURIComponent(r.slug)}?${q}`,
          };
        }
      }
    }

    results.push(
      resolved ?? {
        listing_id: id,
        title: id,
        city: null,
        category: null,
        thumb: null,
        price: null,
        href: `/clasificados/anuncio/${encodeURIComponent(id)}?${q}`,
      },
    );
  }

  results.sort((a, b) => (order.get(a.listing_id) ?? 0) - (order.get(b.listing_id) ?? 0));
  return results;
}
