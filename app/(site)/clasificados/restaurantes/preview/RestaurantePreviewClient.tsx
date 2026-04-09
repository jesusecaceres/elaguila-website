"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  isRestauranteDraftPristineEmpty,
  mapRestauranteDraftToShellData,
} from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { satisfiesRestauranteMinimumValidPreview } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteDetailShell } from "@/app/clasificados/restaurantes/shell/RestauranteDetailShell";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";
import { supabase } from "@/app/lib/supabaseClient";

const EDIT_HREF = "/publicar/restaurantes";

export default function RestaurantePreviewClient() {
  const { hydrated, draft } = useRestauranteDraft();
  const [pub, setPub] = useState<{ busy: boolean; url?: string; err?: string; persisted?: boolean }>({ busy: false });

  const pristine = useMemo(() => isRestauranteDraftPristineEmpty(draft), [draft]);
  const shellData = useMemo(() => mapRestauranteDraftToShellData(draft), [draft]);
  const minOk = useMemo(() => satisfiesRestauranteMinimumValidPreview(draft), [draft]);

  const onPublish = useCallback(async () => {
    setPub({ busy: true });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const owner_user_id = auth?.user?.id;
      const res = await fetch("/api/clasificados/restaurantes/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, ...(owner_user_id ? { owner_user_id } : {}) }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        publicUrl?: string;
        error?: string;
        persisted?: boolean;
      };
      if (!res.ok || !j.ok) {
        setPub({ busy: false, err: j.error ?? "publish_failed" });
        return;
      }
      setPub({ busy: false, url: j.publicUrl, persisted: j.persisted, err: undefined });
    } catch {
      setPub({ busy: false, err: "network" });
    }
  }, [draft]);

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
              <p className="text-xs text-[color:var(--lx-muted)]">
                Borrador incompleto para publicar: faltan campos mínimos (nombre, tipo, cocina, resumen, ciudad, imagen
                principal o primera de galería, al menos un contacto y señal de horario).
              </p>
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
                  Requiere Supabase en el servidor para persistir en resultados y ficha pública.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={pub.busy}
                    onClick={() => void onPublish()}
                    className="min-h-[44px] rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] disabled:opacity-50"
                  >
                    {pub.busy ? "Publicando…" : "Publicar listado"}
                  </button>
                  {pub.url ? (
                    <Link
                      href={pub.url}
                      className="text-sm font-semibold text-[color:var(--lx-gold)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4"
                    >
                      Abrir anuncio público →
                    </Link>
                  ) : null}
                </div>
                {pub.err ? (
                  <p className="mt-2 text-xs text-red-700">
                    {pub.err === "not_ready"
                      ? "Aún no está listo."
                      : pub.err === "network"
                        ? "Error de red."
                        : `No se pudo publicar (${pub.err}).`}
                  </p>
                ) : null}
                {pub.persisted === false && pub.url ? (
                  <p className="mt-2 text-xs text-[color:var(--lx-muted)]">
                    Slug generado localmente; conecta Supabase para guardar en resultados y detalle público.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </details>

        <ClasificadosPreviewAdCanvas>
          <RestauranteDetailShell data={shellData} />
        </ClasificadosPreviewAdCanvas>
      </div>
    </RestaurantesShellChrome>
  );
}
