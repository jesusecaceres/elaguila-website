"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShellPrimaryCta } from "./restaurantDetailShellTypes";
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

function shouldGateExternalHttps(href: string, key: ShellPrimaryCta["key"]): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  if (key === "whatsapp") return false;
  try {
    const host = new URL(href).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "wa.me" || host === "api.whatsapp.com") return false;
  } catch {
    return false;
  }
  return true;
}

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

export function RestauranteShellInteractiveCtas({
  listingId,
  ctas,
}: {
  listingId: string;
  ctas: ShellPrimaryCta[];
}) {
  const [saved, setSaved] = useState(false);
  const [dataModal, setDataModal] = useState<{ href: string; title: string } | null>(null);
  const [extModal, setExtModal] = useState<{ href: string; title: string } | null>(null);

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
    if (!extModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExtModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [extModal]);

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

  const onShare = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      void navigator.share({ title: document.title, url }).catch(() => {
        void navigator.clipboard.writeText(url);
      });
    } else {
      void navigator.clipboard.writeText(url);
    }
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white"
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              {saved ? "Guardado" : cta.label}
            </button>
          );
        }

        if (cta.key === "share") {
          return (
            <button
              key={rowKey}
              type="button"
              onClick={onShare}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white"
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              {cta.label}
            </button>
          );
        }

        if (disabled) {
          return (
            <span
              key={rowKey}
              title={cta.disabledReason}
              className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-full border border-white/15 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]/45 shadow-inner"
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white"
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              {cta.label}
            </button>
          );
        }

        if (shouldGateExternalHttps(cta.href, cta.key)) {
          return (
            <button
              key={rowKey}
              type="button"
              onClick={() => setExtModal({ href: cta.href, title: cta.label })}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white"
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              {cta.label}
            </button>
          );
        }

        return (
          <a
            key={rowKey}
            href={cta.href}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white"
            {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            {cta.label}
          </a>
        );
      })}
      <RestauranteShellDataUrlModal
        open={dataModal != null}
        onClose={() => setDataModal(null)}
        href={dataModal?.href ?? ""}
        title={dataModal?.title ?? ""}
      />
      {extModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rest-shell-ext-link-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1a1814] p-5 text-white shadow-2xl">
            <p id="rest-shell-ext-link-title" className="text-base font-semibold">
              Sitio externo
            </p>
            <p className="mt-2 text-sm text-white/85">
              Los menús y páginas web no se pueden mostrar dentro de la vista previa. Puedes abrir el enlace en una pestaña
              nueva cuando quieras revisarlo.
            </p>
            <p className="mt-3 break-all text-xs text-white/60">{extModal.href}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-[44px] rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]"
                onClick={() => {
                  window.open(extModal.href, "_blank", "noopener,noreferrer");
                  setExtModal(null);
                }}
              >
                Abrir en nueva pestaña
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => setExtModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
