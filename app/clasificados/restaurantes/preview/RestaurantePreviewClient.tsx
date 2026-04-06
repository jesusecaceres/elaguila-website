"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  isRestauranteDraftPristineEmpty,
  mapRestauranteDraftToShellData,
} from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { satisfiesRestauranteMinimumValidPreview } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { RestauranteDetailShell } from "@/app/clasificados/restaurantes/shell/RestauranteDetailShell";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";

const EDIT_HREF = "/publicar/restaurantes";

export default function RestaurantePreviewClient() {
  const { hydrated, draft } = useRestauranteDraft();

  const pristine = useMemo(() => isRestauranteDraftPristineEmpty(draft), [draft]);
  const shellData = useMemo(() => mapRestauranteDraftToShellData(draft), [draft]);
  const minOk = useMemo(() => satisfiesRestauranteMinimumValidPreview(draft), [draft]);

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
      <div className="mx-auto max-w-[1280px] px-4 pt-4 md:px-5 lg:px-6">
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
      </div>
      <RestauranteDetailShell data={shellData} />
    </RestaurantesShellChrome>
  );
}
