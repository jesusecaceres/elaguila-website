"use client";

import type { ListingData } from "@/app/clasificados/components/ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BienesRaicesPrivadoOwnerTrustCardProps = {
  listing: ListingData;
  onPreviewAction?: (message: string) => void;
  /** Live anuncio: real contact handlers (replaces preview toasts). */
  liveContact?: {
    onRequestInfo: () => void;
    onScheduleVisit: () => void;
    /** Opens chat / message flow (same as seller rail “mensaje”). */
    onOpenChat: () => void;
  };
};

export function BienesRaicesPrivadoOwnerTrustCard({
  listing,
  onPreviewAction,
  liveContact,
}: BienesRaicesPrivadoOwnerTrustCardProps) {
  const lang = listing.lang;
  const name = (listing.sellerName ?? "").trim() || (lang === "es" ? "Propietario" : "Owner");
  const phone = (listing.contactPhone ?? "").trim();
  const email = (listing.contactEmail ?? "").trim();
  const phoneDigits = phone.replace(/\D/g, "");
  const hasPhone = phoneDigits.length >= 10;
  const hasEmail = Boolean(email);

  const t =
    lang === "es"
      ? {
          cardTitle: "Contactar al propietario",
          trustLine: "Anuncio publicado directamente por el propietario.",
          trustSub: "Sin intermediarios comerciales en esta vista.",
          requestInfo: "Solicitar información",
          message: "Enviar mensaje",
          scheduleVisit: "Programar visita",
          call: "Llamar",
          memberSince: "Miembro",
          responseNote: "El tiempo de respuesta depende del propietario.",
        }
      : {
          cardTitle: "Contact the owner",
          trustLine: "This listing is posted directly by the owner.",
          trustSub: "No brokerage presentation on this view.",
          requestInfo: "Request info",
          message: "Send message",
          call: "Call",
          memberSince: "Member",
          responseNote: "Response time depends on the owner.",
        };

  const toast = (msg: string) => onPreviewAction?.(msg);
  const isLive = Boolean(liveContact);

  return (
    <aside
      className="w-full min-w-0 rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-stone-100"
      data-section="br-privado-owner-card"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{t.cardTitle}</p>
      <div className="mt-4 flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-500"
          aria-hidden
        >
          {name.slice(0, 1).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-[#111111] leading-snug break-words">{name}</p>
          {listing.todayLabel ? (
            <p className="mt-1 text-xs text-stone-500">
              {t.memberSince}: {listing.todayLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-800/10 bg-emerald-50/40 px-3 py-2.5">
        <p className="text-xs font-medium text-emerald-950/90 leading-snug">{t.trustLine}</p>
        <p className="mt-1 text-[11px] text-emerald-900/65 leading-snug">{t.trustSub}</p>
      </div>

      <p className="mt-4 text-[11px] text-stone-500 leading-snug">{t.responseNote}</p>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() =>
            isLive ? liveContact!.onRequestInfo() : toast(lang === "es" ? "Vista previa: solicitud de información" : "Preview: info request")
          }
          className="w-full rounded-xl border border-[#3F5A43]/60 bg-[#3F5A43] px-4 py-3 text-sm font-semibold text-[#F7F4EC] shadow-sm transition hover:bg-[#36503A]"
        >
          {t.requestInfo}
        </button>
        <button
          type="button"
          onClick={() =>
            isLive ? liveContact!.onOpenChat() : toast(lang === "es" ? "Vista previa: mensaje al propietario" : "Preview: message to owner")
          }
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-[#111111] shadow-sm transition hover:bg-stone-50"
        >
          {t.message}
        </button>
        {isLive ? (
          <button
            type="button"
            onClick={() => liveContact!.onScheduleVisit()}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-[#111111] shadow-sm transition hover:bg-stone-100"
          >
            {t.scheduleVisit}
          </button>
        ) : null}
        {hasPhone ? (
          <a
            href={`tel:${phoneDigits}`}
            className="block w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm font-semibold text-[#111111] transition hover:bg-stone-100"
          >
            {t.call} · {phone}
          </a>
        ) : null}
        {hasEmail ? (
          <a
            href={`mailto:${encodeURIComponent(email)}`}
            className="block w-full text-center text-xs font-semibold text-[#2F4A33] underline-offset-2 hover:underline break-all"
          >
            {email}
          </a>
        ) : null}
      </div>
    </aside>
  );
}
