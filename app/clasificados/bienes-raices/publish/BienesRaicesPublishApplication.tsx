"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { clearAllClassifiedsDrafts, RULES_CONFIRMED_KEY, getStoredDraftId, setStoredDraftId, clearStoredDraftId } from "@/app/clasificados/lib/classifiedsDraftStorage";
import { setPreviewDraft } from "@/app/clasificados/lib/previewListingDraft";
import {
  createDraft,
  updateDraft,
  getDraft,
  getDraftsForCategory,
  getLatestDraftForCategory,
  deleteDraftInDb,
  type DraftDataPayload,
  type ListingDraftRow,
} from "@/app/clasificados/lib/listingDraftsDb";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { getPublishCategoryFields } from "@/app/clasificados/config/publishCategoryFields";
import { getStepOrderForCategory } from "@/app/clasificados/config/categorySchema";
import { BUSINESS_META_KEYS } from "@/app/clasificados/config/businessListingContract";
import { buildNegocioRedesPayload, formatUsPhone10 } from "@/app/clasificados/bienes-raices/negocio/utils/brNegocioContactHelpers";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaTwitter, FaYoutube } from "react-icons/fa";
import {
  BIENES_RAICES_SUBCATEGORIES,
  BR_PROPERTY_TYPE_OPTIONS,
} from "@/app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy";
import {
  BR_COMODIDADES_OPTIONS,
  BR_PRIVATE_COPY_PROFILES,
  getBrSubcategoriaFromPropertyType,
  isBrPrivadoComercial,
  isBrPrivadoEdificio,
  isBrPrivadoLote,
  isBrPrivadoProyectoNuevo,
  isBrPrivadoResidential,
  type BrSubcategoriaKey,
} from "@/app/clasificados/bienes-raices/privado/publish/brPrivadoPublishConstants";
import {
  brNegocioDigitsOnly,
  formatBrNegocioIntegerInputDisplay,
  formatBrNegocioPriceInputDisplay,
} from "@/app/clasificados/bienes-raices/negocio/publish/brNegocioPublishFormatting";
import {
  BR_NEGOCIO_PRICE_MONTHLY,
  BR_NEGOCIO_PRICE_WEEKLY,
  BR_PRIVADO_PRICE_PER_POST,
} from "@/app/clasificados/bienes-raices/shared/publish/brPublishPricing";
import { buildPublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import {
  coalesceNegocioAgenteFromWizard,
  coalesceNegocioNombreFromWizard,
  coalesceWizardDetailValue,
} from "@/app/clasificados/lib/legacyWizardCoalesce";
import { LEGACY_WIZARD_BR_DETAIL } from "@/app/clasificados/lib/legacyWizardDraftKeys";
import { stripLegacySharedWizardBrKeys } from "@/app/clasificados/lib/stripLegacySharedWizardBrKeys";
import { BienesRaicesNegocioPublishShell } from "@/app/clasificados/bienes-raices/negocio/publish/BienesRaicesNegocioPublishShell";
import { BienesRaicesPublishShell } from "@/app/clasificados/bienes-raices/shared/publish/BienesRaicesPublishShell";
import { BienesRaicesPublishTrackStep } from "@/app/clasificados/bienes-raices/shared/publish/BienesRaicesPublishTrackStep";
import { BienesRaicesNegocioFloorplanBlock } from "@/app/clasificados/bienes-raices/negocio/publish/BienesRaicesNegocioFloorplanBlock";
import { BienesRaicesNegocioMediaUrlFields } from "@/app/clasificados/bienes-raices/negocio/publish/BienesRaicesNegocioMediaUrlFields";
import { resolveBrNegocioAgentForPairs, resolveBrNegocioBusinessNameForPairs } from "@/app/clasificados/bienes-raices/negocio/mapping/brNegocioReadResolvers";
import { BienesRaicesNegocioBasicsWizard } from "@/app/clasificados/bienes-raices/negocio/publish/BienesRaicesNegocioBasicsWizard";
import { PrivateBrPreviewContent } from "@/app/clasificados/bienes-raices/privado/preview/PrivateBrPublishFullPreviewContent";
import { MediaStepContactCard } from "@/app/clasificados/publicar/components/MediaStepContactCard";
import { PublishMediaPreviewPanel } from "@/app/clasificados/publicar/components/PublishMediaPreviewPanel";
import { buildDetailsAppendix, getDetailPairs } from "@/app/clasificados/lib/publishDetailPairs";
import { computePublishRequirements } from "@/app/clasificados/lib/publishRequirements";
import {
  buildMissingBasicsRequirementsText,
  buildMissingRequirementsText,
  buildPublishRequirementItems,
  computeBasicsOk,
  getFirstBasicsInvalidElementId,
} from "@/app/clasificados/lib/publishRequirementChecklist";
import { buildFullPreviewListingData } from "@/app/clasificados/lib/buildFullPreviewListingData";
import {
  buildCompactBrPrivateDetailPairs,
  buildPublishPreviewDisplayStrings,
} from "@/app/clasificados/lib/publishPreviewStrings";
import {
  buildPreviewPublishReturnPath,
  executeClosePublishFullPreviewModal,
  executeFullPreviewConfirmPublish,
  getFullPreviewVariantOnOpen,
} from "@/app/clasificados/lib/publishPreviewModalHelpers";
import { CA_CITIES, CITY_ALIASES } from "@/app/data/locations/norcal";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { MediaUploader } from "@/app/clasificados/components/MediaUploader";
import ListingView from "@/app/clasificados/components/ListingView";

type Lang = "es" | "en";
type PublishStep = "category" | "rentas-track" | "bienes-raices-track" | "basics" | "details" | "media";

type DraftV1 = {
  v: 1;
  step: PublishStep;
  title: string;
  description: string;
  isFree: boolean;
  price: string;
  city: string;
  category: string;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  updatedAt: string;
};

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64 ?? "");
    };
    r.onerror = () => reject(new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

/** Full data URL for an image file. Used in preview draft so images survive navigation (blob URLs are revoked on unmount). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string) ?? "");
    r.onerror = () => reject(new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

function formatMoneyMaybe(raw: string, lang: Lang) {
  const cleaned = (raw ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return "";
  try {
    return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function formatPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

function formatPhoneDisplay(raw: string): string {
  const digits = formatPhoneDigits(raw);
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  sacramento: { lat: 38.5816, lng: -121.4944 },
  "san jose": { lat: 37.3382, lng: -121.8863 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  oakland: { lat: 37.8044, lng: -122.2712 },
  berkeley: { lat: 37.8715, lng: -122.273 },
  fremont: { lat: 37.5483, lng: -121.9886 },
  stockton: { lat: 37.9577, lng: -121.2908 },
  modesto: { lat: 37.6391, lng: -120.9969 },
  "palo alto": { lat: 37.4419, lng: -122.143 },
  "santa clara": { lat: 37.3541, lng: -121.9552 },
  sunnyvale: { lat: 37.3688, lng: -122.0363 },
  hayward: { lat: 37.6688, lng: -122.0808 },
  concord: { lat: 37.978, lng: -122.0311 },
  vallejo: { lat: 38.1041, lng: -122.2566 },
  "san leandro": { lat: 37.7249, lng: -122.1561 },
};

function normalizeCityKey(input: string): string {
  return stripDiacritics((input ?? "").trim().toLowerCase()).replace(/\s+/g, " ").trim();
}

function getCityCoords(cityName: string): { lat: number; lng: number } | null {
  const key = normalizeCityKey(cityName);
  if (!key) return null;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const record = CA_CITIES.find(
    (r) => normalizeCityKey(r.city) === key || r.aliases?.some((a) => normalizeCityKey(a) === key)
  );
  return record ? { lat: record.lat, lng: record.lng } : null;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRoughDistanceMiles(viewerCity: string, listingCity: string): number | null {
  const a = getCityCoords(viewerCity);
  const b = getCityCoords(listingCity);
  if (!a || !b) return null;
  return haversineMiles(a.lat, a.lng, b.lat, b.lng);
}

function getRoughDistanceLabel(viewerCity: string, listingCity: string, lang: "es" | "en"): string {
  const miles = getRoughDistanceMiles(viewerCity, listingCity);
  if (miles === null) {
    return lang === "es"
      ? "Agrega una ciudad reconocida para estimar distancia"
      : "Enter a recognized city to estimate distance";
  }
  return lang === "es"
    ? `Aproximadamente a ${Math.round(miles)} millas de ti`
    : `Approximately ${Math.round(miles)} miles from you`;
}

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}


function parseIsoMaybe(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function isoPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function stripDiacritics(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toCityKey(raw: string): string {
  return stripDiacritics((raw || "").trim().toLowerCase())
    .replace(/[.,']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCity(raw: string): string {
  const key = toCityKey(raw);
  if (!key) return "";
  const fromAlias = CITY_ALIASES[key];
  if (fromAlias) return fromAlias;
  for (const record of CA_CITIES) {
    if (toCityKey(record.city) === key) return record.city;
    if (record.aliases?.some((a) => toCityKey(a) === key)) return record.city;
  }
  return "";
}

function getStableSessionId(userId: string | null): string {
  if (userId) return userId;
  if (typeof window === "undefined") return "ssr";
  const key = "leonix_listing_draft_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}


export default function BienesRaicesPublishApplication() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ category?: string }>();

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const slugFromUrl = (params?.category ?? "").trim().toLowerCase();
  /** BR publish route is always this category; branch (privado|negocio) is decided in-track, not here. */
  const categoryFromUrl: CategoryKey = "bienes-raices";
  const showFormPlaceholder = slugFromUrl !== "" && normalizeCategory(params?.category ?? "") === "";

  // Prefill support (used by category-specific pre-forms like Restaurants)
  const prefill = useMemo(() => {
    const get = (k: string) => (searchParams?.get(k) ?? "").trim();
    const bizName = get("bizName") || get("name");
    const placeType = get("placeType");
    const cuisine = get("cuisine");
    const prefillCity = normalizeCity(get("city"));
    const phone = get("phone");
    const website = get("website");
    const notes = get("notes");
    return { bizName, placeType, cuisine, city: prefillCity, phone, website, notes };
  }, [searchParams]);

  const redirectForLogin = useMemo(() => {
    const slug = categoryFromUrl || "bienes-raices";
    const qs = searchParams?.toString() ?? "";
    const here = qs
      ? `/clasificados/publicar/${slug}?${qs}`
      : `/clasificados/publicar/${slug}?lang=${lang}`;
    return safeInternalRedirect(here) || `/clasificados/publicar/${slug}?lang=${lang}`;
  }, [lang, searchParams, categoryFromUrl]);

  /** Sync draftId in URL (canonical source for which draft is being edited). Preserves lang and other params. */
  const syncDraftIdInUrl = useCallback(
    (draftId: string | null) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      if (draftId) p.set("draftId", draftId);
      else p.delete("draftId");
      const qs = p.toString();
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "bienes-raices"}`;
      router.replace(qs ? `${path}?${qs}` : path);
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  const [step, setStep] = useState<PublishStep>(() => {
    const steps: PublishStep[] = ["bienes-raices-track", "basics", "media"];
    const s = searchParams?.get("step")?.trim();
    if (s === "category" || s === "rentas-track") return "bienes-raices-track";
    if (
      s &&
      (["bienes-raices-track", "basics", "media"] as const).includes(s as "bienes-raices-track" | "basics" | "media") &&
      steps.includes(s as PublishStep)
    ) {
      return s as PublishStep;
    }
    if (s === "details") return "media";
    return "bienes-raices-track";
  });
  const [category, setCategory] = useState<CategoryKey | "">(() => categoryFromUrl);

  /** BR: track (privado|negocio) → basics → media — no shared category picker step. */
  const stepsForCategory = useMemo((): PublishStep[] => ["bienes-raices-track", "basics", "media"], []);

  /** Previous logical step for in-app Back. Returns null only when already at category. */
  const getPreviousStep = useCallback((): PublishStep | null => {
    const idx = stepsForCategory.indexOf(step);
    if (idx <= 0) return null;
    return stepsForCategory[idx - 1];
  }, [stepsForCategory, step]);

  /** Options for step URL sync when category is bienes-raices (branch in query). */
  type StepSyncOptions = { branch?: "privado" | "negocio" };

  /** Sync step into URL query (preserves lang, draftId, etc.). For BR, includes branch= when set. Replace = no new history entry. scroll: false to avoid double scroll. */
  const syncStepInUrl = useCallback(
    (newStep: PublishStep, options?: StepSyncOptions) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("step", newStep);
      if (categoryFromUrl === "bienes-raices") {
        const br = (options?.branch ?? (detailsRefForBrBranch.current?.bienesRaicesBranch ?? "").trim().toLowerCase());
        if (br === "privado" || br === "negocio") p.set("branch", br);
        else p.delete("branch");
      }
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "bienes-raices"}`;
      router.replace(`${path}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** Push step to URL so browser Back has a previous step in the flow. For BR, includes branch= when set. Use when user navigates forward (goToStep). scroll: false so we scroll once in goToStep. */
  const syncStepInUrlPush = useCallback(
    (newStep: PublishStep, options?: StepSyncOptions) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("step", newStep);
      if (categoryFromUrl === "bienes-raices") {
        const br = (options?.branch ?? (detailsRefForBrBranch.current?.bienesRaicesBranch ?? "").trim().toLowerCase());
        if (br === "privado" || br === "negocio") p.set("branch", br);
        else p.delete("branch");
      }
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "bienes-raices"}`;
      router.push(`${path}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** BR only: set or update branch= in URL (replace). Use when user selects Negocio so URL reflects before next step. */
  const syncBrBranchInUrl = useCallback(
    (branch: "privado" | "negocio") => {
      if (categoryFromUrl !== "bienes-raices") return;
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("branch", branch);
      const path = pathname ?? `/clasificados/publicar/bienes-raices`;
      router.replace(`${path}?${p.toString()}`);
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** When true, step→URL effect should skip (we just pushed in goToStep). */
  const skipStepSyncRef = useRef(false);

  /** BR branch for URL sync (details is declared later; we read this in syncStepInUrl/syncStepInUrlPush). */
  const detailsRefForBrBranch = useRef<Record<string, string>>({});

  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [sellerDisplayName, setSellerDisplayName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isPro, setIsPro] = useState(false);

  // Free listing rules: 7 days, 3 photos, no video, no boosts. Free reposts: 2 max.
  const FREE_REPOST_LIMIT = 2;
  const [videoFiles, setVideoFiles] = useState<[File | null, File | null]>([null, null]);
  const [videoThumbBlobs, setVideoThumbBlobs] = useState<[Blob | null, Blob | null]>([null, null]);
  const [videoErrors, setVideoErrors] = useState<[string, string]>(["", ""]);
  const [expandedVideoIndex, setExpandedVideoIndex] = useState<0 | 1 | null>(null);
  const [previewViewed, setPreviewViewed] = useState(false);

  useEffect(() => {
    setCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Invalid category slug: send to Clasificados hub (do not force a default publish category like en-venta).
  useEffect(() => {
    if (slugFromUrl === "" || normalizeCategory(params?.category ?? "") !== "") return;
    const p = new URLSearchParams();
    p.set("lang", lang);
    router.replace(`/clasificados?${p.toString()}`);
  }, [slugFromUrl, params?.category, lang, router]);

  useEffect(() => {
    if (searchParams?.get("fromPreview") === "1") setPreviewViewed(true);
  }, [searchParams]);

  // Derive step from URL when it changes (initial load and browser Back/Forward). Keeps app step and URL in sync. Skip step->URL effect so we don't replace again (no loop, no extra scroll).
  const stepsForCategoryRef = useRef(stepsForCategory);
  stepsForCategoryRef.current = stepsForCategory;
  useEffect(() => {
    const urlStep = searchParams?.get("step")?.trim();
    if (!urlStep || !VALID_STEPS.includes(urlStep as PublishStep)) return;
    const steps = stepsForCategoryRef.current;
    if (!steps.includes(urlStep as PublishStep)) return;
    skipStepSyncRef.current = true;
    setStep(urlStep as PublishStep);
  }, [searchParams]);

  // BR only: hydrate branch from URL so details.bienesRaicesBranch and ?branch= stay in sync (load, refresh, restore).
  useEffect(() => {
    if (categoryFromUrl !== "bienes-raices") return;
    const urlBranch = searchParams?.get("branch")?.trim().toLowerCase();
    if (urlBranch !== "privado" && urlBranch !== "negocio") return;
    setDetails((prev) => {
      const cur = (prev?.bienesRaicesBranch ?? "").trim().toLowerCase();
      if (cur === urlBranch) return prev;
      return { ...prev, bienesRaicesBranch: urlBranch };
    });
  }, [categoryFromUrl, searchParams]);

  // When step changes in-app, sync step to URL (replace). Skip when we just pushed in goToStep or when URL already matches (avoids re-run on searchParams change and double sync).
  useEffect(() => {
    if (skipStepSyncRef.current) {
      skipStepSyncRef.current = false;
      return;
    }
    if (searchParams?.get("step") === step) return;
    syncStepInUrl(step);
    // Intentionally omit searchParams from deps so we don't re-run when replace() updates the URL and causes a jump.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, syncStepInUrl]);

  type ServicesPackage = "" | "standard" | "plus";
  const [servicesPackage, setServicesPackage] = useState<ServicesPackage>("");
  const [showServicesGate, setShowServicesGate] = useState(false);
  /** After user clicks “Siguiente”, show strong validation styling for that step (publish flow only). */
  const [publishNextAttempted, setPublishNextAttempted] = useState<Partial<Record<PublishStep, boolean>>>({});

  // Restaurants do not require a listing price in our flow (treated as Free by default)
  useEffect(() => {
    if (category === "restaurantes") {
      setIsFree(true);
      setPrice("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const stepOrder: PublishStep[] = getStepOrderForCategory(category || "bienes-raices");
  const safeStepForProgress: PublishStep = categoryFromUrl === "bienes-raices" && step === "details" ? "media" : step;
  const currentStepIndex = Math.max(0, stepOrder.indexOf(safeStepForProgress));

  // BR has no details step; normalize ?step=details or stray step state to media so BR never lands on the legacy details screen.
  useEffect(() => {
    if (categoryFromUrl !== "bienes-raices") return;
    const urlStep = searchParams?.get("step")?.trim();
    if (urlStep === "details" || step === "details") {
      skipStepSyncRef.current = true;
      setStep("media");
      syncStepInUrl("media");
    }
  }, [categoryFromUrl, searchParams, step, syncStepInUrl]);

  // Details (category-specific structured fields)
  const [details, setDetails] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    // Pre-fill from category pre-forms (e.g., Restaurants)
    if (prefill.placeType) d["placeType"] = prefill.placeType;
    if (prefill.cuisine) d["cuisine"] = prefill.cuisine;
    if (prefill.website) d["website"] = prefill.website;
    if (prefill.notes) d["notes"] = prefill.notes;
    return d;
  });
  detailsRefForBrBranch.current = details;
  // Basics
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>(() => {
    if (prefill.notes) return prefill.notes;
    return "";
  });
  const [isFree, setIsFree] = useState<boolean>(false);
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState<string>(() => prefill.city || "");

  // Media + contact
  const [contactMethod, setContactMethod] = useState<"phone" | "email" | "both">("both");
  const [contactPhone, setContactPhone] = useState<string>(() => formatPhoneDisplay(prefill.phone || ""));
  const [contactEmail, setContactEmail] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  /** Rentas Privado is Pro-only; no free/pro comparison. */
  const isRentasPrivado = false;
  /** Bienes Raíces negocio gets premium media (12 images, 1 video) like Rentas premium. */
  const isBienesRaicesNegocio =
    categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio";
  /** Private BR: sale-by-owner; single preview CTA, no free/pro comparison. */
  const isBienesRaicesPrivado = categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "privado";
  const effectiveIsPro = isPro || isRentasPrivado || isBienesRaicesNegocio;
  const maxImages = 12;

  // If plan changes to Free, trim images to Free limit (3). Rentas Privado and private BR keep higher limits.
  useEffect(() => {
    if (!effectiveIsPro && !isBienesRaicesPrivado && images.length > 3) {
      setImages((prev) => prev.slice(0, 3));
    }
  }, [effectiveIsPro, isBienesRaicesPrivado, images.length]);

  const proVideoThumbPreviewUrls: [string, string] = useMemo(() => {
    const out: [string, string] = ["", ""];
    videoThumbBlobs.forEach((blob, i) => {
      if (blob) try { out[i] = URL.createObjectURL(blob); } catch {}
    });
    return out;
  }, [videoThumbBlobs]);

  const proVideoPreviewUrls: [string, string] = useMemo(() => {
    const out: [string, string] = ["", ""];
    videoFiles.forEach((file, i) => {
      if (file) try { out[i] = URL.createObjectURL(file); } catch {}
    });
    return out;
  }, [videoFiles]);

  useEffect(() => {
    return () => {
      proVideoThumbPreviewUrls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
      proVideoPreviewUrls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
    };
  }, [proVideoThumbPreviewUrls, proVideoPreviewUrls]);

  // Publish
  const [publishError, setPublishError] = useState<string>("");
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishedId, setPublishedId] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showDraftRestoreModal, setShowDraftRestoreModal] = useState<boolean>(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState<boolean>(false);
  const [fullPreviewVariant, setFullPreviewVariant] = useState<"free" | "pro">("free");
  /** Pro comparison: which benefit is highlighted in the preview (e.g. "more-photos", "pro-video"). */
  const [proHighlightId, setProHighlightId] = useState<string | null>(null);
  const [fullPreviewRulesConfirmed, setFullPreviewRulesConfirmed] = useState<boolean>(false);
  const [fullPreviewInfoConfirmed, setFullPreviewInfoConfirmed] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [saveProgressing, setSaveProgressing] = useState<boolean>(false);
  const [leaveSaving, setLeaveSaving] = useState<boolean>(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [dbSaveStatus, setDbSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [recoveredDraftMessage, setRecoveredDraftMessage] = useState<string | null>(null);
  const draftCheckedRef = useRef(false);
  const saveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbSaveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDbSaveRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);
  /** When true, session gate must NOT redirect to login (preview is open; keep user on publish flow). */
  const fullPreviewModalOpenRef = useRef<boolean>(false);
  const sessionGateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rulesConfirmed, setRulesConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(RULES_CONFIRMED_KEY) === "1";
  });
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [agentPhotoUploading, setAgentPhotoUploading] = useState(false);
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);

  const setRulesConfirmedPersisted = (value: boolean) => {
    setRulesConfirmed(value);
    if (typeof window !== "undefined") {
      if (value) sessionStorage.setItem(RULES_CONFIRMED_KEY, "1");
      else sessionStorage.removeItem(RULES_CONFIRMED_KEY);
    }
  };

  /** Upload business logo or agent photo to listing-images; store public URL in details. Used by BR negocio and Rentas negocio. */
  const uploadBusinessImage = useCallback(
    async (file: File, kind: "logo" | "agent") => {
      if (!userId) return;
      const setBusy = kind === "logo" ? setLogoUploading : setAgentPhotoUploading;
      const key = kind === "logo" ? "negocioLogoUrl" : "negocioFotoAgenteUrl";
      setBusy(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const rawExt = (file.name.split(".").pop() || "jpg").toLowerCase();
        const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";
        const path = `${userId}/drafts/business-${kind}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
        if (error) throw error;
        const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
        setDetails((prev) => ({ ...prev, [key]: url }));
      } catch (e: unknown) {
        console.warn("business image upload failed", e);
        if (typeof window !== "undefined") alert(lang === "es" ? "No se pudo subir la imagen. Intenta de nuevo." : "Upload failed. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [userId, lang]
  );

  /** Upload BR negocio floorplan asset (image/pdf) and store public URL in details.negocioFloorPlanUrl. */
  const uploadBusinessFloorPlan = useCallback(
    async (file: File) => {
      if (!userId) return;
      setFloorPlanUploading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const rawExt = (file.name.split(".").pop() || "pdf").toLowerCase();
        const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : "pdf";
        const path = `${userId}/drafts/business-floorplan-${Date.now()}.${ext}`;
        const isPdf = ext === "pdf" || file.type === "application/pdf";
        const contentType =
          file.type && file.type !== "application/octet-stream"
            ? file.type
            : isPdf
              ? "application/pdf"
              : "image/jpeg";
        const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true, contentType });
        if (error) throw error;
        const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
        setDetails((prev) => ({ ...prev, negocioFloorPlanUrl: url }));
      } catch (e: unknown) {
        console.warn("floorplan upload failed", e);
        if (typeof window !== "undefined") {
          alert(lang === "es" ? "No se pudo subir el plano. Intenta de nuevo." : "Floorplan upload failed. Please try again.");
        }
      } finally {
        setFloorPlanUploading(false);
      }
    },
    [userId, lang]
  );

  const draftTimer = useRef<number | null>(null);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const categoryActionsRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef<PublishStep | null>(null);
  const confirmPublishTriggered = useRef(false);

  /** Category-scoped so BR draft never overwrites En Venta draft (and vice versa). */
  const draftKey = useMemo(
    () => `listing_draft_${getStableSessionId(userId || null)}_${categoryFromUrl || "unknown"}`,
    [userId, categoryFromUrl]
  );

  function scrollFormToTop(behavior: ScrollBehavior = "smooth") {
    if (typeof window === "undefined") return;

    const navbarEl = document.querySelector("[data-navbar-root]");
    const navbarHeight = navbarEl ? navbarEl.getBoundingClientRect().height : 0;
    const gapBelowNavbar = 16;
    const offset = navbarHeight > 0 ? navbarHeight + gapBelowNavbar : 72;

    if (topAnchorRef.current) {
      const rect = topAnchorRef.current.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top - offset;
      window.scrollTo({
        top: Math.max(0, absoluteTop),
        behavior,
      });
      return;
    }

    window.scrollTo({ top: 0, behavior });
  }

  /** Navigate to a step: push URL so browser Back has history; scroll form to top. Use for forward step navigation only. For Back use handleBack(). Options.branch for BR when step is set before details has committed. */
  const goToStep = useCallback(
    (newStep: PublishStep, options?: StepSyncOptions) => {
      skipStepSyncRef.current = true;
      setStep(newStep);
      syncStepInUrlPush(newStep, options);
      requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
    },
    [syncStepInUrlPush]
  );

  /** In-app Atrás: always go to the real previous step in the flow (setStep + replace URL). Never router.back() so we never leave the publish flow. */
  const handleBack = useCallback(() => {
    const prev = getPreviousStep();
    if (!prev) return;
    skipStepSyncRef.current = true;
    setStep(prev);
    syncStepInUrl(prev);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
  }, [getPreviousStep, setStep, syncStepInUrl]);

  function scrollCategoryActionsIntoView() {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      const el = categoryActionsRef.current;
      const isShortViewport = window.innerHeight <= 700;
      if (el && isShortViewport) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    });
  }

  // Scroll only in goToStep and handleBack to avoid double scroll and passive URL-restore scroll.
  // (previousStepRef kept for any future use; no scroll-on-step-change here.)

  // Session gate: redirect to login if not authenticated; fail-safe timeout so "Verificando sesión…" never hangs.
  const SESSION_GATE_TIMEOUT_MS = 8000;
  useEffect(() => {
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e: any) {
      setAuthError(
        (e?.message as string) ||
          (lang === "es"
            ? "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)."
            : "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).")
      );
      setChecking(false);
      return;
    }

    let mounted = true;
    const loginUrl = () => `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(redirectForLogin)}`;

    const clearTimeoutAndRedirectToLogin = () => {
      if (fullPreviewModalOpenRef.current) {
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("[publish session gate] skip redirect: preview modal is open");
        }
        return;
      }
      if (sessionGateTimeoutRef.current) {
        clearTimeout(sessionGateTimeoutRef.current);
        sessionGateTimeoutRef.current = null;
      }
      setChecking(false);
      router.replace(loginUrl());
    };

    sessionGateTimeoutRef.current = setTimeout(() => {
      sessionGateTimeoutRef.current = null;
      if (!mounted) return;
      clearTimeoutAndRedirectToLogin();
    }, SESSION_GATE_TIMEOUT_MS);

    async function check() {
      try {
        const { data } = await withAuthTimeout(
          supabase!.auth.getUser(),
          AUTH_CHECK_TIMEOUT_MS
        );
        if (!mounted) return;
        if (sessionGateTimeoutRef.current) {
          clearTimeout(sessionGateTimeoutRef.current);
          sessionGateTimeoutRef.current = null;
        }

        if (!data.user) {
          if (fullPreviewModalOpenRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.log("[publish session gate] skip redirect (no user): preview modal is open");
            }
            return;
          }
          setChecking(false);
          router.replace(loginUrl());
          return;
        }

        const meta = data.user.user_metadata || {};
        const profilePhoneDigits = (meta.phone || meta.contact_phone || "").toString().replace(/\D/g, "");
        const profileCityCanonical = normalizeCity((meta.city || meta.location || "").toString().trim());
        const profileCompleteForPost = profilePhoneDigits.length === 10 && Boolean(profileCityCanonical);
        if (!profileCompleteForPost) {
          if (fullPreviewModalOpenRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.log("[publish session gate] skip redirect (profile): preview modal is open");
            }
            return;
          }
          setChecking(false);
          const perfilUrl = `/dashboard/perfil?lang=${lang}&require=post&redirect=${encodeURIComponent(redirectForLogin)}`;
          router.replace(perfilUrl);
          return;
        }

        setUserId(data.user.id);
        setSignedIn(true);
        const name = (meta.full_name ?? meta.name ?? meta.fullName ?? "").toString().trim();
        setSellerDisplayName(name || "");

        const planRaw =
          (data.user.user_metadata?.leonix_plan as string | undefined) ||
          (data.user.user_metadata?.plan as string | undefined) ||
          (data.user.app_metadata?.plan as string | undefined) ||
          "";
        const plan = String(planRaw).toLowerCase();
        setIsPro(plan.includes("pro"));

        setChecking(false);
      } catch {
        if (!mounted) return;
        if (fullPreviewModalOpenRef.current) {
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("[publish session gate] skip redirect (catch): preview modal is open");
          }
          return;
        }
        if (sessionGateTimeoutRef.current) {
          clearTimeout(sessionGateTimeoutRef.current);
          sessionGateTimeoutRef.current = null;
        }
        setChecking(false);
        router.replace(loginUrl());
      }
    }

    check();

    return () => {
      mounted = false;
      if (sessionGateTimeoutRef.current) {
        clearTimeout(sessionGateTimeoutRef.current);
        sessionGateTimeoutRef.current = null;
      }
    };
  }, [router, redirectForLogin, lang]);

  const copy = useMemo(
    () => ({
      es: {
        title: "Publicar tu anuncio",
        subtitle: "Publica con claridad. Mientras más completo, más confianza y mejores resultados.",
        brTitle: "Bienes Raíces en Leonix",
        brSubtitle:
          "Listados pensados para el Norte de California: elige si publicas como propietario o como negocio, completa la ficha y revisa una vista previa lista para publicar.",
        brSteps: {
          "bienes-raices-track": "Perfil",
          basics: "La propiedad",
          media: "Revisar y publicar",
        },
        steps: { category: "Categoría", "rentas-track": "Rama", "bienes-raices-track": "Tipo de anunciante", basics: "Básicos", details: "Detalles", media: "Media + Contacto + Vista previa" },
        deleteDraft: "Eliminar progreso guardado",
        basicsTitle: "Básicos",
        categoryTitle: "Elige la categoría",
        categoryNote: "Esto asegura que tu anuncio salga en el lugar correcto y muestre los campos adecuados.",
        fieldTitle: "Título",
        fieldDesc: "Descripción",
        fieldPrice: "Precio",
        freeToggle: "Gratis",
        fieldCity: "Ciudad",
        next: "Siguiente",
        back: "Atrás",
        detailsTitle: "Detalles (por categoría)",
        detailsNote:
          "Agrega solo lo que aplica. Estos detalles ayudan a que tu anuncio se vea más profesional.",
        mediaTitle: "Media + Contacto",
        images: "Fotos (mínimo 1)",
        addImages: "Agregar fotos",
        video: "Videos (Pro, hasta 2 por anuncio)",
        addVideo: "Agregar video",
        videoHint: "Hasta 2 videos por anuncio. Máx 15s, 1080p, ~75MB.",
        rentasPrivadoVideo: "Video (Pro, hasta 1 por anuncio)",
        rentasPrivadoVideoHint: "Hasta 1 video. Máx 15s, 1080p, ~75MB.",
        videoLocked: "Desbloquea video con LEONIX Pro.",
        contact: "Método de contacto",
        phone: "Teléfono",
        email: "Email",
        both: "Ambos",
        publish: "Publicar",
        publishing: "Publicando anuncio…",
        rulesConfirm: "Confirmo que mi anuncio cumple con las reglas de la comunidad.",
        errorTitle: "Error al publicar anuncio",
        successTitle: "Anuncio publicado",
        goToMyListings: "Ir a mis anuncios",
        preview: "Vista previa",
        cardPreview: "Tarjeta (grid)",
        detailPreview: "Detalle",
        requiredHint: "Requisitos: Categoría + Título + Descripción + Precio/Gratis + Ciudad + 1 foto + Contacto.",
        published: "¡Listo! Tu anuncio fue publicado.",
        viewListing: "Ver anuncio",
        needReqs: "Revisa los requisitos antes de publicar.",
        checking: "Verificando sesión…",
        todayLabel: "Publicado hoy",
        saveLabel: "Guardar",
        shareLabel: "Compartir",
        contactLabel: "Contactar",
        fullPreviewCta: "Ver versión gratis",
        viewYourListingCta: "Ver tu anuncio",
        fullPreviewTitle: "Vista completa del anuncio",
        fullPreviewBackToEdit: "Volver a editar",
        fullPreviewInfoConfirm: "Confirmo que la información es correcta.",
        fullPreviewConfirmPublish: "Confirmar y publicar",
        proPreviewCta: "Ver cómo se vería con Pro",
        proPreviewTitle: "Vista previa Pro",
        proPreviewUpgradeCta: "Mejorar a Pro",
        proPreviewBackToListing: "Volver a mi anuncio",
        proPreviewViewFreeCta: "Ver versión gratis",
        sendMessageLabel: "Enviar mensaje",
        contactHelperText: "Así verán los usuarios cómo pueden contactarte.",
        draftInProgress: "Tienes una aplicación en progreso",
        continueDraft: "Continuar con lo guardado",
        createNewAd: "Crear anuncio nuevo",
        createNewAdHint: "La aplicación actual se conserva; empezarás otro anuncio desde cero.",
        deleteCurrentApplication: "Eliminar aplicación actual",
        deleteApplication: "Eliminar aplicación",
        leaveSaveDraft: "Guardar progreso y salir",
        leaveConfirmTitle: "¿Salir de la publicación?",
        leaveKeepEditing: "Seguir editando",
        exitLink: "Salir",
        saveProgress: "Guardar progreso",
        saveProgressSuccess: "Progreso guardado",
      },
      en: {
        title: "Post your ad",
        subtitle: "Post with clarity. The more complete it is, the more trust—and better results.",
        brTitle: "Real estate on Leonix",
        brSubtitle:
          "Built for Northern California: choose owner-led or business, complete your listing, and preview before you publish.",
        brSteps: {
          "bienes-raices-track": "Profile",
          basics: "Property",
          media: "Review & publish",
        },
        steps: { category: "Category", "rentas-track": "Track", "bienes-raices-track": "Seller type", basics: "Basics", details: "Details", media: "Media + Contact + Preview" },
        deleteDraft: "Delete application",
        basicsTitle: "Basics",
        categoryTitle: "Choose a category",
        categoryNote: "This ensures your listing appears in the right place and shows the right fields.",
        fieldTitle: "Title",
        fieldDesc: "Description",
        fieldPrice: "Price",
        freeToggle: "Free",
        fieldCity: "City",
        next: "Next",
        back: "Back",
        detailsTitle: "Details (per category)",
        detailsNote:
          "Add what applies. Structured details help buyers compare listings and trust what they see.",
        mediaTitle: "Media + Contact",
        images: "Photos (min 1)",
        addImages: "Add photos",
        video: "Videos (Pro, up to 2 per listing)",
        addVideo: "Add video",
        videoHint: "Up to 2 videos per listing. Max 15s, 1080p, ~75MB.",
        rentasPrivadoVideo: "Video (Pro, up to 1 per listing)",
        rentasPrivadoVideoHint: "Up to 1 video. Max 15s, 1080p, ~75MB.",
        videoLocked: "Unlock video with LEONIX Pro.",
        contact: "Contact method",
        phone: "Phone",
        email: "Email",
        both: "Both",
        publish: "Publish",
        publishing: "Publishing listing…",
        rulesConfirm: "I confirm that my listing complies with the community rules.",
        errorTitle: "Error publishing listing",
        successTitle: "Listing published",
        goToMyListings: "Go to my listings",
        preview: "Preview",
        cardPreview: "Card (grid)",
        detailPreview: "Detail",
        requiredHint: "Requirements: Category + Title + Description + Price/Free + City + 1 photo + Contact.",
        published: "Done! Your listing is live.",
        viewListing: "View listing",
        needReqs: "Please meet the requirements before publishing.",
        checking: "Checking session…",
        todayLabel: "Posted today",
        saveProgress: "Save progress",
        saveProgressSuccess: "Progress saved",
        saveLabel: "Save",
        shareLabel: "Share",
        contactLabel: "Contact",
        fullPreviewCta: "View free version",
        viewYourListingCta: "View your listing",
        fullPreviewTitle: "Full listing preview",
        fullPreviewBackToEdit: "Back to edit",
        fullPreviewInfoConfirm: "I confirm the information is correct.",
        fullPreviewConfirmPublish: "Confirm & Publish",
        proPreviewCta: "See how it would look with Pro",
        proPreviewTitle: "Pro preview",
        proPreviewUpgradeCta: "Upgrade to Pro",
        proPreviewBackToListing: "Back to my listing",
        proPreviewViewFreeCta: "View free version",
        sendMessageLabel: "Send message",
        contactHelperText: "This is how users will see how to contact you.",
        draftInProgress: "You have an application in progress",
        continueDraft: "Continue with saved draft",
        createNewAd: "Create new ad",
        createNewAdHint: "Your current application is kept; you'll start a separate ad from scratch.",
        deleteCurrentApplication: "Delete current application",
        deleteApplication: "Delete application",
        leaveConfirmTitle: "Leave publish flow?",
        leaveSaveDraft: "Save progress and exit",
        leaveKeepEditing: "Keep editing",
        exitLink: "Exit",
      },
    }),
    []
  )[lang];

  const IMAGES_RESTORE_KEY = "leonix_listing_draft_images_restore";

  const VALID_STEPS: PublishStep[] = ["bienes-raices-track", "basics", "details", "media"];

  /** Restore form + images from DB draft_data payload. Restores saved step; fallback to basics (not category) for existing draft resume. */
  function applyDraftPayloadFromDb(payload: DraftDataPayload) {
    applyDraftToForm(payload as Partial<DraftV1>);
    if (payload.step && VALID_STEPS.includes(payload.step as PublishStep)) {
      setStep(payload.step as PublishStep);
    } else {
      setStep("basics");
    }
    if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < payload.images.length; i++) {
        const img = payload.images[i];
        const b64 = img?.base64 ?? "";
        const name = img?.name || `image-${i + 1}.jpg`;
        const type = img?.type || "image/jpeg";
        if (!b64) continue;
        try {
          const bin = atob(b64);
          const arr = new Uint8Array(bin.length);
          for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
          files.push(new File([new Blob([arr], { type })], name, { type }));
        } catch {
          // skip invalid image
        }
      }
      if (files.length) setImages(files);
    }
  }

  // When returning from Pro page: auto-restore draft and step. For signed-in users, prefer DB over localStorage.
  useEffect(() => {
    if (searchParams?.get("fromPro") !== "1" || draftKey === "listing_draft_ssr") return;
    const raw = localStorage.getItem(draftKey);
    const parsed = raw ? (() => { try { return JSON.parse(raw) as Partial<DraftV1>; } catch { return null; } })() : null;
    if (!parsed || parsed.v !== 1) return;

    let cancelled = false;
    if (signedIn && userId) {
      draftCheckedRef.current = true;
      (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const latest = await getLatestDraftForCategory(supabase, userId, "bienes-raices");
          if (!cancelled && latest?.draft_data) {
            applyDraftPayloadFromDb(latest.draft_data as DraftDataPayload);
            setDraftId(latest.id);
            setStoredDraftId(userId, latest.id);
            syncDraftIdInUrl(latest.id);
            return;
          }
        } catch {
          // fall through to localStorage fallback
        }
        if (!cancelled) {
          applyDraftToForm(parsed);
          setStep("basics");
          const stored = getStoredDraftId(userId);
          if (stored) setDraftId(stored);
        }
      })();
      return () => { cancelled = true; };
    }

    draftCheckedRef.current = true;
    applyDraftToForm(parsed);
    setStep("basics");
    if (userId) {
      const stored = getStoredDraftId(userId);
      if (stored) setDraftId(stored);
    }
  }, [searchParams, draftKey, userId, signedIn, categoryFromUrl, syncDraftIdInUrl]);

  // Re-entry: URL is source of truth for draft. First try draftId from URL (owned by user); then show restore modal if latest exists and URL has no draftId (no auto-hydrate).
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || draftCheckedRef.current) return;
    if (searchParams?.get("fromPro") === "1") return;

    if (!signedIn || !userId) {
      // Not signed in: local/session only; show modal only if local draft is for this category
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<DraftV1>;
          if (parsed.v === 1) {
            const parsedCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
            if (parsedCat === categoryFromUrl) setShowDraftRestoreModal(true);
          }
        } catch {
          // ignore
        }
      }
      return;
    }

    let cancelled = false;
    draftCheckedRef.current = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const categoryForQuery = categoryFromUrl || undefined;

        // 1) URL draftId first: load exact draft if present and owned. Stay category-scoped: if draft is for another category, redirect to that route.
        const urlDraftId = searchParams?.get("draftId")?.trim();
        if (urlDraftId) {
          const row = await getDraft(supabase, urlDraftId, userId);
          if (cancelled) return;
          if (row?.draft_data) {
            const payload = row.draft_data as DraftDataPayload & { category?: string };
            const draftCat = typeof payload?.category === "string" ? normalizeCategory(payload.category) : "";
            if (draftCat && draftCat !== categoryForQuery) {
              const p = new URLSearchParams(searchParams?.toString() ?? "");
              p.set("draftId", row.id);
              if (!p.has("lang")) p.set("lang", lang);
              router.replace(`/clasificados/publicar/${draftCat}?${p.toString()}`);
              return;
            }
            applyDraftPayloadFromDb(row.draft_data as DraftDataPayload);
            setDraftId(row.id);
            setStoredDraftId(userId, row.id);
            syncDraftIdInUrl(row.id);
            return;
          }
          // Invalid or not owned: strip from URL and fall through
          syncDraftIdInUrl(null);
        }

        // 2) No draftId in URL: Bienes Raíces auto-hydrate latest in-progress draft (e.g. return from /agente with returnTo missing draftId).
        // Only Start new / Eliminar aplicación should clear; do not leave an empty form behind a blocking modal.
        {
          const branchInUrl = searchParams?.get("branch")?.trim().toLowerCase();
          let pick: ListingDraftRow | null = null;
          if (branchInUrl === "privado" || branchInUrl === "negocio") {
            const rows = await getDraftsForCategory(supabase, userId, "bienes-raices", 20);
            if (cancelled) return;
            pick =
              rows.find(
                (row) =>
                  ((row.draft_data?.details as Record<string, string> | undefined)?.bienesRaicesBranch ?? "")
                    .trim()
                    .toLowerCase() === branchInUrl
              ) ?? null;
          }
          if (!pick) {
            pick = await getLatestDraftForCategory(supabase, userId, "bienes-raices");
          }
          if (cancelled) return;
          if (pick?.draft_data) {
            const payload = pick.draft_data as DraftDataPayload;
            applyDraftPayloadFromDb(payload);
            setDraftId(pick.id);
            setStoredDraftId(userId, pick.id);
            syncDraftIdInUrl(pick.id);
            const brSteps: PublishStep[] = ["bienes-raices-track", "basics", "media"];
            let restoredStep: PublishStep = "basics";
            if (categoryFromUrl === "bienes-raices" && payload.step === "details") {
              restoredStep = "media";
            } else if (payload.step && brSteps.includes(payload.step as PublishStep)) {
              restoredStep = payload.step as PublishStep;
            }
            setStep(restoredStep);
            const brBranch = (payload.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
            const branchOpt = brBranch === "privado" || brBranch === "negocio" ? { branch: brBranch as "privado" | "negocio" } : undefined;
            syncStepInUrl(restoredStep, branchOpt);
            setRecoveredDraftMessage(lang === "es" ? "Progreso guardado recuperado." : "Recovered saved progress.");
            return;
          }
        }

        // 3) No DB draft: fall back to local; show modal only if local draft is for this category
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DraftV1>;
          if (parsed.v === 1) {
            const parsedCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
            if (parsedCat === categoryFromUrl) setShowDraftRestoreModal(true);
          }
        }
      } catch {
        if (!cancelled) {
          syncDraftIdInUrl(null);
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Partial<DraftV1>;
              if (parsed.v === 1) setShowDraftRestoreModal(true);
            } catch {
              // ignore
            }
          }
          draftCheckedRef.current = true;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [draftKey, signedIn, userId, categoryFromUrl, searchParams, syncDraftIdInUrl, syncStepInUrl, router, lang]);

  /** Restore only form values from draft; step is not restored (avoids random step jumps). Never sync category from draft when it would differ from URL (route must be updated elsewhere first). */
  function applyDraftToForm(parsed: Partial<DraftV1>) {
    setTitle(typeof parsed.title === "string" ? parsed.title : "");
    setDescription(typeof parsed.description === "string" ? parsed.description : "");
    setIsFree(Boolean(parsed.isFree));
    setPrice(typeof parsed.price === "string" ? parsed.price : "");
    const loadedCity = typeof parsed.city === "string" ? parsed.city : "";
    setCity(loadedCity ? (normalizeCity(loadedCity) || loadedCity.trim()) : "");
    const draftCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
    if (draftCat && draftCat === categoryFromUrl) setCategory(draftCat);
    setDetails(typeof (parsed as any).details === "object" && (parsed as any).details ? ((parsed as any).details as Record<string, string>) : {});
    const method = parsed.contactMethod === "phone" || parsed.contactMethod === "email" || parsed.contactMethod === "both" ? parsed.contactMethod : "both";
    setContactMethod(method);
    setContactPhone(typeof parsed.contactPhone === "string" ? formatPhoneDisplay(parsed.contactPhone) : "");
    setContactEmail(typeof parsed.contactEmail === "string" ? parsed.contactEmail : "");
  }

  function resetFormToEmpty() {
    const d: Record<string, string> = {};
    if (prefill.placeType) d["placeType"] = prefill.placeType;
    if (prefill.cuisine) d["cuisine"] = prefill.cuisine;
    if (prefill.website) d["website"] = prefill.website;
    if (prefill.notes) d["notes"] = prefill.notes;
    setTitle("");
    setDescription(prefill.notes || "");
    setPrice("");
    setIsFree(false);
    setCity(prefill.city || "");
    setDetails(d);
    setContactMethod("both");
    setContactPhone(formatPhoneDisplay(prefill.phone || ""));
    setContactEmail("");
    setImages([]);
    setFilePreviews([]);
    setStep("bienes-raices-track");
    setCategory(categoryFromUrl);
  }

  useEffect(() => {
    if (!recoveredDraftMessage) return;
    const t = setTimeout(() => setRecoveredDraftMessage(null), 3000);
    return () => clearTimeout(t);
  }, [recoveredDraftMessage]);

  async function handleContinueDraft() {
    setShowDraftRestoreModal(false);
    try {
      if (draftId && userId) {
        const supabase = createSupabaseBrowserClient();
        const row = await getDraft(supabase, draftId, userId);
        if (row?.draft_data) {
          const payload = row.draft_data as DraftDataPayload & { category?: string };
          const draftCat = typeof payload?.category === "string" ? normalizeCategory(payload.category) : "";
          if (draftCat && draftCat !== categoryFromUrl) {
            const p = new URLSearchParams(searchParams?.toString() ?? "");
            p.set("draftId", draftId);
            if (!p.has("lang")) p.set("lang", lang);
            if (draftCat === "bienes-raices") {
              const stepVal = (payload as DraftDataPayload).step;
              if (stepVal && ["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"].includes(stepVal)) p.set("step", stepVal);
              const brBranch = (payload.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
              if (brBranch === "privado" || brBranch === "negocio") p.set("branch", brBranch);
            }
            router.replace(`/clasificados/publicar/${draftCat}?${p.toString()}`);
            return;
          }
          applyDraftPayloadFromDb(payload);
          const restoredStep = (categoryFromUrl === "bienes-raices" && payload.step === "details")
            ? "media"
            : (payload.step && (["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"] as const).includes(payload.step as PublishStep) && stepsForCategory.includes(payload.step as PublishStep)) ? (payload.step as PublishStep) : "basics";
          setStep(restoredStep);
          syncDraftIdInUrl(draftId);
          const brBranch = (payload.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
          const branchOpt = (brBranch === "privado" || brBranch === "negocio") ? { branch: brBranch as "privado" | "negocio" } : undefined;
          syncStepInUrl(restoredStep, branchOpt);
          setRecoveredDraftMessage(lang === "es" ? "Progreso guardado recuperado." : "Recovered saved progress.");
          return;
        }
      }
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DraftV1>;
      if (parsed.v !== 1) return;
      const parsedCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
      if (parsedCat && parsedCat !== categoryFromUrl) {
        const p = new URLSearchParams(searchParams?.toString() ?? "");
        if (!p.has("lang")) p.set("lang", lang);
        if (parsedCat === "bienes-raices") {
          const brBranch = (parsed.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
          if (brBranch === "privado" || brBranch === "negocio") p.set("branch", brBranch);
        }
        router.replace(`/clasificados/publicar/${parsedCat}?${p.toString()}`);
        return;
      }
      applyDraftToForm(parsed);
      setStep("basics");
      const localBrBranch = (parsed.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
      const localBranchOpt = (localBrBranch === "privado" || localBrBranch === "negocio") ? { branch: localBrBranch as "privado" | "negocio" } : undefined;
      syncStepInUrl("basics", localBranchOpt);
      try {
        const imgRaw = sessionStorage.getItem(draftKey + "_images");
        if (imgRaw) {
          const { base64: b64List, names, types } = JSON.parse(imgRaw) as { base64: string[]; names: string[]; types: string[] };
          if (Array.isArray(b64List) && Array.isArray(names) && b64List.length > 0) {
            const files: File[] = [];
            for (let i = 0; i < b64List.length; i++) {
              const b64 = b64List[i];
              const name = (names && names[i]) || `image-${i + 1}.jpg`;
              const type = (types && types[i]) || "image/jpeg";
              const bin = atob(b64);
              const arr = new Uint8Array(bin.length);
              for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
              files.push(new File([new Blob([arr], { type })], name, { type }));
            }
            if (files.length) setImages(files);
          }
        }
      } catch {
        // ignore image restore
      }
    } catch {
      // already closed modal
    }
  }

  function handleCreateNewAd() {
    setDraftId(null);
    if (userId) clearStoredDraftId(userId);
    resetFormToEmpty();
    setShowDraftRestoreModal(false);
    syncDraftIdInUrl(null);
    setStep("bienes-raices-track");
    syncStepInUrl("bienes-raices-track");
  }

  async function handleDeleteCurrentDraft() {
    if (draftId && userId) {
      try {
        const supabase = createSupabaseBrowserClient();
        await deleteDraftInDb(supabase, draftId, userId);
      } catch {
        // ignore
      }
      setDraftId(null);
      clearStoredDraftId(userId);
    }
    clearAllClassifiedsDrafts({ draftKey, userId });
    resetFormToEmpty();
    setShowDraftRestoreModal(false);
    syncDraftIdInUrl(null);
    setStep("bienes-raices-track");
    syncStepInUrl("bienes-raices-track");
  }

  // Restore images from sessionStorage when returning from preview (prevents form reset)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(IMAGES_RESTORE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(IMAGES_RESTORE_KEY);
      const { base64: b64List, names, types } = JSON.parse(raw) as { base64: string[]; names: string[]; types: string[] };
      if (!Array.isArray(b64List) || !Array.isArray(names) || b64List.length === 0) return;
      const files: File[] = [];
      for (let i = 0; i < b64List.length; i++) {
        const b64 = b64List[i];
        const name = (names && names[i]) || `image-${i + 1}.jpg`;
        const type = (types && types[i]) || "image/jpeg";
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
        const blob = new Blob([arr], { type });
        files.push(new File([blob], name, { type }));
      }
      if (files.length) setImages(files);
    } catch {
      sessionStorage.removeItem(IMAGES_RESTORE_KEY);
    }
  }, []);

  // When returning from preview with Confirm & Publish: set rules/preview state and run publish once.
  useEffect(() => {
    if (searchParams?.get("confirmPublish") !== "1" || confirmPublishTriggered.current) return;
    confirmPublishTriggered.current = true;
    setRulesConfirmedPersisted(true);
    setPreviewViewed(true);
    setStep("media");
    const t = setTimeout(() => {
      publish();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single run with current publish
  }, [searchParams]);

  // Draft autosave to localStorage (quick resilience) — 250ms debounce
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const draft: DraftV1 = {
        v: 1,
        step,
        title,
        description,
        isFree,
        price,
        city: normalizeCity(city) || city.trim(),
        category,
        details,
        contactMethod,
        contactPhone,
        contactEmail,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 250);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [draftKey, showDraftRestoreModal, step, title, description, isFree, price, city, category, contactMethod, contactPhone, contactEmail, details]);

  // Persist images with draft (local fallback); debounced.
  const draftImagesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal || images.length === 0) return;
    if (draftImagesTimerRef.current) clearTimeout(draftImagesTimerRef.current);
    draftImagesTimerRef.current = setTimeout(() => {
      const key = draftKey + "_images";
      Promise.all(images.map((f) => fileToBase64(f)))
        .then((base64) => {
          const names = images.map((f) => f.name);
          const types = images.map((f) => f.type || "image/jpeg");
          sessionStorage.setItem(key, JSON.stringify({ base64, names, types }));
        })
        .catch(() => {});
      draftImagesTimerRef.current = null;
    }, 400);
    return () => {
      if (draftImagesTimerRef.current) clearTimeout(draftImagesTimerRef.current);
    };
  }, [draftKey, showDraftRestoreModal, images]);

  /** Build full normalized payload for DB (includes images as base64). */
  const buildPayloadAsync = useCallback(async (): Promise<DraftDataPayload> => {
    const imagePayload =
      images.length > 0
        ? await Promise.all(
            images.map(async (f) => ({
              base64: await fileToBase64(f),
              name: f.name,
              type: f.type || "image/jpeg",
            }))
          )
        : [];
    return {
      v: 1,
      step,
      category: category || "",
      title,
      description,
      isFree,
      price,
      city: normalizeCity(city) || city.trim(),
      details: stripLegacySharedWizardBrKeys(
        Object.fromEntries(
          Object.entries(details).map(([k, v]) => [k, v ?? ""])
        ) as Record<string, string>
      ),
      contactMethod,
      contactPhone,
      contactEmail,
      images: imagePayload,
      updatedAt: new Date().toISOString(),
    };
  }, [step, category, title, description, isFree, price, city, details, contactMethod, contactPhone, contactEmail, images]);

  /** Persist draft to DB (one active draft per category per user; for rentas, per branch). Then localStorage fallback. */
  const performDbSave = useCallback(async () => {
    if (draftKey === "listing_draft_ssr" || !userId || showDraftRestoreModal) return;
    try {
      const payload = await buildPayloadAsync();
      const hasContent =
        (payload.title || "").trim() ||
        (payload.description || "").trim() ||
        (payload.city || "").trim() ||
        (payload.price || "").trim() ||
        payload.images.length > 0 ||
        Object.values(payload.details || {}).some((v) => (v || "").trim());
      if (!draftId && !hasContent) return;

      const categorySlug = payload.category || "bienes-raices";
      const bienesRaicesBranch = (payload.details?.bienesRaicesBranch ?? "").trim().toLowerCase();
      if (categorySlug === "bienes-raices" && bienesRaicesBranch !== "privado" && bienesRaicesBranch !== "negocio") {
        const { images: _img, ...rest } = payload;
        localStorage.setItem(draftKey, JSON.stringify(rest as Partial<DraftV1>));
        return;
      }

      setDbSaveStatus("saving");
      const supabase = createSupabaseBrowserClient();

      if (draftId) {
        const result = await updateDraft(supabase, draftId, userId, payload);
        if (result.ok) {
          setDbSaveStatus("saved");
          if (dbSaveSuccessTimerRef.current) clearTimeout(dbSaveSuccessTimerRef.current);
          dbSaveSuccessTimerRef.current = setTimeout(() => {
            setDbSaveStatus("idle");
            dbSaveSuccessTimerRef.current = null;
          }, 2000);
        } else {
          setDbSaveStatus("error");
        }
      } else {
        const existing = await getLatestDraftForCategory(supabase, userId, categorySlug);
        if (existing) {
          const result = await updateDraft(supabase, existing.id, userId, payload);
          if (result.ok) {
            setDraftId(existing.id);
            setStoredDraftId(userId, existing.id);
            syncDraftIdInUrl(existing.id);
            setDbSaveStatus("saved");
            if (dbSaveSuccessTimerRef.current) clearTimeout(dbSaveSuccessTimerRef.current);
            dbSaveSuccessTimerRef.current = setTimeout(() => {
              setDbSaveStatus("idle");
              dbSaveSuccessTimerRef.current = null;
            }, 2000);
          } else {
            setDbSaveStatus("error");
          }
        } else {
          const created = await createDraft(supabase, userId, categorySlug, payload);
          if (created) {
            setDraftId(created.id);
            setStoredDraftId(userId, created.id);
            syncDraftIdInUrl(created.id);
            setDbSaveStatus("saved");
            if (dbSaveSuccessTimerRef.current) clearTimeout(dbSaveSuccessTimerRef.current);
            dbSaveSuccessTimerRef.current = setTimeout(() => {
              setDbSaveStatus("idle");
              dbSaveSuccessTimerRef.current = null;
            }, 2000);
          } else {
            setDbSaveStatus("error");
          }
        }
      }

      const { images: _img, ...rest } = payload;
      const forLocal = rest as Partial<DraftV1>;
      localStorage.setItem(draftKey, JSON.stringify(forLocal));
      if (payload.images.length > 0) {
        const payloadStr = JSON.stringify({
          base64: payload.images.map((i) => i.base64),
          names: payload.images.map((i) => i.name),
          types: payload.images.map((i) => i.type),
        });
        sessionStorage.setItem(IMAGES_RESTORE_KEY, payloadStr);
        sessionStorage.setItem(draftKey + "_images", payloadStr);
      }
    } catch {
      setDbSaveStatus("error");
    }
  }, [
    draftKey,
    userId,
    draftId,
    showDraftRestoreModal,
    buildPayloadAsync,
    syncDraftIdInUrl,
  ]);

  // DB autosave — immediate for step, category, contactMethod, isFree, images
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal || !userId) return;
    if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    pendingDbSaveRef.current = null;
    void performDbSave();
    return () => {
      if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    };
  }, [step, category, contactMethod, isFree, images, draftKey, showDraftRestoreModal, userId, performDbSave]);

  // DB autosave — debounced 500ms for typing-heavy fields
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal || !userId) return;
    if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    pendingDbSaveRef.current = window.setTimeout(() => {
      pendingDbSaveRef.current = null;
      void performDbSave();
    }, 500);
    return () => {
      if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    };
  }, [title, description, price, city, contactPhone, contactEmail, details, draftKey, showDraftRestoreModal, userId, performDbSave]);

  // Flush pending DB save on visibilitychange (tab hidden / closed)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && pendingDbSaveRef.current) {
        clearTimeout(pendingDbSaveRef.current);
        pendingDbSaveRef.current = null;
        void performDbSave();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [performDbSave]);

  /** Flush draft and images so when seller returns from Pro page their ad is intact. Also persists to DB. */
  const saveDraftAndImagesForProReturn = useCallback(async () => {
    if (draftKey === "listing_draft_ssr") return;
    try {
      const draft: DraftV1 = {
        v: 1,
        step,
        title,
        description,
        isFree,
        price,
        city: normalizeCity(city) || city.trim(),
        category,
        details,
        contactMethod,
        contactPhone,
        contactEmail,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      if (images.length > 0) {
        const base64 = await Promise.all(images.map((f) => fileToBase64(f)));
        const names = images.map((f) => f.name);
        const types = images.map((f) => f.type || "image/jpeg");
        const payload = JSON.stringify({ base64, names, types });
        sessionStorage.setItem(IMAGES_RESTORE_KEY, payload);
        sessionStorage.setItem(draftKey + "_images", payload);
      }
      await performDbSave();
    } catch {
      // ignore
    }
  }, [draftKey, step, title, description, isFree, price, city, category, details, contactMethod, contactPhone, contactEmail, images, performDbSave]);

  const handleSaveProgress = useCallback(async () => {
    setSaveProgressing(true);
    try {
      await saveDraftAndImagesForProReturn();
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
      setShowSaveSuccess(true);
      saveSuccessTimerRef.current = setTimeout(() => {
        setShowSaveSuccess(false);
        saveSuccessTimerRef.current = null;
      }, 3000);
    } finally {
      setSaveProgressing(false);
    }
  }, [saveDraftAndImagesForProReturn]);

  useEffect(() => {
    return () => {
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    };
  }, []);

  const isFormDirty = useMemo(() => {
    return (
      title.trim().length > 0 ||
      description.trim().length > 0 ||
      city.trim().length > 0 ||
      (price.trim().length > 0 && !isFree) ||
      images.length > 0 ||
      Object.values(details).some((v) => String(v ?? "").trim().length > 0)
    );
  }, [title, description, city, price, isFree, images.length, details]);

  function handleExitClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isFormDirty) setShowLeaveConfirmModal(true);
    else void handleExitSaveAndNavigate();
  }

  /** Salir: always persist progress (local + DB) then go to Clasificados — never clear drafts here. */
  async function handleExitSaveAndNavigate() {
    setLeaveSaving(true);
    try {
      await saveDraftAndImagesForProReturn();
      setShowLeaveConfirmModal(false);
      router.push(`/clasificados?lang=${lang}`);
    } finally {
      setLeaveSaving(false);
    }
  }

  async function handleLeaveSaveDraft() {
    await handleExitSaveAndNavigate();
  }

  // Image previews (from images state)
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  // Single normalized snapshot for preview, validation, and insert (same source of truth).
  const publishDraftSnapshot = useMemo(() => {
    const isPrivate = false;
    const descriptionForSnapshot =
      category === "bienes-raices"
        ? coalesceWizardDetailValue(details, "brFullDescription", LEGACY_WIZARD_BR_DETAIL.fullDescription)
        : description;
    const cityCanonical = normalizeCity(city) || null;
    const detailPairs = getDetailPairs(category, lang, details, cityCanonical ?? city.trim());
    return buildPublishDraftSnapshot({
      title,
      description: descriptionForSnapshot,
      city,
      price,
      isFree: category === "en-venta" || category === "bienes-raices" ? false : isFree,
      details,
      contactMethod,
      contactPhone,
      contactEmail,
      category,
      lang,
      isPro: effectiveIsPro,
      imageUrls: filePreviews,
      proVideoThumbUrl: proVideoThumbPreviewUrls[0] || null,
      proVideoUrl: proVideoPreviewUrls[0] || null,
      proVideoThumbUrl2: isPrivate ? null : (proVideoThumbPreviewUrls[1] || null),
      proVideoUrl2: isPrivate ? null : (proVideoPreviewUrls[1] || null),
      cityCanonical,
      detailPairs,
    });
  }, [
    title,
    description,
    city,
    price,
    isFree,
    details,
    contactMethod,
    contactPhone,
    contactEmail,
    category,
    lang,
    effectiveIsPro,
    filePreviews,
    proVideoThumbPreviewUrls,
    proVideoPreviewUrls,
  ]);

  // Validation from snapshot so we validate what preview/insert use.
  const requirements = useMemo(
    () => computePublishRequirements(publishDraftSnapshot),
    [publishDraftSnapshot]
  );

  /** BR private: type-aware copy profile for placeholders and helpers. Uses bienesRaicesSubcategoria or derives from brPropertyType. */
  const brPrivateCopyProfile = useMemo(() => {
    if (categoryFromUrl !== "bienes-raices" || (details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "privado") return null;
    const subcat =
      (details.bienesRaicesSubcategoria ?? "").trim() ||
      getBrSubcategoriaFromPropertyType(
        coalesceWizardDetailValue(details, "brPropertyType", LEGACY_WIZARD_BR_DETAIL.propertyType)
      );
    const key = (["residencial", "condos-townhomes", "multifamiliar", "terrenos", "comercial", "industrial"] as const).includes(subcat as BrSubcategoriaKey) ? subcat as BrSubcategoriaKey : "residencial";
    return BR_PRIVATE_COPY_PROFILES[key];
  }, [categoryFromUrl, details.bienesRaicesBranch, details.bienesRaicesSubcategoria, details.brPropertyType]);

  const basicsOk = useMemo(
    () => computeBasicsOk(categoryFromUrl, requirements),
    [categoryFromUrl, requirements]
  );

  const requirementItems = useMemo(
    () =>
      buildPublishRequirementItems({
        requirements,
        lang,
        isFree,
        contactMethod,
        categoryFromUrl,
        rentasBranch: details.rentasBranch ?? "",
      }),
    [requirements, lang, isFree, contactMethod, categoryFromUrl, details.rentasBranch]
  );

  const missingRequirementsText = useMemo(
    () => buildMissingRequirementsText(requirementItems, lang),
    [requirementItems, lang]
  );

  const missingBasicsRequirementsText = useMemo(
    () => buildMissingBasicsRequirementsText(requirementItems, lang),
    [requirementItems, lang]
  );

  function deleteDraft() {
    if (draftId && userId) {
      try {
        const supabase = createSupabaseBrowserClient();
        void deleteDraftInDb(supabase, draftId, userId);
      } catch {
        // ignore
      }
      setDraftId(null);
      clearStoredDraftId(userId);
    }
    try {
      localStorage.removeItem(draftKey);
      sessionStorage.removeItem(draftKey + "_images");
    } catch {
      // ignore
    }
  }

  
async function inspectAndThumbVideo(file: File, index: number) {
  setVideoErrors((prev) => {
    const n: [string, string] = [...prev];
    n[index] = "";
    return n;
  });
  setVideoThumbBlobs((prev) => {
    const n: [Blob | null, Blob | null] = [...prev];
    n[index] = null;
    return n;
  });

  if (!file.type.startsWith("video/")) {
    setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
    setVideoErrors((prev) => {
      const n: [string, string] = [...prev];
      n[index] = lang === "es" ? "Selecciona un archivo de video." : "Please select a video file.";
      return n;
    });
    return;
  }

  const maxBytes = 75 * 1024 * 1024; // ~75MB
  if (file.size > maxBytes) {
    setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
    setVideoErrors((prev) => {
      const n: [string, string] = [...prev];
      n[index] = lang === "es"
        ? "El video es muy grande. Usa un clip más corto o comprimido (máx ~75MB)."
        : "Video file is too large. Please use a shorter/compressed clip (max ~75MB).";
      return n;
    });
    return;
  }

  const url = URL.createObjectURL(file);
  try {
    const info = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      const cleanup = () => { v.removeAttribute("src"); try { v.load(); } catch {} };
      v.onloadedmetadata = () => {
        const duration = Number(v.duration || 0);
        const width = Number((v as any).videoWidth || 0);
        const height = Number((v as any).videoHeight || 0);
        cleanup();
        resolve({ duration, width, height });
      };
      v.onerror = () => { cleanup(); reject(new Error("metadata")); };
    });

    if (info.duration > 15.2) {
      setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
      setVideoErrors((prev) => {
        const n: [string, string] = [...prev];
        n[index] = lang === "es" ? "El video debe ser de 15 segundos o menos." : "Video must be 15 seconds or less.";
        return n;
      });
      return;
    }
    if (info.width > 1920 || info.height > 1080) {
      setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
      setVideoErrors((prev) => {
        const n: [string, string] = [...prev];
        n[index] = lang === "es" ? "El video debe ser 1080p o menos (1920×1080)." : "Video must be 1080p or less (1920×1080).";
        return n;
      });
      return;
    }

    const thumb = await new Promise<Blob | null>((resolve) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      const done = (b: Blob | null) => { v.removeAttribute("src"); try { v.load(); } catch {}; resolve(b); };
      v.onloadeddata = () => {
        const t = Math.min(0.5, Math.max(0, (v.duration || 1) * 0.1));
        try { v.currentTime = t; } catch { done(null); }
      };
      v.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = (v as any).videoWidth || 640;
          canvas.height = (v as any).videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (!ctx) return done(null);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => done(b), "image/jpeg", 0.82);
        } catch { done(null); }
      };
      v.onerror = () => done(null);
    });

    setVideoThumbBlobs((prev) => { const n: [Blob | null, Blob | null] = [...prev]; n[index] = thumb; return n; });
  } catch {
    setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
    setVideoErrors((prev) => {
      const n: [string, string] = [...prev];
      n[index] = lang === "es" ? "No se pudo leer el video. Prueba otro archivo (máx 15s, 1080p, ~75MB)." : "Could not read video. Try another file (max 15s, 1080p, ~75MB).";
      return n;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function publish() {
    setPublishError("");
    setPublishedId("");

    if (!rulesConfirmed) {
      setPublishError(lang === "es" ? "Debes confirmar que tu anuncio cumple con las reglas de la comunidad." : "You must confirm that your listing complies with the community rules.");
      return;
    }
    if (!requirements.allOk) {
      setPublishError(`${copy.needReqs}${missingRequirementsText ? " " + missingRequirementsText : ""}`);
      return;
    }

    if (!publishDraftSnapshot.cityCanonical) {
      setPublishError(lang === "es" ? "Selecciona una ciudad válida del Norte de California." : "Select a valid city in Northern California.");
      return;
    }

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e: any) {
      setPublishError((e?.message as string) || "Supabase config error");
      return;
    }

    setPublishing(true);
    try {
      const snap = publishDraftSnapshot;
      const finalDescription = (snap.description + buildDetailsAppendix(snap.category, snap.lang, snap.details, snap.cityCanonical ?? snap.city)).trim();
      const bienesRaicesBranch = (snap.details.bienesRaicesBranch ?? "").trim().toLowerCase();
      const isBienesRaicesNegocio = snap.category === "bienes-raices" && bienesRaicesBranch === "negocio";
      // Insert from same normalized snapshot as preview/validation (DB field names unchanged).
      const mediaPhoneDigits = getPhoneDigits(snap.contactPhone);
      const officePhoneDigits = (snap.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
      const resolvedPhoneForInsert =
        mediaPhoneDigits.length === 10 ? mediaPhoneDigits : isBienesRaicesNegocio && officePhoneDigits.length === 10 ? officePhoneDigits : null;
      const negocioEmailTrim = (snap.details.negocioEmail ?? "").trim();
      const resolvedEmailForInsert =
        snap.contactEmail.trim() || (isBienesRaicesNegocio && /.+@.+\..+/.test(negocioEmailTrim) ? negocioEmailTrim : "");
      const insertPayload: any = {
        owner_id: userId,
        title: snap.title,
        description: finalDescription,
        city: snap.cityCanonical!,
        category: snap.category,
        price: snap.isFree ? 0 : Number((snap.priceRaw ?? "").replace(/[^0-9.]/g, "")) || 0,
        is_free: snap.isFree,
        contact_phone: snap.contactMethod === "email" ? null : resolvedPhoneForInsert,
        contact_email: snap.contactMethod === "phone" ? null : resolvedEmailForInsert || null,
        status: "active",
        is_published: true,
        detail_pairs: Array.isArray(snap.detailPairs) && snap.detailPairs.length > 0 ? snap.detailPairs : null,
      };
      if (snap.category === "bienes-raices") {
        insertPayload.seller_type = bienesRaicesBranch === "negocio" ? "business" : "personal";
        if (isBienesRaicesNegocio) {
          insertPayload.rentas_tier = "negocio";
          insertPayload.business_name = resolveBrNegocioBusinessNameForPairs(snap.details) || null;
          const businessMeta: Record<string, string> = {};
          for (const k of BUSINESS_META_KEYS) {
            let v: string;
            if (k === "negocioNombre") v = resolveBrNegocioBusinessNameForPairs(snap.details);
            else if (k === "negocioAgente") v = resolveBrNegocioAgentForPairs(snap.details);
            else v = (snap.details[k] ?? "").trim();
            if (v) businessMeta[k] = v;
          }
          const mergedRedesBr = buildNegocioRedesPayload(snap.details as Record<string, string | undefined>);
          if (mergedRedesBr.trim()) {
            businessMeta.negocioRedes = mergedRedesBr.trim();
          }
          if (!businessMeta.negocioEmail?.trim()) {
            const ce = (snap.contactEmail ?? "").trim();
            if (/.+@.+\..+/.test(ce)) businessMeta.negocioEmail = ce;
          }
          if (Object.keys(businessMeta).length > 0) {
            insertPayload.business_meta = JSON.stringify(businessMeta);
          }
        }
      }

      const { data, error } = await supabase
        .from("listings")
        .insert([insertPayload])
        .select("id")
        .single();

      if (error) {
        setPublishError(error.message);
        return;
      }

      const id = (data as any)?.id as string | undefined;
      if (!id) {
        setPublishError(lang === "es" ? "Publicado, pero no se recibió ID." : "Published, but no ID returned.");
        return;
      }

      let descriptionForUpdate = finalDescription;

      // Upload photos (required). Store URLs in description to avoid schema guessing.
      const photoUrls: string[] = [];
      try {
        const basePath = `${userId}/${id}/photos`;
        setUploadProgress({ current: 0, total: images.length });
        for (let i = 0; i < images.length; i++) {
          const f = images[i];
          const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
          const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
          const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${safeExt}`;

          const up = await supabase.storage
            .from("listing-images")
            .upload(path, f, { upsert: true, contentType: f.type || "image/jpeg" });

          if (up.error) {
            console.warn("photo upload failed", up.error.message);
            continue;
          }
          const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
          if (url) photoUrls.push(url);
          setUploadProgress({ current: i + 1, total: images.length });
        }

        if (photoUrls.length) {
          const marker =
            `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;

          const photosAppendix =
            lang === "es"
              ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
              : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;

          descriptionForUpdate = (descriptionForUpdate + photosAppendix).trim();

          // Structured URLs for dashboard/mis-anuncios thumbnails (same strings as in description markers).
          await supabase
            .from("listings")
            .update({ description: descriptionForUpdate, images: photoUrls })
            .eq("id", id);
        }
      } catch (e: any) {
        // If photo upload fails, don't crash the publish flow; listing is already live.
        console.warn("photo upload error", e?.message || e);
      } finally {
        setUploadProgress(null);
      }

// Pro video upload (optional, Pro-only). BR negocio: 1 video; others: up to 2.
const videoLimit = 1;
for (let vi = 0; vi < videoLimit; vi++) {
  const videoFile = videoFiles[vi];
  const videoThumbBlob = videoThumbBlobs[vi];
  const videoError = videoErrors[vi];
  if (!isPro || !videoFile || videoError) continue;
  try {
    const basePath = vi === 0 ? `${userId}/${id}/video` : `${userId}/${id}/video2`;
    const ext = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
    const videoPath = `${basePath}/clip.${/^[a-z0-9]+$/.test(ext) ? ext : "mp4"}`;
    const up1 = await supabase.storage
      .from("listing-images")
      .upload(videoPath, videoFile, { upsert: true, contentType: videoFile.type });

    if (up1.error) throw up1.error;

    const videoUrl = supabase.storage.from("listing-images").getPublicUrl(videoPath).data.publicUrl;
    let thumbUrl: string | null = null;
    if (videoThumbBlob) {
      const thumbPath = `${basePath}/thumb.jpg`;
      const up2 = await supabase.storage
        .from("listing-images")
        .upload(thumbPath, videoThumbBlob, { upsert: true, contentType: "image/jpeg" });
      if (!up2.error) thumbUrl = supabase.storage.from("listing-images").getPublicUrl(thumbPath).data.publicUrl;
    }

    const tag = vi === 0 ? "LEONIX_PRO_VIDEO" : "LEONIX_PRO_VIDEO_2";
    const marker = `[${tag}]\nurl=${videoUrl}\n` + (thumbUrl ? `thumb=${thumbUrl}\n` : "") + `[/${tag}]`;
    const videoAppendix =
      lang === "es"
        ? `\n\n— Video (Pro) ${vi + 1} —\nVideo: ${videoUrl}${thumbUrl ? `\nMiniatura: ${thumbUrl}` : ""}\n${marker}\n`
        : `\n\n— Video (Pro) ${vi + 1} —\nVideo: ${videoUrl}${thumbUrl ? `\nThumbnail: ${thumbUrl}` : ""}\n${marker}\n`;

    descriptionForUpdate = (descriptionForUpdate + videoAppendix).trim();
    await supabase.from("listings").update({ description: descriptionForUpdate }).eq("id", id);
  } catch (e: any) {
    console.warn(`video ${vi + 1} upload failed`, e?.message || e);
  }
}

      setPublishedId(id);
      setShowSuccessModal(true);
      deleteDraft();
    } catch (e: any) {
      setPublishError(
        (e?.message as string) || (lang === "es" ? "Error desconocido al publicar." : "Unknown error.")
      );
    } finally {
      setPublishing(false);
    }
  }

  // Lazy require to avoid hard-coupling to repo types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ListingCard: any = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("@/app/clasificados/components/ListingCard").default;
    } catch {
      return null;
    }
  }, []);

  // Preview UI strings derived from snapshot so card/preview stay in sync.
  const {
    previewTitle,
    previewDescription,
    previewPrice,
    previewCity,
    previewPosted,
    previewShortDescription,
  } = useMemo(
    () =>
      buildPublishPreviewDisplayStrings({
        snapshot: publishDraftSnapshot,
        lang,
        todayLabel: copy.todayLabel,
      }),
    [publishDraftSnapshot, lang, copy.todayLabel]
  );
  const previewPhone = publishDraftSnapshot.contactMethod === "email" ? "" : formatPhoneDisplay(publishDraftSnapshot.contactPhone);
  const previewEmail = publishDraftSnapshot.contactMethod === "phone" ? "" : publishDraftSnapshot.contactEmail;
  const previewDetailPairs = publishDraftSnapshot.detailPairs;
  const compactBrPrivateDetailPairs = useMemo(
    () =>
      buildCompactBrPrivateDetailPairs({
        categoryFromUrl,
        isBienesRaicesPrivado,
        previewDetailPairs,
        lang,
      }),
    [categoryFromUrl, isBienesRaicesPrivado, previewDetailPairs, lang]
  );
  const previewCategoryLabel = publishDraftSnapshot.category ? categoryConfig[publishDraftSnapshot.category as CategoryKey]?.label[lang] ?? "" : "";
  const previewContactMethod = publishDraftSnapshot.contactMethod;
  const coverImage = publishDraftSnapshot.images[0] ?? null;
  const extraPreviewImages = publishDraftSnapshot.images.slice(1, 5);

  /** Current publish URL (path + query) so `/agente/[id]` can link back to this draft/preview flow. */
  const previewPublishReturnPath = useMemo(
    () => buildPreviewPublishReturnPath(pathname, searchParams),
    [pathname, searchParams]
  );

  // ListingData for in-page full preview modal (same shape as ListingView expects; uses current filePreviews so no navigation).
  const fullPreviewListingData = useMemo(
    () =>
      buildFullPreviewListingData({
        publishDraftSnapshot,
        lang,
        todayLabel: copy.todayLabel,
        previewCategoryLabel,
        sellerDisplayName,
        category,
        categoryFromUrl,
        details,
        userId,
        previewPublishReturnPath,
      }),
    [publishDraftSnapshot, lang, copy.todayLabel, previewCategoryLabel, sellerDisplayName, category, categoryFromUrl, details, userId, previewPublishReturnPath]
  );

  /** BR negocio (media step): full-page preview via `/clasificados/preview-listing` — same `BienesRaicesPreviewNegocioFresh` shell as embedded preview. */
  const openBrNegocioFullListingPreview = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!isBienesRaicesNegocio || step !== "media") return;
    if (userId && typeof performDbSave === "function") {
      void performDbSave();
    }
    const backToEditUrl = previewPublishReturnPath;
    const snap = publishDraftSnapshot;
    setPreviewDraft({
      backToEditUrl,
      lang,
      category: "bienes-raices",
      branch: "negocio",
      title: snap.title,
      description: snap.description,
      isFree: snap.isFree,
      price: snap.priceRaw || "",
      city: snap.city,
      todayLabel: copy.todayLabel,
      detailPairs: snap.detailPairs ?? [],
      contactMethod: snap.contactMethod,
      contactPhone: snap.contactPhone,
      contactEmail: snap.contactEmail,
      imageUrls: snap.images ?? [],
      proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
      proVideoUrl: snap.proVideoUrl ?? null,
      isPro: snap.isPro,
      sellerName: sellerDisplayName ?? null,
      businessRail: fullPreviewListingData.businessRail ?? null,
      businessRailTier: fullPreviewListingData.businessRailTier ?? null,
      ownerId: userId ?? null,
      fullListingDataJson: JSON.stringify(fullPreviewListingData),
    });
    router.push(`/clasificados/preview-listing?lang=${lang}&branch=negocio`);
  }, [
    isBienesRaicesNegocio,
    step,
    userId,
    performDbSave,
    previewPublishReturnPath,
    publishDraftSnapshot,
    lang,
    copy.todayLabel,
    sellerDisplayName,
    fullPreviewListingData,
    router,
  ]);

  /** BR privado (media step): same full-page preview route as negocio — owner-led premium shell on `/clasificados/preview-listing`. */
  const openBrPrivadoFullListingPreview = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!isBienesRaicesPrivado || step !== "media") return;
    if (userId && typeof performDbSave === "function") {
      void performDbSave();
    }
    const backToEditUrl = previewPublishReturnPath;
    const snap = publishDraftSnapshot;
    setPreviewDraft({
      backToEditUrl,
      lang,
      category: "bienes-raices",
      branch: "privado",
      title: snap.title,
      description: snap.description,
      isFree: snap.isFree,
      price: snap.priceRaw || "",
      city: snap.city,
      todayLabel: copy.todayLabel,
      detailPairs: snap.detailPairs ?? [],
      contactMethod: snap.contactMethod,
      contactPhone: snap.contactPhone,
      contactEmail: snap.contactEmail,
      imageUrls: snap.images ?? [],
      proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
      proVideoUrl: snap.proVideoUrl ?? null,
      isPro: snap.isPro,
      sellerName: sellerDisplayName ?? null,
      businessRail: null,
      businessRailTier: null,
      ownerId: userId ?? null,
      fullListingDataJson: JSON.stringify(fullPreviewListingData),
    });
    router.push(`/clasificados/preview-listing?lang=${lang}&branch=privado`);
  }, [
    isBienesRaicesPrivado,
    step,
    userId,
    performDbSave,
    previewPublishReturnPath,
    publishDraftSnapshot,
    lang,
    copy.todayLabel,
    sellerDisplayName,
    fullPreviewListingData,
    router,
  ]);

  // Open in-page full preview modal. No route change, no auth round-trip. Preserves draft and form state.
  const openFullPreview = useCallback(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[publish preview] openFullPreview called", { isBienesRaicesPrivado, draftId, step });
    }
    if (userId && typeof performDbSave === "function") {
      void performDbSave();
    }
    fullPreviewModalOpenRef.current = true;
    setFullPreviewVariant(
      getFullPreviewVariantOnOpen({ isRentasPrivado, isBienesRaicesNegocio, isBienesRaicesPrivado })
    );
    setFullPreviewRulesConfirmed(false);
    setFullPreviewInfoConfirmed(false);
    setShowFullPreviewModal(true);
  }, [isRentasPrivado, isBienesRaicesNegocio, isBienesRaicesPrivado, userId, performDbSave, draftId, step]);

  const handleSharePreview = useCallback(() => {
    if (typeof window === "undefined") return Promise.resolve();
    const url = window.location.href;
    const shareTitle = (title?.trim() || (lang === "es" ? "Vista previa" : "Preview")) + (lang === "es" ? " — Leonix" : " — Leonix");
    if (navigator.share) {
      return navigator.share({ title: shareTitle, url }).catch(() => navigator.clipboard?.writeText(url) ?? Promise.resolve());
    }
    return navigator.clipboard?.writeText(url) ?? Promise.resolve();
  }, [title, lang]);

  // Open same preview in Pro mode (same data; Pro badge styling). Used for En Venta Pro comparison.
  const openProPreview = () => {
    setFullPreviewVariant("pro");
    setFullPreviewRulesConfirmed(false);
    setFullPreviewInfoConfirmed(false);
    setShowFullPreviewModal(true);
  };

  const closeFullPreviewModal = useCallback(() => {
    executeClosePublishFullPreviewModal({
      setModalOpenTracked: (open) => {
        fullPreviewModalOpenRef.current = open;
      },
      setShowFullPreviewModal,
      clearProHighlight: () => setProHighlightId(null),
    });
  }, []);

  const handleFullPreviewConfirmPublish = () => {
    executeFullPreviewConfirmPublish({
      fullPreviewRulesConfirmed,
      fullPreviewInfoConfirmed,
      setRulesConfirmedPersisted,
      setPreviewViewed,
      setShowFullPreviewModal,
      publish,
    });
  };

  const basicsShowValidation = publishNextAttempted.basics ?? false;
  const categoryShowValidation = publishNextAttempted.category ?? false;

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16 [overflow-anchor:auto]">
      <div className="max-w-4xl mx-auto px-6" style={{ overflowAnchor: "none" } as React.CSSProperties}>
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] text-center">
              {categoryFromUrl === "bienes-raices" ? copy.brTitle : copy.title}
            </h1>
            <p className="text-[#111111] text-center max-w-2xl mx-auto">
              {checking ? copy.checking : categoryFromUrl === "bienes-raices" ? copy.brSubtitle : copy.subtitle}
            </p>
            {authError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {authError}
              </div>
            )}
            {recoveredDraftMessage && (
              <p className="mt-2 text-sm text-[#111111]/70" role="status">
                {recoveredDraftMessage}
              </p>
            )}
          </div>

          {!checking && signedIn && showFormPlaceholder && (
            <div className="mt-6 rounded-2xl border border-black/10 bg-[#F5F5F5] p-8 text-center text-[#111111]">
              <p className="text-lg font-medium">
                {lang === "es" ? "Formulario disponible próximamente." : "Form available soon."}
              </p>
              <Link
                href={`/clasificados/publicar/bienes-raices${lang ? `?lang=${lang}` : ""}`}
                className="mt-4 inline-block rounded-xl bg-[#A98C2A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f7a24]"
              >
                {lang === "es" ? "Publicar en Bienes Raíces" : "Post in Real Estate"}
              </Link>
            </div>
          )}

          {!checking && signedIn && !showFormPlaceholder && (
            <>
              {/* Draft restore: do not auto-load; let user choose */}
              {showDraftRestoreModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="draft-restore-title">
                  <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 max-w-md w-full shadow-xl">
                    <h2 id="draft-restore-title" className="text-xl font-bold text-[#111111]">{copy.draftInProgress}</h2>
                    <p className="mt-2 text-sm text-[#111111]/80">
                      {lang === "es"
                        ? "Puedes continuar con lo guardado, crear otro anuncio nuevo (esta aplicación se conserva) o eliminar esta aplicación."
                        : "You can continue with saved progress, create a separate new ad (this application is kept), or delete this application."}
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleContinueDraft}
                        className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8f7a24]"
                      >
                        {copy.continueDraft}
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewAd}
                        className="w-full rounded-xl border border-[#111111]/30 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
                      >
                        {copy.createNewAd}
                      </button>
                      <p className="text-xs text-[#111111]/60 px-1">{copy.createNewAdHint}</p>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="mt-1 text-sm text-[#111111]/70 underline hover:text-[#111111]"
                      >
                        {copy.deleteCurrentApplication}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave confirmation when user has unsaved changes */}
              {showLeaveConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="leave-confirm-title">
                  <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 max-w-md w-full shadow-xl">
                    <h2 id="leave-confirm-title" className="text-xl font-bold text-[#111111]">{copy.leaveConfirmTitle}</h2>
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        disabled={leaveSaving}
                        onClick={() => void handleLeaveSaveDraft()}
                        className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8f7a24] disabled:opacity-70 disabled:cursor-wait"
                      >
                        {leaveSaving ? (lang === "es" ? "Guardando…" : "Saving…") : copy.leaveSaveDraft}
                      </button>
                      <button
                        type="button"
                        disabled={leaveSaving}
                        onClick={() => setShowLeaveConfirmModal(false)}
                        className="w-full rounded-xl border border-[#111111]/30 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8] disabled:opacity-70"
                      >
                        {copy.leaveKeepEditing}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* In-page full preview modal — no route, no sessionStorage; uses current form state and ListingView */}
              {showFullPreviewModal && (
                <div
                  className="fixed inset-0 z-[110] overflow-y-auto overscroll-y-contain bg-[#D9D9D9] text-[#111111]"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="full-preview-title"
                >
                  <h2 id="full-preview-title" className="sr-only">{copy.fullPreviewTitle}</h2>
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 border-b border-black/10 bg-[#F5F5F5] shadow-sm">
                    <button
                      type="button"
                      onClick={closeFullPreviewModal}
                      className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
                    >
                      ← {copy.fullPreviewBackToEdit}
                    </button>
                    <span className="text-xs text-[#111111]/50">
                      {isBienesRaicesPrivado
                        ? (lang === "es" ? "Vista previa" : "Preview")
                        : fullPreviewVariant === "pro"
                          ? copy.proPreviewTitle
                          : lang === "es"
                            ? "Vista previa (como la verán los compradores)"
                            : "Preview (as buyers will see it)"}
                    </span>
                  </div>
                  <section
                    className={cx(
                      "mx-auto px-4 sm:px-6 py-6 w-full min-w-0",
                      // BR negocio: same max width as main publish shell (max-w-4xl); width owned here only.
                      isBienesRaicesNegocio ? "max-w-4xl" : "max-w-screen-2xl"
                    )}
                  >
                    {isBienesRaicesPrivado ? (
                      <PrivateBrPreviewContent
                        lang={lang}
                        description={publishDraftSnapshot.description ?? ""}
                        rawPrice={price}
                        rawTitle={title}
                        rawCity={city}
                        details={details}
                        previewDetailPairs={previewDetailPairs}
                        images={publishDraftSnapshot.images ?? []}
                        sellerDisplayName={sellerDisplayName ?? ""}
                        previewPhone={previewPhone}
                        previewEmail={previewEmail}
                        formatMoneyMaybe={formatMoneyMaybe}
                        copyRulesConfirm={copy.rulesConfirm}
                        copyFullPreviewInfoConfirm={copy.fullPreviewInfoConfirm}
                        copyFullPreviewBackToEdit={copy.fullPreviewBackToEdit}
                        copyFullPreviewConfirmPublish={copy.fullPreviewConfirmPublish}
                        copyPublishing={copy.publishing}
                        fullPreviewRulesConfirmed={fullPreviewRulesConfirmed}
                        setFullPreviewRulesConfirmed={setFullPreviewRulesConfirmed}
                        fullPreviewInfoConfirmed={fullPreviewInfoConfirmed}
                        setFullPreviewInfoConfirmed={setFullPreviewInfoConfirmed}
                        setShowRulesModal={setShowRulesModal}
                        closeFullPreviewModal={closeFullPreviewModal}
                        handleFullPreviewConfirmPublish={handleFullPreviewConfirmPublish}
                        publishing={publishing}
                        onSave={userId ? performDbSave : undefined}
                        onShare={handleSharePreview}
                      />
                    ) : (
                      <ListingView
                        listing={fullPreviewListingData}
                        previewMode={true}
                        previewProUpgrade={category === "bienes-raices" ? false : fullPreviewVariant === "pro"}
                        proHighlight={category === "bienes-raices" ? null : fullPreviewVariant === "pro" ? proHighlightId : null}
                        onProBenefitClick={category === "bienes-raices" ? undefined : fullPreviewVariant === "pro" ? setProHighlightId : undefined}
                        hideProComparisonUI={category === "bienes-raices"}
                      />
                    )}
                    {isBienesRaicesNegocio && (
                  <div className="mt-8 border-t border-black/10 bg-[#F5F5F5] p-4 safe-area-pb">
                    <div className="max-w-md mx-auto space-y-3">
                      {fullPreviewVariant === "pro" ? (
                        <>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={closeFullPreviewModal}
                              className="flex-1 min-w-0 w-full sm:max-w-none rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
                            >
                              {copy.proPreviewBackToListing}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFullPreviewVariant("free"); setProHighlightId(null); }}
                              className="flex-1 min-w-0 w-full sm:max-w-none rounded-xl border border-[#111111]/20 bg-white text-[#111111] font-semibold py-3.5 text-center hover:bg-[#F5F5F5] transition"
                            >
                              {copy.proPreviewViewFreeCta}
                            </button>
                            <Link
                              href={`/clasificados/membresias?lang=${lang}`}
                              className="flex-1 min-w-0 w-full sm:max-w-none rounded-xl font-semibold py-3.5 text-center transition bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                            >
                              {copy.proPreviewUpgradeCta}
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewRulesConfirmed}
                              onChange={(e) => setFullPreviewRulesConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>
                              {copy.rulesConfirm}
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowRulesModal(true); }}
                                className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
                              >
                                {lang === "es" ? "Ver reglas" : "View rules"}
                              </button>
                            </span>
                          </label>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewInfoConfirmed}
                              onChange={(e) => setFullPreviewInfoConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>{copy.fullPreviewInfoConfirm}</span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={closeFullPreviewModal}
                              className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
                            >
                              {copy.fullPreviewBackToEdit}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFullPreviewVariant("pro")}
                              className="flex-1 w-full max-w-full rounded-xl border border-[#111111]/20 bg-white text-[#111111] font-semibold py-3.5 text-center hover:bg-[#F5F5F5] transition"
                            >
                              {copy.proPreviewCta}
                            </button>
                            <button
                              type="button"
                              onClick={handleFullPreviewConfirmPublish}
                              disabled={!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed || publishing}
                              className={cx(
                                "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
                                fullPreviewRulesConfirmed && fullPreviewInfoConfirmed && !publishing
                                  ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                                  : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
                              )}
                            >
                              {publishing ? copy.publishing : copy.fullPreviewConfirmPublish}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                    )}
                  </section>
                </div>
              )}

              {/* In-page rules modal — no navigation, same publish state; z-[120] so it appears above full preview */}
              {showRulesModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="rules-modal-title">
                  <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl">
                    <h2 id="rules-modal-title" className="text-xl font-bold text-[#111111]">
                      {lang === "es" ? "Reglas de la comunidad" : "Community rules"}
                    </h2>
                    <p className="mt-3 text-sm text-[#111111]/80">
                      {lang === "es"
                        ? "Al publicar en LEONIX Clasificados aceptas que tu anuncio cumple con estas reglas. Esto nos ayuda a mantener un espacio útil para todos."
                        : "By posting on LEONIX Classifieds you confirm your listing complies with these rules. This helps us keep the space useful for everyone."}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-[#111111]/90 list-disc list-inside">
                      {(lang === "es"
                        ? [
                            "El contenido debe ser real y corresponder a lo que ofreces (producto, servicio, renta, etc.).",
                            "No está permitido el spam, contenido engañoso ni duplicados abusivos.",
                            "Respeta a la comunidad: sin contenido ofensivo, discriminatorio o ilegal.",
                            "Los anuncios gratuitos tienen duración y límites (por ejemplo 7 días, 3 fotos). Los planes Pro ofrecen más fotos, video y mayor visibilidad.",
                          ]
                        : [
                            "Content must be real and match what you offer (item, service, rental, etc.).",
                            "Spam, misleading content, and abusive duplicates are not allowed.",
                            "Respect the community: no offensive, discriminatory, or illegal content.",
                            "Free listings have duration and limits (e.g. 7 days, 3 photos). Pro plans offer more photos, video, and visibility.",
                          ]
                      ).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(false)}
                      className="mt-6 w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8]"
                    >
                      {lang === "es" ? "Volver a publicar" : "Back to publish"}
                    </button>
                  </div>
                </div>
              )}

              <div ref={topAnchorRef} aria-hidden className="h-px w-full" />
              {/* Progress bar — Salir moved to category step bottom left */}
              <div className="mt-6">
                <div className="min-w-0 rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={stepOrder.length} aria-label={lang === "es" ? "Progreso de publicación" : "Publish progress"}>
                  <div className="flex items-center gap-1 sm:gap-2">
                  {stepOrder.map((s, idx) => {
                    const isActive = safeStepForProgress === s;
                    const isPast = stepOrder.indexOf(s) < currentStepIndex;
                    const isUpcoming = !isActive && !isPast;
                    const label =
                      categoryFromUrl === "bienes-raices" && (s === "bienes-raices-track" || s === "basics" || s === "media")
                        ? copy.brSteps[s as "bienes-raices-track" | "basics" | "media"]
                        : s === "category"
                          ? copy.steps.category
                          : s === "rentas-track"
                            ? copy.steps["rentas-track"]
                            : s === "bienes-raices-track"
                              ? copy.steps["bienes-raices-track"]
                              : s === "basics"
                                ? copy.steps.basics
                                : s === "details"
                                  ? copy.steps.details
                                  : copy.steps.media;
                    return (
                      <span
                        key={s}
                        className={cx(
                          "inline-flex items-center text-[11px] sm:text-xs font-medium select-none",
                          isActive && "text-[#111111]",
                          isPast && "text-[#111111]/70",
                          isUpcoming && "text-[#111111]/40"
                        )}
                      >
                        <span
                          className={cx(
                            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                            isActive && "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]",
                            isPast && "border-black/15 bg-[#E8E8E8] text-[#111111]/80",
                            isUpcoming && "border-black/10 bg-[#F5F5F5] text-[#111111]/40"
                          )}
                        >
                          {isPast ? "✓" : idx + 1}
                        </span>
                        <span className="ml-1.5 hidden sm:inline">{label}</span>
                        {idx < stepOrder.length - 1 && <span className="mx-1 text-[#111111]/25" aria-hidden>›</span>}
                      </span>
                    );
                  })}
                  </div>
                </div>
              </div>

              {/* Visible checklist from same normalized source as preview/publish — pass/fail so form and system stay in sync */}
              <div className="mt-3 rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-3">
                <div className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
                  {lang === "es" ? "Requisitos para publicar" : "Publish requirements"}
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  {requirementItems.map((item) => (
                    <li key={item.key} className={cx("flex items-center gap-1.5", item.ok ? "text-[#111111]/80" : "text-red-700")}>
                      {item.ok ? <span aria-hidden>✓</span> : <span aria-hidden>✗</span>}
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Always reserve one line so status toggles do not cause layout shift while typing */}
              <div className="mt-2 min-h-[1.5rem] text-sm flex items-center" role="status" aria-live="polite">
                {showSaveSuccess && <span className="text-[#0d7a0d] font-medium">✓ {copy.saveProgressSuccess}</span>}
                {saveProgressing && !showSaveSuccess && <span className="text-[#111111]/70">{lang === "es" ? "Guardando…" : "Saving…"}</span>}
                {dbSaveStatus === "saved" && !showSaveSuccess && <span className="text-[#0d7a0d] font-medium">{lang === "es" ? "Guardado" : "Saved"}</span>}
                {dbSaveStatus === "error" && <span className="text-red-600" role="alert">{lang === "es" ? "Error al guardar. Reintenta." : "Error saving. Try again."}</span>}
                {!saveProgressing && !showSaveSuccess && dbSaveStatus !== "saved" && dbSaveStatus !== "error" && (
                  <span className="invisible select-none text-[#111111]/70" aria-hidden>.</span>
                )}
              </div>

              <div className="mt-6 grid gap-6">
                {/* BIENES RAÍCES TRACK: Privado vs Negocio/Profesional */}
                {step === "bienes-raices-track" && (
                  <BienesRaicesPublishShell>
                    <BienesRaicesPublishTrackStep
                      lang={lang}
                      cx={cx}
                      details={details}
                      setDetails={setDetails}
                      goToStep={goToStep}
                      handleBack={handleBack}
                      brPrivadoPricePerPost={BR_PRIVADO_PRICE_PER_POST}
                      brNegocioPriceWeekly={BR_NEGOCIO_PRICE_WEEKLY}
                      brNegocioPriceMonthly={BR_NEGOCIO_PRICE_MONTHLY}
                      copyBack={copy.back}
                    />
                  </BienesRaicesPublishShell>
                )}

                {/* BASICS */}
                {step === "basics" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.basicsTitle}</h2>
                    <div className="mt-4 grid gap-4">
                        <BienesRaicesPublishShell>
                        <div
                          id="publish-basics-br-meta"
                          className={cx(
                            "space-y-4",
                            basicsShowValidation && !requirements.bienesRaicesMetaOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                          )}
                        >
                          {/* Bienes Raíces: read-only advertiser summary (set in previous step); Cambiar goes back to bienes-raices-track */}
                          <div className="rounded-xl border border-[#C9B46A]/25 bg-[#F8F6F0]/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
                                {lang === "es" ? "Publicando como" : "Posting as"}
                              </p>
                              <p className="mt-1 text-sm font-medium text-[#111111]">
                                {details.bienesRaicesBranch === "negocio"
                                  ? (lang === "es" ? "Negocio" : "Business")
                                  : (lang === "es" ? "Privado" : "Private")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => goToStep("bienes-raices-track")}
                              className="text-sm font-semibold text-[#111111]/80 hover:text-[#111111] underline"
                            >
                              {lang === "es" ? "Cambiar" : "Change"}
                            </button>
                          </div>
                          {(details.bienesRaicesBranch ?? "").trim() === "negocio" ? (
                            <BienesRaicesNegocioBasicsWizard
                              lang={lang}
                              details={details}
                              setDetails={setDetails}
                              title={title}
                              setTitle={setTitle}
                              price={price}
                              setPrice={setPrice}
                              city={city}
                              setCity={setCity}
                              basicsShowValidation={basicsShowValidation}
                              requirements={requirements}
                              formatBrNegocioPriceInputDisplay={formatBrNegocioPriceInputDisplay}
                              formatBrNegocioIntegerInputDisplay={formatBrNegocioIntegerInputDisplay}
                              brNegocioDigitsOnly={brNegocioDigitsOnly}
                              logoUploading={logoUploading}
                              agentPhotoUploading={agentPhotoUploading}
                              uploadBusinessImage={uploadBusinessImage}
                              goToStep={goToStep}
                              previewListing={fullPreviewListingData}
                            />
                          ) : (
                          <>
                          <div>
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Tipo de propiedad" : "Property type"}{" *"}</label>
                            <select
                              value={details.brPropertyType ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDetails((prev) => ({ ...prev, brPropertyType: v, bienesRaicesSubcategoria: getBrSubcategoriaFromPropertyType(v) }));
                              }}
                              aria-invalid={basicsShowValidation && !details.brPropertyType?.trim()}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !details.brPropertyType?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            >
                              <option value="">{lang === "es" ? "Elige tipo de propiedad…" : "Choose property type…"}</option>
                              {BR_PROPERTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{lang === "es" ? o.label.es : o.label.en}</option>)}
                            </select>
                            {!details.brPropertyType?.trim() && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Subtipo de propiedad" : "Property subtype"}</label>
                            <input value={details.brPropertySubtype ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brPropertySubtype: e.target.value }))} placeholder={brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.subtypePlaceholder.es : brPrivateCopyProfile.subtypePlaceholder.en) : (lang === "es" ? "Ej: Casa independiente, Duplex" : "e.g. Single family, Duplex")} className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30" />
                          </div>
                          <div id="publish-basics-title">
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Título del anuncio" : "Listing title"}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">{lang === "es" ? "Un título claro que describa la propiedad." : "A clear title that describes the property."}</p>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.titlePlaceholder.es : brPrivateCopyProfile.titlePlaceholder.en) : (lang === "es" ? "Ej: Casa 3 recámaras en zona céntrica" : "e.g. 3-bed house in central area")}
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}</div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div id="publish-basics-price">
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Precio" : "Price"}{" *"}</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={price}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if ((details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio") {
                                    setPrice(formatBrNegocioPriceInputDisplay(v));
                                  } else {
                                    setPrice(v.replace(/[^0-9.]/g, ""));
                                  }
                                }}
                                placeholder={
                                  (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio"
                                    ? (lang === "es" ? "Ej: 1,200,000" : "e.g. 1,200,000")
                                    : lang === "es"
                                      ? "Ej: 250000"
                                      : "e.g. 250000"
                                }
                                aria-invalid={basicsShowValidation && !requirements.priceOk}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                  basicsShowValidation && !requirements.priceOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                )}
                              />
                              {!requirements.priceOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Indica el precio." : "Enter price."}</div>
                              )}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Modo de precio" : "Price display"}</label>
                              <div className="mt-2 flex rounded-xl border border-black/10 overflow-hidden bg-[#F5F5F5]">
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, brPriceDisplayMode: "exacto" }))} className={cx("flex-1 py-3 text-sm font-semibold", (details.brPriceDisplayMode ?? "exacto") === "exacto" ? "bg-[#C9B46A]/40 text-[#111111]" : "text-[#111111]/70 hover:bg-[#EFEFEF]")}>{lang === "es" ? "Exacto" : "Exact"}</button>
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, brPriceDisplayMode: "desde" }))} className={cx("flex-1 py-3 text-sm font-semibold", (details.brPriceDisplayMode ?? "") === "desde" ? "bg-[#C9B46A]/40 text-[#111111]" : "text-[#111111]/70 hover:bg-[#EFEFEF]")}>{lang === "es" ? "Desde" : "From"}</button>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                            <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Ubicación" : "Location"}</h4>
                            <div id="publish-basics-city">
                              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Ciudad" : "City"}{" *"}</label>
                              <CityAutocomplete
                                value={city}
                                onChange={setCity}
                                placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                                lang={lang}
                                label=""
                                variant="light"
                                className="mt-1"
                                invalid={basicsShowValidation && !requirements.cityOk}
                              />
                              {!requirements.cityOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Nombre de la vecindad" : "Neighborhood name"}</label>
                              <input value={details.brZone ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brZone: e.target.value }))} placeholder={lang === "es" ? "Ej: Rose Garden, Downtown, Little Portugal, Willow Glen" : "e.g. Rose Garden, Downtown, Little Portugal, Willow Glen"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                            </div>
                            {(details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio" ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Número" : "Street number"}</label>
                                  <input
                                    value={details.brNegocioStreetNumber ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioStreetNumber: e.target.value }))}
                                    placeholder={lang === "es" ? "Ej: 123" : "e.g. 123"}
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Calle" : "Street"}</label>
                                  <input
                                    value={details.brNegocioStreet ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioStreet: e.target.value }))}
                                    placeholder={lang === "es" ? "Ej: Av. Central" : "e.g. Main St"}
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estado" : "State"}</label>
                                  <input
                                    value={details.brNegocioState ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioState: e.target.value }))}
                                    placeholder={lang === "es" ? "Ej: CA" : "e.g. CA"}
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Código postal" : "ZIP code"}</label>
                                  <input
                                    value={details.brNegocioZip ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioZip: e.target.value.replace(/[^\d-]/g, "").slice(0, 10) }))}
                                    placeholder={lang === "es" ? "Ej: 95112" : "e.g. 95112"}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Dirección (opcional)" : "Address (optional)"}</label>
                                <input value={details.brAddress ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAddress: e.target.value }))} placeholder={lang === "es" ? "Ej: Calle 5, Av. Central" : "e.g. 123 Main St"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                            )}
                            <div>
                              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Mostrar ubicación" : "Location display"}</label>
                              <div className="mt-1 flex rounded-lg border border-black/10 overflow-hidden bg-[#F5F5F5]">
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, brLocationDisplayMode: "exacta" }))} className={cx("flex-1 py-2 text-xs font-semibold", (details.brLocationDisplayMode ?? "exacta") === "exacta" ? "bg-[#C9B46A]/30 text-[#111111]" : "text-[#111111]/70")}>{lang === "es" ? "Exacta" : "Exact"}</button>
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, brLocationDisplayMode: "aproximada" }))} className={cx("flex-1 py-2 text-xs font-semibold", (details.brLocationDisplayMode ?? "") === "aproximada" ? "bg-[#C9B46A]/30 text-[#111111]" : "text-[#111111]/70")}>{lang === "es" ? "Aproximada" : "Approximate"}</button>
                              </div>
                            </div>
                          </div>
                          {/* Shared optional fields for all BR (Privado and Negocio) */}
                          <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                            <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Datos opcionales de la propiedad" : "Optional property info"}</h4>
                            {(details.bienesRaicesBranch ?? "").trim().toLowerCase() === "privado" && (
                              <p className="text-[11px] text-[#111111]/65">{lang === "es" ? "Todos opcionales. Completa solo lo que conozcas." : "All optional. Fill in only what you know."}</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "negocio" && (
                                <>
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-[#111111]/80">{lang === "es" ? "Video de la propiedad" : "Property video"}</label>
                                    <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Pega el enlace del video de tu propiedad. Puede ser de YouTube, TikTok, Vimeo, Instagram u otro enlace público." : "Paste the link to your property video. Can be from YouTube, TikTok, Vimeo, Instagram or another public link."}</p>
                                    <input value={details.brVideoUrl ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brVideoUrl: e.target.value }))} placeholder="https://" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tour virtual" : "Virtual tour"}</label>
                                    <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Pega el enlace del recorrido virtual o tour 3D de la propiedad. Puede ser de Matterport, YouTube o del sitio web donde esté publicado." : "Paste the link to the virtual tour or 3D walkthrough. Can be Matterport, YouTube or the site where it is published."}</p>
                                    <input value={details.brVirtualTourUrl ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brVirtualTourUrl: e.target.value }))} placeholder="https://" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                  </div>
                                </>
                              )}
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Año de construcción" : "Year built"}</label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Año en que se construyó la propiedad o la última remodelación importante." : "Year the property was built or last major remodel."}</p>
                                <input value={details.brYearBuilt ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brYearBuilt: e.target.value }))} placeholder={lang === "es" ? "Ej: 1995" : "e.g. 1995"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Código de uso del suelo. Ej: R-1 (residencial), C-1 (comercial), agrícola." : "Land use code. e.g. R-1 (residential), C-1 (commercial), agricultural."}</p>
                                <input value={details.brZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brZoning: e.target.value }))} placeholder={lang === "es" ? "Ej: R-1, comercial" : "e.g. R-1, commercial"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Solo si aplica. Ej: se vende tal como está, short sale, probate, propiedad rentada." : "Only if applicable. e.g. as-is, short sale, probate, tenant-occupied."}</p>
                                <input value={details.brSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSpecialConditions: e.target.value }))} placeholder={lang === "es" ? "Opcional" : "Optional"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-xs text-[#111111]/80">{lang === "es" ? "Servicios disponibles" : "Utilities available"}</span>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Marca los servicios con los que cuenta la propiedad." : "Check the utilities available at the property."}</p>
                                <div className="mt-2 flex flex-wrap gap-3">
                                  {[
                                    { key: "brServicioAgua", labelEs: "Agua", labelEn: "Water" },
                                    { key: "brServicioElectricidad", labelEs: "Electricidad", labelEn: "Electric" },
                                    { key: "brServicioGas", labelEs: "Gas", labelEn: "Gas" },
                                    { key: "brServicioDrenaje", labelEs: "Drenaje", labelEn: "Sewer" },
                                    { key: "brServicioInternet", labelEs: "Internet", labelEn: "Internet" },
                                  ].map(({ key, labelEs, labelEn }) => {
                                    const val = (details[key as keyof typeof details] ?? "").toString().trim().toLowerCase();
                                    const isOn = val === "si" || val === "sí" || val === "yes";
                                    return (
                                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={isOn} onChange={(e) => setDetails((prev) => ({ ...prev, [key]: e.target.checked ? "si" : "" }))} className="rounded border-black/20 text-[#C9B46A] focus:ring-[#C9B46A]/30" />
                                        <span className="text-sm text-[#111111]">{lang === "es" ? labelEs : labelEn}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                {(details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "negocio" && (
                                  <div className="mt-3">
                                    <label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles adicionales de servicios" : "Additional utility details"}</label>
                                    <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: PG&E, San Jose Water, pozo, fosa séptica, panel solar." : "e.g. PG&E, San Jose Water, well, septic, solar."}</p>
                                    <input value={details.brUtilitiesForProperty ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brUtilitiesForProperty: e.target.value }))} placeholder={lang === "es" ? "Opcional" : "Optional"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Property-type–conditional sections: BR Privado only. Negocio keeps single Quick facts block. */}
                          {details.bienesRaicesBranch === "negocio" ? (
                            <div className="rounded-xl border border-black/10 bg-white/80 p-4">
                              <h4 className="text-sm font-medium text-[#111111] mb-3">{lang === "es" ? "Datos rápidos" : "Quick facts"}</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámaras" : "Bedrooms"}{" *"}</label><input value={details.brBedrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brBedrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brBedrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Baños" : "Bathrooms"}{" *"}</label><input value={details.brBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brBathrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Medios baños" : "Half baths"}</label><input value={details.brHalfBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brHalfBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label>
                                  <input
                                    value={formatBrNegocioIntegerInputDisplay(details.brSquareFeet ?? "")}
                                    onChange={(e) =>
                                      setDetails((prev) => ({
                                        ...prev,
                                        brSquareFeet: brNegocioDigitsOnly(e.target.value),
                                      }))
                                    }
                                    placeholder={lang === "es" ? "Ej: 1,200" : "e.g. 1,200"}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                  {!details.brSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label>
                                  <input
                                    value={formatBrNegocioIntegerInputDisplay(details.brLotSize ?? "")}
                                    onChange={(e) =>
                                      setDetails((prev) => ({
                                        ...prev,
                                        brLotSize: brNegocioDigitsOnly(e.target.value),
                                      }))
                                    }
                                    placeholder={lang === "es" ? "Ej: 5,000" : "e.g. 5,000"}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.brLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLevels: e.target.value }))} placeholder="1" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking"}</label><input value={details.brParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingSpaces: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                              </div>
                            </div>
                          ) : (() => {
                            const pt = (details.brPropertyType ?? "").trim();
                            const hideBrPrivateTechnical = (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "privado";
                            if (isBrPrivadoResidential(pt)) {
                              return (
                                <>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4">
                                    <h4 className="text-sm font-medium text-[#111111] mb-3">{lang === "es" ? "Datos rápidos residenciales" : "Residential quick facts"}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámaras" : "Bedrooms"}{" *"}</label><input value={details.brBedrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brBedrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brBedrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Baños" : "Bathrooms"}{" *"}</label><input value={details.brBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brBathrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Medios baños" : "Half baths"}</label><input value={details.brHalfBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brHalfBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label><input value={details.brSquareFeet ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSquareFeet: e.target.value }))} placeholder={lang === "es" ? "Ej: 1200" : "e.g. 1200"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label><input value={details.brLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLotSize: e.target.value }))} placeholder={lang === "es" ? "m² o pies²" : "sq ft"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.brLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLevels: e.target.value }))} placeholder="1" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Número de espacios de estacionamiento." : "Number of parking spaces."}</p>
                                        <input value={details.brParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingSpaces: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Interior y distribución" : "Interior & layout"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="sm:col-span-2">
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Espacios de la propiedad" : "Property spaces"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Marca o escribe los espacios principales que tiene la propiedad. Ej: sala, comedor, oficina, cuarto de lavado, family room." : "List the main spaces. e.g. living room, dining room, office, laundry room, family room."}</p>
                                        <input value={details.brRoomTypes ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brRoomTypes: e.target.value }))} placeholder={lang === "es" ? "Ej: sala, comedor, family room" : "e.g. living room, dining, family room"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámara principal" : "Primary bedroom"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: walk-in closet, baño completo, vista al jardín." : "e.g. walk-in closet, en suite bath, garden view."}</p>
                                        <input value={details.brPrimaryBedroomFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brPrimaryBedroomFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Baño principal" : "Primary bathroom"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: doble lavabo, tina, regadera, acabados de lujo." : "e.g. double vanity, tub, shower, luxury finishes."}</p>
                                        <input value={details.brPrimaryBathroomFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brPrimaryBathroomFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Comedor" : "Dining room"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: comedor formal, espacio para 8, conexión con cocina." : "e.g. formal dining, seats 8, open to kitchen."}</p>
                                        <input value={details.brDiningRoomFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brDiningRoomFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Cocina" : "Kitchen"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: isla, granito, electrodomésticos de acero inoxidable, desayunador." : "e.g. island, granite, stainless appliances, breakfast nook."}</p>
                                        <input value={details.brKitchenFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brKitchenFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Sistemas y equipamiento" : "Systems & equipment"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Calefacción" : "Heating"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: central de gas, piso radiante, calefactor de pared." : "e.g. central gas, radiant floor, wall heater."}</p>
                                        <input value={details.brHeating ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brHeating: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Enfriamiento" : "Cooling"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: aire central, mini splits, ventiladores de techo." : "e.g. central A/C, mini splits, ceiling fans."}</p>
                                        <input value={details.brCooling ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brCooling: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Electrodomésticos incluidos" : "Appliances included"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: refrigerador, estufa, lavavajillas, microondas, lavadora y secadora." : "e.g. fridge, range, dishwasher, microwave, washer & dryer."}</p>
                                        <input value={details.brAppliancesIncluded ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAppliancesIncluded: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Lavandería" : "Laundry"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: cuarto de lavado, área en el garaje, conexiones dentro de la casa." : "e.g. laundry room, garage hookups, in-unit."}</p>
                                        <input value={details.brLaundryFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLaundryFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Acabados e interior" : "Finishes & interior"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Pisos" : "Flooring"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: madera, laminado, loseta, alfombra, concreto pulido." : "e.g. hardwood, laminate, tile, carpet, polished concrete."}</p>
                                        <input value={details.brFlooring ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFlooring: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de chimeneas" : "Fireplace count"}</label><input value={details.brFireplaceCount ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFireplaceCount: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div className="sm:col-span-2">
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles de chimenea" : "Fireplace features"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: chimenea de leña, gas, piedra, en sala y recámara principal." : "e.g. wood-burning, gas, stone, in living room and primary bedroom."}</p>
                                        <input value={details.brFireplaceFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFireplaceFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Estacionamiento y acceso" : "Parking & access"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento (detalles)" : "Parking features"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: cochera cubierta 2 autos, entrada directa, EV charger." : "e.g. 2-car garage, direct access, EV charger."}</p>
                                        <input value={details.brParkingFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cocheras cubiertas" : "Attached garage spaces"}</label><input value={details.brAttachedGarageSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAttachedGarageSpaces: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Espacios descubiertos" : "Uncovered spaces"}</label><input value={details.brUncoveredSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brUncoveredSpaces: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Accesibilidad" : "Accessibility features"}</label><input value={details.brAccessibilityFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAccessibilityFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Exterior y terreno" : "Exterior & lot"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cercado" : "Fencing"}</label><input value={details.brFencing ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFencing: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Características del terreno" : "Lot features"}</label><input value={details.brLotFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLotFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Patio / portal" : "Patio & porch features"}</label><input value={details.brPatioPorchFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brPatioPorchFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Exterior" : "Exterior features"}</label><input value={details.brExteriorFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brExteriorFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div className="sm:col-span-2"><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estructuras adicionales" : "Additional structures"}</label><input value={details.brAdditionalStructures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAdditionalStructures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Construcción y legal" : "Construction & legal"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estilo arquitectónico" : "Architectural style"}</label><input value={details.brArchitecturalStyle ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brArchitecturalStyle: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Materiales" : "Materials"}</label><input value={details.brMaterials ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brMaterials: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cimentación" : "Foundation"}</label><input value={details.brFoundation ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFoundation: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Techo" : "Roof"}</label><input value={details.brRoof ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brRoof: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Construcción nueva" : "New construction"}</label><input value={details.brNewConstruction ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brNewConstruction: e.target.value }))} placeholder={lang === "es" ? "Sí/No" : "Yes/No"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela" : "Parcel number"}</label><input value={details.brParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Servicios" : "Services"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.brSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSewer: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Agua" : "Water"}</label><input value={details.brWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brWater: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.brGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                </>
                              );
                            }
                            if (isBrPrivadoLote(pt)) {
                              return (
                                <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                  <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Terreno" : "Land"}</h4>
                                  <p className="text-[11px] text-[#111111]/55">{lang === "es" ? "Solo información relevante para terreno o lote. No se piden recámaras, baños ni cocina." : "Only land/lot-relevant info. Bedrooms, bathrooms and kitchen are not asked."}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno (tamaño)" : "Lot size"}{" *"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Superficie en m², pies² o acres. Ej: 500 m², 0.25 acres." : "Area in sq ft, m² or acres. e.g. 500 m², 0.25 acres."}</p>
                                      <input value={details.brLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLotSize: e.target.value }))} placeholder={lang === "es" ? "m² o pies² o acres" : "sq ft, m² or acres"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      {!details.brLotSize?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Características del terreno" : "Lot features"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: plano, con pendiente, vista, esquina, acceso a calle." : "e.g. flat, sloped, view, corner lot, street access."}</p>
                                      <input value={details.brLotFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLotFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cercado" : "Fencing"}</label><input value={details.brFencing ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFencing: e.target.value }))} placeholder={lang === "es" ? "Ej: sí, reja perimetral" : "e.g. yes, perimeter"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div>
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela / APN" : "Parcel / APN"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Número de parcela o Assessor Parcel Number del catastro." : "Parcel number or Assessor Parcel Number."}</p>
                                      <input value={details.brParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Uso de suelo permitido. Ej: residencial, agrícola, comercial." : "Permitted use. e.g. residential, agricultural, commercial."}</p>
                                      <input value={details.brZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brZoning: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Solo si aplica. Ej: se vende tal como está, short sale, probate." : "Only if applicable. e.g. as-is, short sale, probate."}</p>
                                      <input value={details.brSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSpecialConditions: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Acceso" : "Access"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Cómo se accede al terreno: calle pavimentada, camino de tierra, easement, etc." : "How the lot is accessed: paved road, dirt road, easement, etc."}</p>
                                      <input value={details.brAccessDescription ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAccessDescription: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Servicios disponibles: Agua" : "Water available"}</label><input value={details.brWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brWater: e.target.value }))} placeholder={lang === "es" ? "Ej: municipal, pozo, no" : "e.g. city, well, none"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.brSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSewer: e.target.value }))} placeholder={lang === "es" ? "Ej: municipal, fosa, no" : "e.g. city, septic, none"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.brGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div className="sm:col-span-2"><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estructuras adicionales" : "Additional structures"}</label><input value={details.brAdditionalStructures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAdditionalStructures: e.target.value }))} placeholder={lang === "es" ? "Ej: bodega, caseta" : "e.g. shed, guardhouse"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                  </div>
                                </div>
                              );
                            }
                            if (isBrPrivadoComercial(pt)) {
                              return (
                                <>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Espacio comercial" : "Commercial space"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label><input value={details.brSquareFeet ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSquareFeet: e.target.value }))} placeholder={lang === "es" ? "Ej: 1200" : "e.g. 1200"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label><input value={details.brLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLotSize: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.brLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLevels: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking spaces"}</label><input value={details.brParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingSpaces: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles estacionamiento" : "Parking features"}</label><input value={details.brParkingFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Accesibilidad" : "Accessibility features"}</label><input value={details.brAccessibilityFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAccessibilityFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Uso y legal" : "Use & legal"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label><input value={details.brZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brZoning: e.target.value }))} placeholder={lang === "es" ? "Ej: C-1, comercial" : "e.g. C-1, commercial"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label><input value={details.brSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSpecialConditions: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela / APN" : "Parcel / APN"}</label><input value={details.brParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Construcción" : "Construction"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Año de construcción" : "Year built"}</label><input value={details.brYearBuilt ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brYearBuilt: e.target.value }))} placeholder={lang === "es" ? "Ej: 1995" : "e.g. 1995"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Materiales" : "Materials"}</label><input value={details.brMaterials ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brMaterials: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cimentación" : "Foundation"}</label><input value={details.brFoundation ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFoundation: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Techo" : "Roof"}</label><input value={details.brRoof ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brRoof: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Servicios" : "Services"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.brSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSewer: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Agua" : "Water"}</label><input value={details.brWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brWater: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.brGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Exterior / acceso" : "Exterior / access"}</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Exterior" : "Exterior features"}</label><input value={details.brExteriorFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brExteriorFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Descripción de acceso" : "Access description"}</label><input value={details.brAccessDescription ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAccessDescription: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                </>
                              );
                            }
                            if (isBrPrivadoEdificio(pt)) {
                              return (
                                <>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Datos del edificio" : "Building data"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label><input value={details.brSquareFeet ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSquareFeet: e.target.value }))} placeholder={lang === "es" ? "Ej: 5000" : "e.g. 5000"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.brSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label><input value={details.brLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLotSize: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.brLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brLevels: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking spaces"}</label><input value={details.brParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingSpaces: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles estacionamiento" : "Parking features"}</label><input value={details.brParkingFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParkingFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Legal y uso" : "Legal & use"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label><input value={details.brZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brZoning: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela / APN" : "Parcel / APN"}</label><input value={details.brParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div className="sm:col-span-2"><label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label><input value={details.brSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSpecialConditions: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Construcción" : "Construction"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Año de construcción" : "Year built"}</label><input value={details.brYearBuilt ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brYearBuilt: e.target.value }))} placeholder={lang === "es" ? "Ej: 1995" : "e.g. 1995"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Materiales" : "Materials"}</label><input value={details.brMaterials ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brMaterials: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cimentación" : "Foundation"}</label><input value={details.brFoundation ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brFoundation: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Techo" : "Roof"}</label><input value={details.brRoof ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brRoof: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Servicios" : "Services"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.brSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brSewer: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Agua" : "Water"}</label><input value={details.brWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brWater: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.brGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Exterior" : "Exterior"}</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Exterior" : "Exterior features"}</label><input value={details.brExteriorFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brExteriorFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estructuras adicionales" : "Additional structures"}</label><input value={details.brAdditionalStructures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, brAdditionalStructures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                </>
                              );
                            }
                            if (isBrPrivadoProyectoNuevo(pt)) {
                              return null;
                            }
                            return null;
                          })()}
                          <div id="publish-basics-desc">
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Descripción de la propiedad" : "Property description"}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">{brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.descriptionHelper.es : brPrivateCopyProfile.descriptionHelper.en) : (lang === "es" ? "Descripción completa del anuncio. Se usará en la ficha y para búsquedas (mín. 5 caracteres)." : "Full listing description for the listing page and search (min 5 characters).")}</p>
                            <textarea
                              value={details.brFullDescription ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, brFullDescription: e.target.value }))}
                              placeholder={brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.descriptionPlaceholder.es : brPrivateCopyProfile.descriptionPlaceholder.en) : (lang === "es" ? "Describa la propiedad, ubicación, acabados, características, etc." : "Describe the property, location, finishes, features, etc.")}
                              rows={5}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido. Mínimo 5 caracteres." : "Required. Min 5 characters."}</div>
                            )}
                          </div>
                          </>
                          )}
                        </div>
                        </BienesRaicesPublishShell>

                    </div>

                    {basicsShowValidation && !basicsOk && missingBasicsRequirementsText && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800" role="alert">
                        {missingBasicsRequirementsText}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleBack()}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                          {copy.back}
                        </button>
                      <button
                        type="button"
                        disabled={saveProgressing}
                        onClick={() => void handleSaveProgress()}
                        className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                      >
                        {copy.deleteApplication}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!basicsOk) {
                            setPublishNextAttempted((prev) => ({ ...prev, basics: true }));
                            requestAnimationFrame(() => {
                              const id = getFirstBasicsInvalidElementId(categoryFromUrl, requirements);
                              document.getElementById(id ?? "")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            });
                            return;
                          }
                          setPublishNextAttempted((prev) => ({ ...prev, basics: false }));
                          goToStep("details");
                        }}
                        className="rounded-xl font-semibold px-5 py-3 bg-yellow-500/90 hover:bg-yellow-500 text-black"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* DETAILS — only for categories that include details in their step flow (e.g. Rentas). BR has no details step. */}
                {step === "details" && stepsForCategory.includes("details") && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.detailsTitle}</h2>
                    <p className="mt-2 text-sm text-[#111111]">
                      {lang === "es"
                        ? "Estos detalles ayudan a que tu anuncio se vea como en las mejores plataformas. Solo llena lo que aplica."
                        : "These details help your listing look like the top platforms. Fill only what applies."}
                    </p>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                      <div className="text-sm text-[#111111]">
                        {lang === "es" ? "Categoría:" : "Category:"}{" "}
                        <span className="text-[#111111]/90 font-semibold">{categoryFromUrl}</span>
                      </div>

                      {getPublishCategoryFields(categoryFromUrl, details).length === 0 ? (
                        <div className="mt-3 text-sm text-[#111111]/55">
                          {lang === "es"
                            ? "Por ahora no hay campos extra para esta categoría."
                            : "No extra fields for this category yet."}
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {getPublishCategoryFields(categoryFromUrl, details).map((f) => {
                            const v = details[f.key] ?? "";
                            const label = f.label[lang];
                            const placeholder = f.placeholder ? f.placeholder[lang] : undefined;

                            if (f.type === "select" && f.options) {
                              return (
                                <label key={f.key} className="block">
                                  <div className="text-xs text-[#111111] mb-1">{label}</div>
                                  <select
                                    value={v}
                                    onChange={(e) =>
                                      setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                    }
                                    className="w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] outline-none focus:border-white/20"
                                  >
                                    <option value="">{lang === "es" ? "Selecciona…" : "Select…"}</option>
                                    {f.options.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label[lang]}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              );
                            }

                            if (categoryFromUrl === "bienes-raices" && f.key === "comodidades") {
                              const parts = (v || "").split(/,/).map((s) => s.trim()).filter(Boolean);
                              const toggle = (opt: { es: string; en: string }) => {
                                const token = opt[lang];
                                const has = parts.some((p) => p.toLowerCase() === token.toLowerCase());
                                const next = has ? parts.filter((p) => p.toLowerCase() !== token.toLowerCase()) : [...parts, token];
                                setDetails((prev) => ({ ...prev, comodidades: next.join(", ") }));
                              };
                              return (
                                <div key={f.key} className="sm:col-span-2">
                                  <div className="text-xs text-[#111111] mb-1">{label}</div>
                                  <p className="text-[10px] text-[#111111]/60 mb-2">
                                    {lang === "es" ? "Toca para agregar o quitar." : "Tap to add or remove."}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {BR_COMODIDADES_OPTIONS.map((opt) => {
                                      const token = opt[lang];
                                      const selected = parts.some((p) => p.toLowerCase() === token.toLowerCase());
                                      return (
                                        <button
                                          key={token}
                                          type="button"
                                          onClick={() => toggle(opt)}
                                          className={cx(
                                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                                            selected
                                              ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                                              : "border-black/15 bg-white/80 text-[#111111]/70 hover:border-black/25 hover:bg-white"
                                          )}
                                        >
                                          {token}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <input
                                    value={v}
                                    onChange={(e) =>
                                      setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                    }
                                    placeholder={placeholder}
                                    className="w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#111111]/30 outline-none focus:border-white/20"
                                  />
                                </div>
                              );
                            }

                            return (
                              <label key={f.key} className="block">
                                <div className="text-xs text-[#111111] mb-1">{label}</div>
                                <input
                                  value={v}
                                  onChange={(e) =>
                                    setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                  }
                                  inputMode={f.type === "number" ? "numeric" : undefined}
                                  placeholder={placeholder}
                                  className="w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#111111]/30 outline-none focus:border-white/20"
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setDetails({})}
                          className="text-xs text-[#111111] hover:text-[#111111]"
                        >
                          {lang === "es" ? "Limpiar detalles" : "Clear details"}
                        </button>
                        <div className="text-xs text-[#111111]/40">
                          {lang === "es"
                            ? "Estos detalles se guardan automáticamente."
                            : "These details are saved automatically."}
                        </div>
                      </div>
                    </div>

<div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => { if (category === "servicios" && !servicesPackage) { setShowServicesGate(true); return; } handleBack(); }}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.back}
                      </button>
                      <button
                        type="button"
                        disabled={saveProgressing}
                        onClick={() => void handleSaveProgress()}
                        className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                      >
                        {copy.deleteApplication}
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep("media")}
                        className="rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* MEDIA + CONTACT + PREVIEW */}
                {step === "media" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.mediaTitle}</h2>

                    <div className="mt-4 grid gap-5">
                      <MediaUploader
                        images={images}
                        onImagesChange={setImages}
                        videoFiles={videoFiles}
                        onVideoChange={(idx, f) => {
                          setVideoFiles((prev) => {
                            const n: [File | null, File | null] = [...prev];
                            n[idx] = f;
                            return n;
                          });
                          setVideoErrors((prev) => { const n: [string, string] = [...prev]; n[idx] = ""; return n; });
                          setVideoThumbBlobs((prev) => { const n: [Blob | null, Blob | null] = [...prev]; n[idx] = null; return n; });
                          if (f) inspectAndThumbVideo(f, idx);
                        }}
                        onVideoRemove={(idx) => {
                          setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[idx] = null; return n; });
                          setVideoThumbBlobs((prev) => { const n: [Blob | null, Blob | null] = [...prev]; n[idx] = null; return n; });
                          setVideoErrors((prev) => { const n: [string, string] = [...prev]; n[idx] = ""; return n; });
                        }}
                        isPro={effectiveIsPro}
                        maxImages={maxImages}
                        lang={lang}
                        uploadProgress={uploadProgress}
                        videoPreviewUrls={proVideoPreviewUrls}
                        videoErrors={videoErrors}
                        proUpgradeHref={
                          categoryFromUrl === "bienes-raices"
                            ? `/clasificados/publicar/bienes-raices/pro?lang=${lang}&return=${encodeURIComponent(
                                `${pathname ?? "/clasificados/publicar/bienes-raices"}?lang=${lang}&step=media&fromPro=1`
                              )}`
                            : undefined
                        }
                        onBeforeProNavigate={categoryFromUrl === "bienes-raices" ? saveDraftAndImagesForProReturn : undefined}
                        maxVideos={categoryFromUrl === "bienes-raices" ? 1 : (isRentasPrivado ? 1 : 2)}
                        copy={{
                          addImages: copy.addImages,
                          addVideo: copy.addVideo,
                          video: isRentasPrivado ? (copy as { rentasPrivadoVideo?: string }).rentasPrivadoVideo : copy.video,
                          videoHint: isRentasPrivado ? (copy as { rentasPrivadoVideoHint?: string }).rentasPrivadoVideoHint : copy.videoHint,
                          images: copy.images,
                        }}
                      />

                      {categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio" && (
                        <>
                          <BienesRaicesNegocioMediaUrlFields lang={lang} details={details} setDetails={setDetails} />
                          <BienesRaicesNegocioFloorplanBlock
                            lang={lang}
                            details={details}
                            setDetails={setDetails}
                            floorPlanUploading={floorPlanUploading}
                            uploadBusinessFloorPlan={uploadBusinessFloorPlan}
                          />
                        </>
                      )}

                        {!requirements.imagesOk && (
                          <div className="mt-1 text-xs text-[#111111]/40">
                            {lang === "es" ? "Requerido: mínimo 1 foto." : "Required: at least 1 photo."}
                          </div>
                        )}

                        {!(categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio") && (
                          <MediaStepContactCard
                            lang={lang}
                            cx={cx}
                            copy={{ contact: copy.contact, phone: copy.phone, email: copy.email, both: copy.both }}
                            contactMethod={contactMethod}
                            setContactMethod={setContactMethod}
                            contactPhone={contactPhone}
                            setContactPhone={setContactPhone}
                            contactEmail={contactEmail}
                            setContactEmail={setContactEmail}
                            formatPhoneDisplay={formatPhoneDisplay}
                            phoneOk={requirements.phoneOk}
                            emailOk={requirements.emailOk}
                          />
                        )}

                      {isBienesRaicesNegocio && (
                        <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-b from-[#FFFCF7] to-[#F5F5F5] p-4 sm:p-5 shadow-sm">
                          <p className="text-sm font-semibold text-[#111111]">
                            {lang === "es" ? "Última revisión antes de publicar" : "Final review before publishing"}
                          </p>
                          <p className="mt-1 text-xs text-[#111111]/60">
                            {lang === "es"
                              ? "Abre la vista previa a pantalla completa (como la verán los compradores), vuelve a editar o publica cuando estés listo."
                              : "Open the full-page preview as buyers will see it, go back to edit, or publish when ready."}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => void openBrNegocioFullListingPreview()}
                              className="rounded-xl border border-[#3F5A43]/70 bg-[#3F5A43] px-4 py-2.5 text-sm font-semibold text-[#F7F4EC] shadow-sm hover:bg-[#36503A] transition"
                            >
                              {lang === "es" ? "Ver anuncio" : "View listing"}
                            </button>
                            <button
                              type="button"
                              onClick={() => goToStep("basics")}
                              className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
                            >
                              {lang === "es" ? "Volver a editar" : "Back to edit"}
                            </button>
                            <button
                              type="button"
                              disabled={publishing || !requirements.allOk || !previewViewed || !rulesConfirmed}
                              onClick={() => void publish()}
                              className={cx(
                                "rounded-xl px-4 py-2.5 text-sm font-semibold",
                                publishing || !requirements.allOk || !previewViewed || !rulesConfirmed
                                  ? "bg-yellow-500/40 text-black/70 cursor-not-allowed"
                                  : "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                              )}
                            >
                              {publishing ? copy.publishing : copy.publish}
                            </button>
                          </div>
                        </div>
                      )}

                      {isBienesRaicesPrivado && (
                        <div className="rounded-2xl border border-emerald-800/20 bg-gradient-to-b from-[#F4FAF6] to-[#F5F5F5] p-4 sm:p-5 shadow-sm">
                          <p className="text-sm font-semibold text-[#111111]">
                            {lang === "es" ? "Revisión final (propietario)" : "Final review (owner)"}
                          </p>
                          <p className="mt-1 text-xs text-[#111111]/60">
                            {lang === "es"
                              ? "Abre la vista previa a pantalla completa (como la verán los compradores), vuelve a editar o publica cuando estés listo."
                              : "Open the full-page preview as buyers will see it, go back to edit, or publish when ready."}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => void openBrPrivadoFullListingPreview()}
                              className="rounded-xl border border-[#2D5016]/80 bg-[#2D5016] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#244012] transition"
                            >
                              {lang === "es" ? "Ver anuncio" : "View listing"}
                            </button>
                            <button
                              type="button"
                              onClick={() => goToStep("basics")}
                              className="rounded-xl border border-emerald-800/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-emerald-50/80 transition"
                            >
                              {lang === "es" ? "Volver a editar" : "Back to edit"}
                            </button>
                            <button
                              type="button"
                              disabled={publishing || !requirements.allOk || !previewViewed || !rulesConfirmed}
                              onClick={() => void publish()}
                              className={cx(
                                "rounded-xl px-4 py-2.5 text-sm font-semibold",
                                publishing || !requirements.allOk || !previewViewed || !rulesConfirmed
                                  ? "bg-yellow-500/40 text-black/70 cursor-not-allowed"
                                  : "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                              )}
                            >
                              {publishing ? copy.publishing : copy.publish}
                            </button>
                          </div>
                        </div>
                      )}

                      {isBienesRaicesNegocio ? (
                        <div className="mt-1 w-full min-w-0">
                          <p className="text-sm font-semibold text-[#111111]">{copy.preview}</p>
                          <p className="mt-1 mb-3 text-xs text-[#111111]/55">
                            {lang === "es"
                              ? "Vista previa final — mismo diseño premium que verán los compradores."
                              : "Final preview — same premium layout buyers will see."}
                          </p>
                          <div className="max-h-[min(92vh,980px)] w-full min-w-0 overflow-y-auto overflow-x-hidden">
                            <ListingView listing={fullPreviewListingData} previewMode hideProComparisonUI />
                          </div>
                        </div>
                      ) : (
                        <PublishMediaPreviewPanel
                          lang={lang}
                          copy={{ preview: copy.preview, cardPreview: copy.cardPreview }}
                          useBienesRaicesPrivadoLeftCard={
                            categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "negocio"
                          }
                          formatMoneyMaybe={formatMoneyMaybe}
                          coverImage={coverImage}
                          previewPrice={previewPrice}
                          previewTitle={previewTitle}
                          previewCity={previewCity}
                          previewPosted={previewPosted}
                          previewShortDescription={previewShortDescription}
                          details={details}
                          previewPriceIsFree={publishDraftSnapshot.isFree}
                          rightPanel={{
                            copy: {
                              detailPreview: copy.detailPreview,
                              saveLabel: copy.saveLabel,
                              shareLabel: copy.shareLabel,
                              contactLabel: copy.contactLabel,
                              fullPreviewCta: copy.fullPreviewCta,
                              proPreviewCta: copy.proPreviewCta,
                            },
                            viewYourListingCta: (copy as { viewYourListingCta?: string }).viewYourListingCta,
                            previewCategoryLabel,
                            categoryFromUrl,
                            isBienesRaicesPrivado,
                            previewDetailPairs,
                            compactBrPrivateDetailPairs,
                            previewShortDescription,
                            previewDescription,
                            isRentasPrivado,
                            isBienesRaicesNegocio,
                            openFullPreview,
                            openProPreview,
                            isPro,
                            videoFiles,
                            videoErrors,
                            proVideoThumbPreviewUrls,
                            proVideoPreviewUrls,
                            expandedVideoIndex,
                            setExpandedVideoIndex,
                          }}
                        />
                      )}

                      {publishError && (
                        <div
                          className="rounded-xl p-4 text-sm"
                          style={{ background: "#ffe5e5", border: "2px solid red", color: "#b00020" }}
                          role="alert"
                        >
                          <div className="font-semibold">❌ {copy.errorTitle}</div>
                          <div className="mt-1">{publishError}</div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-1">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rulesConfirmed}
                            onChange={(e) => setRulesConfirmedPersisted(e.target.checked)}
                            className="mt-1 rounded border-black/20"
                          />
                          <span className="text-sm text-[#111111]">
                            {copy.rulesConfirm}
                            {" "}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setShowRulesModal(true); }}
                              className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
                            >
                              {lang === "es" ? "Ver reglas" : "View rules"}
                            </button>
                          </span>
                        </label>
                      </div>

                      <label className="mt-3 flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          id="confirmPreview"
                          checked={previewViewed}
                          onChange={(e) => setPreviewViewed(e.target.checked)}
                          className="mt-1 rounded border-black/20 text-[#C9B46A] focus:ring-yellow-400/30"
                        />
                        <span className="text-sm text-[#111111]">
                          {lang === "es" ? "Confirmo que revisé mi anuncio y que toda la información es correcta." : "I confirm I reviewed my listing and all information is correct."}
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleBack()}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                          {copy.back}
                        </button>
                        <button
                          type="button"
                          disabled={saveProgressing}
                          onClick={() => void handleSaveProgress()}
                          className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                        >
                          {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCurrentDraft()}
                          className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                        >
                          {copy.deleteApplication}
                        </button>
                        <button
                          type="button"
                          disabled={publishing || !requirements.allOk || !previewViewed || !rulesConfirmed}
                          onClick={publish}
                          className={cx(
                            "rounded-xl font-semibold px-6 py-3",
                            publishing || !requirements.allOk || !previewViewed || !rulesConfirmed
                              ? "bg-yellow-500/40 text-black/70 cursor-not-allowed"
                              : "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                          )}
                        >
                          {publishing ? copy.publishing : copy.publish}
                        </button>
                      </div>
                      {!previewViewed && (
                        <p className="mt-2 text-sm text-amber-700">
                          {lang === "es"
                            ? "Marca la casilla de arriba para confirmar que revisaste el anuncio, o vuelve desde “Ver anuncio” para registrar la vista previa."
                            : "Check the box above to confirm you reviewed the listing, or return from “View listing” so we know you saw the preview."}
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Success modal after publish */}
              {showSuccessModal && publishedId && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="success-modal-title"
                >
                  <div
                    className="absolute inset-0 bg-black/60"
                    aria-hidden
                    onClick={() => setShowSuccessModal(false)}
                  />
                  <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-[#F5F5F5] shadow-xl p-6">
                    <h2 id="success-modal-title" className="text-xl font-bold text-[#111111] text-center">
                      ✅ {copy.successTitle}
                    </h2>
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => router.push(`/clasificados/anuncio/${publishedId}?lang=${lang}`)}
                        className="rounded-xl bg-[#111111] text-white font-semibold px-5 py-3 hover:bg-[#333333]"
                      >
                        {copy.viewListing}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/mis-anuncios?lang=${lang}`)}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] font-semibold px-5 py-3 hover:bg-[#EFEFEF]"
                      >
                        {copy.goToMyListings}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-xs text-[#111111]/40 text-center">
                {lang === "es"
                  ? `Sesión: ${userId ? userId.slice(0, 8) + "…" : ""} · Guardado automático activo`
                  : `Session: ${userId ? userId.slice(0, 8) + "…" : ""} · Autosave active`}
              </div>
            </>
          )}
        </div>
      </div>
          {showServicesGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="p-5">
              <div className="text-sm font-semibold text-[#111111]">
                {lang === "es" ? "Servicios es para negocios" : "Services is for businesses"}
              </div>
              <div className="mt-1 text-xs text-[#5A5A5A]">
                {lang === "es"
                  ? "Elige tu nivel de presencia digital. No se te cobrará hasta publicar."
                  : "Choose your digital presence level. You won’t be charged until you publish."}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setServicesPackage("standard");
                    setShowServicesGate(false);
                    goToStep("basics");
                  }}
                  className="rounded-2xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] p-4 text-left"
                >
                  <div className="text-sm font-semibold text-[#111111]">Business Standard</div>
                  <div className="mt-0.5 text-xs text-[#5A5A5A]">$200 / {lang === "es" ? "mes" : "month"}</div>
                  <ul className="mt-3 space-y-1 text-xs text-[#2B2B2B]">
                    <li>• {lang === "es" ? "Logo de su negocio" : "Business logo"}</li>
                    <li>• {lang === "es" ? "Perfil básico" : "Basic profile"}</li>
                    <li>• {lang === "es" ? "Aparece en búsquedas y filtros" : "Shows in search & filters"}</li>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setServicesPackage("plus");
                    setShowServicesGate(false);
                    goToStep("basics");
                  }}
                  className="rounded-2xl border border-[#A98C2A]/60 bg-[#F2EFE8] hover:bg-[#EFE7D8] p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#111111]">Business Plus</div>
                    <span className="rounded-full bg-[#111111] px-2 py-0.5 text-[10px] font-semibold text-white">
                      {lang === "es" ? "Recomendado" : "Recommended"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#5A5A5A]">$349 / {lang === "es" ? "mes" : "month"}</div>
                  <ul className="mt-3 space-y-1 text-xs text-[#2B2B2B]">
                    <li>• {lang === "es" ? "Más fotos + más detalles" : "More photos + more detail"}</li>
                    <li>• {lang === "es" ? "Su negocio más visible" : "More visibility"}</li>
                    <li>• {lang === "es" ? "Oportunidades mayores para obtener más clientes" : "More chances to win customers"}</li>
                    <li>• {lang === "es" ? "Posibilidad de poner videos también" : "Option to add videos"}</li>
                  </ul>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-[#5A5A5A]">
                  {lang === "es"
                    ? "¿Anuncias en la revista impresa? Tu cuenta incluye beneficios adicionales."
                    : "Print advertiser? Your account includes additional benefits."}
                </div>
                <button
                  type="button"
                  onClick={() => setShowServicesGate(false)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
</main>
  );
}

