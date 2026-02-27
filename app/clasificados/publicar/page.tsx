"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";
type PublishStep = "basics" | "details" | "media";

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
const DRAFT_KEY = "leonix_clasificados_post_draft_v1";


type DetailField = {
  key: string;
  label: { es: string; en: string };
  type: "text" | "number" | "select";
  placeholder?: { es: string; en: string };
  options?: Array<{ value: string; label: { es: string; en: string } }>;
};

const DETAIL_FIELDS: Record<string, DetailField[]> = {
  autos: [
    { key: "year", label: { es: "Año", en: "Year" }, type: "number", placeholder: { es: "Ej: 2018", en: "e.g. 2018" } },
    { key: "make", label: { es: "Marca", en: "Make" }, type: "text", placeholder: { es: "Ej: Toyota", en: "e.g. Toyota" } },
    { key: "model", label: { es: "Modelo", en: "Model" }, type: "text", placeholder: { es: "Ej: Camry", en: "e.g. Camry" } },
    { key: "mileage", label: { es: "Millas", en: "Mileage" }, type: "number", placeholder: { es: "Ej: 85000", en: "e.g. 85000" } },
    {
      key: "condition",
      label: { es: "Condición", en: "Condition" },
      type: "select",
      options: [
        { value: "new", label: { es: "Nuevo", en: "New" } },
        { value: "used", label: { es: "Usado", en: "Used" } },
        { value: "certified", label: { es: "Certificado", en: "Certified" } },
      ],
    },
    {
      key: "transmission",
      label: { es: "Transmisión", en: "Transmission" },
      type: "select",
      options: [
        { value: "auto", label: { es: "Automática", en: "Automatic" } },
        { value: "manual", label: { es: "Manual", en: "Manual" } },
      ],
    },
  ],
  rentas: [
    {
      key: "beds",
      label: { es: "Recámaras", en: "Bedrooms" },
      type: "select",
      options: [
        { value: "studio", label: { es: "Estudio", en: "Studio" } },
        { value: "1", label: { es: "1", en: "1" } },
        { value: "2", label: { es: "2", en: "2" } },
        { value: "3", label: { es: "3", en: "3" } },
        { value: "4+", label: { es: "4+", en: "4+" } },
        { value: "room", label: { es: "Cuarto (Room)", en: "Room" } },
      ],
    },
    {
      key: "baths",
      label: { es: "Baños", en: "Bathrooms" },
      type: "select",
      options: [
        { value: "1", label: { es: "1", en: "1" } },
        { value: "1.5", label: { es: "1.5", en: "1.5" } },
        { value: "2", label: { es: "2", en: "2" } },
        { value: "2.5", label: { es: "2.5", en: "2.5" } },
        { value: "3+", label: { es: "3+", en: "3+" } },
      ],
    },
    { key: "deposit", label: { es: "Depósito", en: "Deposit" }, type: "text", placeholder: { es: "Ej: $1500 / 1 mes", en: "e.g. $1500 / 1 month" } },
    { key: "available", label: { es: "Disponible", en: "Available" }, type: "text", placeholder: { es: "Ej: Inmediato / 1 de Marzo", en: "e.g. Now / Mar 1" } },
    {
      key: "furnished",
      label: { es: "Amueblado", en: "Furnished" },
      type: "select",
      options: [
        { value: "yes", label: { es: "Sí", en: "Yes" } },
        { value: "no", label: { es: "No", en: "No" } },
      ],
    },
    {
      key: "pets",
      label: { es: "Mascotas", en: "Pets" },
      type: "select",
      options: [
        { value: "allowed", label: { es: "Permitidas", en: "Allowed" } },
        { value: "no", label: { es: "No", en: "No" } },
        { value: "cats", label: { es: "Solo gatos", en: "Cats only" } },
        { value: "dogs", label: { es: "Solo perros", en: "Dogs only" } },
      ],
    },
  ],
  empleos: [
    { key: "company", label: { es: "Empresa", en: "Company" }, type: "text", placeholder: { es: "Nombre de la empresa", en: "Company name" } },
    {
      key: "jobType",
      label: { es: "Tipo de trabajo", en: "Job type" },
      type: "select",
      options: [
        { value: "full", label: { es: "Tiempo completo", en: "Full-time" } },
        { value: "part", label: { es: "Medio tiempo", en: "Part-time" } },
        { value: "contract", label: { es: "Contrato", en: "Contract" } },
        { value: "temp", label: { es: "Temporal", en: "Temporary" } },
      ],
    },
    {
      key: "workMode",
      label: { es: "Modalidad", en: "Work mode" },
      type: "select",
      options: [
        { value: "onsite", label: { es: "Presencial", en: "On-site" } },
        { value: "remote", label: { es: "Remoto", en: "Remote" } },
        { value: "hybrid", label: { es: "Híbrido", en: "Hybrid" } },
      ],
    },
    { key: "pay", label: { es: "Pago", en: "Pay" }, type: "text", placeholder: { es: "Ej: $22/hr o $900/sem", en: "e.g. $22/hr or $900/wk" } },
  ],
  servicios: [
    { key: "serviceType", label: { es: "Tipo de servicio", en: "Service type" }, type: "text", placeholder: { es: "Ej: Jardinería, Plomería", en: "e.g. Landscaping, Plumbing" } },
    { key: "area", label: { es: "Zona", en: "Service area" }, type: "text", placeholder: { es: "Ej: San José + 15 mi", en: "e.g. San Jose + 15 mi" } },
    { key: "availability", label: { es: "Disponibilidad", en: "Availability" }, type: "text", placeholder: { es: "Ej: Lun–Sáb", en: "e.g. Mon–Sat" } },
  ],
  "en-venta": [
    { key: "itemType", label: { es: "Tipo de artículo", en: "Item type" }, type: "text", placeholder: { es: "Ej: Muebles, Electrónica", en: "e.g. Furniture, Electronics" } },
    {
      key: "condition",
      label: { es: "Condición", en: "Condition" },
      type: "select",
      options: [
        { value: "new", label: { es: "Nuevo", en: "New" } },
        { value: "like-new", label: { es: "Como nuevo", en: "Like new" } },
        { value: "good", label: { es: "Buen estado", en: "Good" } },
        { value: "fair", label: { es: "Regular", en: "Fair" } },
      ],
    },
  ],
  restaurantes: [
    {
      key: "placeType",
      label: { es: "Tipo de negocio", en: "Business type" },
      type: "select",
      options: [
        { value: "brick", label: { es: "Local (restaurante / café)", en: "Brick & mortar (restaurant / café)" } },
        { value: "truck", label: { es: "Food truck", en: "Food truck" } },
        { value: "popup", label: { es: "Pop-up / puesto temporal", en: "Pop-up / temporary stand" } },
      ],
    },
    { key: "cuisine", label: { es: "Cocina", en: "Cuisine" }, type: "text", placeholder: { es: "Ej: Mexicana, Pupusas", en: "e.g. Mexican, Pupusas" } },
    { key: "address", label: { es: "Dirección (opcional)", en: "Address (optional)" }, type: "text", placeholder: { es: "Ej: 123 Main St", en: "e.g. 123 Main St" } },
    { key: "zip", label: { es: "ZIP (opcional)", en: "ZIP (optional)" }, type: "text", placeholder: { es: "Ej: 95112", en: "e.g. 95112" } },
    { key: "hours", label: { es: "Horario (opcional)", en: "Hours (optional)" }, type: "text", placeholder: { es: "Ej: Lun–Sab 10am–9pm", en: "e.g. Mon–Sat 10am–9pm" } },
    { key: "website", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, type: "text", placeholder: { es: "https://", en: "https://" } },
    { key: "notes", label: { es: "Notas (opcional)", en: "Notes (optional)" }, type: "text", placeholder: { es: "Pedidos por teléfono, especialidades…", en: "Phone orders, specialties…" } },
  ],

};

