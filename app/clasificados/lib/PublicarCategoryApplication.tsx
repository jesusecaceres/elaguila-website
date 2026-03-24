"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiShoppingCart,
  FiHome,
  FiLayers,
  FiTruck,
  FiCoffee,
  FiTool,
  FiBriefcase,
  FiBook,
  FiUsers,
  FiMapPin,
} from "react-icons/fi";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { clearAllClassifiedsDrafts, RULES_CONFIRMED_KEY, getStoredDraftId, setStoredDraftId, clearStoredDraftId } from "@/app/clasificados/lib/classifiedsDraftStorage";
import { setPreviewDraft } from "@/app/clasificados/lib/previewListingDraft";
import {
  createDraft,
  updateDraft,
  getDraft,
  getDraftsForCategory,
  getLatestDraftForCategory,
  getLatestDraftForRentasBranch,
  deleteDraftInDb,
  type DraftDataPayload,
} from "@/app/clasificados/lib/listingDraftsDb";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import type { PublishStep } from "@/app/clasificados/config/categorySchema";
import { getPublishCategoryFields } from "@/app/clasificados/config/publishCategoryFields";
import {
  RENTAS_SUBCATEGORIES,
  getTipoOptionsForSubcategory,
} from "@/app/clasificados/rentas/shared/fields/rentasTaxonomy";
import { mapRentasNegocioDetailsTierToDb } from "@/app/clasificados/rentas/negocio/mapping/rentasNegocioDetailsTierToDb";
import { RENTAS_NEGOCIO_PRICE_PER_POST } from "@/app/clasificados/rentas/negocio/publish/rentasNegocioPublishConstants";
import { BUSINESS_META_KEYS } from "@/app/clasificados/config/businessListingContract";
import { buildNegocioRedesPayload } from "@/app/clasificados/bienes-raices/negocio/utils/brNegocioContactHelpers";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaTwitter, FaYoutube } from "react-icons/fa";
import { buildPublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import {
  coalesceNegocioAgenteFromWizard,
  coalesceNegocioNombreFromWizard,
} from "@/app/clasificados/lib/legacyWizardCoalesce";
import { stripLegacySharedWizardBrKeys } from "@/app/clasificados/lib/stripLegacySharedWizardBrKeys";
import { RentasNegocioPublishShell } from "@/app/clasificados/rentas/negocio/publish/RentasNegocioPublishShell";
import { RentasPublishShell } from "@/app/clasificados/rentas/shared/publish/RentasPublishShell";
import { RentasPublishTrackStep } from "@/app/clasificados/rentas/shared/publish/RentasPublishTrackStep";
import { MediaStepContactCard } from "@/app/clasificados/lib/publishUi/MediaStepContactCard";
import { PublishMediaPreviewPanel } from "@/app/clasificados/lib/publishUi/PublishMediaPreviewPanel";
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
import RentasPrivadoPublishPreview from "@/app/clasificados/rentas/privado/preview/RentasPrivadoPublishPreview";

/** Real categories for publicar (no "all", no "Más"). Same order and icons as lista explorer. */
const PUBLICAR_CATEGORIES: Array<{
  key: Exclude<CategoryKey, "all">;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "en-venta", Icon: FiShoppingCart },
  { key: "bienes-raices", Icon: FiLayers },
  { key: "rentas", Icon: FiHome },
  { key: "autos", Icon: FiTruck },
  { key: "restaurantes", Icon: FiCoffee },
  { key: "servicios", Icon: FiTool },
  { key: "empleos", Icon: FiBriefcase },
  { key: "clases", Icon: FiBook },
  { key: "comunidad", Icon: FiUsers },
  { key: "travel", Icon: FiMapPin },
];

type Lang = "es" | "en";

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


