"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { useViajesLocalHeroObjectUrl } from "@/app/(site)/clasificados/viajes/lib/useViajesLocalHeroObjectUrl";
import { newViajesDraftMediaId, viajesDraftMediaDelete, viajesDraftMediaPut } from "@/app/(site)/clasificados/viajes/lib/viajesDraftMediaIdb";
import { ViajesDateRangeFields } from "../../components/ViajesDateRangeFields";
import { getPublicarViajesNegociosCopy } from "../data/publicarViajesNegociosCopy";
import type { ViajesNegociosCtaType } from "../lib/viajesNegociosDraftTypes";
import { VIAJES_NEGOCIOS_GALLERY_MAX, VIAJES_NEGOCIOS_MAX_INLINE_IMAGE } from "../lib/viajesNegociosDraftDefaults";
import { useViajesNegociosDraft } from "../lib/useViajesNegociosDraft";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid gap-4 sm:grid-cols-2";

export function ViajesNegociosApplicationShell() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const c = getPublicarViajesNegociosCopy(lang);
  const { draft, update, reset, hydrated } = useViajesNegociosDraft();
  const heroBlobUrl = useViajesLocalHeroObjectUrl("negocios", draft.localHeroImageId);
  const [publishOpen, setPublishOpen] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const publishModalTitleId = useId();
  const BLOB_PATH_BYTES = 360_000;

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  const branchHref = appendLangToPath("/publicar/viajes", lang);
  const privadoHref = appendLangToPath("/publicar/viajes/privado", lang);
  const previewHref = appendLangToPath("/clasificados/viajes/preview/negocios", lang);

  const chk = (id: string, checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text-2)]">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
  const a = c.audience;

  const onReset = () => {
    if (typeof window !== "undefined" && window.confirm(c.resetDraft)) reset();
  };

  const heroThumb = draft.localImageDataUrl || heroBlobUrl || draft.imagenPrincipal.trim();

  async function onPickHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const prevBlobId = draft.localHeroImageId;
    e.target.value = "";

    const storeBlob = async () => {
      const newId = newViajesDraftMediaId();
      try {
        await viajesDraftMediaPut("negocios", newId, file);
        if (prevBlobId) void viajesDraftMediaDelete("negocios", prevBlobId);
        update({ localHeroImageId: newId, localImageDataUrl: null });
      } catch {
        window.alert(
          lang === "en"
            ? "Could not store this image locally. Try a smaller file or paste a URL."
            : "No se pudo guardar la imagen en el dispositivo. Prueba un archivo más pequeño o pega una URL."
        );
      }
    };

    if (file.size > BLOB_PATH_BYTES) {
      await storeBlob();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        const r = String(reader.result ?? "");
        if (r.length > VIAJES_NEGOCIOS_MAX_INLINE_IMAGE) {
          await storeBlob();
          return;
        }
        if (prevBlobId) void viajesDraftMediaDelete("negocios", prevBlobId);
        update({ localImageDataUrl: r, localHeroImageId: null });
      })();
    };
    reader.readAsDataURL(file);
  }

  function onClearHero() {
    if (draft.localHeroImageId) void viajesDraftMediaDelete("negocios", draft.localHeroImageId);
    update({ localImageDataUrl: null, localHeroImageId: null, imagenPrincipal: "" });
    if (heroFileRef.current) heroFileRef.current.value = "";
  }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result ?? "");
      if (r.length > 160_000) {
        window.alert(
          lang === "en" ? "Logo file is too large for local draft. Use a URL or a smaller image." : "El logo es demasiado grande para el borrador local. Usa una URL o una imagen más pequeña."
        );
        return;
      }
      update({ logoLocalDataUrl: r, logoSocio: "" });
    };
    reader.readAsDataURL(file);
  }

  function onGalleryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    if (draft.galeriaUrls.length >= VIAJES_NEGOCIOS_GALLERY_MAX) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result ?? "");
      if (r.length > 120_000) {
        window.alert(
          lang === "en" ? "Image too large. Add a hosted URL instead or shrink the file." : "Imagen demasiado grande. Usa una URL alojada o reduce el archivo."
        );
        return;
      }
      update({ galeriaUrls: [...draft.galeriaUrls, r] });
    };
    reader.readAsDataURL(file);
  }

  function addGalleryUrl() {
    if (draft.galeriaUrls.length >= VIAJES_NEGOCIOS_GALLERY_MAX) return;
    const raw =
      typeof window !== "undefined"
        ? window.prompt(lang === "en" ? "Paste image URL (https://…)" : "Pega URL de imagen (https://…)")
        : null;
    const u = raw?.trim();
    if (!u) return;
    update({ galeriaUrls: [...draft.galeriaUrls, u] });
  }

  const logoPreview = draft.logoLocalDataUrl || draft.logoSocio.trim();

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-24 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.14), transparent 55%)",
      }}
    >
      <Navbar />
      <div className="mx-auto flex max-w-3xl justify-end px-4 pb-2 pt-4 sm:px-6">
        <ViajesLangSwitch compact />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-2 sm:px-6 sm:pt-4">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link href={branchHref} className="hover:text-[color:var(--lx-text)]">
            ← {c.navBack}
          </Link>
        </nav>
        <header className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">{c.workflowKicker}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{c.h1}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.intro}</p>
          <ol className="mt-4 flex flex-wrap gap-2" aria-label="Workflow steps">
            {c.stepLabels.map((label, i) => (
              <li
                key={label}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
                  i === c.activeStepIndex
                    ? "bg-[#D97706] text-white shadow-sm"
                    : "border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                }`}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-[color:var(--lx-card)] p-4 shadow-sm">
            <p className="text-sm font-bold text-[color:var(--lx-text)]">{c.recovery.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{c.recovery.wrongLaneBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={privadoHref}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] shadow-sm hover:bg-[color:var(--lx-nav-hover)]"
              >
                {c.recovery.goPrivado}
              </Link>
              <Link
                href={branchHref}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/60 px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                {c.recovery.hubViajes}
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/90 p-3 text-xs text-[color:var(--lx-text-2)]">
              <p className="font-bold text-[color:var(--lx-text)]">{c.workflow.previewWhat.title}</p>
              <p className="mt-1 leading-relaxed">{c.workflow.previewWhat.body}</p>
            </div>
            <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 text-xs text-[color:var(--lx-text-2)]">
              <p className="font-bold text-[color:var(--lx-text)]">{c.workflow.afterSubmit.title}</p>
              <p className="mt-1 leading-relaxed">{c.workflow.afterSubmit.body}</p>
            </div>
            <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 text-xs text-[color:var(--lx-text-2)]">
              <p className="font-bold text-[color:var(--lx-text)]">{c.workflow.moderation.title}</p>
              <p className="mt-1 leading-relaxed">{c.workflow.moderation.body}</p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-[color:var(--lx-gold-border)] bg-amber-50/90 p-3 text-xs text-amber-950 sm:p-4">
            <p className="font-bold">{c.trustBar.title}</p>
            <p className="mt-1 leading-relaxed">{c.trustBar.body}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 text-xs text-[color:var(--lx-text-2)] sm:p-4">
            <p className="font-bold text-[color:var(--lx-text)]">{c.productMode.title}</p>
            <p className="mt-1 leading-relaxed">{c.productMode.body}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 p-3 text-xs text-[color:var(--lx-text-2)] sm:p-4">
            <p className="font-bold text-[color:var(--lx-text)]">{c.lifecycle.title}</p>
            <p className="mt-1 text-[color:var(--lx-muted)]">{c.lifecycle.intro}</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {c.lifecycle.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.main}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.main}</p>
            <div className="mt-4">
              <label className={LABEL} htmlFor="tipoOferta">
                {c.offerType.label}
              </label>
              <select id="tipoOferta" className={INPUT} value={draft.offerType} onChange={(e) => update({ offerType: e.target.value })}>
                {(Object.keys(c.offerType.options) as Array<keyof typeof c.offerType.options>).map((key) => (
                  <option key={String(key)} value={key}>
                    {c.offerType.options[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="titulo">
                {c.title.label}
              </label>
              <input id="titulo" className={INPUT} value={draft.titulo} onChange={(e) => update({ titulo: e.target.value })} placeholder={c.title.placeholder} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="destino">
                  {c.destination.label}
                </label>
                <input id="destino" className={INPUT} value={draft.destino} onChange={(e) => update({ destino: e.target.value })} placeholder={c.destination.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="ciudadSalida">
                  {c.departureCity.label}
                </label>
                <input id="ciudadSalida" className={INPUT} value={draft.ciudadSalida} onChange={(e) => update({ ciudadSalida: e.target.value })} placeholder={c.departureCity.placeholder} />
              </div>
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="precio">
                  {c.price.label}
                </label>
                <input id="precio" className={INPUT} value={draft.precio} onChange={(e) => update({ precio: e.target.value })} placeholder={c.price.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="duracion">
                  {c.duration.label}
                </label>
                <input id="duracion" className={INPUT} value={draft.duracion} onChange={(e) => update({ duracion: e.target.value })} placeholder={c.duration.placeholder} />
              </div>
            </div>
            <div className="mt-4">
              <span className={LABEL}>{c.dates.label}</span>
              <div className="mt-3">
                <ViajesDateRangeFields
                  lang={lang}
                  dateMode={draft.dateMode}
                  fechaInicio={draft.fechaInicio}
                  fechaFin={draft.fechaFin}
                  fechasNota={draft.fechasNota}
                  fechas={draft.fechas}
                  onPatch={(p) => update(p)}
                  copy={c.dateUx}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="descripcion">
                {c.shortDescription.label}
              </label>
              <textarea id="descripcion" className={`${INPUT} min-h-[88px] resize-y`} value={draft.descripcion} onChange={(e) => update({ descripcion: e.target.value })} rows={3} />
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="incluye">
                {c.includes.label}
              </label>
              <textarea id="incluye" className={`${INPUT} min-h-[100px] resize-y`} value={draft.incluye} onChange={(e) => update({ incluye: e.target.value })} placeholder={c.includes.placeholder} rows={4} />
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.audience}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.audience}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {chk("familias", draft.familias, (v) => update({ familias: v }), a.families)}
              {chk("parejas", draft.parejas, (v) => update({ parejas: v }), a.couples)}
              {chk("grupos", draft.grupos, (v) => update({ grupos: v }), a.groups)}
              {chk("guiaEs", draft.guiaEspanol, (v) => update({ guiaEspanol: v }), a.spanishGuide)}
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="presupuestoTag">
                  {a.budgetTag.label}
                </label>
                <select id="presupuestoTag" className={INPUT} value={draft.presupuestoTag} onChange={(e) => update({ presupuestoTag: e.target.value })}>
                  <option value="">{a.budgetTag.empty}</option>
                  <option value="economico">{a.budgetTag.economy}</option>
                  <option value="moderado">{a.budgetTag.moderate}</option>
                  <option value="premium">{a.budgetTag.premium}</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="idiomaAtencion">
                  {a.serviceLanguage.label}
                </label>
                <input id="idiomaAtencion" className={INPUT} value={draft.idiomaAtencion} onChange={(e) => update({ idiomaAtencion: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {chk("hotel", draft.incluyeHotel, (v) => update({ incluyeHotel: v }), a.includesHotel)}
              {chk("transporte", draft.incluyeTransporte, (v) => update({ incluyeTransporte: v }), a.includesTransport)}
              {chk("comida", draft.incluyeComida, (v) => update({ incluyeComida: v }), a.includesFood)}
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.media}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.media}</p>

            <div className="mt-6 space-y-2 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/35 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.multimedia.blocks.hero}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    draft.heroSourceMode === "url"
                      ? "border-[#D97706] bg-[#D97706]/12 text-[color:var(--lx-text)]"
                      : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                  }`}
                  onClick={() => update({ heroSourceMode: "url" })}
                >
                  {c.multimedia.tabUrl}
                </button>
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    draft.heroSourceMode === "file"
                      ? "border-[#D97706] bg-[#D97706]/12 text-[color:var(--lx-text)]"
                      : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                  }`}
                  onClick={() => update({ heroSourceMode: "file", imagenPrincipal: "" })}
                >
                  {c.multimedia.tabFile}
                </button>
              </div>
              {draft.heroSourceMode === "url" ? (
                <div>
                  <label className={LABEL} htmlFor="imgMain">
                    {c.multimedia.heroUrl.label}
                  </label>
                  <input
                    id="imgMain"
                    className={INPUT}
                    value={draft.imagenPrincipal}
                    onChange={(e) => update({ imagenPrincipal: e.target.value })}
                    placeholder={c.multimedia.heroUrl.placeholder}
                  />
                </div>
              ) : (
                <div>
                  <span className={LABEL}>{c.multimedia.localFile.label}</span>
                  <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.multimedia.localFile.helper}</p>
                  <input ref={heroFileRef} type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={onPickHeroFile} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-bold text-[color:var(--lx-text)]" onClick={onClearHero}>
                      {c.multimedia.clearImage}
                    </button>
                  </div>
                </div>
              )}
              {heroThumb ? (
                <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroThumb} alt="" className="max-h-56 w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/35 p-4">
              <div>
                <span className={LABEL}>{c.multimedia.blocks.gallery}</span>
                <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.multimedia.gallery.helper}</p>
                <p className="mt-1 text-[11px] font-semibold text-[color:var(--lx-muted)]">{c.multimedia.galleryMaxNote}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-xl bg-[#D97706] px-3 py-2 text-xs font-bold text-white shadow-sm" onClick={addGalleryUrl}>
                  {c.multimedia.galleryAddUrl}
                </button>
                <button type="button" className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-bold text-[color:var(--lx-text)]" onClick={() => galleryFileRef.current?.click()}>
                  {c.multimedia.galleryAddFile}
                </button>
                <input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={onGalleryFile} />
              </div>
              <ul className="space-y-2">
                {draft.galeriaUrls.map((url, idx) => (
                  <li key={`${idx}-${url.slice(0, 24)}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-2">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[color:var(--lx-nav-border)] bg-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs text-[color:var(--lx-muted)]">{url.startsWith("data:") ? (lang === "en" ? "Local image" : "Imagen local") : url}</span>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-700 underline"
                      onClick={() => update({ galeriaUrls: draft.galeriaUrls.filter((_, i) => i !== idx) })}
                    >
                      {c.multimedia.galleryRemove}
                    </button>
                  </li>
                ))}
              </ul>
              <div>
                <label className={LABEL} htmlFor="galNota">
                  {c.multimedia.gallery.label} — {lang === "en" ? "notes" : "notas"}
                </label>
                <textarea
                  id="galNota"
                  className={`${INPUT} mt-1 min-h-[64px]`}
                  value={draft.galeriaNota}
                  onChange={(e) => update({ galeriaNota: e.target.value })}
                  placeholder={c.multimedia.gallery.placeholder}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/35 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.multimedia.blocks.logo}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    draft.logoSourceMode === "url"
                      ? "border-[#D97706] bg-[#D97706]/12"
                      : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                  }`}
                  onClick={() => update({ logoSourceMode: "url", logoLocalDataUrl: null })}
                >
                  {c.multimedia.tabUrl}
                </button>
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    draft.logoSourceMode === "file"
                      ? "border-[#D97706] bg-[#D97706]/12"
                      : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                  }`}
                  onClick={() => update({ logoSourceMode: "file", logoSocio: "" })}
                >
                  {c.multimedia.tabFile}
                </button>
              </div>
              {draft.logoSourceMode === "url" ? (
                <div>
                  <label className={LABEL} htmlFor="logo">
                    {c.multimedia.logo.label}
                  </label>
                  <input id="logo" className={INPUT} value={draft.logoSocio} onChange={(e) => update({ logoSocio: e.target.value })} placeholder="https://…" />
                </div>
              ) : (
                <div>
                  <input ref={logoFileRef} type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={onLogoFile} />
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-[color:var(--lx-muted)] underline"
                    onClick={() => {
                      update({ logoLocalDataUrl: null });
                      if (logoFileRef.current) logoFileRef.current.value = "";
                    }}
                  >
                    {c.multimedia.clearImage}
                  </button>
                </div>
              )}
              {logoPreview ? (
                <div className="h-16 w-16 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-white p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/35 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.multimedia.blocks.video}</p>
              <div>
                <label className={LABEL} htmlFor="video">
                  {c.multimedia.video.label}
                </label>
                <input
                  id="video"
                  className={INPUT}
                  value={draft.videoUrl}
                  onChange={(e) => update({ videoUrl: e.target.value })}
                  placeholder={c.multimedia.video.placeholder}
                />
              </div>
              <div>
                <span className={LABEL}>{c.multimedia.videoFile}</span>
                <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.multimedia.videoFileHint}</p>
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/*"
                  className="mt-2 block w-full text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) update({ videoLocalLabel: f.name });
                    e.target.value = "";
                  }}
                />
                {draft.videoLocalLabel ? (
                  <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
                    {lang === "en" ? "Selected:" : "Seleccionado:"} {draft.videoLocalLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className={CARD}>
            <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.business}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.business}</p>
            <div className="mt-4">
              <label className={LABEL} htmlFor="biz">
                {c.business.name.label}
              </label>
              <input id="biz" className={INPUT} value={draft.businessName} onChange={(e) => update({ businessName: e.target.value })} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="tel">
                  {c.business.phone.label}
                </label>
                <input id="tel" className={INPUT} value={draft.phone} onChange={(e) => update({ phone: e.target.value })} />
              </div>
              <div>
                <label className={LABEL} htmlFor="telOff">
                  {c.business.phoneOffice.label}
                </label>
                <input id="telOff" className={INPUT} value={draft.phoneOffice} onChange={(e) => update({ phoneOffice: e.target.value })} />
              </div>
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="wa">
                  {c.business.whatsapp.label}
                </label>
                <input id="wa" className={INPUT} value={draft.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} />
                <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{c.contactUx.whatsappHint}</p>
              </div>
              <div>
                <label className={LABEL} htmlFor="emailBiz">
                  {c.business.email.label}
                </label>
                <input id="emailBiz" type="email" className={INPUT} value={draft.email} onChange={(e) => update({ email: e.target.value })} autoComplete="email" />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="web">
                {c.business.website.label}
              </label>
              <input id="web" className={INPUT} value={draft.website} onChange={(e) => update({ website: e.target.value })} placeholder="https://…" />
              <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{c.contactUx.websiteHint}</p>
            </div>
            <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/50 p-3 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
              {c.contactUx.ctaExplain}
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="ctaType">
                {c.ctaType.label}
              </label>
              <select id="ctaType" className={INPUT} value={draft.ctaType} onChange={(e) => update({ ctaType: e.target.value as ViajesNegociosCtaType })}>
                {(Object.keys(c.ctaType.options) as Array<keyof typeof c.ctaType.options>).map((key) => (
                  <option key={key} value={key}>
                    {c.ctaType.options[key]}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.business.socialSection}</p>
            <div className={`mt-2 grid gap-3 sm:grid-cols-2`}>
              <div>
                <label className={LABEL} htmlFor="sf">
                  {c.business.socialFacebook.label}
                </label>
                <input id="sf" className={INPUT} value={draft.socialFacebook} onChange={(e) => update({ socialFacebook: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className={LABEL} htmlFor="si">
                  {c.business.socialInstagram.label}
                </label>
                <input id="si" className={INPUT} value={draft.socialInstagram} onChange={(e) => update({ socialInstagram: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className={LABEL} htmlFor="st">
                  {c.business.socialTiktok.label}
                </label>
                <input id="st" className={INPUT} value={draft.socialTiktok} onChange={(e) => update({ socialTiktok: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className={LABEL} htmlFor="sy">
                  {c.business.socialYoutube.label}
                </label>
                <input id="sy" className={INPUT} value={draft.socialYoutube} onChange={(e) => update({ socialYoutube: e.target.value })} placeholder="https://…" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="sx">
                  {c.business.socialTwitter.label}
                </label>
                <input id="sx" className={INPUT} value={draft.socialTwitter} onChange={(e) => update({ socialTwitter: e.target.value })} placeholder="https://…" />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL} htmlFor="socials">
                {c.business.socials.label}
              </label>
              <input id="socials" className={INPUT} value={draft.socials} onChange={(e) => update({ socials: e.target.value })} placeholder={c.business.socials.placeholder} />
            </div>
            <div className={`mt-4 ${GRID2}`}>
              <div>
                <label className={LABEL} htmlFor="destServed">
                  {c.business.destinationsServed.label}
                </label>
                <input id="destServed" className={INPUT} value={draft.destinationsServed} onChange={(e) => update({ destinationsServed: e.target.value })} placeholder={c.business.destinationsServed.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="langs">
                  {c.business.languages.label}
                </label>
                <input id="langs" className={INPUT} value={draft.languages} onChange={(e) => update({ languages: e.target.value })} placeholder={c.business.languages.placeholder} />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={hydrated ? previewHref : "#"}
              aria-disabled={!hydrated}
              className={`inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl px-6 text-sm font-bold text-white shadow-md transition hover:brightness-105 ${
                hydrated ? "bg-[#D97706]" : "cursor-not-allowed bg-[color:var(--lx-muted)] opacity-70"
              }`}
              onClick={(e) => {
                if (!hydrated) e.preventDefault();
              }}
            >
              {c.previewCta}
            </Link>
            <button type="button" onClick={onReset} className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]">
              {c.resetDraft}
            </button>
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border-2 border-[#D97706]/50 bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[#B45309] transition hover:bg-amber-50/90"
            >
              {c.publishHandoffCta}
            </button>
            <button
              type="button"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-muted)]"
              disabled
            >
              {c.submitSoon}
            </button>
          </div>
          <p className="text-center text-xs text-[color:var(--lx-muted)]">{c.ctaRowHint}</p>
        </form>

        {publishOpen ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={publishModalTitleId}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-5 shadow-xl sm:p-6">
              <h2 id={publishModalTitleId} className="text-lg font-bold text-[color:var(--lx-text)]">
                {c.publishModal.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.publishModal.intro}</p>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-[color:var(--lx-text-2)]">
                {c.publishModal.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/90 p-3 text-sm text-amber-950">{c.publishModal.standardPlus}</p>
              <p className="mt-3 text-xs font-medium text-[color:var(--lx-muted)]">{c.publishModal.honestNote}</p>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-[#D97706] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105"
                onClick={() => setPublishOpen(false)}
              >
                {c.publishModal.close}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
