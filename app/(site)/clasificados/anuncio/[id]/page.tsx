"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import newLogo from "../../../../../public/logo.png";

import { SAMPLE_LISTINGS } from "../../../../data/classifieds/sampleListings";
import { extractProVideoInfos } from "../../components/proVideo";
import ProBadge from "../../components/ProBadge";
import { isProListing } from "../../components/planHelpers";
import { isVerifiedSeller } from "../../components/verifiedSeller";
import ContactActions from "../../components/ContactActions";
import AiInsightsPanel from "../../components/AiInsightsPanel";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { trackEvent } from "@/app/lib/listingAnalytics";
import { addListingView } from "@/app/lib/recentlyViewed";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { submitListingReportAction } from "@/app/admin/actions";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { useRentasAnuncioDerived } from "../../rentas/listing/hooks/useRentasAnuncioDerived";
import { RentasAnuncioHeroMonthlyRent } from "../../rentas/listing/components/RentasAnuncioHeroMonthlyRent";
import { RentasAnuncioMetaFactChips } from "../../rentas/listing/components/RentasAnuncioMetaFactChips";
import {
  RentasAnuncioPostDescriptionSections,
  RentasAnuncioRentalFactsSection,
} from "../../rentas/listing/components/RentasAnuncioDetailColumnSections";
import { RentasSameCompanyListingsSection } from "../../rentas/listing/components/RentasSameCompanyListingsSection";
import { RentasAnuncioMetaGridCards } from "../../rentas/listing/components/RentasAnuncioMetaGridCards";
import { RentasNegocioDesktopBusinessRail } from "../../rentas/listing/components/RentasNegocioDesktopBusinessRail";
import type { RentasAnuncioListingLike } from "../../rentas/listing/types/rentasAnuncioLiveTypes";
import { EnVentaAnuncioLayout } from "../../en-venta/listing/EnVentaAnuncioLayout";
import { EV_LISTING_PARAM } from "../../en-venta/results/contracts/enVentaResultsUrlParams";
import { parseEnVentaResultsReturnUrl } from "../../en-venta/results/utils/enVentaListingLinks";
import { missingListingsColumnName, stripSelectColumn } from "../../lib/listingsSelectShrink";
import { resolveLeonixLiveListingContact } from "../../lib/leonixListingContactResolve";
import { useAutosAnuncioDerived } from "../../autos/listing/hooks/useAutosAnuncioDerived";
import { AutosAnuncioMetaFactCards } from "../../autos/listing/components/AutosAnuncioMetaFactCards";
import { AutosAnuncioLaneContextStrip } from "../../autos/listing/components/AutosAnuncioLaneContextStrip";
import { AutosAnuncioAnalyticsStrip } from "../../autos/listing/components/AutosAnuncioAnalyticsStrip";
import type { AutosAnuncioListingLike } from "../../autos/listing/types/autosAnuncioLiveTypes";
type Lang = "es" | "en";

const ANUNCIO_LISTING_SELECT_BASE =
  "id, owner_id, title, description, city, category, price, is_free, detail_pairs, seller_type, rentas_tier, business_name, business_meta, contact_phone, contact_email, status, is_published, created_at, original_price, current_price, price_last_updated, images, boost_expires";

type CategoryKey =
  | "en-venta"
  | "bienes-raices"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "travel";

type SellerType = "personal" | "business";
type ListingStatus = "active" | "sold";

type Listing = {
  id: string;
  category: CategoryKey;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  hasImage: boolean;
  condition: "any" | "new" | "good" | "fair";
  sellerType: SellerType;
  status?: ListingStatus;
  original_price?: number | null;
  current_price?: number | null;
  price_last_updated?: string | null;
  created_at?: string | null;
  sellerName?: string | null;
  sellerUsername?: string | null;
  sellerJoinYear?: number | null;
  sellerActiveListings?: number | null;
  images?: string[] | null;
  boostUntil?: string | null;
  owner_id?: string | null;
  businessName?: string | null;
  business_name?: string | null;
  rentasTier?: string | null;
  rentas_tier?: string | null;
  servicesTier?: string | null;
  business_meta?: string | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parsePriceLabel(label: string): number | null {
  const m = (label || "").replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function formatPostedAgo(createdAt: string | null | undefined, lang: Lang): string {
  if (!createdAt) return "";
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "";
  const now = Date.now();
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (lang === "es") {
    if (diffMins < 60) return `Publicado hace ${diffMins <= 1 ? "1 minuto" : `${diffMins} minutos`}`;
    if (diffHours < 24) return `Publicado hace ${diffHours === 1 ? "1 hora" : `${diffHours} horas`}`;
    return `Publicado hace ${diffDays === 1 ? "1 día" : `${diffDays} días`}`;
  }
  if (diffMins < 60) return `Posted ${diffMins <= 1 ? "1 minute" : `${diffMins} minutes`} ago`;
  if (diffHours < 24) return `Posted ${diffHours === 1 ? "1 hour" : `${diffHours} hours`} ago`;
  return `Posted ${diffDays === 1 ? "1 day" : `${diffDays} days`} ago`;
}

const CATEGORY_KEYS: readonly CategoryKey[] = [
  "en-venta",
  "bienes-raices",
  "rentas",
  "autos",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "travel",
];

function coerceCategoryKey(raw: unknown): CategoryKey {
  const s = typeof raw === "string" ? raw : "";
  if (s === "bienes-raices") return "bienes-raices";
  return (CATEGORY_KEYS as readonly string[]).includes(s) ? (s as CategoryKey) : "en-venta";
}

function imageUrlsFromJsonb(images: unknown): string[] {
  if (images == null) return [];
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
          if (typeof url === "string" && url.trim()) return url.trim();
        }
        return null;
      })
      .filter((u): u is string => u != null);
  }
  return [];
}

function extractLeonixImageUrlsFromDescription(description: string | null | undefined): string[] {
  if (!description) return [];
  const m = description.match(/\[LEONIX_IMAGES\]([\s\S]*?)\[\/LEONIX_IMAGES\]/);
  if (!m) return [];
  const block = m[1];
  const urls: string[] = [];
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    const um = /^url=(.+)$/i.exec(trimmed);
    if (um?.[1]) urls.push(um[1].trim());
  }
  return urls;
}

function stripLeonixImagesBlock(desc: string): string {
  return desc.replace(/\s*\[LEONIX_IMAGES\][\s\S]*?\[\/LEONIX_IMAGES\]\s*/g, "\n").trim();
}

function mapDbListingRowToListing(row: Record<string, unknown>): Listing {
  const rawDesc = String(row.description ?? "");
  const blurbText = stripLeonixImagesBlock(rawDesc).trim() || rawDesc.trim();
  const fromJson = imageUrlsFromJsonb(row.images);
  const fromMarker = extractLeonixImageUrlsFromDescription(rawDesc);
  const merged = [...new Set([...fromJson, ...fromMarker])];
  const images = merged.length > 0 ? merged : null;

  const isFree = Boolean(row.is_free);
  const priceRaw = row.price;
  const priceNum = typeof priceRaw === "number" ? priceRaw : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, ""));
  const priceLabel = {
    es: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "es", isFree }),
    en: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "en", isFree }),
  };

  const sellerType: SellerType = row.seller_type === "business" ? "business" : "personal";
  const statusRaw = row.status;
  /** Only `active` | `sold` reach here — guarded before map (same public contract as lista/hub for browse; sold kept for direct links). */
  const status: ListingStatus = statusRaw === "sold" ? "sold" : "active";

  const boostRaw = row.boost_expires;
  const boostUntil =
    typeof boostRaw === "string" && boostRaw.trim() ? boostRaw : typeof boostRaw === "number" ? String(boostRaw) : null;

  const detailPairs = row.detail_pairs;
  const base: Listing = {
    id: String(row.id ?? ""),
    category: coerceCategoryKey(row.category),
    title: { es: String(row.title ?? "").trim(), en: String(row.title ?? "").trim() },
    priceLabel,
    city: String(row.city ?? "").trim(),
    postedAgo: { es: "", en: "" },
    blurb: { es: blurbText, en: blurbText },
    hasImage: merged.length > 0,
    condition: "good",
    sellerType,
    status,
    original_price: row.original_price != null ? Number(row.original_price) : null,
    current_price: row.current_price != null ? Number(row.current_price) : null,
    price_last_updated: typeof row.price_last_updated === "string" ? row.price_last_updated : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    images,
    boostUntil,
    owner_id: row.owner_id != null ? String(row.owner_id) : null,
    businessName: row.business_name != null ? String(row.business_name) : null,
    business_name: row.business_name != null ? String(row.business_name) : null,
    rentasTier: row.rentas_tier != null ? String(row.rentas_tier) : null,
    rentas_tier: row.rentas_tier != null ? String(row.rentas_tier) : null,
    business_meta: typeof row.business_meta === "string" ? row.business_meta : null,
  };

  const out = base as Listing & { detailPairs?: unknown; contact_phone?: unknown; contact_email?: unknown; seller_type?: string };
  if (Array.isArray(detailPairs)) {
    out.detailPairs = detailPairs;
  }
  out.contact_phone = row.contact_phone ?? null;
  out.contact_email = row.contact_email ?? null;
  out.seller_type = sellerType;
  return out;
}

