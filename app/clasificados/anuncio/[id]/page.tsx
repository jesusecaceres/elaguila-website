"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import newLogo from "../../../../public/logo.png";

import { SAMPLE_LISTINGS } from "../../../data/classifieds/sampleListings";
import { extractProVideoInfos } from "../../components/proVideo";
import ProBadge from "../../components/ProBadge";
import { isProListing } from "../../components/planHelpers";
import { isVerifiedSeller } from "../../components/verifiedSeller";
import { isListingSaved, onSavedListingsChange, toggleListingSaved } from "../../components/savedListings";
import ContactActions from "../../components/ContactActions";
import AiInsightsPanel from "../../components/AiInsightsPanel";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { trackEvent } from "@/app/lib/listingAnalytics";
import { addListingView } from "@/app/lib/recentlyViewed";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { submitListingReportAction } from "@/app/admin/actions";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { parseBusinessMeta } from "../../config/businessListingContract";

type Lang = "es" | "en";

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

/** Rentas-only plan tier for display (Privado Pro / Negocio Standard / Negocio Plus). */
type RentasPlanTier = "privado_pro" | "business_standard" | "business_plus";

function inferRentasPlanTier(listing: { category?: string; sellerType?: string; seller_type?: string } & Record<string, unknown>): RentasPlanTier | null {
  if (listing?.category !== "rentas") return null;
  const sellerType = listing.sellerType ?? listing.seller_type ?? "personal";
  if (sellerType === "personal" && isProListing(listing)) return "privado_pro";
  if (sellerType === "business") {
    const tier = listing.rentasTier ?? listing.rentas_tier ?? listing.servicesTier;
    if (tier === "plus" || tier === "premium") return "business_plus";
    return "business_standard";
  }
  return null;
}

