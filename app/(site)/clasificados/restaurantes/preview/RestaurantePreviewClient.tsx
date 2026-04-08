"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  isRestauranteDraftPristineEmpty,
  mapRestauranteDraftToShellData,
} from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { satisfiesRestauranteMinimumValidPreview } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
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
      <RestaurantesShellChrome lang="es">
        <div className="mx-auto max-w-xl px-4 py-24 text-center text-[color:var(--lx-muted)]">Cargando vista previa…</div>
      </RestaurantesShellChrome>
    );
  }

  if (pristine) {
    return (
      <RestaurantesShellChrome lang="es">
        <div className="mx-auto max-w-lg px-4 py-20 sm:py-28">
          <div className="rounded-[24px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-8 py-12 text-center shadow-[0_24px_80px_-32px_rgba(42,36,22,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Vista previa</p>
            <h1 className="mt-3 text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">Aún no hay datos del anuncio</h1>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
              Completa el formulario de publicación para ver cómo se verá tu restaurante para los compradores. Solo los campos
              que llenes aparecerán en la página.
            </p>
            <Link
              href={EDIT_HREF}
              className="mt-8 inline-flex rounded-full bg-[color:var(--lx-cta-dark)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              Volver a editar
            </Link>
          </div>
        </div>
      </RestaurantesShellChrome>
    );
  }

  return (
    <RestaurantesShellChrome lang="es">
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 pt-4 md:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={EDIT_HREF}
            className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            ← Volver a editar
          </Link>
          {!minOk ? (
            <p className="text-xs text-[color:var(--lx-muted)] sm:text-right">
              Borrador incompleto: faltan campos para una vista previa publicable mínima (nombre, tipo, cocina, resumen,
              ciudad, foto principal, contacto y horario).
            </p>
          ) : (
            <p className="text-xs font-medium text-emerald-800 sm:text-right">Vista previa mínima lista (borrador).</p>
          )}
        </div>
        {minOk ? (
          <div className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">Publicar en Clasificados</p>
            <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">
              Misma información que esta vista previa. Requiere Supabase configurado en el servidor para persistir.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
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
        <div
          className="rounded-2xl border border-[color:var(--lx-gold-border)]/40 bg-[color:var(--lx-section)] px-4 py-3 text-xs leading-relaxed text-[color:var(--lx-text-2)] sm:px-5 sm:text-sm"
          role="note"
        >
          <p className="font-semibold text-[color:var(--lx-text)]">Cómo funciona esta vista</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 marker:text-[color:var(--lx-gold)]">
            <li>
              Solo aparecen bloques con datos: los campos vacíos no generan secciones vacías ni texto de relleno.
            </li>
            <li>
              El borrador es el de esta sesión (misma pestaña): texto, medios y orden de galería coinciden con lo que
              guardaste al editar. Si cierras la pestaña o el navegador, el borrador de esta sesión ya no estará disponible.
            </li>
          </ul>
        </div>
      </div>
      <RestauranteDetailShell data={shellData} />
    </RestaurantesShellChrome>
  );
}
