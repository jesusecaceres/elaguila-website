"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  isRestauranteDraftPristineEmpty,
  mapRestauranteDraftToShellData,
} from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import {
  auditRestaurantePublishReadiness,
  auditRestaurantePublishMediaReadinessSafe,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { buildRestaurantePublishPayload } from "@/app/clasificados/restaurantes/application/buildRestaurantePublishPayload";
import { resolveRestauranteDraftMediaToRemoteUrls } from "@/app/clasificados/restaurantes/application/restauranteDraftPublishPrepare";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteAdStoryPreview } from "@/app/clasificados/restaurantes/shell/RestauranteAdStoryPreview";
import { RestaurantePreviewCard } from "@/app/clasificados/restaurantes/shell/RestaurantePreviewCard";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { RestauranteOfertasLocalesUpsellCard } from "@/app/lib/clasificados/restaurantes/RestauranteOfertasLocalesUpsellCard";
import { supabase } from "@/app/lib/supabaseClient";
// Leonix premium visual tokens

const LEONIX_PAGE_BG = "#F4F1EB";
const LEONIX_CARD_SURFACE = "#FFFAF3";
const LEONIX_BORDER = "#D8C2A0";
const LEONIX_PRIMARY_TEXT = "#1F1A17";
const LEONIX_SECONDARY_TEXT = "#5A5148";
const LEONIX_MUTED_TEXT = "#8B7E70";
const LEONIX_GOLD_ACCENT = "#BEA98E";
const LEONIX_DARK_CTA = "#2C1810";
const LEONIX_SUCCESS_GREEN = "#1A4D2E";
const LEONIX_INFO_BLUE = "#355C7D";
const LEONIX_ELEVATED_CHIP = "#F6EBDD";

const EDIT_HREF = "/publicar/restaurantes";

