"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { RULES_CONFIRMED_KEY } from "@/app/clasificados/lib/classifiedsDraftStorage";
import { buildPublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import { getDetailPairs, buildDetailsAppendix } from "@/app/clasificados/lib/publishDetailPairs";
import { computePublishRequirements } from "@/app/clasificados/lib/publishRequirements";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { normalizeEvCity } from "../shared/utils/evCityCanonical";
import {
  EN_VENTA_DEPARTMENTS,
  getArticulosForDepartment,
  getSubcategoriesForDept,
} from "../shared/fields/enVentaTaxonomy";
import { EN_VENTA_PUBLISH_CONDITION_OPTIONS } from "../shared/fields/enVentaTaxonomy";
import { getEnVentaAttributeFields } from "../shared/fields/enVentaTaxonomy";
import { mapEnVentaSellerKindToDb } from "../mapping/mapEnVentaDraftToInsert";
import { EnVentaListaCard } from "../lista/EnVentaListaCard";
import { buildEnVentaPreviewModel } from "../preview/buildEnVentaPreviewModel";

type Lang = "es" | "en";

const STORAGE_KEY = "leonix_en_venta_wizard_v1";

function getPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string) ?? "");
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

type StepId = "category" | "basics" | "details" | "media" | "location" | "preview" | "publish";

const STEPS: StepId[] = ["category", "basics", "details", "media", "location", "preview", "publish"];