function parsePriceLabel(label: string): number | null {
  const m = (label || "").replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

/** Parse negocioRedes text into renderable social links. Returns null to show raw text. */
function parseRentasSocialLinks(raw: string | null | undefined): Array<{ label: string; url: string }> | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const out: Array<{ label: string; url: string }> = [];
  const urlLike = /https?:\/\/[^\s,]+/gi;
  const parts = s.split(/[,;]|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const urlMatch = part.match(urlLike);
    const url = urlMatch ? urlMatch[0] : "";
    const labelPart = url ? part.replace(urlLike, "").replace(/^[:\s]+|[:\s]+$/g, "").trim() : part;
    const label =
      labelPart.toLowerCase().startsWith("facebook")
        ? "Facebook"
        : labelPart.toLowerCase().startsWith("instagram") || labelPart.toLowerCase().startsWith("ig")
          ? "Instagram"
          : labelPart.toLowerCase().startsWith("whatsapp") || labelPart.toLowerCase().startsWith("wa")
            ? "WhatsApp"
            : labelPart.toLowerCase().startsWith("twitter") || labelPart.toLowerCase().startsWith("x ")
              ? "X"
              : labelPart || "Red social";
    if (url && /^https?:\/\//i.test(url)) {
      out.push({ label, url });
    } else if (/^https?:\/\//i.test(part)) {
      out.push({ label: "Red social", url: part });
    }
  }
  if (out.length === 0 && /https?:\/\//i.test(s)) {
    const m = s.match(urlLike);
    if (m) m.forEach((u) => out.push({ label: "Enlace", url: u }));
  }
  return out.length > 0 ? out : null;
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

export default function AnuncioDetallePage() {
  const params = useParams<{ id: string }>();

  // ✅ Null-safe guard: some setups type useSearchParams() as possibly null
  const sp = useSearchParams();
  const searchParams = sp ?? new URLSearchParams();

  const lang = ((searchParams.get("lang") || "es") as Lang) === "en" ? "en" : "es";

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
      "bienes-raices": { es: "Bienes Raíces", en: "Real Estate" },
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

  const listing: Listing | undefined = useMemo(() => {
    const id = params?.id;
    if (!id) return undefined;
    return (SAMPLE_LISTINGS as unknown as Listing[]).find((x) => x.id === id);
  }, [params?.id]);
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


  const autoMeta = useMemo(() => {
    if (!listing || listing.category !== "autos") return null;

    const title = (listing.title?.[lang] ?? "");
    const blurb = (listing.blurb?.[lang] ?? "");
    const blob = `${title} ${blurb} ${(listing.priceLabel?.[lang] ?? "")}`.toLowerCase();

    const yearMatch = title.match(/(19\d{2}|20\d{2})/);
    const year = yearMatch ? yearMatch[1] : null;

    const mileageMatch =
      title.match(/(\d{2,3})\s*k\b/) ||
      title.match(/(\d{1,3}(?:,\d{3})+)\s*(?:miles|millas)\b/i);
    let mileage: string | null = null;
    if (mileageMatch) {
      mileage = mileageMatch[1].includes(",") ? mileageMatch[1] : `${mileageMatch[1]}k`;
      mileage = lang === "es" ? `${mileage} millas` : `${mileage} miles`;
    }

    const has = (re: RegExp) => re.test(blob);

    const facts: Array<{ label: string; value: string }> = [];

    if (year) facts.push({ label: lang === "es" ? "Año" : "Year", value: year });
    if (mileage) facts.push({ label: lang === "es" ? "Millaje" : "Mileage", value: mileage });

    if (has(/t[íi]tulo\s+limpio|clean\s+title/)) {
      facts.push({ label: lang === "es" ? "Título" : "Title", value: lang === "es" ? "Limpio" : "Clean" });
    } else if (has(/salvage|reconstru/)) {
      facts.push({ label: lang === "es" ? "Título" : "Title", value: lang === "es" ? "Salvage/Rebuild" : "Salvage/Rebuild" });
    }

    if (has(/financ|financing/)) {
      facts.push({ label: lang === "es" ? "Opciones" : "Options", value: lang === "es" ? "Financiamiento" : "Financing" });
    } else if (has(/cash\s+only|solo\s+efectivo/)) {
      facts.push({ label: lang === "es" ? "Opciones" : "Options", value: lang === "es" ? "Solo efectivo" : "Cash only" });
    }

    return facts.length ? { facts } : null;
  }, [listing, lang]);

  const relatedListings = useMemo(() => {
    if (!listing) return [];
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
  }, [listing?.id, listing?.category, listing?.priceLabel, listing?.city]);

  const rentasMeta = useMemo(() => {
    if (!listing || listing.category !== "rentas") return null;

    const title = (listing.title?.[lang] ?? "");
    const blurb = (listing.blurb?.[lang] ?? "");
    const blob = `${title} ${blurb} ${(listing.priceLabel?.[lang] ?? "")}`.toLowerCase();

    const has = (re: RegExp) => re.test(blob);

    const facts: Array<{ label: string; value: string }> = [];

    // Type cue (derived only from text)
    let type: string | null = null;
    if (has(/\bcuarto\b|\broom\b/)) type = lang === "es" ? "Cuarto" : "Room";
    else if (has(/\bestudio\b|\bstudio\b/)) type = lang === "es" ? "Estudio" : "Studio";
    else if (has(/\bapartamento\b|\bapartment\b/)) type = lang === "es" ? "Apartamento" : "Apartment";
    else if (has(/\bcasa\b|\bhouse\b|\bhogar\b/)) type = lang === "es" ? "Casa" : "House";

    if (type) facts.push({ label: lang === "es" ? "Tipo" : "Type", value: type });

    // Utilities / deposit cues
    if (has(/utilities\s*incl|utilidades\s*incl|incl\.?\s*utilities/)) {
      facts.push({ label: lang === "es" ? "Servicios" : "Utilities", value: lang === "es" ? "Incluidos" : "Included" });
    } else if (has(/utilities|utilidades/)) {
      facts.push({ label: lang === "es" ? "Servicios" : "Utilities", value: lang === "es" ? "Mencionados" : "Mentioned" });
    }

    if (has(/deposit|dep[oó]sito/)) {
      facts.push({ label: lang === "es" ? "Depósito" : "Deposit", value: lang === "es" ? "Requerido (ver)" : "Required (see)" });
    }

    // Availability cue
    const date = (title + " " + blurb).match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
    if (date) {
      facts.push({ label: lang === "es" ? "Disponible" : "Available", value: date[1] });
    } else if (has(/available\s+now|disponible\s+ya|inmediato/)) {
      facts.push({ label: lang === "es" ? "Disponible" : "Available", value: lang === "es" ? "Ahora" : "Now" });
    }

    return facts.length ? { facts } : null;
  }, [listing, lang]);

  /** Rental facts block: renta, depósito, plazo, fecha disponible, amueblado, mascotas, estacionamiento, servicios, lavandería, fumar. From detailPairs when available, else rentasMeta + price. */
  const rentasRentalFacts = useMemo((): Array<{ label: string; value: string }> => {
    if (!listing || listing.category !== "rentas") return [];
    const pairs = (listing as any).detailPairs as Array<{ label: string; value: string }> | undefined;
    const priceVal = listing.priceLabel?.[lang] ?? "";
    const rentalFactLabels = new Set([
      "depósito", "deposit", "plazo del contrato", "lease term", "plazo contrato",
      "fecha disponible", "available date", "available", "disponible",
      "amueblado", "furnished", "mascotas", "pets", "mascotas permitidas",
      "estacionamiento", "parking", "servicios incluidos", "utilities included", "utilities",
      "lavandería", "laundry", "fumar", "smoking", "fumar permitido",
      "renta mensual", "monthly rent", "renta",
    ]);
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const out: Array<{ label: string; value: string }> = [];
    if (priceVal) out.push({ label: lang === "es" ? "Renta mensual" : "Monthly rent", value: priceVal });
    if (Array.isArray(pairs)) {
      for (const p of pairs) {
        const n = normalize(p.label);
        if (rentalFactLabels.has(n) || /dep[oó]sito|plazo|disponible|amueblado|mascota|estacionamiento|servicio|lavander[ií]a|fumar|renta/i.test(n)) {
          if (!out.some((o) => normalize(o.label) === n)) out.push(p);
        }
      }
    }
    if (out.length <= 1 && rentasMeta?.facts) {
      for (const f of rentasMeta.facts) {
        if (!out.some((o) => o.label === f.label)) out.push(f);
      }
    }
    return out;
  }, [listing, lang, rentasMeta]);

  /** Amenities / features: detailPairs not in rental facts (recámaras, baños, tamaño, etc.). */
  const rentasAmenities = useMemo((): Array<{ label: string; value: string }> => {
    if (!listing || listing.category !== "rentas") return [];
    const pairs = (listing as any).detailPairs as Array<{ label: string; value: string }> | undefined;
    if (!Array.isArray(pairs) || pairs.length === 0) return [];
    const rentalFactLabels = new Set([
      "depósito", "deposit", "plazo del contrato", "lease term", "fecha disponible", "available date",
      "amueblado", "furnished", "mascotas", "pets", "estacionamiento", "parking",
      "servicios incluidos", "utilities included", "lavandería", "laundry", "fumar", "smoking",
      "renta mensual", "monthly rent",
    ]);
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    return pairs.filter((p) => !rentalFactLabels.has(normalize(p.label)));
  }, [listing]);

  /** Parsed business identity (from business_meta). Shared contract: rentas = business rentals; en-venta = future business sales. */
  const rentasBusinessMeta = useMemo((): Record<string, string> | null => {
    if (!listing || listing.category !== "rentas") return null;
    return parseBusinessMeta((listing as any).business_meta);
  }, [listing]);

  /** Display values for Rentas negocio business rail (name, agent, role, phone, website, socials, etc.). */
  const rentasNegocioDisplay = useMemo(() => {
    const isBiz =
      listing?.sellerType === "business" || (listing as any)?.seller_type === "business";
    if (!listing || listing.category !== "rentas" || !isBiz) return null;
    const name =
      (listing as any).business_name ?? (listing as any).businessName ?? rentasBusinessMeta?.negocioNombre ?? "";
    const meta = rentasBusinessMeta ?? {};
    const website = meta.negocioSitioWeb?.trim() || "";
    const rawSocials = meta.negocioRedes?.trim() || "";
    const socialLinks = parseRentasSocialLinks(rawSocials);
    return {
      name: name.trim() || (lang === "es" ? "Negocio" : "Business"),
      agent: meta.negocioAgente?.trim() || "",
      role: meta.negocioCargo?.trim() || "",
      officePhone: meta.negocioTelOficina?.trim() || "",
      website: website || null,
      socialLinks,
      rawSocials: socialLinks ? "" : rawSocials,
      logoUrl: meta.negocioLogoUrl?.trim() || null,
      agentPhotoUrl: meta.negocioFotoAgenteUrl?.trim() || null,
      languages: meta.negocioIdiomas?.trim() || "",
      hours: meta.negocioHorario?.trim() || "",
      virtualTourUrl: meta.negocioRecorridoVirtual?.trim() || null,
      plusMoreListings: meta.negocioPlusMasAnuncios === "si",
    };
  }, [listing, rentasBusinessMeta, lang]);

  /** Same-business Rentas listings for Plus "Más anuncios de esta compañía" (when flag set). */
  const rentasSameCompanyListings = useMemo(() => {
    if (!listing || listing.category !== "rentas") return [];
    const tier = inferRentasPlanTier(listing as any);
    const plusMore = rentasBusinessMeta?.negocioPlusMasAnuncios === "si";
    if (tier !== "business_plus" || !plusMore) return [];
    const bizName =
      ((listing as any).business_name ?? (listing as any).businessName ?? "").trim().toLowerCase();
    if (!bizName) return [];
    const list = (SAMPLE_LISTINGS as unknown as Listing[]).filter((l) => {
      if (l.category !== "rentas" || l.id === listing.id) return false;
      const otherBiz =
        ((l as any).business_name ?? (l as any).businessName ?? "").trim().toLowerCase();
      return otherBiz === bizName;
    });
    return list.slice(0, 6);
  }, [listing, rentasBusinessMeta?.negocioPlusMasAnuncios]);

  const [saved, setSaved] = useState<boolean>(() => (listing ? isListingSaved(listing.id) : false));
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
    trackEvent(listing.id, "listing_view");
    trackEvent(listing.id, "listing_open");
    addListingView(listing.id);
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

  useEffect(() => {
    if (!listing) return;
    return onSavedListingsChange(() => setSaved(isListingSaved(listing.id)));
  }, [listing?.id]);

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
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing ? listing.title[lang] : (lang === "es" ? "Anuncio" : "Listing");
    const text = listing ? listing.blurb[lang] : "";
    const nav: any = navigator as any;

    try {
      if (nav?.share) {
        await nav.share({ title, text, url });
        if (listing) trackEvent(listing.id, "listing_share");
        return;
      }
    } catch {
      // ignore and fall back
    }

    await copyText(url || buildShareMessage());
    if (listing) trackEvent(listing.id, "listing_share");
  };

  const handleGuardarAnuncio = async () => {
    if (!listing) return;
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (saved) {
        await supabase.from("user_saved_listings").delete().eq("user_id", user.id).eq("listing_id", listing.id);
        setSaved(false);
      } else {
        await supabase.from("user_saved_listings").upsert({ user_id: user.id, listing_id: listing.id }, { onConflict: "user_id,listing_id" });
        setSaved(true);
        trackEvent(listing.id, "listing_save");
      }
    } else {
      setSaved(toggleListingSaved(listing.id));
      trackEvent(listing.id, "listing_save");
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
      if (listing) trackEvent(listing.id, "message_sent");
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
  const rentasPlanTier = useMemo(
    () => (listing && listing.category === "rentas" ? inferRentasPlanTier(listing as any) : null),
    [listing]
  );
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

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main card */}
          <div className="lg:col-span-8">
            <div
              className={cx(
                "rounded-2xl border bg-[#D9D9D9]/35 backdrop-blur p-8",
                rentasPlanTier === "business_plus" && "border-yellow-300/60 ring-1 ring-yellow-300/25 shadow-[0_0_0_1px_rgba(250,204,21,0.2)]",
                rentasPlanTier === "business_standard" && "border-yellow-400/45",
                rentasPlanTier === "privado_pro" && "border-stone-300/50 bg-white/95 shadow-sm",
                !rentasPlanTier && isBusiness && "border-yellow-400/45",
                !rentasPlanTier && !isBusiness && "border-black/10"
              )}
            >
              {mediaSlots.length > 0 && (
                <div
                  className={cx(
                    "relative rounded-xl overflow-hidden bg-[#E8E8E8] flex items-center justify-center mb-6",
                    rentasPlanTier === "privado_pro"
                      ? "aspect-[4/3] max-h-[420px] min-h-[240px] border border-stone-200/80"
                      : (rentasPlanTier === "business_plus" || rentasPlanTier === "business_standard")
                        ? "aspect-[4/3] max-h-[420px] min-h-[240px] border border-black/10"
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
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight">
                    {listing.title[lang]}
                  </h1>
                  {listing.category === "rentas" ? (
                    <div className="mt-3">
                      <div className={cx("font-medium text-[#111111]/80", rentasPlanTier === "privado_pro" ? "text-sm" : "text-sm")}>
                        {lang === "es" ? "Renta mensual" : "Monthly rent"}
                      </div>
                      <div className={cx(
                        "font-extrabold",
                        rentasPlanTier === "privado_pro" ? "text-2xl sm:text-3xl text-[#111111]" : "text-2xl text-yellow-200"
                      )}>
                        {formatListingPrice(listing.priceLabel[lang], { lang })}
                      </div>
                    </div>
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
                <div className="mt-6 flex flex-wrap gap-2">
                  {rentasMeta.facts.map((f) => (
                    <span
                      key={f.label}
                      className="rounded-full border border-black/10 bg-[#F5F5F5] px-3 py-1.5 text-xs font-medium text-[#111111]"
                    >
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              )}

              {listing.category === "rentas" && rentasRentalFacts.length > 0 && (
                <div className={cx(
                  "mt-6 rounded-2xl p-6",
                  rentasPlanTier === "privado_pro"
                    ? "border border-stone-200/80 bg-[#FAFAF9]"
                    : "border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
                )}>
                  <h3 className="text-sm font-semibold text-[#111111]">
                    {lang === "es" ? "Datos del rental" : "Rental details"}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rentasRentalFacts.map((f) => (
                      <div key={f.label} className="rounded-xl border border-black/10 bg-white/60 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wide text-[#111111]/60">{f.label}</div>
                        <div className="mt-0.5 text-sm font-semibold text-[#111111]">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={cx(
                "mt-8 rounded-2xl p-6",
                listing.category === "rentas" && rentasPlanTier === "privado_pro"
                  ? "border border-stone-200/80 bg-[#FAFAF9]"
                  : "border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
              )}>
                <div className="text-sm text-[#111111] leading-relaxed">{listing.blurb[lang]}</div>
              </div>

              {listing.category === "rentas" && rentasAmenities.length > 0 && (
                <div className={cx(
                  "mt-6 rounded-2xl p-6",
                  rentasPlanTier === "privado_pro"
                    ? "border border-stone-200/80 bg-[#FAFAF9]"
                    : "border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
                )}>
                  <h3 className="text-sm font-semibold text-[#111111]">
                    {lang === "es" ? "Características y comodidades" : "Features & amenities"}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rentasAmenities.map((f) => (
                      <div key={f.label} className="rounded-xl border border-black/10 bg-white/60 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wide text-[#111111]/60">{f.label}</div>
                        <div className="mt-0.5 text-sm font-semibold text-[#111111]">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {listing.category === "rentas" && (
                <div
                  className={cx(
                    "mt-6 rounded-2xl border p-4 sm:p-5",
                    rentasPlanTier === "business_plus" &&
                      "border-yellow-300/50 bg-[#F5F5F5] ring-1 ring-yellow-300/20 shadow-[0_0_0_1px_rgba(250,204,21,0.15)]",
                    rentasPlanTier === "business_standard" && "border-yellow-400/35 bg-[#F5F5F5]",
                    rentasPlanTier === "privado_pro" && "border-stone-200/80 bg-[#FAFAF9]",
                    !rentasPlanTier && "border-black/10 bg-[#F5F5F5]"
                  )}
                  data-section="rentas-trust"
                >
                  <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-3">
                    {lang === "es" ? "Quién publica" : "Posted by"}
                  </h3>
                  {rentasPlanTier === "business_plus" && (
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          "border-yellow-300/80 bg-gradient-to-r from-yellow-500/18 to-yellow-300/14 text-yellow-100"
                        )}
                      >
                        <span aria-hidden="true">🔑</span>
                        {lang === "es" ? "Negocio Plus" : "Business Plus"}
                      </span>
                    </div>
                  )}
                  {rentasPlanTier === "business_standard" && (listing.sellerType === "business" || (listing as any).seller_type === "business") && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-yellow-400/40 bg-[#111111]/05 px-2.5 py-1 text-[11px] font-semibold text-[#111111]/90">
                        {lang === "es" ? "Negocio" : "Business"}
                      </span>
                    </div>
                  )}
                  {listing.sellerType === "business" ? (
                    <>
                      <p className="text-sm font-semibold text-[#111111]">
                        {lang === "es" ? "Negocio" : "Business"}
                        {(listing as any).businessName ?? (listing as any).business_name ? ` — ${(listing as any).businessName ?? (listing as any).business_name}` : ""}
                      </p>
                      <p className="mt-1.5 text-xs text-[#111111]/80">
                        {rentasPlanTier === "business_plus"
                          ? (lang === "es"
                            ? "Anuncio profesional con presencia Plus: mayor visibilidad e identidad de negocio."
                            : "Professional listing with Plus presence: stronger visibility and business identity.")
                          : (lang === "es"
                            ? "Anuncio profesional con identidad de negocio."
                            : "Professional listing with business identity.")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#111111]">
                        {lang === "es" ? "Anunciante privado" : "Private advertiser"}
                      </p>
                      <p className="mt-1 text-xs text-[#111111]/80">
                        {lang === "es" ? "Arrendador o dueño (persona)." : "Landlord or owner (individual)."}
                      </p>
                      <p className="mt-2 text-[11px] text-[#111111]/60">
                        {lang === "es" ? "Respuesta: —" : "Response: —"}
                      </p>
                    </>
                  )}
                </div>
              )}

              {listing.category === "rentas" && (
                <div className="mt-4 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-5" data-section="rentas-safety">
                  <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
                    {lang === "es" ? "Para tu seguridad" : "For your safety"}
                  </h3>
                  <ul className="space-y-2 text-sm text-[#111111]/90">
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#111111]/60" aria-hidden>•</span>
                      <span>{lang === "es" ? "No envíes depósitos sin verificar el inmueble o al anunciante." : "Do not send deposits without verifying the property or the advertiser."}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#111111]/60" aria-hidden>•</span>
                      <span>{lang === "es" ? "Confirma detalles (renta, depósito, contrato) antes de pagar." : "Confirm details (rent, deposit, contract) before paying."}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#111111]/60" aria-hidden>•</span>
                      <span>{lang === "es" ? "Usa los datos de contacto del anuncio." : "Use the contact information shown in the listing."}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-[#111111]/60" aria-hidden>•</span>
                      <span>{lang === "es" ? "Desconfía de ofertas que parezcan demasiado buenas para ser verdad." : "Be cautious of offers that seem too good to be true."}</span>
                    </li>
                  </ul>
                </div>
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

                {autoMeta?.facts?.slice(0, 4).map((f) => (
                  <div
                    key={f.label}
                    className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5"
                  >
                    <div className="text-xs text-[#111111]">{f.label}</div>
                    <div className="mt-1 text-[#111111] font-semibold">{f.value}</div>
                  </div>
                ))}

                {rentasMeta?.facts?.slice(0, 4).map((f) => (
                  <div
                    key={f.label}
                    className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5"
                  >
                    <div className="text-xs text-[#111111]">{f.label}</div>
                    <div className="mt-1 text-[#111111] font-semibold">{f.value}</div>
                  </div>
                ))}

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
                <div className="mt-10" data-section="rentas-mas-anuncios">
                  <h3 className="text-xl font-bold text-[#111111] mb-4">
                    {lang === "es" ? "Más anuncios de esta compañía" : "More listings from this company"}
                  </h3>
                  {rentasSameCompanyListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rentasSameCompanyListings.map((item) => (
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
                  ) : (
                    <div className="rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-5 text-center">
                      <p className="text-sm text-[#111111]/80">
                        {lang === "es"
                          ? "No hay otros anuncios de esta empresa por ahora."
                          : "No other listings from this company at the moment."}
                      </p>
                    </div>
                  )}
                </div>
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

          {/* Right rail: for Rentas Negocio, business identity + contact first (open-card reference). */}
          <div className="lg:col-span-4 space-y-6">
            {listing.category === "rentas" && isBusiness && rentasNegocioDisplay ? (
              <div
                className={cx(
                  "rounded-2xl border p-5 sm:p-6",
                  rentasPlanTier === "business_plus"
                    ? "border-yellow-300/50 bg-[#FAFAF8] ring-1 ring-yellow-300/20 shadow-sm"
                    : "border-[#C9B46A]/45 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-sm"
                )}
                data-section="rentas-business-rail"
              >
                <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-3">
                  {lang === "es" ? "Identidad del negocio" : "Business"}
                </h4>
                <div className="flex flex-col gap-4">
                  {(rentasNegocioDisplay.logoUrl || rentasNegocioDisplay.agentPhotoUrl) && (
                    <div className="flex items-start gap-3">
                      {rentasNegocioDisplay.logoUrl && (
                        <img
                          src={rentasNegocioDisplay.logoUrl}
                          alt=""
                          className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white"
                        />
                      )}
                      {rentasNegocioDisplay.agentPhotoUrl && (
                        <img
                          src={rentasNegocioDisplay.agentPhotoUrl}
                          alt=""
                          className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white"
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-[#111111]">
                      {rentasNegocioDisplay.name || (lang === "es" ? "Negocio" : "Business")}
                    </p>
                    {rentasNegocioDisplay.agent && (
                      <p className="mt-0.5 text-sm text-[#111111]/90">{rentasNegocioDisplay.agent}</p>
                    )}
                    {rentasNegocioDisplay.role && (
                      <p className="text-xs text-[#111111]/70">{rentasNegocioDisplay.role}</p>
                    )}
                  </div>
                  {rentasNegocioDisplay.officePhone && (
                    <p className="text-sm text-[#111111]">
                      <span className="text-[#111111]/70">{lang === "es" ? "Oficina:" : "Office:"} </span>
                      <a href={`tel:${rentasNegocioDisplay.officePhone.replace(/\D/g, "")}`} className="font-medium hover:underline">
                        {rentasNegocioDisplay.officePhone}
                      </a>
                    </p>
                  )}
                  {rentasNegocioDisplay.website && (
                    <a
                      href={rentasNegocioDisplay.website.startsWith("http") ? rentasNegocioDisplay.website : `https://${rentasNegocioDisplay.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-[#111111] hover:underline break-all"
                    >
                      {lang === "es" ? "Sitio web" : "Website"} →
                    </a>
                  )}
                  {(rentasNegocioDisplay.virtualTourUrl && (rentasPlanTier === "business_plus" || rentasPlanTier === "business_standard")) && (
                    <a
                      href={rentasNegocioDisplay.virtualTourUrl.startsWith("http") ? rentasNegocioDisplay.virtualTourUrl : `https://${rentasNegocioDisplay.virtualTourUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-[#111111] hover:underline break-all"
                    >
                      {lang === "es" ? "Recorrido virtual" : "Virtual tour"} →
                    </a>
                  )}
                  {rentasPlanTier === "business_plus" && rentasNegocioDisplay.socialLinks && rentasNegocioDisplay.socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rentasNegocioDisplay.socialLinks.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#F5F5F5]"
                        >
                          {s.label} →
                        </a>
                      ))}
                    </div>
                  ) : rentasPlanTier === "business_standard" && rentasNegocioDisplay.socialLinks && rentasNegocioDisplay.socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rentasNegocioDisplay.socialLinks.slice(0, 2).map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#F5F5F5]"
                        >
                          {s.label} →
                        </a>
                      ))}
                    </div>
                  ) : rentasNegocioDisplay.rawSocials ? (
                    <p className="text-xs text-[#111111]/80 break-words">{rentasNegocioDisplay.rawSocials}</p>
                  ) : null}
                  {rentasNegocioDisplay.languages && (
                    <p className="text-xs text-[#111111]/80">
                      <span className="text-[#111111]/60">{lang === "es" ? "Idiomas:" : "Languages:"} </span>
                      {rentasNegocioDisplay.languages}
                    </p>
                  )}
                  {rentasNegocioDisplay.hours && (
                    <p className="text-xs text-[#111111]/80">
                      <span className="text-[#111111]/60">{lang === "es" ? "Horario:" : "Hours:"} </span>
                      {rentasNegocioDisplay.hours}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full px-4 py-3 rounded-xl font-semibold bg-[#111111] text-[#F5F5F5] hover:opacity-95 transition text-sm"
                      onClick={handleContactarVendedor}
                    >
                      {lang === "es" ? "Solicitar información" : "Request info"}
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-3 rounded-xl font-semibold border border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111] hover:bg-[#EFE7D8] transition text-sm"
                      onClick={handleContactarVendedor}
                    >
                      {lang === "es" ? "Programar visita" : "Schedule visit"}
                    </button>
                    {(rentasNegocioDisplay.officePhone || (listing as any)?.contact_phone) && (
                      <a
                        href={`tel:${(rentasNegocioDisplay.officePhone || (listing as any)?.contact_phone || "").replace(/\D/g, "")}`}
                        className="w-full px-4 py-3 rounded-xl font-semibold border border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] transition text-sm text-center inline-block"
                      >
                        {lang === "es" ? "Llamar" : "Call"}
                      </a>
                    )}
                    {(listing as any)?.contact_email && (
                      <a
                        href={`mailto:${(listing as any).contact_email}`}
                        className="w-full px-4 py-3 rounded-xl font-semibold border border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] transition text-sm text-center inline-block"
                      >
                        {lang === "es" ? "Enviar mensaje" : "Send message"}
                      </a>
                    )}
                  </div>
                </div>
              </div>
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
                <Link
                  href={`/vendedor/${encodeURIComponent((listing as any).sellerUsername)}?lang=${lang}`}
                  className="text-sm font-medium text-[#111111] hover:underline"
                >
                  {listing?.sellerName ?? (listing as any).sellerUsername ?? (lang === "es" ? "Vendedor" : "Seller")}
                </Link>
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

            <div className={cx(
              "rounded-2xl border p-6",
              rentasPlanTier === "privado_pro" ? "border-stone-200/80 bg-[#FAFAF9]" : "border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]"
            )}>
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
                  phone={rentasNegocioDisplay?.officePhone ?? (listing as any)?.contact_phone ?? (listing as any)?.phone}
                  text={(listing as any)?.text}
                  email={(listing as any)?.contact_email ?? (listing as any)?.email}
                  website={rentasNegocioDisplay?.website ?? (listing as any)?.website}
                  mapsUrl={(listing as any)?.mapsUrl}
                  onContact={listing ? () => trackEvent(listing.id, "message_sent") : undefined}
                />
              </div>

              <div className="mt-6">
                <AiInsightsPanel lang={lang} listing={listing as any} allListings={SAMPLE_LISTINGS as any} />
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