function getCategoryFields(cat: string): DetailField[] {
  return DETAIL_FIELDS[cat] ?? [];
}

function getDetailPairs(cat: string, lang: Lang, details: Record<string, string>) {
  const fields = getCategoryFields(cat);
  const out: Array<{ label: string; value: string }> = [];
  for (const f of fields) {
    const raw = (details[f.key] ?? "").toString().trim();
    if (!raw) continue;

    if (f.type === "select" && f.options) {
      const opt = f.options.find((o) => o.value === raw);
      out.push({ label: f.label[lang], value: opt ? opt.label[lang] : raw });
      continue;
    }

    out.push({ label: f.label[lang], value: raw });
  }
  return out;
}

function buildDetailsAppendix(cat: string, lang: Lang, details: Record<string, string>) {
  const pairs = getDetailPairs(cat, lang, details);
  if (!pairs.length) return "";
  const header = lang === "es" ? "Detalles" : "Details";
  const lines = pairs.map((p) => `${p.label}: ${p.value}`).join("\n");
  return `\n\n—\n${header}:\n${lines}`.trim();
}


export default function PublicarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  // Prefill support (used by category-specific pre-forms like Restaurants)
  const prefill = useMemo(() => {
    const get = (k: string) => (searchParams?.get(k) ?? "").trim();
    const bizName = get("bizName") || get("name");
    const placeType = get("placeType");
    const cuisine = get("cuisine");
    const city = get("city");
    const phone = get("phone");
    const website = get("website");
    const notes = get("notes");
    return { bizName, placeType, cuisine, city, phone, website, notes };
  }, [searchParams]);

  const redirectForLogin = useMemo(() => {
    const qs = searchParams?.toString() ?? "";
    const here = qs
      ? `/clasificados/publicar?${qs}`
      : `/clasificados/publicar?lang=${lang}`;
    return safeInternalRedirect(here) || `/clasificados/publicar?lang=${lang}`;
  }, [lang, searchParams]);

  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isPro, setIsPro] = useState(false);

  // Garage Mode (Free-only, En Venta only) — +4 temporary listings for 7 days, once per 30 days.
  const FREE_EN_VENTA_LIMIT = 2;
  const GARAGE_EXTRA = 4;
  const GARAGE_WINDOW_DAYS = 7;
  const GARAGE_COOLDOWN_DAYS = 30;

  const [enVentaActiveCount, setEnVentaActiveCount] = useState<number | null>(null);
  const [garageActive, setGarageActive] = useState(false);
  const [garageExpiresAt, setGarageExpiresAt] = useState<string>("");
  const [garageLastUsedAt, setGarageLastUsedAt] = useState<string>("");
  const [garageLoading, setGarageLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbBlob, setVideoThumbBlob] = useState<Blob | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [videoError, setVideoError] = useState<string>("");
  const [showProVideoPreview, setShowProVideoPreview] = useState(false);

  const [step, setStep] = useState<PublishStep>("basics");  const [category, setCategory] = useState<string>(() => {
    const c = (searchParams?.get("categoria") ?? searchParams?.get("category") ?? searchParams?.get("cat") ?? "en-venta").trim();
    return c || "en-venta";
  });

  // Restaurants do not require a listing price in our flow (treated as Free by default)
  useEffect(() => {
    if (category === "restaurantes") {
      setIsFree(true);
      setPrice("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);


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
  const [contactMethod, setContactMethod] = useState<"phone" | "email" | "both">("phone");
  const [contactPhone, setContactPhone] = useState<string>(() => prefill.phone || "");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const maxImages = isPro ? 12 : 5;

  // If plan changes to Free, trim images to Free limit.
  useEffect(() => {
    if (!isPro && files.length > 5) {
      setFiles((prev) => prev.slice(0, 5));
    }
  }, [isPro, files.length]);

  const moveImage = (from: number, to: number) => {
    setFiles((prev) => {
      if (from === to) return prev;
      if (from < 0 || from >= prev.length) return prev;
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [picked] = next.splice(from, 1);
      next.splice(to, 0, picked);
      return next;
    });
  };

  const makeCover = (idx: number) => moveImage(idx, 0);

  const moveLeft = (idx: number) => moveImage(idx, idx - 1);
  const moveRight = (idx: number) => moveImage(idx, idx + 1);

  const removeImage = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const proVideoThumbPreviewUrl = useMemo(() => {
    if (!videoThumbBlob) return "";
    try {
      return URL.createObjectURL(videoThumbBlob);
    } catch {
      return "";
    }
  }, [videoThumbBlob]);

  const proVideoPreviewUrl = useMemo(() => {
    if (!videoFile) return "";
    try {
      return URL.createObjectURL(videoFile);
    } catch {
      return "";
    }
  }, [videoFile]);

  useEffect(() => {
    return () => {
      if (proVideoThumbPreviewUrl) URL.revokeObjectURL(proVideoThumbPreviewUrl);
      if (proVideoPreviewUrl) URL.revokeObjectURL(proVideoPreviewUrl);
    };
  }, [proVideoThumbPreviewUrl, proVideoPreviewUrl]);

  // Publish
  const [publishError, setPublishError] = useState<string>("");
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishedId, setPublishedId] = useState<string>("");

  const draftTimer = useRef<number | null>(null);

  // Session gate
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

    async function check() {
      const { data } = await supabase!.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const next = `/login?redirect=${encodeURIComponent(redirectForLogin)}`;
        router.replace(next);
        return;
      }

      setUserId(data.user.id);
      setSignedIn(true);

const planRaw =
  (data.user.user_metadata?.leonix_plan as string | undefined) ||
  (data.user.user_metadata?.plan as string | undefined) ||
  (data.user.app_metadata?.plan as string | undefined) ||
  "";
const plan = String(planRaw).toLowerCase();
setIsPro(plan.includes("pro"));

      const gm = (data.user.user_metadata as any)?.garage_mode_en_venta || null;
      const lastUsed = (gm && (gm.lastUsedAt || gm.last_used_at || gm.last_used)) ? String(gm.lastUsedAt || gm.last_used_at || gm.last_used) : "";
      const expires = (gm && (gm.expiresAt || gm.expires_at || gm.expires)) ? String(gm.expiresAt || gm.expires_at || gm.expires) : "";
      setGarageLastUsedAt(lastUsed);
      setGarageExpiresAt(expires);
      const expD = parseIsoMaybe(expires);
      setGarageActive(!!(expD && expD.getTime() > Date.now()));

      setChecking(false);
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router, redirectForLogin, lang]);

  const copy = useMemo(
    () => ({
      es: {
        title: "Publicar anuncio",
        subtitle: "Publica con claridad. Mientras más completo, más confianza y mejores resultados.",
        steps: { basics: "Básicos", details: "Detalles", media: "Media + Contacto + Vista previa" },
        deleteDraft: "Borrar borrador",
        basicsTitle: "Básicos",
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
        video: "Video (solo Pro, 1 por anuncio)",
        addVideo: "Agregar video",
        videoHint: "Máx 20s, 720p. Sin autoplay en la lista.",
        videoLocked: "Desbloquea video con LEONIX Pro.",
        contact: "Método de contacto",
        phone: "Teléfono",
        email: "Email",
        both: "Ambos",
        publish: "Publicar",
        publishing: "Publicando…",
        preview: "Vista previa",
        cardPreview: "Tarjeta (grid)",
        detailPreview: "Detalle",
        requiredHint: "Requisitos: Título + Descripción + Precio/Gratis + Ciudad + 1 foto + Contacto.",
        published: "¡Listo! Tu anuncio fue publicado.",
        viewListing: "Ver anuncio",
        needReqs: "Revisa los requisitos antes de publicar.",
        checking: "Verificando sesión…",
      },
      en: {
        title: "Post an ad",
        subtitle: "Post with clarity. The more complete it is, the more trust—and better results.",
        steps: { basics: "Basics", details: "Details", media: "Media + Contact + Preview" },
        deleteDraft: "Delete draft",
        basicsTitle: "Basics",
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
        video: "Video (Pro only, 1 per listing)",
        addVideo: "Add video",
        videoHint: "Max 20s, 720p. No autoplay in grid.",
        videoLocked: "Unlock video with LEONIX Pro.",
        contact: "Contact method",
        phone: "Phone",
        email: "Email",
        both: "Both",
        publish: "Publish",
        publishing: "Publishing…",
        preview: "Preview",
        cardPreview: "Card (grid)",
        detailPreview: "Detail",
        requiredHint: "Requirements: Title + Description + Price/Free + City + 1 photo + Contact.",
        published: "Done! Your listing is live.",
        viewListing: "View listing",
        needReqs: "Please meet the requirements before publishing.",
        checking: "Checking session…",
      },
    }),
    []
  )[lang];

  // Load draft once signed in
  useEffect(() => {
    if (!signedIn) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DraftV1>;
      if (parsed.v !== 1) return;

      setStep((parsed.step as PublishStep) || "basics");
      setTitle(typeof parsed.title === "string" ? parsed.title : "");
      setDescription(typeof parsed.description === "string" ? parsed.description : "");
      setIsFree(Boolean(parsed.isFree));
      setPrice(typeof parsed.price === "string" ? parsed.price : "");
      setCity(typeof parsed.city === "string" ? parsed.city : "");
      setCategory(typeof parsed.category === "string" && parsed.category ? parsed.category : category);
      setDetails(typeof (parsed as any).details === "object" && (parsed as any).details ? ((parsed as any).details as Record<string, string>) : {});
      setContactMethod((parsed.contactMethod as any) || "phone");
      setContactPhone(typeof parsed.contactPhone === "string" ? parsed.contactPhone : "");
      setContactEmail(typeof parsed.contactEmail === "string" ? parsed.contactEmail : "");
    } catch {
      // ignore corrupt drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  // Load active listing count for Garage Mode messaging (Free-only, En Venta).
  useEffect(() => {
    if (!signedIn || !userId) return;

    if (category !== "en-venta") {
      setEnVentaActiveCount(null);
      return;
    }

    let mounted = true;
    async function loadCount() {
      setGarageLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();

        // Try the most correct query first (status + user_id). Fall back safely if schema differs.
        const base = supabase.from("listings").select("id", { count: "exact", head: true }).eq("category", "en-venta");

        // Attempt with user_id + status=active
        let r = await base.eq("user_id", userId).eq("status", "active");
        if (r.error) {
          const msg = String(r.error.message || "");
          // Missing status column
          if (/status/i.test(msg) && /(does not exist|unknown|column)/i.test(msg)) {
            r = await base.eq("user_id", userId);
          }
        }

        if (r.error) {
          // If user_id column is missing, we can't enforce Garage Mode safely.
          if (mounted) setEnVentaActiveCount(null);
          return;
        }

        if (mounted) setEnVentaActiveCount(typeof r.count === "number" ? r.count : 0);
      } finally {
        if (mounted) setGarageLoading(false);
      }
    }

    loadCount();
    return () => {
      mounted = false;
    };
  }, [signedIn, userId, category]);


  // Draft autosave (debounced)
  useEffect(() => {
    if (!signedIn) return;

    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const draft: DraftV1 = {
        v: 1,
        step,
        title,
        description,
        isFree,
        price,
        city,
        category,
        details,
        contactMethod,
        contactPhone,
        contactEmail,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 250);

    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [signedIn, step, title, description, isFree, price, city, category, contactMethod, contactPhone, contactEmail, details]);

  // Image previews
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const requirements = useMemo(() => {
    const titleOk = title.trim().length >= 5;
    const descOk = description.trim().length >= 20;
    const cityOk = city.trim().length >= 2;
    const priceOk = isFree || Boolean(formatMoneyMaybe(price, lang));
    const imagesOk = files.length >= 1;
    const phoneOk = contactMethod === "email" ? true : contactPhone.trim().length >= 7;
    const emailOk = contactMethod === "phone" ? true : /.+@.+\..+/.test(contactEmail.trim());
    return {
      titleOk,
      descOk,
      cityOk,
      priceOk,
      imagesOk,
      phoneOk,
      emailOk,
      allOk: titleOk && descOk && cityOk && priceOk && imagesOk && phoneOk && emailOk,
    };
  }, [title, description, city, isFree, price, files.length, contactMethod, contactPhone, contactEmail, lang]);


  const requirementItems = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean; step: PublishStep }> = [
      {
        key: "title",
        label: lang === "es" ? "Título" : "Title",
        ok: requirements.titleOk,
        step: "basics",
      },
      {
        key: "desc",
        label: lang === "es" ? "Descripción" : "Description",
        ok: requirements.descOk,
        step: "basics",
      },
      {
        key: "price",
        label: lang === "es" ? (isFree ? "Gratis" : "Precio") : (isFree ? "Free" : "Price"),
        ok: requirements.priceOk,
        step: "basics",
      },
      {
        key: "city",
        label: lang === "es" ? "Ciudad" : "City",
        ok: requirements.cityOk,
        step: "basics",
      },
      {
        key: "images",
        label: lang === "es" ? "1+ foto" : "1+ photo",
        ok: requirements.imagesOk,
        step: "media",
      },
      {
        key: "contact",
        label:
          lang === "es"
            ? contactMethod === "email"
              ? "Email"
              : contactMethod === "phone"
                ? "Teléfono"
                : "Contacto"
            : contactMethod === "email"
              ? "Email"
              : contactMethod === "phone"
                ? "Phone"
                : "Contact",
        ok: requirements.phoneOk && requirements.emailOk,
        step: "details",
      },
    ];
    return items;
  }, [requirements, lang, isFree, contactMethod]);

  const missingRequirementsText = useMemo(() => {
    const missing = requirementItems.filter((i) => !i.ok).map((i) => i.label);
    if (missing.length === 0) return "";
    const prefix = lang === "es" ? "Falta:" : "Missing:";
    return `${prefix} ${missing.join(" · ")}`;
  }, [requirementItems, lang]);

  const garage = useMemo(() => {
    if (category !== "en-venta") {
      return {
        applicable: false,
        active: false,
        eligibleToActivate: false,
        effectiveLimit: null as number | null,
        remaining: null as number | null,
        cooldownDaysLeft: null as number | null,
      };
    }

    const now = new Date();
    const expD = parseIsoMaybe(garageExpiresAt);
    const lastD = parseIsoMaybe(garageLastUsedAt);

    const active = !!(expD && expD.getTime() > now.getTime());
    const cooldownDaysLeft =
      lastD && Number.isFinite(lastD.getTime())
        ? Math.max(0, GARAGE_COOLDOWN_DAYS - daysBetween(lastD, now))
        : 0;

    const effectiveLimit = FREE_EN_VENTA_LIMIT + (active ? GARAGE_EXTRA : 0);

    const remaining =
      typeof enVentaActiveCount === "number"
        ? Math.max(0, effectiveLimit - enVentaActiveCount)
        : null;

    const eligibleToActivate =
      !isPro && !active && cooldownDaysLeft === 0 && typeof enVentaActiveCount === "number" && enVentaActiveCount >= FREE_EN_VENTA_LIMIT;

    return {
      applicable: !isPro,
      active,
      eligibleToActivate,
      effectiveLimit,
      remaining,
      cooldownDaysLeft,
    };
  }, [
    category,
    isPro,
    enVentaActiveCount,
    garageExpiresAt,
    garageLastUsedAt,
    FREE_EN_VENTA_LIMIT,
    GARAGE_EXTRA,
    GARAGE_COOLDOWN_DAYS,
  ]);


  function deleteDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }

  
