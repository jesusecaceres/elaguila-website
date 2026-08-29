"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";

import { gateBuscoQuickPreview } from "../shared/buscoRequiredForPreview";
import { publishBuscoQuickToListings } from "../shared/publishBuscoQuickToListings";
import { BUSCO_QUICK_DRAFT_KEY, BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY } from "../shared/buscoSessionKeys";
import type { BuscoQuickDraft } from "../shared/buscoQuickTypes";

const BTN_PUBLISH =
  "inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#7A1E2C] px-5 py-3 text-sm font-bold text-[#FFFCF7] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[11rem] sm:flex-none";

const MODAL_COPY = {
  es: {
    title: "Confirmar publicación",
    intro: "Antes de publicar, confirma que tu solicitud está lista.",
    checks: [
      "Confirmo que la información de mi solicitud es correcta.",
      "Confirmo que la imagen (si agregué una) representa lo que busco.",
      "Confirmo que mi solicitud respeta las reglas de Leonix.",
    ] as [string, string, string],
    confirmCta: "Publicar solicitud",
    cancelCta: "Cancelar",
    blockedHint: "Marca las 3 casillas para publicar.",
    closeOverlayAria: "Cerrar",
  },
  en: {
    title: "Confirm publication",
    intro: "Before publishing, confirm your request is ready.",
    checks: [
      "I confirm my request information is correct.",
      "I confirm the image (if I added one) represents what I'm looking for.",
      "I confirm my request follows Leonix rules.",
    ] as [string, string, string],
    confirmCta: "Publish request",
    cancelCta: "Cancel",
    blockedHint: "Check all 3 boxes to publish.",
    closeOverlayAria: "Close",
  },
} as const;

export function BuscoQuickPreviewPublishBar({
  draft,
  lang,
  routeLang,
}: {
  draft: BuscoQuickDraft;
  lang: Lang;
  routeLang: SupportedLang;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const gate = useMemo(() => gateBuscoQuickPreview(draft, lang), [draft, lang]);
  const publishDisabled = !gate.ok || publishing;

  const publishLabel = lang === "es" ? "Publicar solicitud" : "Publish request";
  const busyLabel = lang === "es" ? "Publicando…" : "Publishing…";
  const blockedHint =
    lang === "es" ? "Completa los campos requeridos antes de publicar." : "Complete required fields before publishing.";
  const modalCopy = MODAL_COPY[lang];

  const handleConfirmedPublish = async () => {
    if (publishDisabled) return;
    setPublishError(null);
    setPublishing(true);
    try {
      // I.6B — reuse this same in-progress submission's row (if a prior attempt already created
      // one and hasn't fully completed yet) instead of always inserting a fresh row.
      let inFlightId: string | null = null;
      try {
        inFlightId = window.sessionStorage.getItem(BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY);
      } catch {
        /* sessionStorage optional */
      }
      const r = await publishBuscoQuickToListings({
        draft,
        lang,
        existingListingId: inFlightId,
        onListingIdKnown: (listingId) => {
          try {
            window.sessionStorage.setItem(BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY, listingId);
          } catch {
            /* sessionStorage optional */
          }
        },
      });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      try {
        window.sessionStorage.setItem(`leonix-busco-publish-success:${r.listingId}`, "1");
        window.sessionStorage.removeItem(BUSCO_QUICK_DRAFT_KEY);
        window.sessionStorage.removeItem(BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY);
      } catch {
        /* sessionStorage optional */
      }
      router.push(withClasificadosPublishLang(`/clasificados/anuncio/${r.listingId}`, routeLang));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-1">
      <button
        type="button"
        className={BTN_PUBLISH}
        disabled={publishDisabled}
        title={!gate.ok ? blockedHint : undefined}
        onClick={() => setConfirmOpen(true)}
        data-testid="busco-preview-publish"
      >
        {publishing ? busyLabel : publishLabel}
      </button>
      {publishError ? (
        <p
          className="w-full rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-950"
          role="alert"
        >
          {publishError}
        </p>
      ) : null}

      {/* Section Q — second final verification, required immediately before the actual publish call. */}
      <EmpleosPublishConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmedPublish()}
        title={modalCopy.title}
        intro={modalCopy.intro}
        checks={modalCopy.checks}
        confirmCta={modalCopy.confirmCta}
        cancelCta={modalCopy.cancelCta}
        blockedHint={modalCopy.blockedHint}
        closeOverlayAria={modalCopy.closeOverlayAria}
      />
    </div>
  );
}
