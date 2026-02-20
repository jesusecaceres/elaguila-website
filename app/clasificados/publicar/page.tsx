"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const DRAFT_KEY = "leonix_clasificados_post_draft_v1";

export default function PublicarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

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

  const [step, setStep] = useState<PublishStep>("basics");
  const [category, setCategory] = useState<string>(() => {
    const c = (searchParams?.get("categoria") ?? searchParams?.get("category") ?? "en-venta").trim();
    return c || "en-venta";
  });

  // Basics
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isFree, setIsFree] = useState<boolean>(false);
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState<string>("");

  // Media + contact
  const [contactMethod, setContactMethod] = useState<"phone" | "email" | "both">("phone");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

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
          "En esta fase dejamos los campos estructurados para el siguiente batch. Aquí mantenemos la experiencia limpia y segura.",
        mediaTitle: "Media + Contacto",
        images: "Fotos (mínimo 1)",
        addImages: "Agregar fotos",
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
      setContactMethod((parsed.contactMethod as any) || "phone");
      setContactPhone(typeof parsed.contactPhone === "string" ? parsed.contactPhone : "");
      setContactEmail(typeof parsed.contactEmail === "string" ? parsed.contactEmail : "");
    } catch {
      // ignore corrupt drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

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
  }, [signedIn, step, title, description, isFree, price, city, category, contactMethod, contactPhone, contactEmail]);

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

  function deleteDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }

  async function publish() {
    setPublishError("");
    setPublishedId("");

    if (!requirements.allOk) {
      setPublishError(copy.needReqs);
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
      // Minimal insert to avoid schema guessing.
      const insertPayload: any = {
        title: title.trim(),
        description: description.trim(),
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

              <div className="mt-6 grid gap-6">
                {/* BASICS */}
                {step === "basics" && (
                  <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
                    <h2 className="text-lg font-semibold text-gray-100">{copy.basicsTitle}</h2>

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
                    <p className="mt-2 text-sm text-white/60">{copy.detailsNote}</p>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-sm text-white/70">
                        {lang === "es" ? "Categoría:" : "Category:"}{" "}
                        <span className="text-white/90 font-semibold">{category}</span>
                      </div>
                      <div className="mt-2 text-xs text-white/45">
                        {lang === "es"
                          ? "En el próximo batch, aquí aparecerán los campos estructurados por categoría (Autos, Rentas, Empleos, Servicios, En Venta)."
                          : "In the next batch, structured category fields will appear here (Autos, Rentals, Jobs, Services, For Sale)."}
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
                          <div className="text-sm text-white/80">{copy.images}</div>
                          <label className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 px-4 py-2 text-sm font-semibold text-white/80 cursor-pointer">
                            {copy.addImages}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const nextFiles = Array.from(e.target.files ?? []);
                                setFiles(nextFiles.slice(0, 12));
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
                              <img
                                key={idx}
                                src={src}
                                alt="preview"
                                className="h-20 w-full object-cover rounded-xl border border-white/10"
                              />
                            ))}
                          </div>
                        )}

                        {!requirements.imagesOk && (
                          <div className="mt-1 text-xs text-white/40">
                            {lang === "es" ? "Requerido: mínimo 1 foto." : "Required: at least 1 photo."}
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
                            disabled={publishing}
                            onClick={publish}
                            className={cx(
                              "rounded-xl font-semibold px-6 py-3",
                              publishing
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