async function inspectAndThumbVideo(file: File) {
  setVideoError("");
  setVideoInfo(null);
  setVideoThumbBlob(null);

  if (!file.type.startsWith("video/")) {
    setVideoError(lang === "es" ? "Selecciona un archivo de video." : "Please select a video file.");
    return;
  }

  // Size safety (keeps uploads reliable on mobile)
  const maxBytes = 25 * 1024 * 1024; // 25MB
  if (file.size > maxBytes) {
    setVideoError(
      lang === "es"
        ? "El video es muy grande. Usa un clip más corto o comprimido (máx ~25MB)."
        : "Video file is too large. Please use a shorter/compressed clip (max ~25MB)."
    );
    return;
  }

  const url = URL.createObjectURL(file);
  try {
    const info = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;

      const cleanup = () => {
        v.removeAttribute("src");
        try { v.load(); } catch {}
      };

      v.onloadedmetadata = () => {
        const duration = Number(v.duration || 0);
        const width = Number((v as any).videoWidth || 0);
        const height = Number((v as any).videoHeight || 0);
        cleanup();
        resolve({ duration, width, height });
      };
      v.onerror = () => {
        cleanup();
        reject(new Error("metadata"));
      };
    });

    if (info.duration > 20.2) {
      setVideoError(lang === "es" ? "El video debe ser de 20 segundos o menos." : "Video must be 20 seconds or less.");
      return;
    }
    if (info.width > 1280 || info.height > 720) {
      setVideoError(
        lang === "es"
          ? "El video debe ser 720p o menos (1280×720)."
          : "Video must be 720p or less (1280×720)."
      );
      return;
    }

    setVideoInfo(info);

    // Generate thumbnail (capture ~0.5s)
    const thumb = await new Promise<Blob | null>((resolve) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.src = url;

      const done = (b: Blob | null) => {
        v.removeAttribute("src");
        try { v.load(); } catch {}
        resolve(b);
      };

      v.onloadeddata = () => {
        const t = Math.min(0.5, Math.max(0, (v.duration || 1) * 0.1));
        try {
          v.currentTime = t;
        } catch {
          done(null);
        }
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
        } catch {
          done(null);
        }
      };

      v.onerror = () => done(null);
    });

    setVideoThumbBlob(thumb);
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function publish() {
    setPublishError("");
    setPublishedId("");

    if (!requirements.allOk) {
      setPublishError(`${copy.needReqs}${missingRequirementsText ? " " + missingRequirementsText : ""}`);
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
      // Garage Mode enforcement (Free-only, En Venta only).
      if (!isPro && category === "en-venta" && typeof enVentaActiveCount === "number") {
        const now = new Date();
        const expD = parseIsoMaybe(garageExpiresAt);
        const lastD = parseIsoMaybe(garageLastUsedAt);

        const garageIsActive = !!(expD && expD.getTime() > now.getTime());
        const cooldownLeft =
          lastD && Number.isFinite(lastD.getTime())
            ? Math.max(0, GARAGE_COOLDOWN_DAYS - daysBetween(lastD, now))
            : 0;

        const effectiveLimit = FREE_EN_VENTA_LIMIT + (garageIsActive ? GARAGE_EXTRA : 0);

        // Hard stop if user is already at/over the maximum possible during the window.
        if (enVentaActiveCount >= effectiveLimit) {
          const expText = garageIsActive && expD ? expD.toLocaleDateString(lang === "es" ? "es-US" : "en-US") : "";
          const msg =
            lang === "es"
              ? garageIsActive
                ? `Has alcanzado tu límite actual de En Venta (${effectiveLimit}). Tu Modo Garaje está activo hasta ${expText}. Marca anuncios como vendidos o espera, o mejora a LEONIX Pro.`
                : `Has alcanzado tu límite de En Venta (${FREE_EN_VENTA_LIMIT}). Para publicar más, mejora a LEONIX Pro.`
              : garageIsActive
                ? `You’ve reached your current For Sale limit (${effectiveLimit}). Garage Mode is active until ${expText}. Mark items sold or wait, or upgrade to LEONIX Pro.`
                : `You’ve reached your For Sale limit (${FREE_EN_VENTA_LIMIT}). To post more, upgrade to LEONIX Pro.`;
          setPublishError(msg);
          return;
        }

        // If user is at/over the free limit and Garage Mode is not active, try to activate once per 30 days.
        if (!garageIsActive && enVentaActiveCount >= FREE_EN_VENTA_LIMIT) {
          if (cooldownLeft > 0) {
            const msg =
              lang === "es"
                ? `Ya usaste el Modo Garaje recientemente. Podrás usarlo de nuevo en ${cooldownLeft} día(s). Mientras tanto, mejora a LEONIX Pro para publicar sin límites de Free.`
                : `You’ve used Garage Mode recently. You can use it again in ${cooldownLeft} day(s). Meanwhile, upgrade to LEONIX Pro to post beyond Free limits.`;
            setPublishError(msg);
            return;
          }

          // Activate Garage Mode now (7-day window, +4 listings). Store in user_metadata to persist.
          const newExpires = isoPlusDays(GARAGE_WINDOW_DAYS);
          const newMeta: any = {
            ...(await supabase.auth.getUser()).data.user?.user_metadata,
            garage_mode_en_venta: {
              lastUsedAt: now.toISOString(),
              expiresAt: newExpires,
            },
          };

          const up = await supabase.auth.updateUser({ data: newMeta });
          if (up.error) {
            // If metadata update fails, we don't risk breaking publish; we just continue with Free rules.
            console.warn("garage mode metadata update failed", up.error.message);
          } else {
            setGarageLastUsedAt(now.toISOString());
            setGarageExpiresAt(newExpires);
            setGarageActive(true);
          }
        }
      }

      const finalDescription = (description.trim() + buildDetailsAppendix(category, lang, details)).trim();
      // Minimal insert to avoid schema guessing.
      const insertPayload: any = {
        title: title.trim(),
        description: finalDescription,
        city: city.trim(),
        category: category.trim(),
        price: isFree ? 0 : Number((price ?? "").replace(/[^0-9.]/g, "")) || 0,
        is_free: isFree,
        contact_phone: contactMethod === "email" ? null : contactPhone.trim(),
        contact_email: contactMethod === "phone" ? null : contactEmail.trim(),
      };

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
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
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
        }

        if (photoUrls.length) {
          const marker =
            `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;

          const photosAppendix =
            lang === "es"
              ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
              : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;

          descriptionForUpdate = (descriptionForUpdate + photosAppendix).trim();

          await supabase.from("listings").update({ description: descriptionForUpdate }).eq("id", id);
        }
      } catch (e: any) {
        // If photo upload fails, don't crash the publish flow; listing is already live.
        console.warn("photo upload error", e?.message || e);
      }
      // Optimistic local count update for Free En Venta caps (keeps UI in sync without extra fetch).
      if (!isPro && category === "en-venta" && typeof enVentaActiveCount === "number") {
        setEnVentaActiveCount((prev) => (typeof prev === "number" ? prev + 1 : prev));
      }


// Pro video upload (optional, Pro-only). We store URLs inside description to avoid schema guessing.
let videoUrl: string | null = null;
let thumbUrl: string | null = null;

if (isPro && videoFile && !videoError) {
  try {
    const basePath = `${userId}/${id}/video`;
    const ext = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
    const videoPath = `${basePath}/clip.${ext}`;
    const up1 = await supabase.storage
      .from("listing-images")
      .upload(videoPath, videoFile, { upsert: true, contentType: videoFile.type });

    if (up1.error) throw up1.error;

    videoUrl = supabase.storage.from("listing-images").getPublicUrl(videoPath).data.publicUrl;

    if (videoThumbBlob) {
      const thumbPath = `${basePath}/thumb.jpg`;
      const up2 = await supabase.storage
        .from("listing-images")
        .upload(thumbPath, videoThumbBlob, { upsert: true, contentType: "image/jpeg" });

      if (!up2.error) {
        thumbUrl = supabase.storage.from("listing-images").getPublicUrl(thumbPath).data.publicUrl;
      }
    }

    if (videoUrl) {
      const marker =
        `[LEONIX_PRO_VIDEO]\nurl=${videoUrl}\n` +
        (thumbUrl ? `thumb=${thumbUrl}\n` : "") +
        `[/LEONIX_PRO_VIDEO]`;

      const videoAppendix =
        lang === "es"
          ? `\n\n— Video (Pro) —\nVideo: ${videoUrl}${thumbUrl ? `\nMiniatura: ${thumbUrl}` : ""}\n${marker}\n`
          : `\n\n— Video (Pro) —\nVideo: ${videoUrl}${thumbUrl ? `\nThumbnail: ${thumbUrl}` : ""}\n${marker}\n`;

      await supabase
        .from("listings")
        .update({ description: (descriptionForUpdate + videoAppendix).trim() })
        .eq("id", id);

      descriptionForUpdate = (descriptionForUpdate + videoAppendix).trim();
    }
  } catch (e: any) {
    // Don't fail the publish for video issues; keep listing live.
    console.warn("video upload failed", e?.message || e);
  }
}

      setPublishedId(id);
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
      return require("../components/ListingCard").default;
    } catch {
      return null;
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 text-center">
              {copy.title}
            </h1>
            <p className="text-gray-300 text-center max-w-2xl mx-auto">
              {checking ? copy.checking : copy.subtitle}
            </p>
            {authError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {authError}
              </div>
            )}
          </div>

          {!checking && signedIn && (
            <>
              {/* Stepper */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                  <span
                    className={cx(
                      "px-2 py-1 rounded-lg border",
                      step === "basics"
                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    {copy.steps.basics}
                  </span>
                  <span className="text-white/30">→</span>
                  <span
                    className={cx(
                      "px-2 py-1 rounded-lg border",
                      step === "details"
                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    {copy.steps.details}
                  </span>
                  <span className="text-white/30">→</span>
                  <span
                    className={cx(
                      "px-2 py-1 rounded-lg border",
                      step === "media"
                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    {copy.steps.media}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    deleteDraft();
                    setPublishError("");
                    setPublishedId("");
                  }}
                  className="text-xs sm:text-sm rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 px-3 py-2 text-white/80"
                >
                  {copy.deleteDraft}
                </button>
              </div>

              

              {/* Requirements checklist (quality gate) */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-100">
                      {lang === "es" ? "Requisitos para publicar" : "Publish requirements"}
                    </div>
                    <p className="mt-1 text-xs text-white/70">
                      {lang === "es"
                        ? "Completa esto para que tu anuncio salga bien en la lista. Te guiamos paso a paso."
                        : "Complete these so your listing shows up cleanly in search. We’ll guide you step by step."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("basics")}
                      className="text-xs rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 px-3 py-2 text-white/80"
                    >
                      {copy.steps.basics}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="text-xs rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 px-3 py-2 text-white/80"
                    >
                      {copy.steps.details}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("media")}
                      className="text-xs rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 px-3 py-2 text-white/80"
                    >
                      {copy.steps.media}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {requirementItems.map((it) => (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => setStep(it.step)}
                      className={cx(
                        "text-xs rounded-full border px-3 py-1.5",
                        it.ok
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
                      )}
                      aria-label={it.ok ? `${it.label} OK` : `${it.label} missing`}
                    >
                      {it.ok ? "✓ " : "• "}
                      {it.label}
                    </button>
                  ))}
                </div>

                {!requirements.allOk && (
                  <div className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs text-yellow-100">
                    {missingRequirementsText}
                  </div>
                )}
              </div>

<div className="mt-6 grid gap-6">
                {/* BASICS */}
                {step === "basics" && (
                  <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
                    <h2 className="text-lg font-semibold text-gray-100">{copy.basicsTitle}</h2>
                    {!isPro && category === "en-venta" && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-100">
                              {lang === "es" ? "Modo Garaje" : "Garage Mode"}
                            </div>
                            <p className="mt-1 text-xs text-white/70 max-w-xl">
                              {lang === "es"
                                ? "Solo para usuarios Free en En Venta. Cuando llegas al límite, puedes desbloquear +4 anuncios por 7 días (1 vez cada 30 días)."
                                : "Free users in For Sale only. When you hit the limit, unlock +4 listings for 7 days (once every 30 days)."}
                            </p>
                          </div>

                          <div className="text-xs text-white/70">
                            {garageLoading
                              ? (lang === "es" ? "Calculando…" : "Calculating…")
                              : typeof enVentaActiveCount === "number"
                                ? (lang === "es"
                                    ? `Activos: ${enVentaActiveCount} / ${garage.effectiveLimit ?? FREE_EN_VENTA_LIMIT}`
                                    : `Active: ${enVentaActiveCount} / ${garage.effectiveLimit ?? FREE_EN_VENTA_LIMIT}`)
                                : (lang === "es" ? "Activos: —" : "Active: —")}
                          </div>
                        </div>

                        {garage.active && garageExpiresAt && (
                          <div className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs text-yellow-100">
                            {lang === "es"
                              ? `Modo Garaje activo hasta ${new Date(garageExpiresAt).toLocaleDateString("es-US")}.`
                              : `Garage Mode active until ${new Date(garageExpiresAt).toLocaleDateString("en-US")}.`}
                          </div>
                        )}

                        {!garage.active && typeof garage.cooldownDaysLeft === "number" && garage.cooldownDaysLeft > 0 && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
                            {lang === "es"
                              ? `Disponible de nuevo en ${garage.cooldownDaysLeft} día(s).`
                              : `Available again in ${garage.cooldownDaysLeft} day(s).`}
                          </div>
                        )}

                        {!garage.active && garage.eligibleToActivate && (
                          <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100">
                            {lang === "es"
                              ? "Estás en el límite. Al publicar, activaremos Modo Garaje automáticamente para darte +4 anuncios por 7 días."
                              : "You’re at the limit. When you publish, we’ll automatically activate Garage Mode to give you +4 listings for 7 days."}
                          </div>
                        )}
                      </div>
                    )}


                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className="text-sm text-white/80">{copy.fieldTitle}</label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={lang === "es" ? "Ej: Sofá en excelente condición" : "Ex: Great-condition sofa"}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                        />
                        {!requirements.titleOk && (
                          <div className="mt-1 text-xs text-white/40">
                            {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm text-white/80">{copy.fieldDesc}</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={
                            lang === "es"
                              ? "Describe el estado, medidas, entrega, etc."
                              : "Describe condition, size, pickup/delivery, etc."
                          }
                          rows={5}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                        />
                        {!requirements.descOk && (
                          <div className="mt-1 text-xs text-white/40">
                            {lang === "es" ? "Mínimo 20 caracteres." : "Min 20 characters."}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-sm text-white/80">{copy.fieldPrice}</label>
                          <input
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            disabled={isFree}
                            placeholder={lang === "es" ? "Ej: 120" : "Ex: 120"}
                            className={cx(
                              "mt-2 w-full rounded-xl border px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2",
                              isFree
                                ? "border-white/5 bg-white/5 text-white/50"
                                : "border-white/10 bg-black/40 focus:ring-yellow-400/30"
                            )}
                          />
                          {!requirements.priceOk && (
                            <div className="mt-1 text-xs text-white/40">
                              {lang === "es" ? "Agrega un precio o marca Gratis." : "Add a price or mark Free."}
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-sm text-white/80">{copy.freeToggle}</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsFree((v) => !v);
                              if (!isFree) setPrice("");
                            }}
                            className={cx(
                              "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                              isFree
                                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                                : "border-white/10 bg-black/40 text-white/80 hover:bg-black/50"
                            )}
                          >
                            {isFree ? (lang === "es" ? "Sí, es Gratis" : "Yes, it's Free") : lang === "es" ? "No" : "No"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-white/80">{copy.fieldCity}</label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                        />
                        {!requirements.cityOk && (
                          <div className="mt-1 text-xs text-white/40">
                            {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="text-xs text-white/40">{copy.requiredHint}</div>
                      <button
                        type="button"
                        onClick={() => setStep("details")}
                        className="rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* DETAILS */}
                {step === "details" && (
                  <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
                    <h2 className="text-lg font-semibold text-gray-100">{copy.detailsTitle}</h2>
                    <p className="mt-2 text-sm text-white/60">
                      {lang === "es"
                        ? "Estos detalles ayudan a que tu anuncio se vea como en las mejores plataformas. Solo llena lo que aplica."
                        : "These details help your listing look like the top platforms. Fill only what applies."}
                    </p>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-sm text-white/70">
                        {lang === "es" ? "Categoría:" : "Category:"}{" "}
                        <span className="text-white/90 font-semibold">{category}</span>
                      </div>

                      {getCategoryFields(category).length === 0 ? (
                        <div className="mt-3 text-sm text-white/55">
                          {lang === "es"
                            ? "Por ahora no hay campos extra para esta categoría."
                            : "No extra fields for this category yet."}
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {getCategoryFields(category).map((f) => {
                            const v = details[f.key] ?? "";
                            const label = f.label[lang];
                            const placeholder = f.placeholder ? f.placeholder[lang] : undefined;

                            if (f.type === "select" && f.options) {
                              return (
                                <label key={f.key} className="block">
                                  <div className="text-xs text-white/60 mb-1">{label}</div>
                                  <select
                                    value={v}
                                    onChange={(e) =>
                                      setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
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
                                <div className="text-xs text-white/60 mb-1">{label}</div>
                                <input
                                  value={v}
                                  onChange={(e) =>
                                    setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                  }
                                  inputMode={f.type === "number" ? "numeric" : undefined}
                                  placeholder={placeholder}
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
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
                          className="text-xs text-white/60 hover:text-white/80"
                        >
                          {lang === "es" ? "Limpiar detalles" : "Clear details"}
                        </button>
                        <div className="text-xs text-white/40">
                          {lang === "es"
                            ? "Estos detalles se guardan en tu borrador."
                            : "These details are saved in your draft."}
                        </div>
                      </div>
                    </div>

<div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep("basics")}
                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white font-semibold px-5 py-3"
                      >
                        {copy.back}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("media")}
                        className="rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* MEDIA + CONTACT + PREVIEW */}
                {step === "media" && (
                  <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
                    <h2 className="text-lg font-semibold text-gray-100">{copy.mediaTitle}</h2>

                    <div className="mt-4 grid gap-5">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-white/80">
                            {copy.images}
                            <span className="ml-2 text-xs text-white/50">
                              {lang === "es"
                                ? `(Máx ${maxImages}. ${isPro ? "Puedes reordenar." : "Pro: 12 + reordenar."})`
                                : `(Max ${maxImages}. ${isPro ? "You can reorder." : "Pro: 12 + reorder."})`}
                            </span>
                          </div>
                          <label className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 px-4 py-2 text-sm font-semibold text-white/80 cursor-pointer">
                            {copy.addImages}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const selected = Array.from(e.target.files ?? []);
                                // Allow adding more photos across multiple picks
                                const combined = [...files, ...selected];

                                // De-dupe by (name,size,lastModified) to avoid accidental duplicates
                                const seen = new Set<string>();
                                const deduped: File[] = [];
                                for (const f of combined) {
                                  const k = `${f.name}__${f.size}__${f.lastModified}`;
                                  if (seen.has(k)) continue;
                                  seen.add(k);
                                  deduped.push(f);
                                }

                                setFiles(deduped.slice(0, maxImages));

                                // reset input so picking the same file again triggers change
                                try { (e.target as HTMLInputElement).value = ""; } catch {}
                              }}
                            />
                          </label>
                        </div>

                        {files.length === 0 ? (
                          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">
                            {lang === "es" ? "Agrega por lo menos 1 foto." : "Add at least 1 photo."}
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {filePreviews.map((src, idx) => (
                              <div
                                key={idx}
                                className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
                              >
                                <img src={src} alt="preview" className="h-20 w-full object-cover" />
                                {idx === 0 && (
                                  <div className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-200 border border-yellow-400/20">
                                    {lang === "es" ? "Portada" : "Cover"}
                                  </div>
                                )}

                                <div className="absolute right-1 top-1 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 hover:bg-black/70"
                                    aria-label={lang === "es" ? "Quitar foto" : "Remove photo"}
                                    title={lang === "es" ? "Quitar" : "Remove"}
                                  >
                                    ✕
                                  </button>
                                </div>

                                {isPro && (
                                  <div className="absolute left-1 bottom-1 flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => makeCover(idx)}
                                      className={cx(
                                        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                                        idx === 0
                                          ? "border-white/10 bg-black/40 text-white/40 cursor-not-allowed"
                                          : "border-yellow-400/25 bg-black/60 text-yellow-200 hover:bg-black/70"
                                      )}
                                      title={lang === "es" ? "Hacer portada" : "Make cover"}
                                    >
                                      {lang === "es" ? "Portada" : "Cover"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveLeft(idx)}
                                      className={cx(
                                        "rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 hover:bg-black/70",
                                        idx === 0 && "opacity-40 cursor-not-allowed"
                                      )}
                                      title={lang === "es" ? "Mover izquierda" : "Move left"}
                                    >
                                      ◀
                                    </button>

                                    <button
                                      type="button"
                                      disabled={idx === filePreviews.length - 1}
                                      onClick={() => moveRight(idx)}
                                      className={cx(
                                        "rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 hover:bg-black/70",
                                        idx === filePreviews.length - 1 && "opacity-40 cursor-not-allowed"
                                      )}
                                      title={lang === "es" ? "Mover derecha" : "Move right"}
                                    >
                                      ▶
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {!requirements.imagesOk && (
                          <div className="mt-1 text-xs text-white/40">
                            {lang === "es" ? "Requerido: mínimo 1 foto." : "Required: at least 1 photo."}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 relative overflow-hidden">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-sm text-white/80">{copy.video}</div>
      <div className="mt-1 text-xs text-white/45">{copy.videoHint}</div>
    </div>

    <label
      className={cx(
        "rounded-xl border px-4 py-2 text-sm font-semibold cursor-pointer",
        isPro
          ? "border-white/10 bg-white/5 hover:bg-white/8 text-white/80"
          : "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
      )}
    >
      {copy.addVideo}
      <input
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        disabled={!isPro}
        onChange={async (e) => {
          const f = (e.target.files ?? [])[0] || null;
          setVideoFile(f);
          setVideoError("");
          setVideoInfo(null);
          setVideoThumbBlob(null);
          if (f) await inspectAndThumbVideo(f);
        }}
      />
    </label>
  </div>

  {!isPro && (
    <div className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm text-yellow-200/90 flex items-center justify-between gap-3">
      <div>{copy.videoLocked}</div>
      <Link
        href={`/dashboard?lang=${lang}`}
        className="shrink-0 rounded-lg border border-yellow-400/30 bg-black/30 px-3 py-2 text-xs font-semibold text-yellow-200 hover:bg-black/40"
      >
        {lang === "es" ? "Ver Pro" : "See Pro"}
      </Link>
    </div>
  )}

  {videoError && <div className="mt-3 text-sm text-red-300">{videoError}</div>}

  {videoFile && !videoError && (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-white/75 truncate">{videoFile.name}</div>
        <button
          type="button"
          onClick={() => {
            setVideoFile(null);
          setVideoThumbBlob(null);
          setVideoInfo(null);
          setVideoError("");
          setShowProVideoPreview(false);
          }}
          className="text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-white/70"
        >
          {lang === "es" ? "Quitar" : "Remove"}
        </button>
      </div>

      {videoInfo && (
        <div className="mt-2 text-xs text-white/45">
          {Math.round(videoInfo.duration * 10) / 10}s • {videoInfo.width}×{videoInfo.height}
        </div>
      )}

      {videoThumbBlob && (
        <div className="mt-3">
          <div className="text-xs text-white/45 mb-2">{lang === "es" ? "Miniatura" : "Thumbnail"}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="video thumbnail"
            className="w-full max-w-sm rounded-xl border border-white/10"
            src={proVideoThumbPreviewUrl}
          />
        </div>
      )}
    </div>
  )}
</div>

<div className="rounded-2xl border border-white/10 bg-black/20 p-4">

                        <div className="text-sm text-white/80">{copy.contact}</div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {([
                            ["phone", copy.phone],
                            ["email", copy.email],
                            ["both", copy.both],
                          ] as const).map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setContactMethod(value)}
                              className={cx(
                                "rounded-xl border px-3 py-2 text-sm font-semibold",
                                contactMethod === value
                                  ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                                  : "border-white/10 bg-white/5 text-white/80 hover:bg-white/8"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(contactMethod === "phone" || contactMethod === "both") && (
                            <div>
                              <label className="text-xs text-white/70">{copy.phone}</label>
                              <input
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder={lang === "es" ? "Ej: 408-555-1234" : "Ex: 408-555-1234"}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                              />
                              {!requirements.phoneOk && (
                                <div className="mt-1 text-xs text-white/40">
                                  {lang === "es" ? "Agrega un teléfono válido." : "Add a valid phone."}
                                </div>
                              )}
                            </div>
                          )}

                          {(contactMethod === "email" || contactMethod === "both") && (
                            <div>
                              <label className="text-xs text-white/70">{copy.email}</label>
                              <input
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder={lang === "es" ? "Ej: nombre@email.com" : "Ex: name@email.com"}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                              />
                              {!requirements.emailOk && (
                                <div className="mt-1 text-xs text-white/40">
                                  {lang === "es" ? "Agrega un email válido." : "Add a valid email."}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white/80">{copy.preview}</div>
                          <div className="text-xs text-white/40">
                            {lang === "es" ? "Así se verá tu anuncio" : "This is how your listing will look"}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs text-white/50 mb-2">{copy.cardPreview}</div>
                            {ListingCard ? (
                              (() => {
                                const item: any = {
                                  title: title.trim() || (lang === "es" ? "(Sin título)" : "(No title)"),
                                  description:
                                    description.trim() || (lang === "es" ? "(Sin descripción)" : "(No description)"),
                                  createdAt: lang === "es" ? "hoy" : "today",
                                };
                                return <ListingCard item={item} />;
                              })()
                            ) : (
                              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                                {lang === "es" ? "(Vista previa no disponible)" : "(Preview unavailable)"}
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs text-white/50 mb-2">{copy.detailPreview}</div>
                            <div className="text-lg font-semibold text-gray-100 leading-snug">
                              {title.trim() || (lang === "es" ? "(Sin título)" : "(No title)")}
                            </div>
                            <div className="mt-1 text-sm text-white/70">
                              {isFree
                                ? lang === "es"
                                  ? "Gratis"
                                  : "Free"
                                : formatMoneyMaybe(price, lang) || (lang === "es" ? "(Sin precio)" : "(No price)")}
                              <span className="text-white/30"> · </span>
                              {city.trim() || (lang === "es" ? "(Ciudad)" : "(City)")}
                            </div>
                            {filePreviews.length > 0 && (
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {filePreviews.slice(0, 3).map((src, idx) => (
                                  <img
                                    key={idx}
                                    src={src}
                                    alt="preview"
                                    className="h-20 w-full object-cover rounded-xl border border-white/10"
                                  />
                                ))}
                              </div>
                            )}
                            {isPro && videoFile && (
                              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-yellow-200">
                                      {lang === "es" ? "Video (Pro)" : "Pro Video"}
                                    </div>
                                    <div className="mt-1 text-xs text-white/50">
                                      {lang === "es"
                                        ? "Toque la miniatura para reproducir. No se reproduce automáticamente."
                                        : "Tap the thumbnail to play. No autoplay."}
                                    </div>
                                  </div>
                                  {!showProVideoPreview && (
                                    <button
                                      type="button"
                                      onClick={() => setShowProVideoPreview(true)}
                                      className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-100 hover:bg-yellow-500/15"
                                    >
                                      {lang === "es" ? "Reproducir" : "Play"}
                                    </button>
                                  )}
                                </div>

                                <div className="mt-3">
                                  {!showProVideoPreview ? (
                                    proVideoThumbPreviewUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setShowProVideoPreview(true)}
                                        className="group relative block w-full overflow-hidden rounded-xl border border-white/10"
                                        aria-label={lang === "es" ? "Reproducir video" : "Play video"}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={proVideoThumbPreviewUrl}
                                          alt={lang === "es" ? "Miniatura del video" : "Video thumbnail"}
                                          className="h-auto w-full object-cover opacity-95 group-hover:opacity-100"
                                          loading="lazy"
                                        />
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                          <div className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                                            {lang === "es" ? "▶ Reproducir" : "▶ Play"}
                                          </div>
                                        </div>
                                      </button>
                                    ) : (
                                      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                                        {lang === "es"
                                          ? "Este anuncio incluirá un video Pro al publicarse."
                                          : "This listing will include a Pro video when published."}
                                      </div>
                                    )
                                  ) : (
                                    <video
                                      className="w-full rounded-xl border border-white/10 bg-black"
                                      controls
                                      preload="none"
                                      playsInline
                                      poster={proVideoThumbPreviewUrl || undefined}
                                      src={proVideoPreviewUrl || undefined}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {getDetailPairs(category, lang, details).length > 0 && (
                              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs text-white/50 mb-2">
                                  {lang === "es" ? "Detalles" : "Details"}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                  {getDetailPairs(category, lang, details).map((p) => (
                                    <div key={p.label} className="text-sm text-white/75">
                                      <span className="text-white/45">{p.label}:</span>{" "}
                                      <span className="text-white/85">{p.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
<div className="mt-3 text-sm text-gray-200 whitespace-pre-wrap">
                              {description.trim() || (lang === "es" ? "(Sin descripción)" : "(No description)")}
                            </div>
                          </div>
                        </div>
                      </div>

                      {publishError && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                          {publishError}
                        </div>
                      )}

                      {publishedId && (
                        <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-3 text-sm text-green-200">
                          {copy.published}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setStep("details")}
                          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white font-semibold px-5 py-3"
                        >
                          {copy.back}
                        </button>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                          {publishedId && (
                            <button
                              type="button"
                              onClick={() => router.push(`/clasificados/anuncio/${publishedId}?lang=${lang}`)}
                              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white font-semibold px-5 py-3"
                            >
                              {copy.viewListing}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={publishing || !requirements.allOk}
                            onClick={publish}
                            className={cx(
                              "rounded-xl font-semibold px-6 py-3",
                              publishing || !requirements.allOk
                                ? "bg-yellow-500/40 text-black/70 cursor-not-allowed"
                                : "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                            )}
                          >
                            {publishing ? copy.publishing : copy.publish}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="mt-6 text-xs text-white/40 text-center">
                {lang === "es"
                  ? `Sesión: ${userId ? userId.slice(0, 8) + "…" : ""} · Borrador: autosave`
                  : `Session: ${userId ? userId.slice(0, 8) + "…" : ""} · Draft: autosave`}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}