export default function AnuncioDetallePage() {
  const params = useParams<{ id: string }>();

  // ✅ Null-safe guard: some setups type useSearchParams() as possibly null
  const sp = useSearchParams();
  const searchParams = sp ?? new URLSearchParams();

  const lang = ((searchParams.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const evReturnRaw = searchParams.get(EV_LISTING_PARAM.evReturn);
  const enVentaBackHref = useMemo(() => parseEnVentaResultsReturnUrl(evReturnRaw, lang), [evReturnRaw, lang]);

  const t = useMemo(() => {
    const ui = {
      es: {
        back: "Volver a Clasificados",
        title: "Detalle del anuncio",
        notFoundTitle: "Anuncio no encontrado",
        notFoundBody:
          "Este anuncio no existe o fue eliminado. Regresa a la página principal para explorar otros anuncios.",
        viewAll: "Ver anuncios",
        post: "Publicar anuncio",
        signIn: "Iniciar sesión",

        statusSold: "VENDIDO",
        statusActive: "ACTIVO",

        sellerBusiness: "Negocio",
        sellerPersonal: "Personal",

        metaCity: "Ciudad",
        metaPosted: "Publicado",
        metaCondition: "Condición",
        metaCategory: "Categoría",

        actionsTitle: "Acciones",
        markSold: "Marcar como vendido",
        edit: "Editar anuncio",
        delete: "Eliminar anuncio",
        locked: "Requiere iniciar sesión",

        guardTitle: "Seguridad",
        guardBody:
          "Los anuncios se publican al instante, pero el sistema puede ocultarlos automáticamente si detecta spam o contenido inapropiado.",
        report: "Reportar anuncio",
        reportReasonPlaceholder: "Motivo del reporte (obligatorio)",
        reportSubmit: "Enviar reporte",
        reportCancel: "Cancelar",
        reportThankYou: "Gracias. Hemos recibido tu reporte.",

        contactTitle: "Contacto",
        contactBody:
          "En v2, las acciones de contacto avanzadas se activan para LEONIX Pro. Por ahora, esta pantalla es de lectura y validación.",
      },
      en: {
        back: "Back to Classifieds",
        title: "Listing details",
        notFoundTitle: "Listing not found",
        notFoundBody:
          "This listing doesn’t exist or was removed. Go back to explore other listings.",
        viewAll: "View listings",
        post: "Post listing",
        signIn: "Sign in",

        statusSold: "SOLD",
        statusActive: "ACTIVE",

        sellerBusiness: "Business",
        sellerPersonal: "Personal",

        metaCity: "City",
        metaPosted: "Posted",
        metaCondition: "Condition",
        metaCategory: "Category",

        actionsTitle: "Actions",
        markSold: "Mark as sold",
        edit: "Edit listing",
        delete: "Delete listing",
        locked: "Sign in required",

        guardTitle: "Safety",
        guardBody:
          "Listings appear immediately, but the system may auto-hide them if it detects spam or inappropriate content.",
        report: "Report listing",
        reportReasonPlaceholder: "Reason for report (required)",
        reportSubmit: "Submit report",
        reportCancel: "Cancel",
        reportThankYou: "Thank you. We have received your report.",

        contactTitle: "Contact",
        contactBody:
          "In v2, advanced contact/lead tools are enabled for LEONIX Pro. For now this screen is read-only for testing.",
      },
    } as const;
    return ui[lang];
  }, [lang]);

  const categoryLabel = useMemo(() => {
    const map: Record<CategoryKey, { es: string; en: string }> = {
      "en-venta": { es: "En Venta", en: "For Sale" },
      "bienes-raices": { es: "Bienes Raíces", en: "Real estate" },
      rentas: { es: "Rentas", en: "Rentals" },
      autos: { es: "Autos", en: "Autos" },
      servicios: { es: "Servicios", en: "Services" },
      empleos: { es: "Empleos", en: "Jobs" },
      clases: { es: "Clases", en: "Classes" },
      comunidad: { es: "Comunidad", en: "Community" },
      travel: { es: "Viajes", en: "Travel" },
    };
    return map;
  }, []);

  const sampleListing: Listing | undefined = useMemo(() => {
    const id = params?.id;
    if (!id) return undefined;
    return (SAMPLE_LISTINGS as unknown as Listing[]).find((x) => x.id === id);
  }, [params?.id]);

  const [fetchedListing, setFetchedListing] = useState<Listing | undefined>(undefined);
  const [remoteState, setRemoteState] = useState<"uninitialized" | "loading" | "ready" | "error">("uninitialized");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [brPublishBanner, setBrPublishBanner] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    setRemoteError(null);
    if (!id) {
      setFetchedListing(undefined);
      setRemoteState("ready");
      return;
    }
    const sample = (SAMPLE_LISTINGS as unknown as Listing[]).find((x) => x.id === id);
    if (sample) {
      setFetchedListing(undefined);
      setRemoteState("ready");
      return;
    }
    let cancelled = false;
    setRemoteState("loading");
    setFetchedListing(undefined);
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        let cols = ANUNCIO_LISTING_SELECT_BASE;
        let data: Record<string, unknown> | null = null;
        let error: { message: string } | null = null;
        for (let attempt = 0; attempt < 32; attempt++) {
          const res = await supabase.from("listings").select(cols).eq("id", id).maybeSingle();
          data = (res.data as Record<string, unknown> | null) ?? null;
          error = res.error ? { message: res.error.message } : null;
          if (!error) break;
          const bad = missingListingsColumnName(res.error);
          if (!bad) break;
          const next = stripSelectColumn(cols, bad);
          if (next === cols) break;
          cols = next;
        }
        if (cancelled) return;
        if (error) {
          setRemoteError(error.message);
          setRemoteState("error");
          return;
        }
        if (!data) {
          setFetchedListing(undefined);
          setRemoteState("ready");
          return;
        }
        const row = data as Record<string, unknown>;
        // Public detail: same visibility rules as lista/hub (published + active in browse); direct URL still allows sold.
        if (row.is_published === false) {
          setFetchedListing(undefined);
          setRemoteState("ready");
          return;
        }
        const st = row.status;
        if (st === "removed") {
          setFetchedListing(undefined);
          setRemoteState("ready");
          return;
        }
        if (st !== "active" && st !== "sold") {
          setFetchedListing(undefined);
          setRemoteState("ready");
          return;
        }
        setFetchedListing(mapDbListingRowToListing(row));
        setRemoteState("ready");
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
        setRemoteError(msg);
        setRemoteState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  const listing: Listing | undefined = sampleListing ?? fetchedListing;

  useEffect(() => {
    setBrPublishBanner(null);
    if (!listing?.id || sampleListing) return;
    try {
      const raw = sessionStorage.getItem("lx_br_publish_warnings");
      if (!raw) return;
      const w = JSON.parse(raw) as unknown;
      sessionStorage.removeItem("lx_br_publish_warnings");
      if (Array.isArray(w) && w.every((x) => typeof x === "string")) {
        setBrPublishBanner((w as string[]).join(" "));
      }
    } catch {
      try {
        sessionStorage.removeItem("lx_br_publish_warnings");
      } catch {
        /* ignore */
      }
    }
  }, [listing?.id, sampleListing]);

  const leonixLiveContact = useMemo(
    () => (listing ? resolveLeonixLiveListingContact(listing as Listing & { business_meta?: string | null }) : null),
    [listing]
  );

  /** True when the visible listing was loaded from Supabase, not from SAMPLE_LISTINGS. */
  const isLiveDbListing = Boolean(listing && !sampleListing);

  const {
    rentasMeta,
    rentasRentalFacts,
    rentasAmenities,
    rentasNegocioDisplay,
    rentasSameCompanyListings,
    rentasPlanTier,
  } = useRentasAnuncioDerived({
    listing: listing as unknown as import("../../rentas/listing/types/rentasAnuncioLiveTypes").RentasAnuncioListingLike | undefined,
    lang,
    isLiveDbListing,
    sampleListings: SAMPLE_LISTINGS as unknown as import("../../rentas/listing/types/rentasAnuncioLiveTypes").RentasSameCompanySampleItem[],
  });

  const { autosLiveFacts } = useAutosAnuncioDerived({
    listing: listing as AutosAnuncioListingLike | undefined,
    lang,
  });

  const idParam = params?.id;
  const showLoading = Boolean(
    idParam && !sampleListing && (remoteState === "uninitialized" || remoteState === "loading")
  );
  const showFetchError = Boolean(idParam && !sampleListing && remoteState === "error");

  const jobMeta = useMemo(() => {
    if (!listing || listing.category !== "empleos") return null;

    const t = (listing.title?.[lang] ?? "").toLowerCase();
    const d = (listing.blurb?.[lang] ?? "").toLowerCase();
    const p = (listing.priceLabel?.[lang] ?? "").toLowerCase();
    const blob = `${t} ${d} ${p}`;

    const has = (re: RegExp) => re.test(blob);

    const chips: string[] = [];

    // Job type / jornada (derived only from listing text)
    if (has(/\bfull[-\s]?time\b|tiempo\s+completo/)) chips.push(lang === "es" ? "Tiempo completo" : "Full-time");
    else if (has(/\bpart[-\s]?time\b|tiempo\s+parcial/)) chips.push(lang === "es" ? "Tiempo parcial" : "Part-time");

    if (has(/\bcontract\b|contrato/)) chips.push(lang === "es" ? "Contrato" : "Contract");
    if (has(/\btemporary\b|temporal/)) chips.push(lang === "es" ? "Temporal" : "Temporary");
    if (has(/\bremote\b|remoto/)) chips.push(lang === "es" ? "Remoto" : "Remote");

    // Pay cue (only if explicit)
    let pay: string | null = null;
    const money = (listing.priceLabel?.[lang] ?? "").trim();
    if (money) {
      pay = money;
    } else if (has(/\$\s*\d/)) {
      pay = lang === "es" ? "Pago (ver anuncio)" : "Pay (see listing)";
    }

    // Qualifications (only from explicit words)
    const quals: string[] = [];
    if (has(/experienc|experiencia/)) quals.push(lang === "es" ? "Experiencia" : "Experience");
    if (has(/license|licencia/)) quals.push(lang === "es" ? "Licencia" : "License");
    if (has(/bilingual|biling\w+/)) quals.push(lang === "es" ? "Bilingüe" : "Bilingual");
    if (has(/benefits|beneficios/)) quals.push(lang === "es" ? "Beneficios" : "Benefits");

    return { chips, pay, quals };
  }, [listing, lang]);


  const relatedListings = useMemo(() => {
    if (!listing) return [];
    if (isLiveDbListing) return [];
    const price = parsePriceLabel(listing.priceLabel?.en ?? listing.priceLabel?.es ?? "");
    const low = price != null ? price * 0.5 : 0;
    const high = price != null ? price * 2 : Infinity;
    const cityNorm = (listing.city ?? "").trim().toLowerCase();
    const list = (SAMPLE_LISTINGS as unknown as Listing[]).filter((l) => {
      if (l.category !== listing.category || l.id === listing.id) return false;
      const p = parsePriceLabel(l.priceLabel?.en ?? l.priceLabel?.es ?? "");
      if (p != null && (p < low || p > high)) return false;
      return true;
    });
    const sameCity = (l: Listing) => (l.city ?? "").trim().toLowerCase() === cityNorm;
    const sorted = [...list].sort((a, b) => (sameCity(b) ? 1 : 0) - (sameCity(a) ? 1 : 0));
    return sorted.slice(0, 6);
  }, [isLiveDbListing, listing?.id, listing?.category, listing?.priceLabel, listing?.city]);

  const [saved, setSaved] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [viewsToday, setViewsToday] = useState<number | null>(null);
  const [savedSyncDone, setSavedSyncDone] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [sellerStats, setSellerStats] = useState<{ avgRating: number | null; totalRatings: number } | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender_id: string; message: string; created_at: string }>>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatCurrentUserId, setChatCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!listing) return;
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = user?.id ?? null;
      void trackEvent(listing.id, "listing_view", uid);
      void trackEvent(listing.id, "listing_open", uid);
    })();
    addListingView(listing.id);
    return () => {
      cancelled = true;
    };
  }, [listing?.id]);

  // Sync saved state from Supabase when user is logged in
  useEffect(() => {
    if (!listing?.id || savedSyncDone) return;
    let mounted = true;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) {
        const { data } = await supabase
          .from("user_saved_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", listing.id)
          .maybeSingle();
        if (mounted) setSaved(!!data);
      }
      setSavedSyncDone(true);
    })();
    return () => { mounted = false; };
  }, [listing?.id, savedSyncDone]);

  useEffect(() => {
    if (!listing?.id) return;
    fetch(`/api/clasificados/listings/${encodeURIComponent(listing.id)}/views`)
      .then((res) => res.json())
      .then((data: { count?: number; todayCount?: number }) => {
        setViewCount(typeof data.count === "number" ? data.count : 0);
        setViewsToday(typeof data.todayCount === "number" ? data.todayCount : 0);
      })
      .catch(() => {
        setViewCount(0);
        setViewsToday(0);
      });
  }, [listing?.id]);

  useEffect(() => {
    const ownerId = (listing as any)?.owner_id;
    if (!ownerId) {
      setSellerStats(null);
      return;
    }
    fetch(`/api/seller-stats?seller_id=${encodeURIComponent(ownerId)}`)
      .then((res) => res.json())
      .then((data: { avgRating?: number | null; totalRatings?: number }) => {
        setSellerStats({
          avgRating: typeof data.avgRating === "number" ? data.avgRating : null,
          totalRatings: typeof data.totalRatings === "number" ? data.totalRatings : 0,
        });
      })
      .catch(() => setSellerStats(null));
  }, [(listing as any)?.owner_id]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(lang === "es" ? "Copiado." : "Copied.");
    } catch {
      // Fallback: prompt
      window.prompt(lang === "es" ? "Copia este enlace:" : "Copy this link:", text);
    }
  };

  const buildShareMessage = () => {
    if (!listing) return "";
    const title = listing.title[lang];
    const price = listing.priceLabel[lang];
    const city = listing.city;
    const url = typeof window !== "undefined" ? window.location.href : "";
    return `${title} — ${price} (${city})\n${url}`;
  };

  const handleShare = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id ?? null;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing ? listing.title[lang] : (lang === "es" ? "Anuncio" : "Listing");
    const text = listing ? listing.blurb[lang] : "";
    const nav: unknown = typeof navigator !== "undefined" ? navigator : null;
    const shareFn = nav && typeof (nav as { share?: unknown }).share === "function" ? (nav as { share: (opts: unknown) => Promise<void> }).share : null;

    try {
      if (shareFn) {
        await shareFn({ title, text, url });
        if (listing) void trackEvent(listing.id, "listing_share", uid);
        return;
      }
    } catch {
      // ignore and fall back
    }

    await copyText(url || buildShareMessage());
    if (listing) void trackEvent(listing.id, "listing_share", uid);
  };

  const handleGuardarAnuncio = async () => {
    if (!listing) return;
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const here = `${window.location.pathname}${window.location.search || ""}`;
      window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      return;
    }
    if (saved) {
      await supabase.from("user_saved_listings").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setSaved(false);
    } else {
      await supabase.from("user_saved_listings").upsert({ user_id: user.id, listing_id: listing.id }, { onConflict: "user_id,listing_id" });
      setSaved(true);
      void trackEvent(listing.id, "listing_save", user.id);
    }
  };

  const handleCompartirAnuncio = handleShare;

  const handleContactarVendedor = () => {
    const el = document.getElementById("contact-actions");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReportarAnuncio = () => {
    setReportReason("");
    setReportDone(false);
    setShowReportModal(true);
  };

  useEffect(() => {
    if (!showChatModal || !listing?.id) return;
    const ownerId = (listing as any)?.owner_id;
    let mounted = true;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setChatCurrentUserId(user?.id ?? null);
      if (!user || !ownerId) {
        setChatMessages([]);
        return;
      }
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, message, created_at")
        .eq("listing_id", listing.id)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });
      if (mounted) setChatMessages((data ?? []) as Array<{ id: string; sender_id: string; message: string; created_at: string }>);
    })();
    return () => { mounted = false; };
  }, [showChatModal, listing?.id, (listing as any)?.owner_id]);

  const handleSendMessage = async () => {
    const ownerId = (listing as any)?.owner_id;
    if (!listing?.id || !ownerId || !chatDraft.trim()) return;
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert(lang === "es" ? "Inicia sesión para enviar mensajes." : "Sign in to send messages.");
      return;
    }
    setChatSending(true);
    try {
      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({ sender_id: user.id, receiver_id: ownerId, listing_id: listing.id, message: chatDraft.trim().slice(0, 2000) })
        .select("id, sender_id, message, created_at")
        .single();
      if (error) throw error;
      setChatMessages((prev) => [...prev, { id: (inserted as any).id, sender_id: (inserted as any).sender_id, message: (inserted as any).message, created_at: (inserted as any).created_at }]);
      setChatDraft("");
      if (listing) void trackEvent(listing.id, "message_sent", user.id);
    } catch {
      alert(lang === "es" ? "No se pudo enviar el mensaje." : "Could not send message.");
    } finally {
      setChatSending(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!listing?.id) return;
    const reason = reportReason.trim();
    if (!reason) {
      alert(lang === "es" ? "Escribe el motivo del reporte." : "Please enter a reason for the report.");
      return;
    }
    setReportSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      await submitListingReportAction(listing.id, reason, user?.id ?? null);
      setReportDone(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportReason("");
      }, 1500);
    } catch {
      alert(lang === "es" ? "No se pudo enviar el reporte. Intenta de nuevo." : "Could not submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };


  const status: ListingStatus = listing?.status ? listing.status : "active";
  const isSold = status === "sold";
  const isBusiness =
    listing?.sellerType === "business" || (listing as any)?.seller_type === "business";
  const isPro = isProListing(listing as any);
  const verifiedSeller = useMemo(() => isVerifiedSeller(listing as any), [listing]);

  const proVideoInfos = useMemo(() => {
    if (!listing) return [];
    const blob = `${listing.blurb?.[lang] ?? ""}\n${listing.blurb?.[lang === "es" ? "en" : "es"] ?? ""}`;
    return extractProVideoInfos(blob);
  }, [listing, lang]);

  const priceDropHours = useMemo(() => {
    if (!listing?.price_last_updated || listing.current_price == null || listing.original_price == null) return null;
    if (listing.current_price >= listing.original_price) return null;
    const updated = new Date(listing.price_last_updated).getTime();
    if (!Number.isFinite(updated)) return null;
    return Math.max(0, Math.floor((Date.now() - updated) / (1000 * 60 * 60)));
  }, [listing?.price_last_updated, listing?.current_price, listing?.original_price]);

  const postedAgoDisplay = useMemo(() => {
    if (!listing) return "";
    if (listing.created_at) return formatPostedAgo(listing.created_at, lang);
    return listing.postedAgo[lang];
  }, [listing, lang]);

  const isBoosted = useMemo(() => {
    const until = (listing as any)?.boostUntil;
    return until && new Date(until).getTime() > Date.now();
  }, [listing]);

  const [viewerCityInput, setViewerCityInput] = useState("");
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  useEffect(() => {
    if (!viewerCityInput.trim() || !listing?.city) {
      setDistanceMiles(null);
      return;
    }
    fetch(
      `/api/clasificados/distance?viewer=${encodeURIComponent(viewerCityInput.trim())}&listing=${encodeURIComponent(listing.city)}`
    )
      .then((r) => r.json())
      .then((data: { miles?: number | null }) => setDistanceMiles(data.miles ?? null))
      .catch(() => setDistanceMiles(null));
  }, [viewerCityInput, listing?.city]);

  type MediaSlot = { type: "image"; url: string } | { type: "video"; index: number };
  const mediaSlots = useMemo((): MediaSlot[] => {
    const imgs = listing?.images ?? (listing as any)?.photos;
    const urls = Array.isArray(imgs) ? imgs.filter((u): u is string => typeof u === "string") : [];
    const cover = urls[0];
    const restImages = urls.slice(1);
    const slots: MediaSlot[] = [];
    if (cover) slots.push({ type: "image", url: cover });
    proVideoInfos.forEach((_, i) => slots.push({ type: "video", index: i }));
    restImages.forEach((u) => slots.push({ type: "image", url: u }));
    if (slots.length === 0 && (listing?.hasImage || proVideoInfos.length > 0)) {
      proVideoInfos.forEach((_, i) => slots.push({ type: "video", index: i }));
      if (slots.length === 0) slots.push({ type: "image", url: "/logo.png" });
    }
    return slots;
  }, [listing?.images, (listing as any)?.photos, listing?.hasImage, proVideoInfos]);

  const [mediaIndex, setMediaIndex] = useState(0);
  const galleryTouchStartX = useRef(0);
  useEffect(() => {
    setMediaIndex(0);
  }, [listing?.id]);
  const safeMediaIndex = mediaSlots.length > 0 ? Math.min(mediaIndex, mediaSlots.length - 1) : 0;
  const goPrev = useCallback(() => {
    setMediaIndex((i) => (i <= 0 ? mediaSlots.length - 1 : i - 1));
  }, [mediaSlots.length]);
  const goNext = useCallback(() => {
    setMediaIndex((i) => (i >= mediaSlots.length - 1 ? 0 : i + 1));
  }, [mediaSlots.length]);

  const [expandedVideoIndex, setExpandedVideoIndex] = useState<number | null>(null);

  // v2 placeholder: wired later to real auth
  const [isAuthed] = useState<boolean>(false);

  const conditionText = (c: Listing["condition"]) => {
    if (lang === "es") {
      if (c === "new") return "Nuevo";
      if (c === "good") return "Bueno";
      if (c === "fair") return "Regular";
      return "Cualquiera";
    }
    if (c === "new") return "New";
    if (c === "good") return "Good";
    if (c === "fair") return "Fair";
    return "Any";
  };

  if (showLoading) {
    return (
      <div className="bg-[#D9D9D9] min-h-screen text-[#111111] pb-24">
        <Navbar />
        <section className="max-w-screen-2xl mx-auto px-6 pt-28">
          <div className="text-center">
            <Image src={newLogo} alt="LEONIX" width={260} className="mx-auto mb-6" />
            <p className="text-lg font-medium text-[#111111]/80">
              {lang === "es" ? "Cargando anuncio…" : "Loading listing…"}
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (showFetchError) {
    return (
      <div className="bg-[#D9D9D9] min-h-screen text-[#111111] pb-24">
        <Navbar />
        <section className="max-w-screen-2xl mx-auto px-6 pt-28">
          <div className="text-center max-w-lg mx-auto">
            <Image src={newLogo} alt="LEONIX" width={260} className="mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-[#111111]">
              {lang === "es" ? "No se pudo cargar el anuncio" : "Could not load this listing"}
            </h1>
            {remoteError ? <p className="mt-3 text-sm text-[#111111]/75 break-words">{remoteError}</p> : null}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={`/clasificados?lang=${lang}`}
                className="px-7 py-3 rounded-full bg-[#111111] text-[#F5F5F5] font-semibold hover:opacity-95 transition"
              >
                {t.viewAll}
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-[#D9D9D9] min-h-screen bg-[#D9D9D9] text-[#111111] pb-24">
        <Navbar />
        <section className="max-w-screen-2xl mx-auto px-6 pt-28">
          <div className="text-center">
            <Image src={newLogo} alt="LEONIX" width={260} className="mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-yellow-400">{t.notFoundTitle}</h1>
            <p className="mt-5 text-[#111111] max-w-2xl mx-auto text-lg">{t.notFoundBody}</p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href={`/clasificados?lang=${lang}`}
                className="px-7 py-3 rounded-full bg-[#111111] text-[#F5F5F5] font-semibold hover:opacity-95 transition"
              >
                {t.viewAll}
              </a>
              <a
                href={`/clasificados/publicar?lang=${lang}`}
                className="px-7 py-3 rounded-full border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] text-[#111111] font-semibold hover:bg-[#D9D9D9]/45 transition"
              >
                {t.post}
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (listing.category === "en-venta" || listing.category === "bienes-raices") {
    const ev = listing as Listing & {
      detailPairs?: unknown;
      contact_phone?: string | null;
      contact_email?: string | null;
      business_meta?: string | null;
    };
    const backHref =
      listing.category === "bienes-raices"
        ? `/clasificados/bienes-raices/resultados?lang=${lang}`
        : enVentaBackHref;
    return (
      <>
        {brPublishBanner ? (
          <div className="bg-amber-100 px-4 py-3 text-center text-sm text-amber-950" role="status">
            {brPublishBanner}
          </div>
        ) : null}
        <EnVentaAnuncioLayout
          listing={{
            id: listing.id,
            title: listing.title,
            priceLabel: listing.priceLabel,
            city: listing.city,
            blurb: listing.blurb,
            images: listing.images ?? null,
            sellerType: listing.sellerType,
            businessName: listing.businessName ?? null,
            business_name: listing.business_name ?? null,
            detailPairs: Array.isArray(ev.detailPairs) ? (ev.detailPairs as Array<{ label: string; value: string }>) : null,
            created_at: listing.created_at ?? null,
            status: listing.status,
            contact_phone: ev.contact_phone ?? null,
            contact_email: ev.contact_email ?? null,
            owner_id: listing.owner_id ?? null,
            business_meta: listing.business_meta ?? ev.business_meta ?? null,
          }}
          lang={lang}
          backHref={backHref}
          surface={listing.category === "bienes-raices" ? "bienes-raices" : "en-venta"}
          moreInCategoryHref={
            listing.category === "bienes-raices"
              ? `/clasificados/bienes-raices/resultados?lang=${lang}`
              : `/clasificados/en-venta/results?lang=${lang}`
          }
          moreInCategoryLabel={
            listing.category === "bienes-raices"
              ? lang === "es"
                ? "Más en Bienes Raíces"
                : "More in Real estate"
              : lang === "es"
                ? "Más en En Venta"
                : "More in For Sale"
          }
          showListingReport
        />
      </>
    );
  }

  return (
    <div className="bg-[#D9D9D9] min-h-screen text-[#111111] pb-28">
      <Navbar />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ClassifiedAd",
            name: listing.title[lang],
            description: listing.blurb[lang],
            url: `/clasificados/anuncio/${listing.id}`,
            price: listing.priceLabel[lang],
            priceCurrency: "USD",
            address: {
              "@type": "PostalAddress",
              addressLocality: listing.city,
              addressRegion: "CA",
              addressCountry: "US",
            },
          }),
        }}
      />

      <section className="max-w-screen-2xl mx-auto px-6 pt-28">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            href={`/clasificados?lang=${lang}`}
            className="px-5 py-2.5 rounded-full border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] text-[#111111] font-semibold hover:bg-[#D9D9D9]/45 transition"
          >
            ← {t.back}
          </a>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/clasificados/publicar?lang=${lang}`}
              className="px-6 py-2.5 rounded-full bg-[#111111] text-[#F5F5F5] font-semibold hover:opacity-95 transition"
            >
              {t.post}
            </a>
            <a
              href={`/clasificados/login?lang=${lang}`}
              className="px-6 py-2.5 rounded-full border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] text-[#111111] font-semibold hover:bg-[#D9D9D9]/45 transition"
            >
              {t.signIn}
            </a>
          </div>
        </div>

        <div className={cx("grid grid-cols-1 lg:grid-cols-12 gap-8", "mt-10")}>
          {/* Main card */}
          <div className="lg:col-span-8">
            <div
              className={cx(
                "rounded-2xl border bg-[#D9D9D9]/35 backdrop-blur p-8",
                rentasPlanTier === "business_plus" && "border-yellow-300/60 ring-1 ring-yellow-300/25 shadow-[0_0_0_1px_rgba(250,204,21,0.2)]",
                rentasPlanTier === "business_standard" && "border-yellow-400/45",
                rentasPlanTier === "privado_pro" && "border-stone-300/50 bg-white/95 shadow-sm",
                !rentasPlanTier && isBusiness && listing?.category === "rentas" && "border-yellow-400/45",
                !rentasPlanTier && listing?.category !== "rentas" && "border-black/10"
              )}
            >
                <>
                  {mediaSlots.length > 0 && (
                    <div
                      className={cx(
                        "relative rounded-xl overflow-hidden bg-[#E8E8E8] flex items-center justify-center mb-6",
                        rentasPlanTier === "privado_pro"
                          ? "aspect-[4/3] max-h-[420px] min-h-[240px] border border-stone-200/80"
                          : rentasPlanTier === "business_plus" || rentasPlanTier === "business_standard"
                            ? "aspect-[4/3] max-h-[480px] min-h-[280px] border border-black/10"
                            : "border border-black/10 max-h-[360px] min-h-[200px]"
                      )}
                      onTouchStart={(e) => {
                        galleryTouchStartX.current = e.touches[0]?.clientX ?? 0;
                      }}
                      onTouchEnd={(e) => {
                        const endX = e.changedTouches[0]?.clientX ?? 0;
                        const dx = endX - galleryTouchStartX.current;
                        if (dx > 50) goPrev();
                        else if (dx < -50) goNext();
                      }}
                    >
                      {mediaSlots[safeMediaIndex]?.type === "image" ? (
                        <img
                          src={mediaSlots[safeMediaIndex].url}
                          alt=""
                          className="max-h-full max-w-full w-full object-contain"
                        />
                      ) : (
                        (() => {
                          const slot = mediaSlots[safeMediaIndex];
                          if (slot?.type !== "video") return null;
                          const info = proVideoInfos[slot.index];
                          if (!info) return null;
                          return (
                            <video
                              className="max-h-full max-w-full w-full object-contain"
                              controls
                              preload="none"
                              playsInline
                              poster={info.thumbUrl}
                              src={info.url}
                            />
                          );
                        })()
                      )}
                      {mediaSlots.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold"
                            aria-label={lang === "es" ? "Anterior" : "Previous"}
                            onClick={goPrev}
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold"
                            aria-label={lang === "es" ? "Siguiente" : "Next"}
                            onClick={goNext}
                          >
                            →
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {listing.category === "autos" && <AutosAnuncioAnalyticsStrip listingId={listing.id} lang={lang} />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight">
                        {listing.title[lang]}
                      </h1>
                      {listing.category === "rentas" ? (
                        <RentasAnuncioHeroMonthlyRent
                          lang={lang}
                          priceLabel={listing.priceLabel[lang]}
                          rentasPlanTier={rentasPlanTier}
                        />
                      ) : (
                        <div className="mt-3 text-2xl font-extrabold text-yellow-200">
                          {formatListingPrice(listing.priceLabel[lang], { lang })}
                        </div>
                      )}
                      {priceDropHours !== null && (
                        <div className="mt-2 text-sm font-semibold text-emerald-600">
                          ⬇ {lang === "es" ? `Precio reducido hace ${priceDropHours} horas` : `Price reduced ${priceDropHours} hours ago`}
                        </div>
                      )}

                      <div className="mt-4 text-[#111111]">
                        {listing.city} • {postedAgoDisplay}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {isBoosted && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border border-yellow-400/40 bg-yellow-400/15 text-yellow-200">
                          🚀 {lang === "es" ? "Impulso de visibilidad" : "Visibility boost"}
                        </span>
                      )}
                      <span
                        className={cx(
                          "px-3 py-1 rounded-full text-xs font-semibold border",
                          isBusiness
                            ? "border-yellow-400/55 text-yellow-200 bg-[#F2EFE8]"
                            : "border-black/10 text-[#111111] bg-[#F5F5F5]"
                        )}
                      >
                        {isBusiness ? t.sellerBusiness : t.sellerPersonal}
                      </span>

                      {isPro && rentasPlanTier !== "privado_pro" ? <ProBadge /> : null}
                      {rentasPlanTier === "privado_pro" && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium border border-stone-300/60 text-[#111111]/85 bg-[#FAFAF9]">
                          {lang === "es" ? "Privado" : "Private"}
                        </span>
                      )}

                  
                    {verifiedSeller ? (
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        )}
                      >
                        <span aria-hidden="true">✓</span>
                        Verificado • Verified
                      </span>
                    ) : null}
<span
                    className={cx(
                      "px-3 py-1 rounded-full text-xs font-extrabold border",
                      isSold
                        ? "border-red-400/30 text-red-200 bg-red-400/10"
                        : "border-emerald-400/25 text-emerald-200 bg-emerald-400/10"
                    )}
                  >
                    {isSold ? t.statusSold : t.statusActive}
                  </span>
                </div>

{listing.category !== "rentas" && (
    <p className="mt-3 text-xs text-[#111111]">
      {lang === "es"
        ? "Nota: Usamos detección anti‑spam y señales de verificación para mantener anuncios limpios y confiables."
        : "Note: We use anti-spam detection and verification signals to keep listings clean and trustworthy."}
    </p>
  )}
              </div>

              {listing.category === "rentas" && rentasMeta?.facts && rentasMeta.facts.length > 0 && (
                <RentasAnuncioMetaFactChips facts={rentasMeta.facts} />
              )}

                </>

              {listing.category === "rentas" && (
                <RentasAnuncioRentalFactsSection
                  lang={lang}
                  rentasPlanTier={rentasPlanTier}
                  rentasRentalFacts={rentasRentalFacts}
                />
              )}

              <>
                  <div
                    className={cx(
                      "mt-8 rounded-2xl p-6 scroll-mt-24",
                      listing.category === "rentas" && rentasPlanTier === "privado_pro"
                        ? "border border-stone-200/80 bg-[#FAFAF9]"
                        : "border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
                    )}
                  >
                    <div className="text-sm text-[#111111] leading-relaxed">{listing.blurb[lang]}</div>
                  </div>
              </>

              {listing.category === "rentas" && (
                <RentasAnuncioPostDescriptionSections
                  lang={lang}
                  listing={listing as RentasAnuncioListingLike}
                  rentasPlanTier={rentasPlanTier}
                  rentasAmenities={rentasAmenities}
                />
              )}

              {listing.category === "autos" && (
                <AutosAnuncioLaneContextStrip lang={lang} listing={listing} />
              )}

              {/* Rentas Privado: no Pro teaser block — keep page as listing-only, human/direct */}

{proVideoInfos.length > 0 && mediaSlots.length === 0 && (
  <div className="mt-6 rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-6">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-yellow-200">
          {lang === "es" ? "Videos (Pro)" : "Pro Videos"}
        </div>
        <div className="mt-1 text-xs text-[#111111]">
          {lang === "es"
            ? "Toque la miniatura para reproducir. No se reproduce automáticamente."
            : "Tap the thumbnail to play. No autoplay."}
        </div>
      </div>
      {expandedVideoIndex === null && (
        <button
          type="button"
          onClick={() => setExpandedVideoIndex(0)}
          className="rounded-full border border-[#C9B46A]/70 bg-[#F2EFE8] px-4 py-2 text-xs font-semibold text-yellow-100 hover:bg-[#F2EFE8]"
        >
          {lang === "es" ? "Reproducir" : "Play"}
        </button>
      )}
    </div>

    <div className="mt-4">
      {expandedVideoIndex === null ? (
        proVideoInfos[0]?.thumbUrl ? (
          <button
            type="button"
            onClick={() => setExpandedVideoIndex(0)}
            className="group relative block w-full overflow-hidden rounded-xl border border-black/10"
            aria-label={lang === "es" ? "Reproducir video" : "Play video"}
          >
            {/* Use <img> to avoid Next/Image remote domain config issues */}
            <img
              src={proVideoInfos[0].thumbUrl}
              alt={lang === "es" ? "Miniatura del video" : "Video thumbnail"}
              className="h-auto w-full object-cover opacity-95 group-hover:opacity-100"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-yellow-400/30 bg-neutral-900/50 px-4 py-2 text-sm font-semibold text-[#111111]">
                {lang === "es" ? "▶ Reproducir" : "▶ Play"}
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-4 text-sm text-[#111111]">
            {lang === "es"
              ? "Este anuncio incluye un video Pro. Presione “Reproducir” para verlo."
              : "This listing includes a Pro video. Press “Play” to watch."}
          </div>
        )
      ) : proVideoInfos[expandedVideoIndex] ? (
        <>
          <video
            className="w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
            controls
            preload="none"
            playsInline
            poster={proVideoInfos[expandedVideoIndex].thumbUrl}
            src={proVideoInfos[expandedVideoIndex].url}
          />
          <button type="button" onClick={() => setExpandedVideoIndex(null)} className="mt-2 text-xs text-[#111111]/70 hover:text-[#111111]">
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </>
      ) : null}
    </div>
  </div>
)}

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5">
                    <div className="text-xs text-[#111111]">{t.metaCategory}</div>
                    <div className="mt-1 text-[#111111] font-semibold">
                      {categoryLabel[listing.category][lang]}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5">
                    <div className="text-xs text-[#111111]">{t.metaCondition}</div>
                    <div className="mt-1 text-[#111111] font-semibold">
                      {conditionText(listing.condition)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5">
                    <div className="text-xs text-[#111111]">{t.metaCity}</div>
                    <div className="mt-1 text-[#111111] font-semibold">{listing.city}</div>
                  </div>

                  <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5">
                    <div className="text-xs text-[#111111]">{t.metaPosted}</div>
                    <div className="mt-1 text-[#111111] font-semibold">{postedAgoDisplay}</div>

                    {listing.category === "autos" && autosLiveFacts?.facts && (
                      <AutosAnuncioMetaFactCards facts={autosLiveFacts.facts} />
                    )}

                    {rentasMeta?.facts && <RentasAnuncioMetaGridCards facts={rentasMeta.facts} />}
                  </div>
                </div>
            </div>

            {/* Safety note */}
            <div className="mt-6 rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-6">
              <div className="text-lg font-bold text-yellow-200">{t.guardTitle}</div>
              <div className="mt-2 text-[#111111]">{t.guardBody}</div>

              <div className="mt-4">
                <button
                  type="button"
                  className="cta-free px-5 py-2.5 rounded-full border border-gray-300 bg-white text-[#111111] font-semibold hover:bg-gray-50 transition"
                  onClick={handleReportarAnuncio}
                >
                  {t.report}
                </button>
              </div>
            </div>

            {/* Report modal */}
            {showReportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-[#111111]">
                  <h3 className="text-lg font-bold">{t.report}</h3>
                  {reportDone ? (
                    <p className="mt-4 text-[#111111]">{t.reportThankYou}</p>
                  ) : (
                    <>
                      <textarea
                        className="mt-4 w-full rounded-xl border border-gray-300 p-3 text-sm min-h-[100px] resize-y"
                        placeholder={t.reportReasonPlaceholder}
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        disabled={reportSubmitting}
                      />
                      <div className="mt-4 flex gap-3 justify-end">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full border border-gray-300 bg-white font-medium hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => setShowReportModal(false)}
                          disabled={reportSubmitting}
                        >
                          {t.reportCancel}
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full bg-[#C9B46A] text-[#111111] font-medium hover:opacity-90 disabled:opacity-50"
                          onClick={handleReportSubmit}
                          disabled={reportSubmitting}
                        >
                          {reportSubmitting ? (lang === "es" ? "Enviando…" : "Sending…") : t.reportSubmit}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Chat modal — Contactar vendedor */}
            {showChatModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col text-[#111111]">
                  <div className="p-4 border-b border-black/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold">
                      {lang === "es" ? "Contactar vendedor" : "Contact seller"}
                    </h3>
                    <button type="button" className="p-2 rounded-lg hover:bg-black/5" onClick={() => setShowChatModal(false)} aria-label={lang === "es" ? "Cerrar" : "Close"}>
                      ×
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 min-h-[200px] space-y-2">
                    {!chatCurrentUserId ? (
                      <p className="text-sm text-[#111111]/70">{lang === "es" ? "Inicia sesión para enviar mensajes al vendedor." : "Sign in to send messages to the seller."}</p>
                    ) : !(listing as any)?.owner_id ? (
                      <p className="text-sm text-[#111111]/70">{lang === "es" ? "Este anuncio no tiene vendedor asignado." : "This listing has no seller assigned."}</p>
                    ) : (
                      <>
                        {chatMessages.map((m) => (
                          <div
                            key={m.id}
                            className={m.sender_id === chatCurrentUserId ? "text-right" : "text-left"}
                          >
                            <div className={m.sender_id === chatCurrentUserId ? "inline-block rounded-xl bg-[#C9B46A]/20 px-3 py-2 text-sm" : "inline-block rounded-xl bg-[#F5F5F5] px-3 py-2 text-sm"}>
                              {m.message}
                            </div>
                            <div className="text-xs text-[#111111]/50 mt-0.5">
                              {new Date(m.created_at).toLocaleString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  {chatCurrentUserId && (listing as any)?.owner_id && (
                    <div className="p-4 border-t border-black/10 flex gap-2">
                      <input
                        type="text"
                        className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        placeholder={lang === "es" ? "Escribe tu mensaje…" : "Type your message…"}
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        disabled={chatSending}
                      />
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-[#C9B46A] text-[#111111] font-semibold text-sm hover:opacity-90 disabled:opacity-50"
                        onClick={handleSendMessage}
                        disabled={chatSending || !chatDraft.trim()}
                      >
                        {chatSending ? (lang === "es" ? "…" : "…") : (lang === "es" ? "Enviar" : "Send")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Más anuncios de esta compañía (Rentas Plus only, when flag set) */}
            {listing.category === "rentas" &&
              rentasPlanTier === "business_plus" &&
              rentasNegocioDisplay?.plusMoreListings && (
                <RentasSameCompanyListingsSection lang={lang} items={rentasSameCompanyListings} />
              )}

            {/* También te puede interesar */}
            {relatedListings.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-bold text-[#111111] mb-4">
                  {lang === "es" ? "Más anuncios similares" : "More similar listings"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedListings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/clasificados/anuncio/${item.id}?lang=${lang}`}
                      className="block rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-4 hover:bg-[#EFEFEF] transition"
                    >
                      <div className="text-base font-bold text-[#111111] line-clamp-2">
                        {item.title[lang]}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#111111]">
                        {formatListingPrice(item.priceLabel[lang], { lang })}
                      </div>
                      <div className="mt-1 text-xs text-[#111111]">
                        {item.city} · {item.postedAgo[lang]}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right rail: Rentas negocio business identity when applicable. */}
          <div className="lg:col-span-4 space-y-6">
            {listing.category === "rentas" && isBusiness && rentasNegocioDisplay ? (
              <RentasNegocioDesktopBusinessRail
                lang={lang}
                display={rentasNegocioDisplay}
                railTier={rentasPlanTier}
                listing={{
                  contact_phone: leonixLiveContact?.phoneForTel ?? (listing as any).contact_phone,
                  contact_email: leonixLiveContact?.emailForMailto ?? (listing as any).contact_email,
                }}
                onRequestInfo={handleContactarVendedor}
                onScheduleVisit={handleContactarVendedor}
              />
            ) : null}
            {viewCount !== null && (
              <div className={cx(
                "rounded-2xl border p-4 space-y-1",
                rentasPlanTier === "privado_pro" ? "border-stone-200/80 bg-[#FAFAF9]" : "border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
              )}>
                <p className="text-sm text-[#111111]">
                  👁 {viewCount} {lang === "es" ? "personas vieron este anuncio" : "people viewed this listing"}
                </p>
                {viewsToday !== null && viewsToday >= 0 && (
                  <p className="text-sm text-[#111111]">
                    🔥 {viewsToday} {lang === "es" ? "visitas hoy" : "views today"}
                  </p>
                )}
              </div>
            )}
            <div className={cx(
              "rounded-2xl border p-6",
              rentasPlanTier === "privado_pro" ? "border-stone-200/80 bg-[#FAFAF9]" : "border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
            )}>
              <div className="text-xl font-bold text-[#111111]">{t.actionsTitle}</div>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleGuardarAnuncio}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition border",
                    "border-black/10 bg-[#D9D9D9]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
                  )}
                >
                  {saved ? (lang === "es" ? "★ Guardado" : "★ Saved") : (lang === "es" ? "☆ Guardar" : "☆ Save")}
                </button>

                <button
                  type="button"
                  onClick={handleCompartirAnuncio}
                  className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
                >
                  {lang === "es" ? "Compartir" : "Share"}
                </button>

                <button
                  type="button"
                  onClick={() => copyText(typeof window !== "undefined" ? window.location.href : "")}
                  className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
                >
                  {lang === "es" ? "Copiar enlace" : "Copy link"}
                </button>

                <button
                  type="button"
                  onClick={() => copyText(buildShareMessage())}
                  className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
                >
                  {lang === "es" ? "Copiar info" : "Copy info"}
                </button>

                <button
                  disabled={!isAuthed}
                  title={!isAuthed ? t.locked : ""}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition",
                    !isAuthed
                      ? "bg-[#F5F5F5] text-[#111111] border border-black/10 cursor-not-allowed"
                      : "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                  )}
                >
                  {t.markSold}
                </button>

                <button
                  disabled={!isAuthed}
                  title={!isAuthed ? t.locked : ""}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition border",
                    !isAuthed
                      ? "bg-[#F5F5F5] text-[#111111] border-black/10 cursor-not-allowed"
                      : "bg-[#D9D9D9]/30 text-[#111111] border-black/10 hover:bg-[#D9D9D9]/45"
                  )}
                >
                  {t.edit}
                </button>

                <button
                  disabled={!isAuthed}
                  title={!isAuthed ? t.locked : ""}
                  className={cx(
                    "w-full px-5 py-3 rounded-full font-semibold transition border",
                    !isAuthed
                      ? "bg-[#F5F5F5] text-[#111111] border-black/10 cursor-not-allowed"
                      : "bg-red-500/15 text-red-200 border-red-400/25 hover:bg-red-500/20"
                  )}
                >
                  {t.delete}
                </button>

                {!isAuthed && (
                  <div className="text-xs text-[#111111] pt-2">
                    {lang === "es"
                      ? "Nota: en v2 estas acciones se habilitan cuando conectemos autenticación real."
                      : "Note: in v2 these actions will enable when we wire real authentication."}
                  </div>
                )}
              </div>
            </div>

            {!(listing.category === "rentas" && isBusiness && rentasNegocioDisplay) && (
            <div className={cx(
              "seller-card rounded-2xl border p-6",
              listing.category === "rentas" && rentasPlanTier === "privado_pro"
                ? "border-stone-200/80 bg-[#FAFAF9]"
                : "border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
            )}>
              <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
                {listing.category === "rentas"
                  ? (lang === "es" ? "Anunciante" : "Advertiser")
                  : (lang === "es" ? "Publicado por" : "Posted by")}
              </h4>
              {listing.category === "rentas" && (listing.sellerType === "business" || (listing as any).seller_type === "business") && ((listing as any).businessName ?? (listing as any).business_name) ? (
                <p className="text-sm font-semibold text-[#111111]">{(listing as any).businessName ?? (listing as any).business_name}</p>
              ) : (listing as any)?.sellerUsername ? (
                <p className="text-sm font-medium text-[#111111]">
                  {listing?.sellerName ?? (listing as any).sellerUsername ?? (lang === "es" ? "Vendedor" : "Seller")}
                </p>
              ) : (
                <p className="text-sm font-medium text-[#111111]">
                  {listing?.sellerName ?? (lang === "es" ? "Vendedor" : "Seller")}
                </p>
              )}
              {listing.category === "rentas" && (listing.sellerType === "business" || (listing as any).seller_type === "business") && (
                <p className="mt-1 text-xs text-[#111111]/70">
                  {lang === "es" ? "Negocio" : "Business"}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#111111]/70">
                {sellerStats?.avgRating != null ? (
                  <span>⭐ {sellerStats.avgRating.toFixed(1)} {lang === "es" ? "vendedor" : "seller"}</span>
                ) : (
                  <span>⭐ {lang === "es" ? "Nuevo vendedor" : "New seller"}</span>
                )}
                <span>{sellerStats?.totalRatings ?? 0} {lang === "es" ? "ventas completadas" : "completed sales"}</span>
                <span>📅 {lang === "es" ? "Miembro desde" : "Member since"} {listing?.sellerJoinYear ?? new Date().getFullYear()}</span>
                <span>📦 {(listing?.sellerActiveListings ?? 0)} {lang === "es" ? "anuncios activos" : "active listings"}</span>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl font-semibold bg-[#C9B46A] text-[#111111] hover:opacity-90 transition"
                  onClick={() => setShowChatModal(true)}
                >
                  {lang === "es" ? "Contactar vendedor" : "Contact seller"}
                </button>
              </div>
            </div>
            )}

            <div
              className={cx(
                "rounded-2xl border p-6",
                rentasPlanTier === "privado_pro"
                  ? "border-stone-200/80 bg-[#FAFAF9]"
                  : "border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
              )}
            >
              <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
                {lang === "es" ? "Ubicación" : "Location"}
              </h3>
              <p className="text-sm text-[#111111] mb-2">
                {lang === "es" ? "Ubicación del vendedor:" : "Seller location:"} {listing?.city ?? ""}
              </p>
              <label className="block text-sm text-[#111111]/80 mb-1">
                {lang === "es" ? "Calcula la distancia desde tu ciudad" : "Calculate distance from your city"}
              </label>
              <CityAutocomplete
                value={viewerCityInput}
                onChange={setViewerCityInput}
                placeholder={lang === "es" ? "Ingresa tu ciudad" : "Enter your city"}
                lang={lang}
                variant="light"
                className="mt-1"
              />
              {distanceMiles !== null && (
                <p className="mt-2 text-sm text-[#111111]/80">
                  {lang === "es"
                    ? `Aproximadamente ${Math.round(distanceMiles)} millas de distancia`
                    : `Approximately ${Math.round(distanceMiles)} miles away`}
                </p>
              )}
            </div>

            <div className={cx(
              "rounded-2xl border p-6",
              rentasPlanTier === "privado_pro" ? "border-stone-200/80 bg-[#FAFAF9]" : "border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
            )}>
              <div className="text-xl font-bold text-[#111111]">{t.contactTitle}</div>
              <div className="mt-3 text-[#111111]">{t.contactBody}</div>
              {listing?.category === "rentas" && (
                <p className="mt-2 text-sm text-[#111111]/85">
                  {lang === "es"
                    ? "Llamar, texto y correo son la forma oficial de contactar al anunciante. Úsalos con confianza."
                    : "Call, text, and email are the official ways to contact the advertiser. Use them with confidence."}
                </p>
              )}

              
              {listing?.category === "empleos" && jobMeta ? (
                <div className="mt-5 rounded-xl border border-yellow-400/20 bg-[#D9D9D9]/20 p-4">
                  <div className="text-sm font-semibold text-[#111111]">
                    {lang === "es" ? "Detalles del trabajo" : "Job details"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {jobMeta.chips.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center rounded-full border border-white/15 bg-[#F5F5F5] px-3 py-1 text-xs text-[#111111]"
                      >
                        {c}
                      </span>
                    ))}
                    {jobMeta.pay ? (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-[#F5F5F5] px-3 py-1 text-xs text-[#111111]">
                        {jobMeta.pay}
                      </span>
                    ) : null}
                  </div>

                  {jobMeta.quals.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-[#111111]/90">
                        {lang === "es" ? "Requisitos (según el texto)" : "Qualifications (from text)"}
                      </div>
                      <ul className="mt-1 list-disc pl-5 text-sm text-[#111111]">
                        {jobMeta.quals.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-[#111111]/15 px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#111111]/20 disabled:opacity-50"
                    onClick={() => {
                      const el = document.getElementById("contact-actions");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {lang === "es" ? "Aplicar / Contactar" : "Apply / Contact"}
                  </button>
                </div>
              ) : null}

              <div className="mt-5" id="contact-actions">
                {listing?.category === "rentas" && (
                  <h3 className="text-sm font-semibold text-[#111111] mb-3">
                    {lang === "es" ? "Contactar" : "Contact"}
                  </h3>
                )}
                <ContactActions
                  lang={lang}
                  phone={leonixLiveContact?.phoneForTel ?? rentasNegocioDisplay?.officePhone ?? (listing as any)?.contact_phone ?? (listing as any)?.phone}
                  text={(listing as any)?.text}
                  email={leonixLiveContact?.emailForMailto ?? (listing as any)?.contact_email ?? (listing as any)?.email}
                  website={leonixLiveContact?.website ?? rentasNegocioDisplay?.website ?? (listing as any)?.website}
                  mapsUrl={(listing as any)?.mapsUrl}
                  onContact={
                    listing
                      ? () => {
                          void (async () => {
                            const sb = createSupabaseBrowserClient();
                            const {
                              data: { user },
                            } = await sb.auth.getUser();
                            void trackEvent(listing.id, "message_sent", user?.id ?? null);
                          })();
                        }
                      : undefined
                  }
                />
              </div>

              <div className="mt-6">
                <AiInsightsPanel
                  lang={lang}
                  listing={listing as any}
                  allListings={(isLiveDbListing ? [] : SAMPLE_LISTINGS) as any}
                />
              </div>


              <div className="mt-4 text-xs text-[#111111]">
                {lang === "es"
                  ? "Estas herramientas se activan con LEONIX Pro (leads por anuncio)."
                  : "These tools activate with LEONIX Pro (per-listing leads)."}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}