export default function EnVentaPublishWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<StepId>("category");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({ seller_kind: "individual" });
  const [contactMethod, setContactMethod] = useState<"phone" | "email" | "both">("phone");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw) as Record<string, unknown>;
      if (o.title != null) setTitle(String(o.title));
      if (o.description != null) setDescription(String(o.description));
      if (o.price != null) setPrice(String(o.price));
      if (o.city != null) setCity(String(o.city));
      if (o.details && typeof o.details === "object") setDetails({ ...(o.details as Record<string, string>) });
      if (o.contactMethod) setContactMethod(o.contactMethod as "phone" | "email" | "both");
      if (o.contactPhone != null) setContactPhone(String(o.contactPhone));
      if (o.contactEmail != null) setContactEmail(String(o.contactEmail));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          title,
          description,
          price,
          city,
          details,
          contactMethod,
          contactPhone,
          contactEmail,
        })
      );
    } catch {
      /* ignore */
    }
  }, [title, description, price, city, details, contactMethod, contactPhone, contactEmail]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = await Promise.all(images.map((f) => fileToDataUrl(f)));
      if (!cancelled) setFilePreviews(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [images]);

  useEffect(() => {
    try {
      setRulesConfirmed(localStorage.getItem(RULES_CONFIRMED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const cityCanonical = useMemo(() => normalizeEvCity(city), [city]);

  const snapshot = useMemo(() => {
    const priceForSnap = price.trim() === "" && (details.negotiable ?? "") === "yes" ? "0" : price;
    const pairs = getDetailPairs("en-venta", lang, details, cityCanonical || city.trim());
    return buildPublishDraftSnapshot({
      title,
      description,
      city,
      price: priceForSnap,
      isFree: false,
      details,
      contactMethod,
      contactPhone,
      contactEmail,
      category: "en-venta",
      lang,
      isPro: false,
      imageUrls: filePreviews,
      proVideoThumbUrl: null,
      proVideoUrl: null,
      cityCanonical: cityCanonical || null,
      detailPairs: pairs,
    });
  }, [
    title,
    description,
    city,
    price,
    details,
    contactMethod,
    contactPhone,
    contactEmail,
    lang,
    filePreviews,
    cityCanonical,
  ]);

  const requirements = useMemo(() => computePublishRequirements(snapshot), [snapshot]);

  const stepIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]!);
  }, [step]);

  const goBack = useCallback(() => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]!);
  }, [step]);

  const subOptions = useMemo(() => getSubcategoriesForDept(details.rama ?? ""), [details.rama]);
  const articleOptions = useMemo(() => getArticulosForDepartment(details.rama ?? ""), [details.rama]);
  const attrFields = useMemo(() => getEnVentaAttributeFields(details.rama ?? ""), [details.rama]);

  async function publish() {
    setPublishError("");
    if (!userId) {
      const here = `/clasificados/publicar/en-venta?lang=${lang}`;
      router.push(`/login?redirect=${encodeURIComponent(here)}`);
      return;
    }
    if (!rulesConfirmed) {
      setPublishError(
        lang === "es"
          ? "Confirma las reglas de la comunidad antes de publicar."
          : "Confirm community rules before publishing."
      );
      return;
    }
    if (!requirements.allOk) {
      setPublishError(lang === "es" ? "Completa los campos requeridos." : "Complete required fields.");
      return;
    }
    if (!cityCanonical) {
      setPublishError(
        lang === "es" ? "Selecciona una ciudad válida del Norte de California." : "Pick a valid NorCal city."
      );
      return;
    }

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e: unknown) {
      setPublishError(e instanceof Error ? e.message : "Config");
      return;
    }

    setPublishing(true);
    try {
      const snap = snapshot;
      const finalDescription = (
        snap.description + buildDetailsAppendix("en-venta", snap.lang, snap.details, snap.cityCanonical ?? snap.city)
      ).trim();

      const mediaPhoneDigits = getPhoneDigits(snap.contactPhone);
      const resolvedPhoneForInsert = mediaPhoneDigits.length === 10 ? mediaPhoneDigits : null;
      const resolvedEmailForInsert = snap.contactEmail.trim();

      const insertPayload: Record<string, unknown> = {
        owner_id: userId,
        title: snap.title,
        description: finalDescription,
        city: snap.cityCanonical!,
        category: "en-venta",
        price: Number((snap.priceRaw ?? "").replace(/[^0-9.]/g, "")) || 0,
        is_free: false,
        contact_phone: snap.contactMethod === "email" ? null : resolvedPhoneForInsert,
        contact_email: snap.contactMethod === "phone" ? null : resolvedEmailForInsert || null,
        status: "active",
        is_published: true,
        detail_pairs: Array.isArray(snap.detailPairs) && snap.detailPairs.length > 0 ? snap.detailPairs : null,
        seller_type: mapEnVentaSellerKindToDb(snap.details.seller_kind),
      };

      const { data, error } = await supabase.from("listings").insert([insertPayload]).select("id").single();

      if (error) {
        setPublishError(error.message);
        return;
      }

      const id = (data as { id?: string } | null)?.id;
      if (!id) {
        setPublishError(lang === "es" ? "Sin ID de anuncio." : "No listing id returned.");
        return;
      }

      let descriptionForUpdate = finalDescription;
      const photoUrls: string[] = [];
      try {
        const basePath = `${userId}/${id}/photos`;
        for (let i = 0; i < images.length; i++) {
          const f = images[i]!;
          const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
          const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
          const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${safeExt}`;
          const up = await supabase.storage
            .from("listing-images")
            .upload(path, f, { upsert: true, contentType: f.type || "image/jpeg" });
          if (up.error) continue;
          const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
          if (url) photoUrls.push(url);
        }
        if (photoUrls.length) {
          const marker = `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;
          const photosAppendix =
            lang === "es"
              ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
              : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
          descriptionForUpdate = (descriptionForUpdate + photosAppendix).trim();
          await supabase.from("listings").update({ description: descriptionForUpdate, images: photoUrls }).eq("id", id);
        }
      } catch {
        /* photos optional failure */
      }

      setPublishedId(id);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } catch (e: unknown) {
      setPublishError(e instanceof Error ? e.message : "Error");
    } finally {
      setPublishing(false);
    }
  }

  const copy = {
    es: {
      exit: "Salir",
      next: "Siguiente",
      back: "Atrás",
      publish: "Publicar",
      rules: "Confirmo que mi anuncio cumple las reglas de Leonix.",
      success: "¡Publicado!",
      view: "Ver anuncio",
      hub: "Ir a En Venta",
    },
    en: {
      exit: "Exit",
      next: "Next",
      back: "Back",
      publish: "Publish",
      rules: "I confirm my listing follows Leonix community rules.",
      success: "Published!",
      view: "View listing",
      hub: "Go to For Sale",
    },
  }[lang];

  if (publishedId) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 pt-28 pb-16 text-[#111111]">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-8 text-center shadow-sm">
          <div className="text-3xl" aria-hidden>
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold">{copy.success}</h1>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/clasificados/anuncio/${publishedId}?lang=${lang}`}
              className="rounded-full bg-[#111111] py-3 text-sm font-semibold text-white"
            >
              {copy.view}
            </Link>
            <Link
              href={`/clasificados/en-venta?lang=${lang}`}
              className="rounded-full border border-black/15 py-3 text-sm font-semibold"
            >
              {copy.hub}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pt-24 pb-24 text-[#111111]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href={`/clasificados/publicar?lang=${lang}`} className="text-sm font-medium text-[#111111]/70 hover:underline">
          ← {lang === "es" ? "Categorías" : "Categories"}
        </Link>
        <div className="text-xs font-semibold text-[#111111]/50">
          {lang === "es" ? "Paso" : "Step"} {stepIndex + 1}/{STEPS.length}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-1">
        {STEPS.map((s) => (
          <span
            key={s}
            className={cx(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              s === step ? "bg-[#111111] text-white" : "bg-black/5 text-[#111111]/50"
            )}
          >
            {s}
          </span>
        ))}
      </div>

      {step === "category" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Departamento y artículo" : "Department & item"}</h1>
          <label className="block text-sm font-semibold">{lang === "es" ? "Departamento" : "Department"}</label>
          <select
            className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            value={details.rama ?? ""}
            onChange={(e) =>
              setDetails((d) => ({
                ...d,
                rama: e.target.value,
                evSub: "",
                itemType: "",
              }))
            }
          >
            <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
            {EN_VENTA_DEPARTMENTS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label[lang]}
              </option>
            ))}
          </select>

          {subOptions.length > 0 ? (
            <>
              <label className="block text-sm font-semibold">{lang === "es" ? "Clasificación" : "Shelf / type"}</label>
              <select
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
                value={details.evSub ?? ""}
                onChange={(e) => setDetails((d) => ({ ...d, evSub: e.target.value }))}
              >
                <option value="">{lang === "es" ? "Opcional" : "Optional"}</option>
                {subOptions.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label[lang]}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <label className="block text-sm font-semibold">{lang === "es" ? "Tipo de artículo" : "Item type"}</label>
          <select
            className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            value={details.itemType ?? ""}
            onChange={(e) => setDetails((d) => ({ ...d, itemType: e.target.value }))}
          >
            <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
            {articleOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label[lang]}
              </option>
            ))}
          </select>
        </section>
      )}

      {step === "basics" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Lo esencial" : "Basics"}</h1>
          <input
            className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
            placeholder={lang === "es" ? "Título (5+ caracteres)" : "Title (5+ chars)"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
            placeholder={lang === "es" ? "Describe tu artículo" : "Describe your item"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">{lang === "es" ? "Precio (USD)" : "Price (USD)"}</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">{lang === "es" ? "Negociable" : "Negotiable"}</label>
              <select
                className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                value={details.negotiable ?? ""}
                onChange={(e) => setDetails((d) => ({ ...d, negotiable: e.target.value }))}
              >
                <option value="">{lang === "es" ? "No" : "No"}</option>
                <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === "es" ? "Condición" : "Condition"}</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={details.condition ?? ""}
              onChange={(e) => setDetails((d) => ({ ...d, condition: e.target.value }))}
            >
              <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
              {EN_VENTA_PUBLISH_CONDITION_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {lang === "es" ? c.labelEs : c.labelEn}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {step === "details" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Detalles" : "Details"}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
              placeholder={lang === "es" ? "Marca (opcional)" : "Brand (optional)"}
              value={details.brand ?? ""}
              onChange={(e) => setDetails((d) => ({ ...d, brand: e.target.value }))}
            />
            <input
              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
              placeholder={lang === "es" ? "Modelo (opcional)" : "Model (optional)"}
              value={details.model ?? ""}
              onChange={(e) => setDetails((d) => ({ ...d, model: e.target.value }))}
            />
          </div>
          {attrFields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold">{f.label[lang]}</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                value={details[f.key] ?? ""}
                onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </section>
      )}

      {step === "media" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Fotos" : "Photos"}</h1>
          <p className="text-sm text-[#111111]/70">{lang === "es" ? "Mínimo 1 foto. La primera es la portada." : "At least 1 photo. First image is the cover."}</p>
          <label className="block">
            <span className="sr-only">{lang === "es" ? "Subir fotos" : "Upload photos"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="block w-full text-sm"
              onChange={(e) => {
                const list = e.target.files;
                if (!list?.length) return;
                setImages((prev) => [...prev, ...Array.from(list)].slice(0, 12));
                e.target.value = "";
              }}
            />
          </label>
          {images.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2">
              {images.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative rounded-lg border border-black/10 p-1 text-center text-[10px]">
                  <span className="line-clamp-2">{f.name}</span>
                  <button
                    type="button"
                    className="mt-1 text-red-600"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  >
                    {lang === "es" ? "Quitar" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {step === "location" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Ubicación y contacto" : "Location & contact"}</h1>
          <CityAutocomplete value={city} onChange={setCity} lang={lang} variant="light" />
          <input
            className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
            placeholder="ZIP"
            value={details.zip ?? ""}
            onChange={(e) => setDetails((d) => ({ ...d, zip: e.target.value }))}
          />
          {(["pickup", "shipping", "delivery"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(details[k] ?? "") === "1"}
                onChange={(e) => setDetails((d) => ({ ...d, [k]: e.target.checked ? "1" : "" }))}
              />
              {k === "pickup" ? (lang === "es" ? "Recogida local" : "Local pickup") : null}
              {k === "shipping" ? (lang === "es" ? "Envío" : "Shipping") : null}
              {k === "delivery" ? (lang === "es" ? "Entrega local" : "Local delivery") : null}
            </label>
          ))}
          <div>
            <label className="text-xs font-semibold">{lang === "es" ? "Vendedor" : "Seller"}</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={details.seller_kind ?? "individual"}
              onChange={(e) => setDetails((d) => ({ ...d, seller_kind: e.target.value }))}
            >
              <option value="individual">{lang === "es" ? "Persona" : "Individual"}</option>
              <option value="business">{lang === "es" ? "Negocio" : "Business"}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === "es" ? "Contacto" : "Contact"}</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value as "phone" | "email" | "both")}
            >
              <option value="phone">{lang === "es" ? "Teléfono" : "Phone"}</option>
              <option value="email">Email</option>
              <option value="both">{lang === "es" ? "Ambos" : "Both"}</option>
            </select>
          </div>
          {contactMethod !== "email" ? (
            <input
              className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              placeholder="(555) 555-5555"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          ) : null}
          {contactMethod !== "phone" ? (
            <input
              className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              type="email"
              placeholder="email@ejemplo.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          ) : null}
        </section>
      )}

      {step === "preview" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Vista previa" : "Preview"}</h1>
          <EnVentaListaCard
            x={buildEnVentaPreviewModel({
              title,
              priceLabel: snapshot.priceLabel,
              city: cityCanonical || city || "—",
              filePreviews,
              rama: details.rama ?? "",
              evSub: details.evSub ?? "",
              itemType: details.itemType ?? "",
              condition: details.condition ?? "",
            })}
            lang={lang}
            isFav={false}
            onToggleFav={() => {}}
            href="/clasificados/en-venta"
            previewMode
          />
        </section>
      )}

      {step === "publish" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{lang === "es" ? "Publicar" : "Publish"}</h1>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={rulesConfirmed}
              onChange={(e) => {
                const v = e.target.checked;
                setRulesConfirmed(v);
                try {
                  localStorage.setItem(RULES_CONFIRMED_KEY, v ? "1" : "0");
                } catch {
                  /* ignore */
                }
              }}
            />
            <span>{copy.rules}</span>
          </label>
          <Link href={`/clasificados/reglas?lang=${lang}`} className="text-sm text-[#111111]/70 underline">
            {lang === "es" ? "Ver reglas" : "View rules"}
          </Link>
          {publishError ? <p className="text-sm text-red-600">{publishError}</p> : null}
          <button
            type="button"
            disabled={publishing}
            onClick={() => void publish()}
            className="w-full rounded-full bg-[#111111] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {publishing ? "…" : copy.publish}
          </button>
        </section>
      )}

      <div className="mt-10 flex justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {copy.back}
        </button>
        {step !== "publish" ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white"
          >
            {copy.next}
          </button>
        ) : null}
      </div>
    </main>
  );
}
