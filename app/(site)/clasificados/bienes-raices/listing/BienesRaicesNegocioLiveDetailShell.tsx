"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { RelatedBrAgentProperties } from "@/app/clasificados/bienes-raices/components/RelatedBrAgentProperties";
import { fetchBrRelatedInventoryListingsForDetail } from "@/app/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser";
import type { BrNegocioListing } from "@/app/clasificados/bienes-raices/resultados/cards/listingTypes";

type Lang = "es" | "en";

export type BienesLiveListingLike = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  businessName?: string | null;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
  owner_id?: string | null;
  leonix_ad_id?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  zip?: string | null;
};

type ParentIdentityRow = {
  id: string;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
};

const PARENT_SELECT =
  "id, business_name, business_meta, contact_phone, contact_email, status, is_published, category, seller_type";

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

function parseBusinessMeta(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function href(raw: unknown): string | null {
  const u = trim(raw);
  return /^https?:\/\/\S+/i.test(u) ? u : null;
}

function asRows(detailPairs: unknown): BienesRaicesPreviewFact[] {
  if (!Array.isArray(detailPairs)) return [];
  const rows: BienesRaicesPreviewFact[] = [];
  for (const item of detailPairs) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const label = trim(obj.label);
    const value = trim(obj.value);
    if (label && value) rows.push({ label, value });
  }
  return rows;
}

function pickFact(rows: BienesRaicesPreviewFact[], tests: RegExp[]): string {
  const hit = rows.find((r) => tests.some((test) => test.test(r.label)));
  return hit?.value ?? "";
}

function quickFactsFromRows(rows: BienesRaicesPreviewFact[]): BienesRaicesNegocioPreviewVm["quickFacts"] {
  const beds = pickFact(rows, [/rec[aá]maras/i, /bed/i]);
  const baths = pickFact(rows, [/baños/i, /bath/i]);
  const sqft = pickFact(rows, [/sq\s*ft/i, /pies/i, /interior/i, /construcci/i]);
  const type = pickFact(rows, [/tipo/i, /property/i]);
  return [
    beds ? { label: "Recámaras", value: beds, icon: "bed" as const } : null,
    baths ? { label: "Baños", value: baths, icon: "bath" as const } : null,
    sqft ? { label: "Tamaño", value: sqft, icon: "ruler" as const } : null,
    type ? { label: "Tipo", value: type, icon: "home" as const } : null,
  ].filter(Boolean) as BienesRaicesNegocioPreviewVm["quickFacts"];
}

