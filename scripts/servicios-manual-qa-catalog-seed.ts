/**
 * Persistent manual-QA Servicios catalog: one published listing per `BUSINESS_TYPE_PRESETS` lane
 * (`businessTypeId`), via `POST /api/clasificados/servicios/publish` + smoke seller Bearer.
 *
 * Requires `npm run dev` (or deployed origin) reachable at SERVICIOS_MANUAL_QA_BASE_URL /
 * NEXT_PUBLIC_SITE_URL (default `http://127.0.0.1:3000`), plus Supabase anon + service role.
 *
 * Run: npx tsx scripts/servicios-manual-qa-catalog-seed.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { BUSINESS_TYPE_PRESETS, chipLabel } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import type { BusinessTypePreset, ChipDef, ClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { evaluateServiciosPublishReadiness } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { newGalleryId, newTestimonialId, newVideoId } from "@/app/clasificados/publicar/servicios/lib/socialAndUrlHelpers";
import {
  filterServiciosPublicListingRows,
  filterServiciosRowsByKeyword,
  type ServiciosResultsFilterQuery,
} from "@/app/clasificados/servicios/lib/serviciosResultsFilter";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name: string): void {
  const p = path.join(repoRoot, name);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

function hydrateEnv(): void {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
}

const QA_STAMP = "MQA-SVC-v1";

const IMG_COVER =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80&auto=format&fit=crop";
const IMG_LOGO = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80&auto=format&fit=crop";
const GALLERY_IMGS = [
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80&auto=format&fit=crop",
] as const;

type ListingRow = {
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  profile_json: ServiciosBusinessProfile;
  leonix_verified: boolean;
  internal_group: string | null;
  listing_status: string;
  owner_user_id?: string | null;
};

function baseOrigin(): string {
  const u = (
    process.env.SERVICIOS_MANUAL_QA_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://127.0.0.1:3000"
  )
    .trim()
    .replace(/\/+$/, "");
  return u || "http://127.0.0.1:3000";
}

function chipKindHint(chip: ChipDef): "emergency" | "mobile" | "other" {
  const text = `${chip.es} ${chip.en}`.toLowerCase();
  if (/\bemergency\b|emergencia|emergencias|urgencias/i.test(text)) return "emergency";
  if (/mobile service|servicio móvil|\bmóvil\b/i.test(text)) return "mobile";
  return "other";
}

function pickQuickSelections(preset: BusinessTypePreset): {
  selectedQuickFactIds: string[];
  customQuickFactIncluded: boolean;
  customQuickFactLabel: string;
} {
  const facts = preset.quickFacts;
  const emergency = facts.find((c) => chipKindHint(c) === "emergency");
  const mobile = facts.find((c) => chipKindHint(c) === "mobile");
  const selected: string[] = [];
  if (emergency) selected.push(emergency.id);
  if (mobile && (!emergency || mobile.id !== emergency.id)) selected.push(mobile.id);
  for (const c of facts) {
    if (selected.length >= 2) break;
    if (!selected.includes(c.id)) selected.push(c.id);
  }
  return {
    selectedQuickFactIds: selected.slice(0, 2),
    customQuickFactIncluded: true,
    customQuickFactLabel: "Bilingüe certificado ES/EN",
  };
}

function buildAboutBlock(preset: BusinessTypePreset): { aboutText: string; specialtiesLine: string } {
  const trade = preset.labelEs;
  const aboutText = [
    `${QA_STAMP} — Perfil manual QA para Leonix Clasificados Servicios (${trade}).`,
    `Somos un equipo establecido en Monterrey con procesos claros: diagnóstico inicial, propuesta por escrito,`,
    `cronograma acordado y seguimiento hasta cierre. Atendemos hogares y negocios con enfoque en seguridad,`,
    `higiene y comunicación transparente. Coordinamos visitas con ventana de tiempo, protección de áreas de trabajo`,
    `y limpieza final verificada. Aceptamos referencias locales y compartimos portafolio previo bajo solicitud.`,
    `Horarios extendidos y canales de contacto múltiples para que reservar o cotizar sea sencillo.`,
  ].join(" ");
  const specialtiesLine = preset.suggestedServices
    .slice(0, 4)
    .map((c) => c.es)
    .join(" · ");
  return { aboutText, specialtiesLine };
}

function buildApplicationState(preset: BusinessTypePreset): ClasificadosServiciosApplicationState {
  const { aboutText, specialtiesLine } = buildAboutBlock(preset);
  const svcIds = preset.suggestedServices.slice(0, 4).map((c) => c.id);
  const reasonIds = preset.reasonsToChoose.slice(0, 3).map((c) => c.id);
  const qk = pickQuickSelections(preset);

  const g0 = newGalleryId();
  const g1 = newGalleryId();
  const g2 = newGalleryId();
  const g3 = newGalleryId();

  const raw: ClasificadosServiciosApplicationState = {
    applicationStepIndex: 8,
    businessTypeId: preset.id,
    businessName: `${QA_STAMP} · ${preset.id} · ${preset.labelEs} — Distrito León`,
    city: "Monterrey",
    physicalStreet: "Av. Constitución 1550 Piso 3",
    physicalSuite: "Oficina QA",
    physicalAddressCity: "Monterrey",
    physicalRegion: "Nuevo León",
    physicalPostalCode: "64000",
    serviceAreaNotes: "San Pedro Garza García\nSanta Catarina\nCentro de Monterrey\nCumbres",
    phone: "+52 81 4000 2100",
    phoneOffice: "+52 81 4000 2101",
    website: "https://leonix.global/clasificados/servicios",
    whatsapp: "528140002100",
    whatsappBusinessUrl: "",
    email: process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com",
    languageIds: ["lang_es", "lang_en", "lang_otro"],
    languageOtherLines: "Portugués",
    logoUrl: IMG_LOGO,
    coverUrl: IMG_COVER,
    gallery: [
      { id: g0, url: GALLERY_IMGS[0]!, source: "url" },
      { id: g1, url: GALLERY_IMGS[1]!, source: "url" },
      { id: g2, url: GALLERY_IMGS[2]!, source: "url" },
      { id: g3, url: GALLERY_IMGS[3]!, source: "url" },
    ],
    featuredGalleryIds: [g0, g1, g2, g3],
    videos: [
      {
        id: newVideoId(),
        url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
        source: "url",
        isPrimary: true,
      },
    ],
    aboutText,
    specialtiesLine,
    selectedServiceIds: svcIds,
    customServiceLabel: "Servicios complementarios a medida",
    customServiceIncluded: preset.suggestedServices.length > 4,
    selectedReasonIds: reasonIds,
    customReasonLabel: "",
    customReasonIncluded: false,
    selectedQuickFactIds: qk.selectedQuickFactIds,
    customQuickFactLabel: qk.customQuickFactLabel,
    customQuickFactIncluded: qk.customQuickFactIncluded,
    leonixVerifiedInterest: true,
    enableCall: true,
    enableMessage: true,
    enableWhatsapp: true,
    enableWebsite: true,
    enableEmail: true,
    primaryCtaId: preset.primaryCtaOptions[0]?.id ?? "",
    secondaryCtaIds: preset.secondaryCtaOptions.slice(0, 2).map((c) => c.id),
    socialInstagram: "https://www.instagram.com/leonixglobal",
    socialFacebook: "https://www.facebook.com/people/",
    socialYoutube: "https://www.youtube.com/@GoogleDevelopers",
    socialTiktok: "https://www.tiktok.com/@example",
    socialLinkedin: "https://www.linkedin.com/company/example",
    hours: [
      { day: "mon", closed: false, open: "09:00", close: "19:00" },
      { day: "tue", closed: false, open: "09:00", close: "19:00" },
      { day: "wed", closed: false, open: "09:00", close: "19:00" },
      { day: "thu", closed: false, open: "09:00", close: "19:00" },
      { day: "fri", closed: false, open: "09:00", close: "18:00" },
      { day: "sat", closed: false, open: "10:00", close: "14:00" },
      { day: "sun", closed: false, open: "10:00", close: "13:00" },
    ],
    testimonials: [
      {
        id: newTestimonialId(),
        authorName: "Mariana Ibarra",
        quote:
          "Reservamos con poca anticipación y el equipo respondió con agenda clara, llegada puntual y trabajo impecable. Recomendamos el servicio para vecinos del sector.",
      },
      {
        id: newTestimonialId(),
        authorName: "Luis Ortega",
        quote:
          "La cotización fue detallada y sin sorpresas. Nos explicaron opciones y plazos reales; la comunicación fue bilingüe cuando lo necesitamos.",
      },
    ],
    offerTitle: `Promoción ${chipLabel(preset.suggestedServices[0]!, "es")} — consulta prioritaria`,
    offerDetails: "Válido para nuevos clientes en zona metropolitana; sujeto a disponibilidad.",
    offerLink: "https://leonix.global/",
    offerImageUrl: GALLERY_IMGS[0]!,
    offerPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    offerPrimaryAsset: "image",
    offerQrLater: true,
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
  };

  return normalizeClasificadosServiciosApplicationState(raw);
}

function rowLangChip(pj: ServiciosBusinessProfile, chip: string): boolean {
  const ids = pj.opsMeta?.discovery?.languageChipIds;
  if (ids && ids.length) return ids.includes(chip);
  return false;
}

function rowLegalComplete(pj: ServiciosBusinessProfile): boolean {
  return pj.opsMeta?.discovery?.listerAttestationsComplete === true;
}

function rowSvcMulti(pj: ServiciosBusinessProfile): boolean {
  if (pj.opsMeta?.discovery?.hasServiceAreaMultiLine === true) return true;
  return (pj.serviceAreas?.items?.length ?? 0) >= 2;
}

function rowOffer(pj: ServiciosBusinessProfile): boolean {
  if (pj.opsMeta?.discovery?.hasPromoHeadline === true) return true;
  return Boolean(pj.promo?.headline?.trim());
}

function rowPhysDiscovery(pj: ServiciosBusinessProfile): boolean {
  if (pj.opsMeta?.discovery?.hasPhysicalAddress === true) return true;
  const c = pj.contact;
  return Boolean(c?.physicalStreet?.trim() || c?.physicalCity?.trim() || c?.physicalPostalCode?.trim());
}

function wireWeekendOpen(pj: ServiciosBusinessProfile): boolean {
  const rows = pj.contact?.hours?.weeklyRows;
  if (!rows?.length) return false;
  return rows.some((r) => {
    const d = (r.dayLabel ?? "").toLowerCase();
    const isWeekend = d.includes("sáb") || d.includes("dom") || d.includes("sat") || d.includes("sun");
    if (!isWeekend) return false;
    const line = (r.line ?? "").toLowerCase();
    return line.length > 0 && !line.includes("cerrado") && !line.includes("closed");
  });
}

function hasQuickKind(profile: ServiciosBusinessProfile, kind: string): boolean {
  return (profile.quickFacts ?? []).some((f) => f.kind === kind);
}

function buildFilterQuery(profile: ServiciosBusinessProfile, internalGroup: string | null, keyword: string): ServiciosResultsFilterQuery {
  const q: ServiciosResultsFilterQuery = { q: keyword };
  if (internalGroup) q.group = internalGroup;
  if (rowLangChip(profile, "lang_es")) q.langEs = "1";
  if (rowLangChip(profile, "lang_en")) q.langEn = "1";
  if (rowLangChip(profile, "lang_otro")) q.langOt = "1";
  if (rowLegalComplete(profile)) q.legal = "1";
  if (profile.contact?.messageEnabled === true) q.msg = "1";
  if (rowSvcMulti(profile)) q.svcMulti = "1";
  if (rowOffer(profile)) q.offer = "1";
  if (profile.opsMeta?.leonixVerifiedInterest === true) q.vint = "1";
  if (wireWeekendOpen(profile)) q.wknd = "1";
  if (profile.contact?.email?.trim()) q.email = "1";
  if (profile.contact?.websiteUrl?.trim()) q.web = "1";
  if (rowPhysDiscovery(profile)) q.phys = "1";
  if (profile.contact?.socialLinks?.whatsappUrl?.trim()) q.whatsapp = "1";
  if (profile.contact?.phone?.trim()) q.call = "1";
  if (hasQuickKind(profile, "bilingual")) q.bilingual = "1";
  if (hasQuickKind(profile, "emergency")) q.emergency = "1";
  if (hasQuickKind(profile, "mobile_service")) q.mobileSvc = "1";
  return q;
}

function qs(obj: Record<string, string | undefined>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== "") e.set(k, v);
  }
  return e.toString();
}

type PublishJson = {
  ok?: boolean;
  slug?: string;
  listingStatus?: string;
  profile?: ServiciosBusinessProfile;
  error?: string;
};

async function main(): Promise<void> {
  hydrateEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sellerEmail = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
  const sellerPassword = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
  const buyerEmail = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
  const origin = baseOrigin();

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: aErr } = await sb.auth.signInWithPassword({
    email: sellerEmail,
    password: sellerPassword,
  });
  if (aErr || !sess.session) {
    throw new Error(aErr?.message ?? "seller signIn failed");
  }
  const token = sess.session.access_token;
  const ownerId = sess.user.id;

  const admin =
    service &&
    createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

  type Created = {
    lane: string;
    internalGroup: string;
    businessName: string;
    slug: string;
    listingStatus: string;
    publishRoute: string;
    filterQs: string;
    filterMatched: boolean;
    skippedExisting: boolean;
  };

  const created: Created[] = [];
  const publishRoute = "/clasificados/publicar/servicios";

  for (const preset of BUSINESS_TYPE_PRESETS) {
    const state = buildApplicationState(preset);
    const ready = evaluateServiciosPublishReadiness(state, "es");
    if (!ready.ok) {
      throw new Error(`not_ready ${preset.id}: ${JSON.stringify(ready.missing)}`);
    }

    let skippedExisting = false;
    let slug = "";
    let listingStatus = "published";
    let profile: ServiciosBusinessProfile | null = null;

    if (admin) {
      const { data: ex } = await admin
        .from("servicios_public_listings")
        .select(
          "slug, business_name, city, published_at, profile_json, leonix_verified, internal_group, listing_status, owner_user_id",
        )
        .eq("owner_user_id", ownerId)
        .eq("business_name", state.businessName)
        .maybeSingle();
      if (ex?.slug) {
        skippedExisting = true;
        slug = ex.slug;
        listingStatus = String(ex.listing_status ?? "published");
        profile = ex.profile_json as ServiciosBusinessProfile;
      }
    }

    if (!skippedExisting) {
      const res = await fetch(`${origin}/api/clasificados/servicios/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state, lang: "es" }),
      });
      const txt = await res.text();
      let json: PublishJson = {};
      try {
        json = JSON.parse(txt) as PublishJson;
      } catch {
        /* ignore */
      }
      if (!res.ok || !json.ok || !json.slug || !json.profile) {
        throw new Error(`publish failed ${preset.id} ${res.status}: ${txt}`);
      }
      slug = String(json.slug);
      listingStatus = String(json.listingStatus ?? "published");
      profile = json.profile;
    }

    if (!profile) {
      throw new Error(`missing profile for ${preset.id}`);
    }

    const row: ListingRow = {
      slug,
      business_name: state.businessName,
      city: state.city,
      published_at: new Date().toISOString(),
      profile_json: profile,
      leonix_verified: false,
      internal_group: preset.internalGroup,
      listing_status: listingStatus,
      owner_user_id: ownerId,
    };

    const keyword = preset.id;
    const fq = buildFilterQuery(profile, preset.internalGroup, keyword);
    const filtered = filterServiciosPublicListingRows([row], "es", fq);
    const kw = filterServiciosRowsByKeyword(filtered, "es", fq.q);
    const filterMatched = kw.some((r) => r.slug === slug);
    const filterQs = qs(fq as Record<string, string | undefined>);

    created.push({
      lane: preset.id,
      internalGroup: preset.internalGroup,
      businessName: state.businessName,
      slug,
      listingStatus,
      publishRoute,
      filterQs,
      filterMatched,
      skippedExisting,
    });
  }

  const firstSlug = created[0]?.slug;
  let inquiryOk = false;
  let leadSeenForSeller = false;
  if (firstSlug) {
    const inq = await fetch(`${origin}/api/clasificados/servicios/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingSlug: firstSlug,
        senderName: "MQA Buyer",
        senderEmail: buyerEmail,
        message: "Solicitud manual QA: necesitamos una cotización detallada con ventana de visita, gracias.",
        requestKind: "quote",
      }),
    });
    const itxt = await inq.text();
    let ij: { ok?: boolean } = {};
    try {
      ij = JSON.parse(itxt) as { ok?: boolean };
    } catch {
      /* ignore */
    }
    inquiryOk = inq.ok && ij.ok === true;
    await new Promise((r) => setTimeout(r, 600));
    const lr = await fetch(`${origin}/api/clasificados/servicios/my-leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const lj = (await lr.json()) as { ok?: boolean; leads?: { listing_slug: string }[] };
    leadSeenForSeller = Boolean(lj.ok && (lj.leads ?? []).some((l) => l.listing_slug === firstSlug));
  }

  const myList = await fetch(`${origin}/api/clasificados/servicios/my-listings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const myJ = (await myList.json()) as { ok?: boolean; listings?: { slug: string }[] };
  const mySlugs = new Set((myJ.listings ?? []).map((l) => l.slug));
  const allInMy = created.every((c) => mySlugs.has(c.slug));

  console.log(
    JSON.stringify(
      {
        origin,
        lanes: created.length,
        created,
        inquiry: {
          listingSlug: firstSlug,
          httpOk: inquiryOk,
          sellerMyLeadsContainsSlug: leadSeenForSeller,
        },
        myListingsContainsAllSeeded: allInMy,
      },
      null,
      2,
    ),
  );

  if (!created.every((c) => c.filterMatched)) {
    throw new Error("filter proof failed for one or more rows");
  }
  if (!inquiryOk) {
    throw new Error("inquiry HTTP did not return ok");
  }
  if (!leadSeenForSeller) {
    throw new Error("seller my-leads did not include inquiry slug");
  }
  if (!allInMy) {
    throw new Error("my-listings did not include every seeded slug");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