export default function PublicarCategoryApplication() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ category?: string }>();

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const slugFromUrl = (params?.category ?? "").trim().toLowerCase();
  const categoryFromUrl = normalizeCategory(params?.category ?? "") || "all";
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
    const slug = categoryFromUrl || "all";
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
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "all"}`;
      router.replace(qs ? `${path}?${qs}` : path);
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  const [step, setStep] = useState<PublishStep>(() => {
    const cat = categoryFromUrl || "all";
    const steps: PublishStep[] =
      cat === "rentas" ? ["category", "rentas-track", "basics", "details", "media"] : ["category", "basics", "details", "media"];
    const s = searchParams?.get("step")?.trim();
    if (
      s &&
      (["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"] as const).includes(s as PublishStep) &&
      steps.includes(s as PublishStep)
    )
      return s as PublishStep;
    return "category";
  });
  const [category, setCategory] = useState<CategoryKey | "">(() => categoryFromUrl);

  /** Full step order for current category. */
  const stepsForCategory = useMemo((): PublishStep[] => {
    const cat = categoryFromUrl || "all";
    if (cat === "rentas") return ["category", "rentas-track", "basics", "details", "media"];
    return ["category", "basics", "details", "media"];
  }, [categoryFromUrl]);

  /** Previous logical step for in-app Back. Returns null only when already at category. */
  const getPreviousStep = useCallback((): PublishStep | null => {
    const idx = stepsForCategory.indexOf(step);
    if (idx <= 0) return null;
    return stepsForCategory[idx - 1];
  }, [stepsForCategory, step]);

  /** Sync step into URL query (preserves lang, draftId, etc.). Replace = no new history entry. scroll: false to avoid double scroll. */
  const syncStepInUrl = useCallback(
    (newStep: PublishStep) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("step", newStep);
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "all"}`;
      router.replace(`${path}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** Push step to URL so browser Back has a previous step in the flow. Use when user navigates forward (goToStep). */
  const syncStepInUrlPush = useCallback(
    (newStep: PublishStep) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("step", newStep);
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "all"}`;
      router.push(`${path}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** When true, step→URL effect should skip (we just pushed in goToStep). */
  const skipStepSyncRef = useRef(false);

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

  const stepOrder = stepsForCategory;
  const safeStepForProgress: PublishStep = step;
  const currentStepIndex = Math.max(0, stepOrder.indexOf(safeStepForProgress));

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
  const isRentasPrivado = categoryFromUrl === "rentas" && (details.rentasBranch ?? "").trim() === "privado";
  const isBienesRaicesNegocio = false;
  const isBienesRaicesPrivado = false;
  const effectiveIsPro = isPro || isRentasPrivado;
  const maxImages = isRentasPrivado ? 15 : effectiveIsPro ? 12 : 3;

  // If plan changes to Free, trim images to Free limit (3). Rentas Privado keeps higher limits.
  useEffect(() => {
    if (!effectiveIsPro && images.length > 3) {
      setImages((prev) => prev.slice(0, 3));
    }
  }, [effectiveIsPro, images.length]);

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
  /** Rentas: branches we already ran restore check for (so we don’t re-fetch). */
  const checkedRentasBranchesRef = useRef<Set<string>>(new Set());
  /** Rentas: user chose "Start new" for this branch this session; don’t show restore modal again. */
  const startNewRentasBranchesRef = useRef<Set<string>>(new Set());
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

  /** Navigate to a step: push URL so browser Back has history; scroll form to top. Use for forward step navigation only. For Back use handleBack(). */
  const goToStep = useCallback(
    (newStep: PublishStep) => {
      skipStepSyncRef.current = true;
      setStep(newStep);
      syncStepInUrlPush(newStep);
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
        steps: { category: "Categoría", "rentas-track": "Rama", basics: "Básicos", details: "Detalles", media: "Media + Contacto + Vista previa" },
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
        steps: { category: "Category", "rentas-track": "Track", basics: "Basics", details: "Details", media: "Media + Contact + Preview" },
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
          "We’ll add structured category fields in the next batch. For now, we keep the experience clean and safe.",
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

  const VALID_STEPS: PublishStep[] = ["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"];

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
          const categoryForQuery = categoryFromUrl || undefined;
          if (categoryForQuery === "rentas") {
            const branch = ((parsed as any)?.details as Record<string, string> | undefined)?.rentasBranch?.trim().toLowerCase();
            if (branch === "privado" || branch === "negocio") {
              const latest = await getLatestDraftForRentasBranch(supabase, userId, branch);
              if (!cancelled && latest?.draft_data) {
                applyDraftPayloadFromDb(latest.draft_data as DraftDataPayload);
                setDraftId(latest.id);
                setStoredDraftId(userId, latest.id);
                syncDraftIdInUrl(latest.id);
                return;
              }
            }
          } else {
            const latest = await getLatestDraftForCategory(supabase, userId, categoryForQuery);
            if (!cancelled && latest?.draft_data) {
              applyDraftPayloadFromDb(latest.draft_data as DraftDataPayload);
              setDraftId(latest.id);
              setStoredDraftId(userId, latest.id);
              syncDraftIdInUrl(latest.id);
              return;
            }
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

        // 2) No draftId in URL: if latest draft exists, show restore modal (do not hydrate)
        if (categoryForQuery === "rentas") {
          const raw = localStorage.getItem(draftKey);
          let branchHint: string | null = null;
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Partial<DraftV1>;
              const d = (parsed as any)?.details as Record<string, string> | undefined;
              const b = (d?.rentasBranch ?? "").trim().toLowerCase();
              if (b === "privado" || b === "negocio") branchHint = b;
            } catch {
              // ignore
            }
          }
          if (branchHint) {
            const latest = await getLatestDraftForRentasBranch(supabase, userId, branchHint);
            if (cancelled) return;
            if (latest?.draft_data) {
              setDraftId(latest.id);
              setStoredDraftId(userId, latest.id);
              setShowDraftRestoreModal(true);
              return;
            }
          }
          // No branch chosen yet: do not offer a random rentas draft; wait for branch selection (see effect below)
          return;
        }
        {
          const latest = categoryForQuery
            ? await getLatestDraftForCategory(supabase, userId, categoryForQuery)
            : null;
          if (cancelled) return;
          if (latest?.draft_data) {
            setDraftId(latest.id);
            setStoredDraftId(userId, latest.id);
            setShowDraftRestoreModal(true);
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

  // Rentas: when user selects a branch, run restore check for that branch only (no modal before branch is chosen).
  useEffect(() => {
    if (categoryFromUrl !== "rentas" || !signedIn || !userId || searchParams?.get("draftId")?.trim()) return;
    const branch = (details.rentasBranch ?? "").trim().toLowerCase();
    if (branch !== "privado" && branch !== "negocio") return;
    if (checkedRentasBranchesRef.current.has(branch) || startNewRentasBranchesRef.current.has(branch)) return;

    let cancelled = false;
    checkedRentasBranchesRef.current.add(branch);
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const latest = await getLatestDraftForRentasBranch(supabase, userId, branch);
        if (cancelled) return;
        if (startNewRentasBranchesRef.current.has(branch)) return;
        if (latest?.draft_data) {
          setDraftId(latest.id);
          setStoredDraftId(userId, latest.id);
          setShowDraftRestoreModal(true);
        }
      } catch {
        // leave modal closed
      }
    })();
    return () => { cancelled = true; };
  }, [categoryFromUrl, signedIn, userId, details.rentasBranch, searchParams]);

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
    setStep("category");
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
            router.replace(`/clasificados/publicar/${draftCat}?${p.toString()}`);
            return;
          }
          applyDraftPayloadFromDb(payload);
          const maybeStep = payload.step as PublishStep | undefined;
          const restoredStep =
            maybeStep && VALID_STEPS.includes(maybeStep) && (stepsForCategory as readonly PublishStep[]).includes(maybeStep)
              ? maybeStep
              : "basics";
          setStep(restoredStep);
          syncDraftIdInUrl(draftId);
          syncStepInUrl(restoredStep);
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
        router.replace(`/clasificados/publicar/${parsedCat}?${p.toString()}`);
        return;
      }
      applyDraftToForm(parsed);
      setStep("basics");
      syncStepInUrl("basics");
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
    if (categoryFromUrl === "rentas") {
      const b = (details.rentasBranch ?? "").trim().toLowerCase();
      if (b === "privado" || b === "negocio") startNewRentasBranchesRef.current.add(b);
    }
    setDraftId(null);
    if (userId) clearStoredDraftId(userId);
    resetFormToEmpty();
    setShowDraftRestoreModal(false);
    syncDraftIdInUrl(null);
    if (categoryFromUrl === "rentas") {
      setStep("rentas-track");
      syncStepInUrl("rentas-track");
    } else {
      setStep("category");
      syncStepInUrl("category");
    }
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
    if (categoryFromUrl === "rentas") {
      setStep("rentas-track");
      syncStepInUrl("rentas-track");
    } else {
      setStep("category");
      syncStepInUrl("category");
    }
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

      const categorySlug = payload.category || "all";
      const rentasBranch = (payload.details?.rentasBranch ?? "").trim().toLowerCase();
      if (categorySlug === "rentas" && rentasBranch !== "privado" && rentasBranch !== "negocio") {
        // Don't write to DB until branch is chosen; keep local autosave only
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
        // One active draft per category per user (for rentas: per branch)
        const isRentasWithBranch = categorySlug === "rentas" && (rentasBranch === "privado" || rentasBranch === "negocio");
        const existing = isRentasWithBranch
          ? await getLatestDraftForRentasBranch(supabase, userId, rentasBranch)
          : await getLatestDraftForCategory(supabase, userId, categorySlug);
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
    const isPrivate = category === "rentas" && (details.rentasBranch ?? "").trim() === "privado";
    const descriptionForSnapshot = description;
    const cityCanonical = normalizeCity(city) || null;
    const detailPairs = getDetailPairs(category, lang, details, cityCanonical ?? city.trim());
    return buildPublishDraftSnapshot({
      title,
      description: descriptionForSnapshot,
      city,
      price,
      isFree: category === "en-venta" ? false : isFree,
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
      const rentasBranch = (snap.details.rentasBranch ?? "").trim();
      const isRentasNegocio = snap.category === "rentas" && rentasBranch === "negocio";
      // Insert from same normalized snapshot as preview/validation (DB field names unchanged).
      const mediaPhoneDigits = getPhoneDigits(snap.contactPhone);
      const resolvedPhoneForInsert = mediaPhoneDigits.length === 10 ? mediaPhoneDigits : null;
      const resolvedEmailForInsert = snap.contactEmail.trim();
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
      if (snap.category === "rentas") {
        insertPayload.seller_type = rentasBranch === "negocio" ? "business" : "personal";
        if (isRentasNegocio) {
          const tier = (snap.details.rentasTier ?? "").trim();
          insertPayload.rentas_tier = mapRentasNegocioDetailsTierToDb(tier);
          insertPayload.business_name = coalesceNegocioNombreFromWizard(snap.details) || null;
          const businessMeta: Record<string, string> = {};
          for (const k of BUSINESS_META_KEYS) {
            let v = (snap.details[k] ?? "").trim();
            if (!v && k === "negocioNombre") v = coalesceNegocioNombreFromWizard(snap.details);
            if (!v && k === "negocioAgente") v = coalesceNegocioAgenteFromWizard(snap.details);
            if (v) businessMeta[k] = v;
          }
          const mergedRedes = buildNegocioRedesPayload(snap.details as Record<string, string | undefined>);
          if (mergedRedes.trim()) {
            businessMeta.negocioRedes = mergedRedes.trim();
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

// Pro video upload (optional, Pro-only): up to 2 clips.
const videoLimit = 2;
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
      setPublishError((e?.message as string) || "Unknown error");
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
              {copy.title}
            </h1>
            <p className="text-[#111111] text-center max-w-2xl mx-auto">
              {checking ? copy.checking : copy.subtitle}
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
                      {isRentasPrivado
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
                      "max-w-screen-2xl"
                    )}
                  >
                    {isRentasPrivado ? (
                      <>
                        <RentasPrivadoPublishPreview
                          listing={fullPreviewListingData}
                          previewMode={true}
                        />
                        <div className="mt-10 pt-8 border-t border-black/10 max-w-2xl mx-auto space-y-3">
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
                        </div>
                      </>
                    ) : (
                      <ListingView
                        listing={fullPreviewListingData}
                        previewMode={true}
                        previewProUpgrade={fullPreviewVariant === "pro"}
                        proHighlight={fullPreviewVariant === "pro" ? proHighlightId : null}
                        onProBenefitClick={fullPreviewVariant === "pro" ? setProHighlightId : undefined}
                        hideProComparisonUI={false}
                      />
                    )}
                    {!isRentasPrivado ? (
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
                    ) : null}
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
                    const label = s === "category" ? copy.steps.category : s === "rentas-track" ? copy.steps["rentas-track"] : s === "basics" ? copy.steps.basics : s === "details" ? copy.steps.details : copy.steps.media;
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
                {/* CATEGORY (STEP 1) — icon cards, all real categories, no Más */}
                {step === "category" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.categoryTitle}</h2>
                    <p className="mt-2 text-sm text-[#111111]">{copy.categoryNote}</p>

                    <div
                      className={cx(
                        "mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3",
                        categoryShowValidation && !requirements.categoryOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                      )}
                    >
                      {PUBLICAR_CATEGORIES.map(({ key, Icon }) => {
                        const label = categoryConfig[key].label[lang];
                        const selected = category === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const qs = searchParams?.toString() || `lang=${lang}`;
                              router.replace(`/clasificados/publicar/${key}?${qs}`);
                              setCategory(key);
                              scrollCategoryActionsIntoView();
                            }}
                            className={cx(
                              "flex flex-col items-center justify-center gap-2 rounded-xl border py-4 px-3 transition-colors",
                              "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30",
                              selected
                                ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                                : "border-black/10 bg-white text-[#111111] hover:bg-[#F5F5F5] active:bg-[#EFEFEF]"
                            )}
                            aria-pressed={selected}
                            aria-label={label}
                          >
                            <Icon className="h-7 w-7 shrink-0 text-[#111111]" aria-hidden />
                            <span className="text-sm font-medium leading-tight text-center">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {categoryShowValidation && !requirements.categoryOk && (
                      <div className="mt-4 rounded-xl border border-red-300 bg-red-50/90 p-3 text-xs text-red-800" role="alert">
                        {lang === "es" ? "Selecciona una categoría para continuar." : "Choose a category to continue."}
                      </div>
                    )}

                    <div ref={categoryActionsRef} className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExitClick}
                        className="rounded-xl border border-black/15 bg-[#F5F5F5] hover:bg-[#E8E8E8] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.exitLink}
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
                          if (categoryFromUrl === "servicios" && !servicesPackage) {
                            setShowServicesGate(true);
                            return;
                          }
                          if (!requirements.categoryOk) {
                            setPublishNextAttempted((prev) => ({ ...prev, category: true }));
                            return;
                          }
                          setPublishNextAttempted((prev) => ({ ...prev, category: false }));
                          if (categoryFromUrl === "rentas") goToStep("rentas-track");
                          else goToStep("basics");
                        }}
                        className="rounded-xl font-semibold px-5 py-3 bg-yellow-500/90 hover:bg-yellow-500 text-black"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* RENTAS TRACK (step 2 for Rentas only): Privado vs Negocio + plan */}
                {step === "rentas-track" && categoryFromUrl === "rentas" && (
                  <RentasPublishShell>
                    <RentasPublishTrackStep
                      lang={lang}
                      cx={cx}
                      details={details}
                      setDetails={setDetails}
                      goToStep={goToStep}
                      handleBack={handleBack}
                      rentasNegocioPricePerPost={RENTAS_NEGOCIO_PRICE_PER_POST}
                      copyBack={copy.back}
                    />
                  </RentasPublishShell>
                )}

                {/* BASICS */}
                {step === "basics" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.basicsTitle}</h2>
                    <div className="mt-4 grid gap-4">
                      {categoryFromUrl === "rentas" ? (
                        <RentasPublishShell>
                        <div
                          id="publish-basics-rentas-meta"
                          className={cx(
                            "space-y-4",
                            basicsShowValidation && !requirements.rentasMetaOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                          )}
                        >
                          <div className="grid-details grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-[#111111]">
                                {lang === "es" ? "Subcategoría" : "Subcategory"}{" *"}
                              </label>
                              <select
                                value={details.rentasSubcategoria ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setDetails((prev) => ({ ...prev, rentasSubcategoria: v, tipoPropiedad: "" }));
                                }}
                                aria-invalid={basicsShowValidation && !details.rentasSubcategoria?.trim()}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                  basicsShowValidation && !details.rentasSubcategoria?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                )}
                              >
                                <option value="">{lang === "es" ? "Elige una subcategoría…" : "Choose one…"}</option>
                                {RENTAS_SUBCATEGORIES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {lang === "es" ? s.label.es : s.label.en}
                                  </option>
                                ))}
                              </select>
                              {!details.rentasSubcategoria?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                  {lang === "es" ? "Requerido." : "Required."}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="text-sm text-[#111111]">
                                {lang === "es" ? "Tipo de propiedad" : "Property type"}{" *"}
                              </label>
                              <select
                                value={details.tipoPropiedad ?? ""}
                                onChange={(e) => setDetails((prev) => ({ ...prev, tipoPropiedad: e.target.value }))}
                                disabled={!details.rentasSubcategoria?.trim()}
                                aria-invalid={basicsShowValidation && !!details.rentasSubcategoria?.trim() && !details.tipoPropiedad?.trim()}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60",
                                  basicsShowValidation && !!details.rentasSubcategoria?.trim() && !details.tipoPropiedad?.trim()
                                    ? "border-red-500 ring-1 ring-red-500/35"
                                    : "border-black/10"
                                )}
                              >
                                <option value="">{lang === "es" ? "Elige tipo…" : "Choose type…"}</option>
                                {getTipoOptionsForSubcategory(details.rentasSubcategoria ?? "").map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {lang === "es" ? o.label.es : o.label.en}
                                  </option>
                                ))}
                              </select>
                              {!details.tipoPropiedad?.trim() && details.rentasSubcategoria?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                  {lang === "es" ? "Requerido." : "Required."}
                                </div>
                              )}
                            </div>
                            {/* Rentas branch/plan set on previous step (rentas-track); show read-only summary */}
                            <div className="sm:col-span-2 rounded-xl border border-[#C9B46A]/25 bg-[#F8F6F0]/60 px-4 py-3">
                              <p className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
                                {lang === "es" ? "Publicando como" : "Posting as"}
                              </p>
                              <p className="mt-1 text-sm font-medium text-[#111111]">
                                {details.rentasBranch === "negocio"
                                  ? (lang === "es" ? "Negocio" : "Business")
                                  : (lang === "es" ? "Privado" : "Private")}
                              </p>
                              <button
                                type="button"
                                onClick={() => goToStep("rentas-track")}
                                className="mt-1 text-xs text-[#111111]/70 hover:underline"
                              >
                                {lang === "es" ? "Cambiar" : "Change"}
                              </button>
                            </div>
                          </div>
                          <div id="publish-basics-title">
                            <label className="text-sm text-[#111111]">{copy.fieldTitle}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">
                              {lang === "es"
                                ? "Un título claro ayuda a que te encuentren."
                                : "A clear title helps people find you."}
                            </p>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Apartamento 2 recámaras cerca del centro" : "Ex: 2-bed apartment near downtown"}
                              spellCheck
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              lang={lang === "es" ? "es" : "en"}
                              inputMode="text"
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>
                          <div id="publish-basics-desc">
                            <label className="text-sm text-[#111111]">{copy.fieldDesc}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">
                              {lang === "es"
                                ? "Describe el espacio, servicios incluidos y condiciones."
                                : "Describe the space, utilities included, and conditions."}
                            </p>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={
                                lang === "es"
                                  ? "Estado del inmueble, qué incluye la renta, reglas, etc."
                                  : "Condition, what's included, rules, etc."
                              }
                              spellCheck
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              lang={lang === "es" ? "es" : "en"}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>
                          <div id="publish-basics-price">
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Renta mensual" : "Monthly rent"}{" *"}
                            </label>
                            <input
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder={lang === "es" ? "Ej: 1500" : "Ex: 1500"}
                              aria-invalid={basicsShowValidation && !requirements.priceOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.priceOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.priceOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Agrega la renta mensual." : "Add monthly rent."}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Depósito" : "Deposit"}
                            </label>
                            <input
                              value={details.deposito ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, deposito: e.target.value }))}
                              placeholder={lang === "es" ? "Ej: $1500 / 1 mes" : "e.g. $1500 / 1 month"}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                          </div>
                          <div id="publish-basics-city">
                            <label className="text-sm text-[#111111]">{copy.fieldCity}{" *"}</label>
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                              lang={lang}
                              label=""
                              variant="light"
                              className="mt-2"
                              invalid={basicsShowValidation && !requirements.cityOk}
                            />
                            {!requirements.cityOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Calles principales o dirección aproximada" : "Main streets or approximate address"}
                            </label>
                            <input
                              value={details.zonaDireccion ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, zonaDireccion: e.target.value }))}
                              placeholder={lang === "es" ? "Ej: Calle A y Calle B, Centro" : "e.g. Street A & Street B, Downtown"}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Fecha disponible" : "Available date"}{" *"}
                            </label>
                            <input
                              value={details.fechaDisponible ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, fechaDisponible: e.target.value }))}
                              placeholder={lang === "es" ? "Ej: Inmediato / 1 de marzo" : "e.g. Immediate / Mar 1"}
                              aria-invalid={basicsShowValidation && !details.fechaDisponible?.trim()}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !details.fechaDisponible?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!details.fechaDisponible?.trim() && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Requerido." : "Required."}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Plazo del contrato" : "Lease term"}
                            </label>
                            <select
                              value={details.plazo_contrato ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, plazo_contrato: e.target.value, plazo_contrato_otro: e.target.value === "otro" ? (prev.plazo_contrato_otro ?? "") : "" }))}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            >
                              <option value="">{lang === "es" ? "Elige…" : "Choose…"}</option>
                              <option value="mes-a-mes">{lang === "es" ? "Mes a mes" : "Month to month"}</option>
                              <option value="6-meses">{lang === "es" ? "6 meses" : "6 months"}</option>
                              <option value="12-meses">{lang === "es" ? "12 meses" : "12 months"}</option>
                              <option value="1-ano">{lang === "es" ? "1 año" : "1 year"}</option>
                              <option value="2-anos">{lang === "es" ? "2 años" : "2 years"}</option>
                              <option value="otro">{lang === "es" ? "Otro" : "Other"}</option>
                            </select>
                            {details.plazo_contrato === "otro" && (
                              <input
                                value={details.plazo_contrato_otro ?? ""}
                                onChange={(e) => setDetails((prev) => ({ ...prev, plazo_contrato_otro: e.target.value }))}
                                placeholder={lang === "es" ? "Ej: 18 meses" : "e.g. 18 months"}
                                className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                              />
                            )}
                          </div>
                          <RentasNegocioPublishShell>
                          {details.rentasBranch === "negocio" && (
                            <>
                              <div className="sm:col-span-2 mt-4 pt-4 border-t border-black/10">
                                <h4 className="text-sm font-semibold text-[#111111] mb-3">
                                  {lang === "es" ? "Identidad del negocio" : "Business identity"}
                                </h4>
                                <p className="text-xs text-[#111111]/70 mb-3">
                                  {lang === "es"
                                    ? "Nombre del negocio es obligatorio. El resto ayuda a dar confianza."
                                    : "Business name is required. The rest helps build trust."}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Nombre del negocio" : "Business name"}{" *"}
                                </label>
                                <input
                                  value={details.negocioNombre ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioNombre: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Inmobiliaria López" : "e.g. Lopez Realty"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                                {!details.negocioNombre?.trim() && (
                                  <div className="mt-1 text-xs text-[#111111]/40">
                                    {lang === "es" ? "Requerido para negocio." : "Required for business."}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Nombre del agente" : "Agent name"}
                                </label>
                                <input
                                  value={details.negocioAgente ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioAgente: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: María García" : "e.g. Maria Garcia"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Cargo / rol" : "Role / title"}
                                </label>
                                <input
                                  value={details.negocioCargo ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioCargo: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Agente de rentas" : "e.g. Rental agent"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Teléfono de oficina" : "Office phone"}
                                  {details.rentasBranch === "negocio" ? " *" : ""}
                                </label>
                                <input
                                  value={details.negocioTelOficina ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioTelOficina: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: (408) 555-0100" : "e.g. (408) 555-0100"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                                {details.rentasBranch === "negocio" && (details.negocioTelOficina ?? "").replace(/\D/g, "").length !== 10 && (details.negocioTelOficina ?? "").length > 0 && (
                                  <div className="mt-1 text-xs text-[#111111]/40">
                                    {lang === "es" ? "Requerido: 10 dígitos." : "Required: 10 digits."}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Sitio web" : "Website"}
                                </label>
                                <input
                                  type="url"
                                  value={details.negocioSitioWeb ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioSitioWeb: e.target.value }))}
                                  placeholder="https://"
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Redes sociales" : "Social links"}
                                </label>
                                <input
                                  value={details.negocioRedes ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioRedes: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Facebook: url, Instagram: url" : "e.g. Facebook: url, Instagram: url"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">{lang === "es" ? "Logo del negocio" : "Business logo"}</label>
                                <div className="mt-2 flex items-center gap-3">
                                  <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                                    {logoUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir imagen" : "Upload image")}
                                    <input type="file" accept="image/*" className="sr-only" disabled={logoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "logo"); e.target.value = ""; }} />
                                  </label>
                                  {details.negocioLogoUrl ? <img src={details.negocioLogoUrl} alt="" className="h-14 w-14 rounded-lg border border-black/10 object-cover bg-white" /> : null}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">{lang === "es" ? "Foto del agente" : "Agent photo"}</label>
                                <div className="mt-2 flex items-center gap-3">
                                  <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                                    {agentPhotoUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir imagen" : "Upload image")}
                                    <input type="file" accept="image/*" className="sr-only" disabled={agentPhotoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "agent"); e.target.value = ""; }} />
                                  </label>
                                  {details.negocioFotoAgenteUrl ? <img src={details.negocioFotoAgenteUrl} alt="" className="h-14 w-14 rounded-lg border border-black/10 object-cover bg-white" /> : null}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Idiomas" : "Languages"}
                                </label>
                                <input
                                  value={details.negocioIdiomas ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioIdiomas: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Español, inglés" : "e.g. Spanish, English"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Horario de atención" : "Business hours"}
                                </label>
                                <input
                                  value={details.negocioHorario ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioHorario: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Lun–Vie 9am–6pm" : "e.g. Mon–Fri 9am–6pm"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Recorrido virtual (URL)" : "Virtual tour (URL)"}
                                </label>
                                <input
                                  type="url"
                                  value={details.negocioRecorridoVirtual ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioRecorridoVirtual: e.target.value }))}
                                  placeholder="https://"
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              {((details.rentasTier ?? "").trim() === "business_plus" || (details.rentasTier ?? "").trim() === "negocio" || (details.bienesRaicesBranch ?? "").trim() === "negocio") && (
                                <div className="sm:col-span-2">
                                  <label className="flex items-center gap-2 text-sm text-[#111111]">
                                    <input
                                      type="checkbox"
                                      checked={(details.negocioPlusMasAnuncios ?? "") === "si"}
                                      onChange={(e) => setDetails((prev) => ({ ...prev, negocioPlusMasAnuncios: e.target.checked ? "si" : "" }))}
                                      className="rounded border-black/20"
                                    />
                                    {lang === "es" ? "Más anuncios de esta empresa" : "More listings from this company"}
                                  </label>
                                </div>
                              )}
                            </>
                          )}
                          </RentasNegocioPublishShell>
                        </div>
                        </RentasPublishShell>
                      ) : (
                        <>
                          <div id="publish-basics-title">
                            <label className="text-sm text-[#111111]">{copy.fieldTitle}</label>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Sofá en excelente condición" : "Ex: Great-condition sofa"}
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div id="publish-basics-desc">
                            <label className="text-sm text-[#111111]">{copy.fieldDesc}</label>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={
                                lang === "es"
                                  ? "Describe el estado, medidas, entrega, etc."
                                  : "Describe condition, size, pickup/delivery, etc."
                              }
                              rows={5}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2" id="publish-basics-price">
                              <label className="text-sm text-[#111111]">{copy.fieldPrice}</label>
                              <input
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={isFree}
                                placeholder={lang === "es" ? "Ej: 120" : "Ex: 120"}
                                aria-invalid={basicsShowValidation && !requirements.priceOk}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2",
                                  isFree
                                    ? "border-white/5 bg-[#F5F5F5] text-[#111111]"
                                    : basicsShowValidation && !requirements.priceOk
                                      ? "border-red-500 ring-1 ring-red-500/35 bg-white/9 focus:ring-yellow-400/30"
                                      : "border-black/10 bg-white/9 focus:ring-yellow-400/30"
                                )}
                              />
                              {!requirements.priceOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                  {lang === "es" ? "Agrega un precio o marca Gratis." : "Add a price or mark Free."}
                                </div>
                              )}
                            </div>

                            <div className="sm:col-span-1">
                              <label className="text-sm text-[#111111]">{copy.freeToggle}</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsFree((v) => !v);
                                  if (!isFree) setPrice("");
                                }}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                                  isFree
                                    ? "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]"
                                    : "border-black/10 bg-white/9 text-[#111111] hover:bg-white/12"
                                )}
                              >
                                {isFree ? (lang === "es" ? "Sí, es Gratis" : "Yes, it's Free") : lang === "es" ? "No" : "No"}
                              </button>
                            </div>
                          </div>

                          <div id="publish-basics-city">
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                              lang={lang}
                              label={copy.fieldCity}
                              variant="light"
                              className="mt-0"
                              invalid={basicsShowValidation && !requirements.cityOk}
                            />
                            {!requirements.cityOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                              </div>
                            )}
                          </div>
                        </>
                      )}
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
                        {category !== "rentas" && (
                          <button
                            type="button"
                            onClick={() => setDetails({})}
                            className="text-xs text-[#111111] hover:text-[#111111]"
                          >
                            {lang === "es" ? "Limpiar detalles" : "Clear details"}
                          </button>
                        )}
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
                        proUpgradeHref={undefined}
                        onBeforeProNavigate={undefined}
                        maxVideos={isRentasPrivado ? 1 : 2}
                        copy={{
                          addImages: copy.addImages,
                          addVideo: copy.addVideo,
                          video: isRentasPrivado ? (copy as { rentasPrivadoVideo?: string }).rentasPrivadoVideo : copy.video,
                          videoHint: isRentasPrivado ? (copy as { rentasPrivadoVideoHint?: string }).rentasPrivadoVideoHint : copy.videoHint,
                          images: copy.images,
                        }}
                      />

                        {!requirements.imagesOk && (
                          <div className="mt-1 text-xs text-[#111111]/40">
                            {lang === "es" ? "Requerido: mínimo 1 foto." : "Required: at least 1 photo."}
                          </div>
                        )}

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

                        <PublishMediaPreviewPanel
                          lang={lang}
                          copy={{ preview: copy.preview, cardPreview: copy.cardPreview }}
                          useBienesRaicesPrivadoLeftCard={false}
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
                          Debes revisar el anuncio completo antes de publicarlo.
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

