"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";

import { useViajesLocalHeroObjectUrl } from "@/app/(site)/clasificados/viajes/lib/useViajesLocalHeroObjectUrl";
import { newViajesDraftMediaId, viajesDraftMediaDelete, viajesDraftMediaPut } from "@/app/(site)/clasificados/viajes/lib/viajesDraftMediaIdb";

import { ViajesDateRangeFields } from "../../components/ViajesDateRangeFields";
import { getPublicarViajesPrivadoCopy } from "../data/publicarViajesPrivadoCopy";
import {
  mergeViajesPrivadoDraftFromPartial,
  VIAJES_PRIVADO_GALLERY_MAX,
  VIAJES_PRIVADO_MAX_IMAGE_STORAGE,
} from "../lib/viajesPrivadoDraftDefaults";
import { useViajesPrivadoDraft } from "../lib/useViajesPrivadoDraft";
import type { ViajesPrivadoDraft, ViajesPrivadoCtaType } from "../lib/viajesPrivadoDraftTypes";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid gap-4 sm:grid-cols-2";

export function ViajesPrivadoApplicationShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const c = getPublicarViajesPrivadoCopy(lang);
  const { draft, update, reset, hydrated, setDraft } = useViajesPrivadoDraft();
  const stagedIdFromUrl = (sp?.get("stagedId") ?? "").trim();
  const [stagedBootstrapErr, setStagedBootstrapErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !stagedIdFromUrl) {
      setStagedBootstrapErr(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setStagedBootstrapErr(null);
      try {
        const sb = createSupabaseBrowserClient();
        const sess = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        const token = sess.data.session?.access_token;
        if (!token) {
          if (!cancelled) setStagedBootstrapErr(lang === "en" ? "Sign in to load this submission." : "Inicia sesión para cargar este envío.");
          return;
        }
        const res = await fetch(`/api/clasificados/viajes/staged-owner?id=${encodeURIComponent(stagedIdFromUrl)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { ok?: boolean; row?: { listing_json?: { privado?: ViajesPrivadoDraft } }; error?: string };
        if (!res.ok || !json.ok || !json.row?.listing_json?.privado) {
          if (!cancelled) setStagedBootstrapErr(json.error ?? (lang === "en" ? "Could not load submission." : "No se pudo cargar el envío."));
          return;
        }
        if (!cancelled) setDraft(mergeViajesPrivadoDraftFromPartial(json.row.listing_json.privado));
      } catch {
        if (!cancelled) setStagedBootstrapErr(lang === "en" ? "Network error." : "Error de red.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, lang, setDraft, stagedIdFromUrl]);
  const heroBlobUrl = useViajesLocalHeroObjectUrl("privado", draft.localHeroBlobId);
  const [publishOpen, setPublishOpen] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const modalTitleId = useId();

  const BLOB_PATH_BYTES = 360_000;

  async function submitStagedReview() {
    if (!hydrated || submitBusy) return;
    setSubmitBusy(true);
    try {
      let session: { access_token?: string } | null = null;
      try {
        const sb = createSupabaseBrowserClient();
        const res = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        session = res.data.session;
      } catch {
        session = null;
      }
      if (!session?.access_token) {
        router.push(`/login?redirect=${encodeURIComponent(`/publicar/viajes/privado${stagedIdFromUrl ? `?stagedId=${encodeURIComponent(stagedIdFromUrl)}` : ""}${lang === "en" ? "&lang=en" : ""}`)}`);
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };
      const res = await fetch("/api/clasificados/viajes/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          lane: "private",
          lang,
          privadoDraft: draft,
          ...(stagedIdFromUrl ? { stagedListingId: stagedIdFromUrl } : {}),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; slug?: string; id?: string };
      if (!res.ok || !json.ok) {
        const code = json.error ?? "unknown";
        if (code === "auth_required") {
          router.push(`/login?redirect=${encodeURIComponent(`/publicar/viajes/privado${stagedIdFromUrl ? `?stagedId=${encodeURIComponent(stagedIdFromUrl)}` : ""}`)}`);
          return;
        }
        if (code === "supabase_not_configured") {
          window.alert(
            lang === "en"
              ? "Server persistence is not configured (Supabase)."
              : "No está configurada la persistencia en servidor (Supabase)."
          );
        } else {
          window.alert(lang === "en" ? `Could not submit: ${code}` : `No se pudo enviar: ${code}`);
        }
        return;
      }
      const q = new URLSearchParams({ slug: String(json.slug), id: String(json.id), lane: "private", lang });
      setPublishOpen(false);
      router.push(`/publicar/viajes/enviado?${q.toString()}`);
    } catch {
      window.alert(lang === "en" ? "Network error while submitting." : "Error de red al enviar.");
    } finally {
      setSubmitBusy(false);
    }
  }

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  const branchHref = appendLangToPath("/publicar/viajes", lang);
  const negociosHref = appendLangToPath("/publicar/viajes/negocios", lang);
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

  function onGalleryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    if (draft.galeriaUrls.length >= VIAJES_PRIVADO_GALLERY_MAX) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result ?? "");
      if (r.length > 120_000) {
        window.alert(
          lang === "en" ? "Image too large. Use a URL or a smaller file." : "Imagen demasiado grande. Usa una URL o un archivo más pequeño."
        );
        return;
      }
      update({ galeriaUrls: [...draft.galeriaUrls, r] });
    };
    reader.readAsDataURL(file);
  }

  function addGalleryUrl() {
    if (draft.galeriaUrls.length >= VIAJES_PRIVADO_GALLERY_MAX) return;
    const raw =
      typeof window !== "undefined"
        ? window.prompt(lang === "en" ? "Paste image URL" : "Pega URL de imagen")
        : null;
    const u = raw?.trim();
    if (!u) return;
    update({ galeriaUrls: [...draft.galeriaUrls, u] });
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
          {stagedIdFromUrl ? (
            <p className="mt-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-3 py-2 text-xs leading-relaxed text-sky-950">
              {lang === "en"
                ? "You are editing a saved private submission from your dashboard. Submitting updates the same record and returns it to internal review."
                : "Estás editando un envío particular guardado desde tu panel. Al enviar se actualiza el mismo registro y vuelve a revisión interna."}
            </p>
          ) : null}
          {stagedBootstrapErr ? <p className="mt-2 text-xs font-semibold text-rose-800">{stagedBootstrapErr}</p> : null}
          <div className="mt-5 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 to-[color:var(--lx-card)] p-4 shadow-sm">
            <p className="text-sm font-bold text-[color:var(--lx-text)]">{c.recovery.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{c.recovery.wrongLaneBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={negociosHref}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] shadow-sm hover:bg-[color:var(--lx-nav-hover)]"
              >
                {c.recovery.goNegocios}
              </Link>
              <Link
                href={branchHref}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-dashed border-emerald-400/60 bg-[color:var(--lx-section)]/60 px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                {c.recovery.hubViajes}
              </Link>
            </div>
          </div>
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

              <div className="mt-6 space-y-3 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/35 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.multimedia.blocks.hero}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                      draft.heroSourceMode === "url"
                        ? "border-[#D97706] bg-[#D97706]/12"
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
                        ? "border-[#D97706] bg-[#D97706]/12"
                        : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
                    }`}
                    onClick={() => update({ heroSourceMode: "file", imagenUrl: "" })}
                  >
                    {c.multimedia.tabFile}
                  </button>
                </div>
                {draft.heroSourceMode === "url" ? (
                  <div>
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
                ) : (
                  <div>
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
                  </div>
                )}
                {heroPreview ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)]">
                    { }
                    <img src={heroPreview} alt="" className="max-h-56 w-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/35 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.multimedia.blocks.gallery}</p>
                <p className="text-xs text-[color:var(--lx-muted)]">{c.multimedia.gallery.helper}</p>
                <p className="text-[11px] font-semibold text-[color:var(--lx-muted)]">{c.multimedia.galleryMaxNote}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-xl bg-[#D97706] px-3 py-2 text-xs font-bold text-white" onClick={addGalleryUrl}>
                    {c.multimedia.galleryAddUrl}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-bold"
                    onClick={() => galleryFileRef.current?.click()}
                  >
                    {c.multimedia.galleryAddFile}
                  </button>
                  <input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={onGalleryFile} />
                </div>
                <ul className="space-y-2">
                  {draft.galeriaUrls.map((url, idx) => (
                    <li key={`g-${idx}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-2">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[color:var(--lx-nav-border)] bg-black/5">
                        { }
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-xs text-[color:var(--lx-muted)]">
                        {url.startsWith("data:") ? (lang === "en" ? "Local image" : "Imagen local") : url}
                      </span>
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
              <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/50 p-3 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
                {c.contactUx.ctaExplain}
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
                  <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{c.contactUx.whatsappHint}</p>
                </div>
                <div>
                  <label className={LABEL} htmlFor="telPriv">
                    {c.contact.phone.label}
                  </label>
                  <input id="telPriv" className={INPUT} value={draft.phone} onChange={(e) => update({ phone: e.target.value })} placeholder={c.contact.phone.placeholder} />
                </div>
              </div>
              <div className="mt-4">
                <label className={LABEL} htmlFor="telOffPriv">
                  {c.contact.phoneOffice.label}
                </label>
                <input id="telOffPriv" className={INPUT} value={draft.phoneOffice} onChange={(e) => update({ phoneOffice: e.target.value })} placeholder={c.contact.phoneOffice.placeholder} />
              </div>
              <div className={`mt-4 ${GRID2}`}>
                <div>
                  <label className={LABEL} htmlFor="emailPriv">
                    {c.contact.email.label}
                  </label>
                  <input id="emailPriv" type="email" className={INPUT} value={draft.email} onChange={(e) => update({ email: e.target.value })} placeholder={c.contact.email.placeholder} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="webPriv">
                    {c.contact.website.label}
                  </label>
                  <input id="webPriv" className={INPUT} value={draft.website} onChange={(e) => update({ website: e.target.value })} placeholder={c.contact.website.placeholder} />
                  <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{c.contactUx.websiteHint}</p>
                </div>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{c.socialSection}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor="sfPr">
                    {c.socialFacebook.label}
                  </label>
                  <input id="sfPr" className={INPUT} value={draft.socialFacebook} onChange={(e) => update({ socialFacebook: e.target.value })} placeholder="https://…" />
                </div>
                <div>
                  <label className={LABEL} htmlFor="siPr">
                    {c.socialInstagram.label}
                  </label>
                  <input id="siPr" className={INPUT} value={draft.socialInstagram} onChange={(e) => update({ socialInstagram: e.target.value })} placeholder="https://…" />
                </div>
                <div>
                  <label className={LABEL} htmlFor="stPr">
                    {c.socialTiktok.label}
                  </label>
                  <input id="stPr" className={INPUT} value={draft.socialTiktok} onChange={(e) => update({ socialTiktok: e.target.value })} placeholder="https://…" />
                </div>
                <div>
                  <label className={LABEL} htmlFor="syPr">
                    {c.socialYoutube.label}
                  </label>
                  <input id="syPr" className={INPUT} value={draft.socialYoutube} onChange={(e) => update({ socialYoutube: e.target.value })} placeholder="https://…" />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL} htmlFor="sxPr">
                    {c.socialTwitter.label}
                  </label>
                  <input id="sxPr" className={INPUT} value={draft.socialTwitter} onChange={(e) => update({ socialTwitter: e.target.value })} placeholder="https://…" />
                </div>
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
                disabled={submitBusy}
              >
                {c.publishModalDismiss}
              </button>
              <button
                type="button"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#D97706] px-5 text-sm font-bold text-white shadow-md disabled:opacity-60"
                onClick={() => void submitStagedReview()}
                disabled={submitBusy || !hydrated}
              >
                {submitBusy ? c.publishModalSubmitting : c.publishModalSubmitReview}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