function buildLiveVm(
  listing: BienesLiveListingLike,
  identitySource: BienesLiveListingLike | ParentIdentityRow,
  lang: Lang,
): BienesRaicesNegocioPreviewVm {
  const rows = asRows(listing.detailPairs);
  const photos = (listing.images ?? []).map(trim).filter(Boolean);
  const meta = parseBusinessMeta(identitySource.business_meta ?? null);
  const phone = trim(identitySource.contact_phone);
  const email = trim(identitySource.contact_email);
  const businessName = trim(identitySource.business_name) || trim((identitySource as BienesLiveListingLike).businessName);
  const title = listing.title[lang] || listing.title.es || listing.title.en || "";
  const cityZip = [trim(listing.city), trim(listing.zip)].filter(Boolean).join(" ");
  const profileHref = href(meta.negocioWebsiteUrl) ?? href(meta.negocioGoogleBusinessUrl);
  const socialLinks = [
    ["Instagram", href(meta.negocioInstagramUrl)],
    ["Facebook", href(meta.negocioFacebookUrl)],
    ["YouTube", href(meta.negocioYoutubeUrl)],
    ["TikTok", href(meta.negocioTiktokUrl)],
  ]
    .filter((x): x is [string, string] => Boolean(x[1]))
    .map(([label, link]) => ({ label, href: link }));

  return {
    publicationType: "",
    platformLogoUrl: "/logo.png",
    heroTitle: title,
    addressLine: cityZip || trim(listing.city),
    priceDisplay: listing.priceLabel[lang] || listing.priceLabel.es || listing.priceLabel.en || "",
    listingStatusLabel: lang === "en" ? "Active" : "Activo",
    operationSummary: listing.leonix_ad_id ? `${listing.leonix_ad_id}` : "",
    quickFacts: quickFactsFromRows(rows),
    contactRailTitle: lang === "en" ? "Contact" : "Contacto",
    identity: {
      photoUrl: href(meta.negocioAgentPhotoUrl) ?? href(meta.negocioLogoUrl),
      name: businessName || (lang === "en" ? "Real estate professional" : "Profesional inmobiliario"),
      role: lang === "en" ? "Real estate agent / business" : "Agente / negocio de bienes raíces",
      brokerageName: businessName || "",
      brokerageLogoUrl: href(meta.negocioLogoUrl),
      showBrokerageBlock: Boolean(businessName || href(meta.negocioLogoUrl)),
      verifiedLine: "",
      licenseLine: trim(meta.negocioLicenseNumber) ? `Lic. ${trim(meta.negocioLicenseNumber)}` : "",
      bioLine: trim(meta.negocioBio),
      socialLinks,
      profileCtaLabel: lang === "en" ? "View profile" : "Ver perfil",
      profileHref,
      profileCtaEnabled: Boolean(profileHref),
      contactPhone: phone,
      contactEmail: email,
      hasPhoto: Boolean(href(meta.negocioAgentPhotoUrl) ?? href(meta.negocioLogoUrl)),
      hasSocialLinks: socialLinks.length > 0,
    },
    media: {
      heroUrl: photos[0] ?? null,
      secondaryPhotoUrls: photos.slice(1, 3),
      videoThumbUrls: [null, null],
      videoPlaybackUrls: [null, null],
      youtubeIds: [null, null],
      externalVideoLinks: [],
      virtualTourUrl: href(meta.virtualTourUrl) ?? null,
      floorPlanUrls: [],
      sitePlanUrl: null,
      metaLine: photos.length ? `${photos.length} fotos` : "",
      hasPhotos: photos.length > 0,
      hasVideo1: false,
      hasVideo2: false,
      hasVirtualTour: Boolean(href(meta.virtualTourUrl)),
      hasFloorPlans: false,
      hasSitePlan: false,
      photoCount: photos.length,
      heroCaption: null,
      allPhotoUrls: photos,
      coverPhotoIndex: 0,
      photoCaptionsFull: photos.map(() => ""),
    },
    propertyDetailsRows: rows,
    highlightsRows: rows.slice(0, 6),
    description: listing.blurb[lang] || listing.blurb.es || listing.blurb.en || "",
    hasDescription: Boolean(trim(listing.blurb[lang] || listing.blurb.es || listing.blurb.en)),
    hasHighlights: rows.length > 0,
    contact: {
      showSolicitarInfo: Boolean(email),
      showProgramarVisita: Boolean(email),
      showLlamar: Boolean(phone),
      showWhatsapp: Boolean(phone),
      showSms: Boolean(phone),
      solicitarInfoHref: email ? `mailto:${email}` : null,
      programarVisitaHref: email ? `mailto:${email}` : null,
      llamarHref: phone ? `tel:${phone}` : null,
      whatsappHref: null,
      smsHref: phone ? `sms:${phone}` : null,
      instructionsLine: "",
      horarioPreferidoLine: "",
      openHouseSummary: null,
      websiteHref: profileHref,
      socialIconLinks: [],
      usefulLinks: profileHref ? [{ label: lang === "en" ? "Website" : "Sitio web", href: profileHref }] : [],
      preferredContactLine: "",
      googleBusinessUrl: href(meta.negocioGoogleBusinessUrl),
      googleReviewsUrl: href(meta.negocioGoogleReviewsUrl),
      yelpReviewsUrl: href(meta.negocioYelpReviewsUrl),
      secondAgent: null,
      lender: null,
    },
    deepBlocks: [],
    detailClusters: [],
    location: {
      line1: "",
      colonia: "",
      cityStateZip: cityZip,
      fullAddress: cityZip,
      mapLocationLine: cityZip,
      mapsUrl: cityZip ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityZip)}` : null,
      hasMeaningfulAddress: Boolean(cityZip),
    },
    schools: { rows: [], showModule: false },
    community: { rows: [], showModule: false },
    hoaDevelopment: { rows: [], showModule: false, sitePlanCallout: false },
    mostrarDireccionExacta: false,
    footerNote: "",
    hoaCommunityCard: null,
    openHouseCard: null,
  };
}

export function BienesRaicesNegocioLiveDetailShell({
  listing,
  lang,
}: {
  listing: BienesLiveListingLike;
  lang: Lang;
}) {
  const [parentIdentity, setParentIdentity] = useState<ParentIdentityRow | null>(null);
  const [portfolio, setPortfolio] = useState<BrNegocioListing[]>([]);
  const parentId = listing.br_inventory_parent_listing_id?.trim() || null;
  const groupId = listing.br_inventory_group_id?.trim() || listing.id;
  const isChild = listing.inventory_role === "inventory_property" && Boolean(parentId);

  useEffect(() => {
    let cancelled = false;
    if (!parentId) {
      setParentIdentity(null);
      return;
    }
    void (async () => {
      const sb = createSupabaseBrowserClient();
      const result = await listingsQueryWithSelectShrink<Record<string, unknown> | null>(PARENT_SELECT, async (cols) => {
        const res = await sb
          .from("listings")
          .select(cols)
          .eq("id", parentId)
          .eq("category", "bienes-raices")
          .eq("status", "active")
          .eq("is_published", true)
          .maybeSingle();
        return { data: (res.data as Record<string, unknown> | null) ?? null, error: res.error ? { message: res.error.message } : null };
      });
      if (cancelled) return;
      setParentIdentity(result.data ? (result.data as ParentIdentityRow) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [parentId]);

  useEffect(() => {
    let cancelled = false;
    void fetchBrRelatedInventoryListingsForDetail({
      currentListingId: listing.id,
      ownerId: listing.owner_id,
      brInventoryGroupId: groupId,
      brInventoryParentListingId: listing.br_inventory_parent_listing_id,
      currentInventoryRole: listing.inventory_role,
      lang,
      limit: 4,
    }).then((rows) => {
      if (!cancelled) setPortfolio(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, lang, listing.br_inventory_parent_listing_id, listing.id, listing.inventory_role, listing.owner_id]);

  const vm = useMemo(() => buildLiveVm(listing, parentIdentity ?? listing, lang), [listing, parentIdentity, lang]);

  return (
    <div className="bg-[#FDFBF7]">
      <BienesRaicesNegocioPreviewView vm={vm} lang={lang} />
      {!isChild && portfolio.length ? (
        <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-8">
          <RelatedBrAgentProperties listings={portfolio} lang={lang} groupId={groupId} />
        </div>
      ) : null}
    </div>
  );
}