export default function RestaurantePreviewClient() {
  const searchParams = useSearchParams();
  const { hydrated, draft } = useRestauranteDraft({ resolveMediaOnLoad: true });
  const [pub, setPub] = useState<{
    busy: boolean;
    url?: string;
    resultsUrl?: string;
    dashboardUrl?: string;
    err?: string;
    errDetail?: string;
    persisted?: boolean;
  }>({ busy: false });

  const [confirmBusinessInfo, setConfirmBusinessInfo] = useState(false);
  const [confirmPhotosRepresent, setConfirmPhotosRepresent] = useState(false);
  const [confirmCommunityRules, setConfirmCommunityRules] = useState(false);
  const confirmationsOk = confirmBusinessInfo && confirmPhotosRepresent && confirmCommunityRules;

  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const pristine = useMemo(() => isRestauranteDraftPristineEmpty(draft), [draft]);
  const shellData = useMemo(() => mapRestauranteDraftToShellData(draft, { lang }), [draft, lang]);

  const publishPlan = searchParams?.get("plan") === "pro" ? "pro" : undefined;
  /** Same normalized shape as storage/API merge — matches what the preview shell maps from (not the POST sanitizer). */
  const normalizedDraft = useMemo(() => mergeRestauranteDraft(draft), [draft]);
  const readiness = useMemo(() => auditRestaurantePublishReadiness(normalizedDraft), [normalizedDraft]);
  const minOk = readiness.readyToPublish;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("[restaurantes/preview] publish readiness audit", readiness, {
      media: auditRestaurantePublishMediaReadinessSafe(normalizedDraft),
    });
  }, [readiness, normalizedDraft]);

  const onPublish = useCallback(async () => {
    if (!confirmBusinessInfo || !confirmPhotosRepresent || !confirmCommunityRules) {
      setPub({
        busy: false,
        err: "confirmations_required",
        errDetail: "Marca las tres confirmaciones antes de publicar.",
      });
      return;
    }
    setPub({ busy: true, err: undefined, errDetail: undefined });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const owner_user_id = auth?.user?.id;

      /** Convert local `data:image/*` refs to HTTPS via Blob upload so transport validation matches preview. */
      let draftForPublish = normalizedDraft;
      try {
        draftForPublish = await resolveRestauranteDraftMediaToRemoteUrls(normalizedDraft);
      } catch (e) {
        setPub({
          busy: false,
          err: "media_upload_failed",
          errDetail:
            e instanceof Error
              ? e.message
              : "No se pudieron subir las imágenes. Comprueba la conexión y que el almacenamiento (BLOB_READ_WRITE_TOKEN) esté configurado en el servidor.",
        });
        return;
      }

      /** Canonical full draft (same merge as API + readiness), never shell/card view model. */
      const publishPayload = buildRestaurantePublishPayload(draftForPublish, owner_user_id, publishPlan, "es");
      
      // DEVELOPMENT DEBUG: Trace exact POST body
      if (process.env.NODE_ENV === 'development') {
        const payloadStr = JSON.stringify(publishPayload, null, 2);
        const payloadSize = new Blob([payloadStr]).size;
        
        console.log('🔍 GATE 1: REAL POST BODY TRACE');
        console.log('Final payload byte size:', `${(payloadSize / 1024).toFixed(2)} KB`);
        console.log('Top-level keys:', Object.keys(publishPayload));
        
        // Check for blocked media signatures
        const containsBlockedSignatures = payloadStr.includes('data:image/') || 
                                         payloadStr.includes('data:video/') || 
                                         payloadStr.includes('blob:') ||
                                         payloadStr.includes('File') ||
                                         payloadStr.includes('Blob') ||
                                         payloadStr.includes('arrayBuffer') ||
                                         payloadStr.includes('originFileObj');
        
        console.log('Contains blocked signatures:', containsBlockedSignatures);
        
        // Count media arrays (`Record<string, unknown>` — use Array.isArray for dev log only)
        const mediaArrays = {
          galleryImages: Array.isArray(publishPayload.galleryImages) ? publishPayload.galleryImages.length : 0,
          interiorImages: Array.isArray(publishPayload.interiorImages) ? publishPayload.interiorImages.length : 0,
          foodImages: Array.isArray(publishPayload.foodImages) ? publishPayload.foodImages.length : 0,
          exteriorImages: Array.isArray(publishPayload.exteriorImages) ? publishPayload.exteriorImages.length : 0,
          featuredDishes: Array.isArray(publishPayload.featuredDishes) ? publishPayload.featuredDishes.length : 0,
        };
        console.log('Media array counts:', mediaArrays);
        
        // Check for oversized strings
        const oversizedStrings: { path: string; length: number; preview: string }[] = [];
        function checkForOversizedStrings(obj: any, path = '') {
          if (typeof obj === 'string' && obj.length > 1000) {
            oversizedStrings.push({ path, length: obj.length, preview: obj.substring(0, 100) });
          } else if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
              checkForOversizedStrings(obj[key], path ? `${path}.${key}` : key);
            });
          }
        }
        checkForOversizedStrings(publishPayload);
        
        if (oversizedStrings.length > 0) {
          console.log('⚠️ OVERSIZED STRINGS FOUND:', oversizedStrings);
        } else {
          console.log('✅ No oversized strings detected');
        }
        
        console.log('--- END POST BODY TRACE ---');
      }
      
      // Hard client guard: check payload size before sending (1MB conservative limit)
      const payloadSize = new Blob([JSON.stringify(publishPayload)]).size;
      const maxSize = 1 * 1024 * 1024; // 1 MB conservative limit
      
      if (payloadSize > maxSize) {
        setPub({
          busy: false,
          err: "payload_too_large",
          errDetail: `Publish payload is still too large. Only metadata should be sent. Current size: ${(payloadSize / 1024).toFixed(1)} KB, limit: 1 MB`,
        });
        return;
      }
      
      const res = await fetch("/api/clasificados/restaurantes/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishPayload),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        publicUrl?: string | null;
        resultsUrl?: string;
        dashboardUrl?: string;
        error?: string;
        detail?: string;
        persisted?: boolean;
      };
      if (!res.ok || !j.ok) {
        setPub({
          busy: false,
          err: j.error ?? "publish_failed",
          errDetail: typeof j.detail === "string" ? j.detail : undefined,
        });
        return;
      }
      setPub({
        busy: false,
        url: j.publicUrl ?? undefined,
        resultsUrl: j.resultsUrl,
        dashboardUrl: j.dashboardUrl,
        persisted: j.persisted ?? true,
        err: undefined,
        errDetail: undefined,
      });
    } catch {
      setPub({ busy: false, err: "network" });
    }
  }, [
    normalizedDraft,
    publishPlan,
    confirmBusinessInfo,
    confirmPhotosRepresent,
    confirmCommunityRules,
  ]);

  if (!hydrated) {
    return (
      <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center text-[color:var(--lx-muted)]">Cargando vista previa…</div>
      </RestaurantesShellChrome>
    );
  }

  if (pristine) {
    return (
      <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
        <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
          <div className="rounded-[24px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-8 py-12 text-center shadow-[0_24px_80px_-32px_rgba(42,36,22,0.12)]">
            <h1 className="text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">Aún no hay datos del anuncio</h1>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
              Completa el formulario de publicación para ver cómo se verá tu restaurante. Solo los campos que llenes aparecerán
              en la página. Usa <strong className="text-[color:var(--lx-text)]">Volver a editar</strong> arriba.
            </p>
          </div>
        </div>
      </RestaurantesShellChrome>
    );
  }

  return (
    <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 pb-16 pt-2 md:px-5 lg:px-6">
        <details className="rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/50 px-4 py-3 text-sm text-[color:var(--lx-text-2)]">
          <summary className="cursor-pointer select-none font-semibold text-[color:var(--lx-text)]">
            Publicar y ayuda de sesión
          </summary>
          <div className="mt-3 space-y-3 border-t border-[color:var(--lx-nav-border)]/60 pt-3">
            {!minOk ? (
              <div className="text-xs text-[color:var(--lx-muted)] space-y-1">
                <p>Borrador incompleto para publicar.</p>
                {readiness.missingFields.length > 0 ? (
                  <p className="font-medium text-[color:var(--lx-text-2)]">
                    Falta: {readiness.missingFields.join(", ")}.
                  </p>
                ) : (
                  <p>Revisa nombre, tipo, cocina, ciudad, imagen, contacto y horario.</p>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-emerald-800">Listo para publicar borrador (validación mínima OK).</p>
            )}
            <p className="text-xs leading-relaxed">
              El borrador vive en esta sesión del navegador: se mantiene al volver y al actualizar en la misma pestaña. Al cerrar
              la pestaña se descarta.
            </p>
            {minOk ? (
              <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-3">
                <p className="text-xs font-semibold text-[color:var(--lx-text)]">Publicar en Clasificados</p>
                <p className="mt-1 text-[11px] text-[color:var(--lx-text-2)]">
                  El servidor debe tener `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`; si falta, verás error 503 y no
                  se guardará nada.
                </p>
                <RestauranteOfertasLocalesUpsellCard lang={lang} />
                <div className="mt-3 space-y-2 border-t border-[color:var(--lx-nav-border)]/50 pt-3">
                  <p className="text-[11px] font-semibold text-[color:var(--lx-text)]">Confirmaciones antes de publicar</p>
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[color:var(--lx-text-2)]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                      checked={confirmBusinessInfo}
                      onChange={(e) => setConfirmBusinessInfo(e.target.checked)}
                    />
                    <span>Confirmo que la información del negocio es correcta y está actualizada.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[color:var(--lx-text-2)]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                      checked={confirmPhotosRepresent}
                      onChange={(e) => setConfirmPhotosRepresent(e.target.checked)}
                    />
                    <span>Confirmo que las fotos y videos representan este restaurante o negocio.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[color:var(--lx-text-2)]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                      checked={confirmCommunityRules}
                      onChange={(e) => setConfirmCommunityRules(e.target.checked)}
                    />
                    <span>Confirmo que el anuncio respeta las reglas de la comunidad y del marketplace.</span>
                  </label>
                  {!confirmationsOk ? (
                    <p className="text-[11px] text-amber-900/90">Marca las tres casillas para habilitar «Publicar listado».</p>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={pub.busy || !confirmationsOk}
                    title={!confirmationsOk ? "Marca las tres confirmaciones para publicar." : undefined}
                    onClick={() => void onPublish()}
                    className="min-h-[44px] rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pub.busy ? "Publicando…" : "Publicar listado"}
                  </button>
                  {pub.url ? (
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <Link
                        href={appendLangToPath(pub.url, "es")}
                        className="text-sm font-semibold text-[color:var(--lx-gold)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4"
                      >
                        Abrir ficha pública →
                      </Link>
                      {pub.resultsUrl ? (
                        <Link
                          href={pub.resultsUrl}
                          className="text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-nav-border)] underline-offset-4"
                        >
                          Ver en resultados (misma búsqueda) →
                        </Link>
                      ) : null}
                      {pub.dashboardUrl ? (
                        <Link
                          href={pub.dashboardUrl}
                          className="text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-nav-border)] underline-offset-4"
                        >
                          Mi panel de restaurantes →
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {pub.err ? (
                  <div className="mt-2 text-xs text-red-800">
                    <p>
                      {pub.err === "not_ready"
                        ? "Aún no está listo."
                        : pub.err === "confirmations_required"
                          ? "Faltan confirmaciones."
                          : pub.err === "network"
                            ? "Error de red."
                            : pub.err === "media_upload_failed"
                              ? "No se pudieron preparar las fotos para publicar (subida a almacenamiento)."
                              : pub.err === "supabase_admin_unconfigured"
                              ? "Servidor sin credenciales de Supabase (rol de servicio). No se persistió nada."
                              : `No se pudo publicar (${pub.err}).`}
                    </p>
                    {pub.errDetail ? <p className="mt-1 font-mono text-[11px] opacity-90">{pub.errDetail}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </details>

        <ClasificadosPreviewAdCanvas>
          {/* Section 1: Vista previa de la tarjeta */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold text-[#1F1A17] mb-3 tracking-tight"
                style={{ color: LEONIX_PRIMARY_TEXT }}
              >
                1. Vista previa de la tarjeta
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                Así se verá tu anuncio en resultados, búsquedas y tarjetas destacadas.
              </p>
            </div>
            <div
              className="rounded-3xl border p-4 shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] sm:p-6 md:p-8"
              style={{
                background: LEONIX_CARD_SURFACE,
                borderColor: LEONIX_BORDER,
              }}
            >
              <RestaurantePreviewCard
                data={shellData}
                className="mx-auto w-full max-w-6xl"
              />
            </div>
          </div>
          
          {/* Section 2: Vista previa completa del anuncio */}
          <div>
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold text-[#1F1A17] mb-3 tracking-tight"
                style={{ color: LEONIX_PRIMARY_TEXT }}
              >
                2. Vista previa completa del anuncio
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                Así se verá tu anuncio cuando una persona abra la publicación completa.
              </p>
            </div>
            <div 
              className="rounded-3xl border p-8 shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)]"
              style={{ 
                background: LEONIX_CARD_SURFACE, 
                borderColor: LEONIX_BORDER 
              }}
            >
              <RestauranteAdStoryPreview data={shellData} lang={lang} />
            </div>
          </div>
        </ClasificadosPreviewAdCanvas>
      </div>
    </RestaurantesShellChrome>
  );
}
