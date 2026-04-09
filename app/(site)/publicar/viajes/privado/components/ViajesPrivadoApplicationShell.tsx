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

import { getPublicarViajesPrivadoCopy } from "../data/publicarViajesPrivadoCopy";
import { VIAJES_PRIVADO_MAX_IMAGE_STORAGE } from "../lib/viajesPrivadoDraftDefaults";
import { useViajesPrivadoDraft } from "../lib/useViajesPrivadoDraft";
import type { ViajesPrivadoCtaType } from "../lib/viajesPrivadoDraftTypes";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid gap-4 sm:grid-cols-2";

export function ViajesPrivadoApplicationShell() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const c = getPublicarViajesPrivadoCopy(lang);
  const { draft, update, reset, hydrated } = useViajesPrivadoDraft();
  const heroBlobUrl = useViajesLocalHeroObjectUrl("privado", draft.localHeroBlobId);
  const [publishOpen, setPublishOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalTitleId = useId();

  const BLOB_PATH_BYTES = 360_000;

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  const branchHref = appendLangToPath("/publicar/viajes", lang);
  const previewHref = appendLangToPath("/clasificados/viajes/preview/privado", lang);

  const chk = (id: string, checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text-2)]">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  async function onPickImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const prevBlobId = draft.localHeroBlobId;
    e.target.value = "";

    const storeBlob = async () => {
      const newId = newViajesDraftMediaId();
      try {
        await viajesDraftMediaPut("privado", newId, file);
        if (prevBlobId) void viajesDraftMediaDelete("privado", prevBlobId);
        update({ localHeroBlobId: newId, localImageDataUrl: null });
      } catch {
        window.alert(
          lang === "en"
            ? "Could not store this image locally (storage may be blocked or full). Try a smaller file or paste an image URL."
            : "No se pudo guardar la imagen en el dispositivo (almacenamiento bloqueado o lleno). Prueba un archivo más pequeño o pega una URL."
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
        if (r.length > VIAJES_PRIVADO_MAX_IMAGE_STORAGE) {
          await storeBlob();
          return;
        }
        if (prevBlobId) void viajesDraftMediaDelete("privado", prevBlobId);
        update({ localImageDataUrl: r, localHeroBlobId: null });
      })();
    };
    reader.readAsDataURL(file);
  }

  const a = c.audience;
  const heroPreview = draft.localImageDataUrl || heroBlobUrl || draft.imagenUrl.trim();

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-28 text-[color:var(--lx-text)]"
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
                  i === c.activeStepIndex ? "bg-[#D97706] text-white shadow-sm" : "border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                }`}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ol>
        </header>

        <div className="mt-6 space-y-3">
          <div className={`${CARD} border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/90`}>
            <p className="text-xs font-bold text-[color:var(--lx-text)]">{c.laneClarification}</p>
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{c.notAffiliate}</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{c.notNegocios}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/90 p-3 text-xs text-[color:var(--lx-text-2)]">
              <p className="font-bold text-[color:var(--lx-text)]">{c.workflow.previewWhat.title}</p>
              <p className="mt-1 leading-relaxed">{c.workflow.previewWhat.body}</p>
            </div>
            <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 text-xs text-[color:var(--lx-text-2)]">
              <p className="font-bold text-[color:var(--lx-text)]">{c.workflow.draftNote.title}</p>
              <p className="mt-1 leading-relaxed">{c.workflow.draftNote.body}</p>
            </div>
            <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 text-xs text-[color:var(--lx-text-2)]">
              <p className="font-bold text-[color:var(--lx-text)]">{c.workflow.publishNext.title}</p>
              <p className="mt-1 leading-relaxed">{c.workflow.publishNext.body}</p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 sm:p-4">
            <p className="font-bold">{c.moderationTitle}</p>
            <p className="mt-1 leading-relaxed">{c.moderationBody}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 text-xs text-[color:var(--lx-text-2)] sm:p-4">
            <p className="font-bold text-[color:var(--lx-text)]">{c.trustBar.title}</p>
            <p className="mt-1 leading-relaxed">{c.trustBar.body}</p>
          </div>
        </div>

        {!hydrated ? (
          <div className="mt-10 h-40 animate-pulse rounded-2xl bg-[color:var(--lx-section)]" aria-busy="true" />
        ) : (
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <section className={CARD}>
              <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.category}</h2>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.category}</p>
              <div className="mt-4">
                <label className={LABEL} htmlFor="tipoOfertaPriv">
                  {c.offerType.label}
                </label>
                <select
                  id="tipoOfertaPriv"
                  className={INPUT}
                  value={draft.offerType}
                  onChange={(e) => update({ offerType: e.target.value })}
                >
                  {(Object.keys(c.offerType.options) as string[]).map((key) => (
                    <option key={key} value={key}>
                      {c.offerType.options[key]}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className={CARD}>
              <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.main}</h2>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.main}</p>
              <div className="mt-4">
                <label className={LABEL} htmlFor="tituloPriv">
                  {c.title.label}
                </label>
                <input id="tituloPriv" className={INPUT} value={draft.titulo} onChange={(e) => update({ titulo: e.target.value })} placeholder={c.title.placeholder} />
              </div>
              <div className={`mt-4 ${GRID2}`}>
                <div>
                  <label className={LABEL} htmlFor="destinoPriv">
                    {c.destination.label}
                  </label>
                  <input id="destinoPriv" className={INPUT} value={draft.destino} onChange={(e) => update({ destino: e.target.value })} placeholder={c.destination.placeholder} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="salidaPriv">
                    {c.departureCity.label}
                  </label>
                  <input
                    id="salidaPriv"
                    className={INPUT}
                    value={draft.ciudadSalida}
                    onChange={(e) => update({ ciudadSalida: e.target.value })}
                    placeholder={c.departureCity.placeholder}
                  />
                </div>
              </div>
              <div className={`mt-4 ${GRID2}`}>
                <div>
                  <label className={LABEL} htmlFor="precioPriv">
                    {c.price.label}
                  </label>
                  <input id="precioPriv" className={INPUT} value={draft.precio} onChange={(e) => update({ precio: e.target.value })} placeholder={c.price.placeholder} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="duracionPriv">
                    {c.duration.label}
                  </label>
                  <input id="duracionPriv" className={INPUT} value={draft.duracion} onChange={(e) => update({ duracion: e.target.value })} placeholder={c.duration.placeholder} />
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="fechasPriv">
                  {c.dates.label}
                </label>
                <input id="fechasPriv" className={INPUT} value={draft.fechas} onChange={(e) => update({ fechas: e.target.value })} placeholder={c.dates.placeholder} />
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="descPriv">
                  {c.shortDescription.label}
                </label>
                <textarea id="descPriv" className={`${INPUT} min-h-[88px] resize-y`} value={draft.descripcion} onChange={(e) => update({ descripcion: e.target.value })} rows={3} />
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="incluyePriv">
                  {c.includes.label}
                </label>
                <textarea
                  id="incluyePriv"
                  className={`${INPUT} min-h-[100px] resize-y`}
                  value={draft.incluye}
                  onChange={(e) => update({ incluye: e.target.value })}
                  placeholder={c.includes.placeholder}
                  rows={4}
                />
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="politicaPriv">
                  {c.reservationPolicy.label}
                </label>
                <textarea
                  id="politicaPriv"
                  className={`${INPUT} min-h-[72px] resize-y`}
                  value={draft.politicaReserva}
                  onChange={(e) => update({ politicaReserva: e.target.value })}
                  placeholder={c.reservationPolicy.placeholder}
                  rows={2}
                />
              </div>
            </section>

            <section className={CARD}>
              <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.audience}</h2>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.audience}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {chk("famPriv", draft.familias, (v) => update({ familias: v }), a.families)}
                {chk("parPriv", draft.parejas, (v) => update({ parejas: v }), a.couples)}
                {chk("grPriv", draft.grupos, (v) => update({ grupos: v }), a.groups)}
                {chk("guiaPriv", draft.guiaEspanol, (v) => update({ guiaEspanol: v }), a.spanishGuide)}
              </div>
              <div className={`mt-4 ${GRID2}`}>
                <div>
                  <label className={LABEL} htmlFor="nPersPriv">
                    {c.peopleCount.label}
                  </label>
                  <input
                    id="nPersPriv"
                    className={INPUT}
                    value={draft.numeroPersonas}
                    onChange={(e) => update({ numeroPersonas: e.target.value })}
                    placeholder={c.peopleCount.placeholder}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="presupPriv">
                    {a.budgetTag.label}
                  </label>
                  <select id="presupPriv" className={INPUT} value={draft.presupuestoTag} onChange={(e) => update({ presupuestoTag: e.target.value })}>
                    <option value="">{a.budgetTag.empty}</option>
                    <option value="economico">{a.budgetTag.economy}</option>
                    <option value="moderado">{a.budgetTag.moderate}</option>
                    <option value="premium">{a.budgetTag.premium}</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="idiomaPriv">
                  {a.serviceLanguage.label}
                </label>
                <input id="idiomaPriv" className={INPUT} value={draft.idiomaAtencion} onChange={(e) => update({ idiomaAtencion: e.target.value })} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {chk("hotPriv", draft.incluyeHotel, (v) => update({ incluyeHotel: v }), c.includesFlags.hotel)}
                {chk("transPriv", draft.incluyeTransporte, (v) => update({ incluyeTransporte: v }), c.includesFlags.transport)}
                {chk("foodPriv", draft.incluyeComida, (v) => update({ incluyeComida: v }), c.includesFlags.food)}
              </div>
            </section>

            <section className={CARD}>
              <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.media}</h2>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.media}</p>
              <div className="mt-4">
                <label className={LABEL} htmlFor="imgUrlPriv">
                  {c.multimedia.heroUrl.label}
                </label>
                <input
                  id="imgUrlPriv"
                  className={INPUT}
                  value={draft.imagenUrl}
                  onChange={(e) => update({ imagenUrl: e.target.value })}
                  placeholder={c.multimedia.heroUrl.placeholder}
                />
              </div>
              <div className="mt-4">
                <span className={LABEL}>{c.multimedia.localFile.label}</span>
                <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.multimedia.localFile.helper}</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={onPickImageFile} />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-bold text-[color:var(--lx-text)]"
                    onClick={() => {
                      if (draft.localHeroBlobId) void viajesDraftMediaDelete("privado", draft.localHeroBlobId);
                      update({ localImageDataUrl: null, localHeroBlobId: null });
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    {c.multimedia.clearImage}
                  </button>
                </div>
                {heroPreview ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroPreview} alt="" className="max-h-56 w-full object-cover" />
                  </div>
                ) : null}
              </div>
            </section>

            <section className={CARD}>
              <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.contact}</h2>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.contact}</p>
              <div className="mt-4">
                <label className={LABEL} htmlFor="nomPriv">
                  {c.contact.displayName.label}
                </label>
                <input
                  id="nomPriv"
                  className={INPUT}
                  value={draft.displayName}
                  onChange={(e) => update({ displayName: e.target.value })}
                  placeholder={c.contact.displayName.placeholder}
                />
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="ctaPriv">
                  {c.contact.ctaType.label}
                </label>
                <select
                  id="ctaPriv"
                  className={INPUT}
                  value={draft.ctaType}
                  onChange={(e) => update({ ctaType: e.target.value as ViajesPrivadoCtaType })}
                >
                  {(Object.keys(c.contact.ctaType.options) as ViajesPrivadoCtaType[]).map((key) => (
                    <option key={key} value={key}>
                      {c.contact.ctaType.options[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`mt-4 ${GRID2}`}>
                <div>
                  <label className={LABEL} htmlFor="waPriv">
                    {c.contact.whatsapp.label}
                  </label>
                  <input id="waPriv" className={INPUT} value={draft.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} placeholder={c.contact.whatsapp.placeholder} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="telPriv">
                    {c.contact.phone.label}
                  </label>
                  <input id="telPriv" className={INPUT} value={draft.phone} onChange={(e) => update({ phone: e.target.value })} placeholder={c.contact.phone.placeholder} />
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="emailPriv">
                  {c.contact.email.label}
                </label>
                <input id="emailPriv" className={INPUT} value={draft.email} onChange={(e) => update({ email: e.target.value })} placeholder={c.contact.email.placeholder} />
              </div>
            </section>

            <section className={CARD}>
              <h2 className="text-base font-bold text-[color:var(--lx-text)]">{c.sections.publish}</h2>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.publish}</p>
              <p className="mt-3 text-sm text-[color:var(--lx-text-2)]">{c.publishModalBody}</p>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={previewHref}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[#D97706] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-105"
              >
                {c.previewCta}
              </Link>
              <button
                type="button"
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)]"
                onClick={() => setPublishOpen(true)}
              >
                {c.publishCta}
              </button>
              <button
                type="button"
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-6 text-sm font-bold text-[color:var(--lx-muted)]"
                onClick={() => {
                  if (typeof window !== "undefined" && window.confirm(lang === "en" ? "Reset all draft fields?" : "¿Restablecer todo el borrador?")) reset();
                }}
              >
                {c.resetDraft}
              </button>
            </div>
            <p className="text-center text-xs text-[color:var(--lx-muted)]">{c.ctaRowHint}</p>
          </form>
        )}
      </div>

      {publishOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-2xl">
            <h2 id={modalTitleId} className="text-lg font-bold text-[color:var(--lx-text)]">
              {c.publishModalTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.publishModalBody}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] px-4 text-sm font-bold text-[color:var(--lx-text)]"
                onClick={() => setPublishOpen(false)}
              >
                {c.publishModalDismiss}
              </button>
              <button
                type="button"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#D97706] px-5 text-sm font-bold text-white shadow-md"
                onClick={() => setPublishOpen(false)}
              >
                {c.publishModalCta}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
