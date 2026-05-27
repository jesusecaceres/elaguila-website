"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShellPrimaryCta } from "./restaurantDetailShellTypes";
import {
  buildCallIntent,
  buildDirectionsIntent,
  buildSendEmailIntent,
  buildSendMessageIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import {
  FiBookmark,
  FiCalendar,
  FiFileText,
  FiGlobe,
  FiMenu,
  FiMessageCircle,
  FiPhone,
  FiShare2,
  FiShoppingBag,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { IconType } from "react-icons";
import { RestauranteShellDataUrlModal } from "./RestauranteShellDataUrlModal";

const STORAGE_KEY = "leonix.clasificados.restaurantes.shell.demo.saved";

function iconFor(key: ShellPrimaryCta["key"]): IconType {
  switch (key) {
    case "website":
      return FiGlobe;
    case "call":
      return FiPhone;
    case "whatsapp":
      return FaWhatsapp;
    case "message":
      return FiMessageCircle;
    case "menu":
      return FiMenu;
    case "menuAsset":
      return FiFileText;
    case "reserve":
      return FiCalendar;
    case "order":
      return FiShoppingBag;
    case "save":
      return FiBookmark;
    case "share":
      return FiShare2;
    default:
      return FiGlobe;
  }
}

type CtaLayout = "wrap" | "scrollRail";

export function RestauranteShellInteractiveCtas({
  listingId,
  ctas,
  /** `scrollRail`: horizontal thumb rail (mobile hero). `wrap`: centered wrap (desktop hero overlay). */
  layout = "wrap",
}: {
  listingId: string;
  ctas: ShellPrimaryCta[];
  layout?: CtaLayout;
}) {
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const [dataModal, setDataModal] = useState<{ href: string; title: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setSaved(Boolean(parsed[listingId]));
    } catch {
      /* ignore */
    }
  }, [listingId]);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const persistSaved = useCallback(
    (next: boolean) => {
      setSaved(next);
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
        parsed[listingId] = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        /* ignore */
      }
    },
    [listingId]
  );

  const openSheetForCta = (cta: ShellPrimaryCta) => {
    const href = cta.href.trim();
    if (!href) return;
    if (cta.key === "call") {
      setCtaIntent(buildCallIntent({ phone: href.replace(/^tel:/i, "") }));
      return;
    }
    if (cta.key === "whatsapp") {
      let digits = "";
      let message = "";
      try {
        const url = new URL(href);
        digits = url.pathname.replace(/\D/g, "");
        message = url.searchParams.get("text") ?? "";
      } catch {
        digits = href.replace(/\D/g, "");
      }
      setCtaIntent(buildWhatsAppMessageIntent({ message, whatsappDigits: digits }));
      return;
    }
    if (cta.key === "message") {
      if (/^mailto:/i.test(href)) {
        const parsed = parseMailto(href);
        setCtaIntent(buildSendEmailIntent(parsed));
        return;
      }
      if (/^sms:/i.test(href)) {
        const parsed = parseSms(href);
        setCtaIntent(buildSendMessageIntent(parsed));
        return;
      }
    }
    if (cta.key === "directions") {
      setCtaIntent(buildDirectionsIntent({ addressOrUrl: href, isMapsUrl: /^https?:\/\//i.test(href) }));
      return;
    }
    const kind =
      cta.key === "order"
        ? "order"
        : cta.key === "reserve"
          ? "booking"
          : cta.key === "menu"
            ? "menu"
            : cta.key === "website"
              ? "website"
              : "other";
    setCtaIntent(buildWebsiteIntent({ url: href, headline: cta.label, kind }));
  };

  const rail = layout === "scrollRail";

  const pillClass =
    "inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white";

  return (
    <div
      className={
        rail
          ? "flex w-full max-w-[100vw] flex-nowrap items-stretch justify-start gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 py-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
          : "flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
      }
      role={rail ? "toolbar" : undefined}
      aria-label={rail ? "Acciones rápidas" : undefined}
    >
      {ctas.map((cta, idx) => {
        const Icon = iconFor(cta.key);
        const disabled = cta.enabled === false;
        const rowKey = `${cta.key}-${idx}`;

        if (cta.key === "save") {
          return (
            <button
              key={rowKey}
              type="button"
              onClick={() => persistSaved(!saved)}
              className={pillClass}
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-olive)]" aria-hidden />
              {saved ? "Guardado" : cta.label}
            </button>
          );
        }

        if (cta.key === "share") {
          return (
            <LeonixShareButton
              key={rowKey}
              listingId={listingId}
              listingUrl={shareUrl}
              listingTitle={typeof document !== "undefined" ? document.title : cta.label}
              category="restaurantes"
              lang="es"
              variant="default"
              directNativeShare
              className="[&>button]:min-h-[44px] [&>button]:shrink-0 [&>button]:snap-start [&>button]:rounded-full [&>button]:border-white/25 [&>button]:bg-white/95 [&>button]:px-4 [&>button]:py-2.5 [&>button]:text-sm [&>button]:font-semibold [&>button]:text-[color:var(--lx-text)] [&>button]:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] [&>button]:backdrop-blur [&>button]:hover:bg-white"
            />
          );
        }

        if (disabled) {
          return (
            <span
              key={rowKey}
              title={cta.disabledReason}
              className="inline-flex min-h-[44px] shrink-0 snap-start cursor-not-allowed items-center gap-2 rounded-full border border-white/15 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]/45 shadow-inner"
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 opacity-50" aria-hidden />
              {cta.label}
            </span>
          );
        }

        if (cta.href.startsWith("data:")) {
          return (
            <button
              key={rowKey}
              type="button"
              onClick={() => setDataModal({ href: cta.href, title: cta.label })}
              className={pillClass}
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-blue)]" aria-hidden />
              {cta.label}
            </button>
          );
        }

        return (
          <button
            key={rowKey}
            type="button"
            onClick={() => openSheetForCta(cta)}
            className={pillClass}
          >
            <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-blue)]" aria-hidden />
            {cta.label}
          </button>
        );
      })}
      <RestauranteShellDataUrlModal
        open={dataModal != null}
        onClose={() => setDataModal(null)}
        href={dataModal?.href ?? ""}
        title={dataModal?.title ?? ""}
      />
      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang="es" />
    </div>
  );
}

function parseMailto(href: string): { email?: string | null; subject: string; body: string } {
  const raw = href.replace(/^mailto:/i, "");
  const [emailPart, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  return {
    email: safeDecode(emailPart),
    subject: safeDecode(params.get("subject") ?? ""),
    body: safeDecode(params.get("body") ?? ""),
  };
}

function parseSms(href: string): { message: string; phone?: string | null } {
  const raw = href.replace(/^sms:/i, "");
  const [phonePart, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  return {
    phone: phonePart,
    message: safeDecode(params.get("body") ?? ""),
  };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}
