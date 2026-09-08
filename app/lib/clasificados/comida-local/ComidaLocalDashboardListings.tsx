"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { ComidaLocalDashboardListingVm } from "./mapComidaLocalDashboardListing";
import {
  editListingLabel,
  publicViewLabel,
  pauseListingLabel,
  resumeListingLabel,
} from "@/app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools";
import { getOwnerEntityCapabilities, isLiveCapability } from "@/app/(site)/dashboard/lib/ownerEntityCapabilityRegistry";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass } from "@/app/(site)/dashboard/lib/listingDisplayStatus";
import { OwnerEntityWorkspace } from "@/app/(site)/dashboard/components/OwnerEntityWorkspace";
import type { ActionItem } from "@/app/(site)/dashboard/components/DashboardListingActionBar";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  items: ComidaLocalDashboardListingVm[];
  showEmpty?: boolean;
  /** Globalization Package A Gate 5 — re-fetch hook after a pause/resume mutation. */
  onLifecycleChanged?: () => void | Promise<void>;
};

export function ComidaLocalDashboardListings({ lang, items, showEmpty = false, onLifecycleChanged }: Props) {
  const q = `lang=${lang}`;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const capabilities = getOwnerEntityCapabilities("comida-local");

  const t =
    lang === "es"
      ? {
          emptyTitle: "Comida Local",
          empty: "Todavía no tienes publicaciones de Comida Local.",
          emptyHelp: "Tus puestos, pop-ups o vendedores locales publicados.",
          publish: "Publicar Comida Local",
          moreOptions: "Más opciones",
          moreOptionsClose: "Cerrar",
          foodType: "Tipo",
          city: "Ciudad",
          published: "Publicado",
          payment: "Pago",
          contact: "Contacto",
          eyebrow: "Comida local",
        }
      : {
          emptyTitle: "Comida Local",
          empty: "You do not have any Comida Local listings yet.",
          emptyHelp: "Your published food stands, pop-ups, and local vendors.",
          publish: "Publish Comida Local",
          moreOptions: "More options",
          moreOptionsClose: "Close",
          foodType: "Type",
          city: "City",
          published: "Published",
          payment: "Payment",
          contact: "Contact",
          eyebrow: "Local food",
        };

  async function mutateLifecycle(listingId: string, action: "pause" | "resume") {
    setActionError(null);
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setActionError(lang === "es" ? "Inicia sesión de nuevo para continuar." : "Sign in again to continue.");
      return;
    }
    setBusyId(listingId);
    try {
      const res = await fetch("/api/clasificados/comida-local/lifecycle", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, action }),
      });
      if (!res.ok) {
        setActionError(
          lang === "es"
            ? "No se pudo actualizar el anuncio. Inténtalo de nuevo."
            : "Could not update the listing. Please try again.",
        );
        return;
      }
      await onLifecycleChanged?.();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0 && showEmpty) {
    return (
      <section className="mt-8 rounded-3xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 shadow-[0_10px_32px_-16px_rgba(31,36,28,0.1)]">
        <h2 className="font-serif text-2xl font-semibold text-[#1F241C]">{t.emptyTitle}</h2>
        <p className="mt-2 text-sm text-[#5C5346]">{t.empty}</p>
        <p className="mt-1 text-xs text-[#7A7164]">{t.emptyHelp}</p>
        <a
          href={`/publicar/comida-local?${q}`}
          className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFCF7]"
        >
          {t.publish}
        </a>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-4">
      {items.map((item) => {
        const uiStatus = resolveListingUiStatus({ status: item.status });
        const busy = busyId === item.id;
        const editHref = `/publicar/comida-local?edit=1&listingId=${encodeURIComponent(item.id)}&source=dashboard&${q}`;
        const detailItems = [
          item.foodTypeLabel ? { label: t.foodType, value: item.foodTypeLabel } : null,
          item.cityLabel ? { label: t.city, value: item.cityLabel } : null,
          item.publishedAtLabel ? { label: t.published, value: item.publishedAtLabel } : null,
          item.paymentStatusLabel ? { label: t.payment, value: item.paymentStatusLabel } : null,
          item.primaryContactLabel ? { label: t.contact, value: item.primaryContactLabel } : null,
        ].filter((x): x is { label: string; value: string } => x !== null);

        const quickActions: ActionItem[] = [];
        if (isLiveCapability(capabilities.identity.publicView) && item.publicPath) {
          quickActions.push({ href: `${item.publicPath}?${q}`, label: publicViewLabel(lang), tone: "secondary" });
        }

        const lifecycleActions: ActionItem[] = [];
        if (isLiveCapability(capabilities.lifecycle.pause) && item.status === "published") {
          lifecycleActions.push({
            label: busy ? (lang === "es" ? "Pausando…" : "Pausing…") : pauseListingLabel(lang),
            onClick: () => void mutateLifecycle(item.id, "pause"),
            disabled: busy,
            tone: "warning",
          });
        }
        if (isLiveCapability(capabilities.lifecycle.reactivate) && item.status === "paused") {
          lifecycleActions.push({
            label: busy ? (lang === "es" ? "Reactivando…" : "Resuming…") : resumeListingLabel(lang),
            onClick: () => void mutateLifecycle(item.id, "resume"),
            disabled: busy,
            tone: "positive",
          });
        }

        return (
          <OwnerEntityWorkspace
            key={item.id}
            lang={lang}
            header={{
              eyebrow: t.eyebrow,
              title: item.title,
              statusLabel: listingUiStatusLabel(uiStatus, lang),
              statusChipClass: listingUiStatusChipClass(uiStatus),
              plan: item.packageLabel || null,
              leonixId: item.leonixAdId,
              badges: item.categoryLabel ? [item.categoryLabel] : undefined,
            }}
            note={actionError && busyId === null ? { text: actionError, tone: "urgent" } : null}
            detailItems={detailItems}
            primaryAction={{ href: editHref, label: editListingLabel(lang) }}
            quickActions={quickActions}
            lifecycleActions={lifecycleActions}
            mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
          />
        );
      })}
    </div>
  );
}
