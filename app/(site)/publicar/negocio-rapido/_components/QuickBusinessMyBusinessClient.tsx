"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { businessAccessCopy } from "@/app/lib/listingPlans/businessAccessCopy";
import { quickBusinessCopy } from "@/app/lib/quickBusiness/quickBusinessCopy";
import { getQuickBusinessDefinition, listQuickBusinessDefinitions } from "@/app/lib/quickBusiness/quickBusinessRegistry";
import {
  getLifecycleCapability,
  isTransitionLegalFrom,
  resolveLifecycleEndpoint,
  type QuickLifecycleIntent,
} from "@/app/lib/quickBusiness/quickBusinessLifecycleCapabilities";
import { isQuickBusinessCategoryKey, quickBusinessChooserPath, quickBusinessMyBusinessPath } from "@/app/lib/quickBusiness/quickBusinessRoutes";
import { qt } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { QuickShell, quickCard, quickPrimaryBtn, quickSecondaryBtn } from "@/app/publicar/rapido/_components/QuickShell";

function withLang(path: string, lang: string): string {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

/** Doorway category key → the category param the payment ledger uses. */
const BILLING_CATEGORY_BY_KEY: Record<string, string> = {
  servicios: "servicios",
  restaurantes: "restaurantes",
  "autos-dealer": "autos-dealer",
  "bienes-negocio": "bienes-negocio",
};

type ListingState = {
  id: string;
  status: string;
  slug?: string;
  isPublished?: boolean;
};

/** Every authenticated call goes through here so no control can ship without a bearer token. */
async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * SIMPLE business control doorway — VIEW / EDIT / PAUSE / REACTIVATE / END / BILLING / HELP.
 *
 * Every control here either performs a real, authenticated, ownership-checked mutation against
 * the category's canonical state model, or it is not rendered at all. Which of PAUSE / RESUME /
 * END exists is decided by `quickBusinessLifecycleCapabilities.ts`, which encodes each family's
 * actual DB CHECK constraint — so a family with no `paused` status simply gets no Pause button
 * instead of a button that would fail.
 *
 * The listing being acted on is resolved server-side from the canonical
 * `business_listing_links` relationship, never from browser state, and the server refuses rather
 * than guessing when a customer has more than one candidate listing.
 */
export function QuickBusinessMyBusinessClient() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const catParam = searchParams?.get("cat");
  const category = isQuickBusinessCategoryKey(catParam) ? catParam : null;

  const [listing, setListing] = useState<ListingState | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyIntent, setBusyIntent] = useState<QuickLifecycleIntent | null>(null);
  const [actionMessage, setActionMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const t = useCallback((es: string, en: string) => (lang === "en" ? en : es), [lang]);

  const loadListing = useCallback(async () => {
    if (!category) return;
    setLoadState("loading");
    setLoadError(null);
    const token = await getAccessToken();
    if (!token) {
      setLoadState("error");
      setLoadError(t("Inicia sesión para administrar tu negocio.", "Sign in to manage your business."));
      return;
    }
    try {
      const res = await fetch(`/api/clasificados/quick-business/my-listing?category=${encodeURIComponent(category)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as {
        ok: boolean;
        listing?: ListingState;
        error?: string;
        message?: string;
      };
      if (json.ok && json.listing) {
        setListing(json.listing);
        setLoadState("loaded");
        return;
      }
      setListing(null);
      setLoadState("error");
      setLoadError(
        json.error === "ambiguous_listing"
          ? t(
              "Tienes más de un anuncio. Ábrelo desde el panel completo para elegir cuál administrar.",
              "You have more than one listing. Open the full dashboard to choose which one to manage.",
            )
          : json.error === "not_found"
            ? t("Todavía no encontramos un anuncio publicado.", "We could not find a published listing yet.")
            : t("No se pudo cargar tu anuncio.", "Could not load your listing."),
      );
    } catch {
      setLoadState("error");
      setLoadError(t("Error de red.", "Network error."));
    }
  }, [category, t]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  async function runLifecycleIntent(intent: QuickLifecycleIntent) {
    if (!category || !listing) return;
    const resolved = resolveLifecycleEndpoint(category, intent, listing.id);
    if (!resolved) return; // unreachable: unsupported intents render no control

    setBusyIntent(intent);
    setActionMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setBusyIntent(null);
      setActionMessage({ kind: "err", text: t("Inicia sesión de nuevo.", "Please sign in again.") });
      return;
    }

    // Each family's canonical endpoint has its own body shape; this maps intent → that shape
    // rather than inventing a new uniform mutation API on top of them.
    let body: Record<string, unknown> = {};
    if (category === "servicios") body = { listingId: listing.id, action: resolved.action };
    else if (category === "restaurantes") body = { listingId: listing.id, action: resolved.action };
    else if (category === "bienes-negocio") body = { listingId: listing.id, mutation: resolved.action };
    // autos-dealer: the id is in the path, the body is empty.

    try {
      const res = await fetch(resolved.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok !== false) {
        setActionMessage({ kind: "ok", text: t("Listo. Cambio aplicado.", "Done. Change applied.") });
        await loadListing();
      } else {
        setActionMessage({
          kind: "err",
          text:
            json.error === "invalid_status_transition"
              ? t("El anuncio ya no está en ese estado.", "The listing is no longer in that state.")
              : json.error === "forbidden"
                ? t("No tienes permiso sobre este anuncio.", "You do not have permission for this listing.")
                : t("No se pudo aplicar el cambio.", "Could not apply the change."),
        });
      }
    } catch {
      setActionMessage({ kind: "err", text: t("Error de red.", "Network error.") });
    } finally {
      setBusyIntent(null);
    }
  }

  async function openBillingPortal(catKey: string) {
    setBillingLoading(true);
    setActionMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setBillingLoading(false);
      setActionMessage({ kind: "err", text: t("Inicia sesión de nuevo.", "Please sign in again.") });
      return;
    }
    try {
      const res = await fetch("/api/stripe/billing-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: BILLING_CATEGORY_BY_KEY[catKey] ?? catKey,
          returnPath: `/publicar/negocio-rapido/mi-negocio?cat=${catKey}&lang=${routeLang}`,
        }),
      });
      const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (json.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      setActionMessage({
        kind: "err",
        text:
          json.error === "no_subscription_found"
            ? t("No encontramos una suscripción activa.", "We could not find an active subscription.")
            : t("No se pudo abrir el portal de facturación.", "Could not open the billing portal."),
      });
    } catch {
      setActionMessage({ kind: "err", text: t("Error de red.", "Network error.") });
    } finally {
      setBillingLoading(false);
    }
  }

  if (!category) {
    return (
      <QuickShell
        lang={lang}
        eyebrow={quickBusinessCopy("eyebrow", lang)}
        title={quickBusinessCopy("myBusinessTitle", lang)}
        subtitle={quickBusinessCopy("myBusinessPick", lang)}
        backHref={quickBusinessChooserPath(routeLang)}
      >
        <ul className="grid grid-cols-2 gap-3">
          {listQuickBusinessDefinitions().map((def) => (
            <li key={def.key}>
              <Link
                href={quickBusinessMyBusinessPath(routeLang, def.key)}
                className={`${quickCard} flex min-h-[84px] flex-col items-center justify-center text-center hover:bg-[#FFF6E7]`}
              >
                <span className="text-2xl" aria-hidden="true">{def.emoji}</span>
                <span className="mt-1 text-sm font-bold">{qt(def.label, lang)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={withLang("/dashboard/mis-anuncios", routeLang)} className={`${quickSecondaryBtn} mt-4`}>
          {quickBusinessCopy("myBusinessView", lang)}
        </Link>
      </QuickShell>
    );
  }

  const def = getQuickBusinessDefinition(category);
  const manage = def.manage;
  const manageHref = withLang(manage.dashboardHref, routeLang);

  const intents: QuickLifecycleIntent[] = ["pause", "resume", "end"];
  const actionableIntents = listing
    ? intents.filter(
        (i) => getLifecycleCapability(category, i)?.state === "supported" && isTransitionLegalFrom(category, i, listing.status),
      )
    : [];

  return (
    <QuickShell
      lang={lang}
      eyebrow={quickBusinessCopy("eyebrow", lang)}
      title={`${def.emoji} ${quickBusinessCopy("myBusinessTitle", lang)} · ${qt(def.label, lang)}`}
      subtitle={quickBusinessCopy("myBusinessBody", lang)}
      backHref={quickBusinessMyBusinessPath(routeLang)}
    >
      <div className="space-y-3">
        <Link href={manageHref} className={quickPrimaryBtn}>
          👀 {quickBusinessCopy("myBusinessView", lang)}
        </Link>

        {actionMessage && (
          <p className={`text-sm ${actionMessage.kind === "ok" ? "text-green-700" : "text-red-600"}`} role="status">
            {actionMessage.text}
          </p>
        )}

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">✏️ {quickBusinessCopy("myBusinessEdit", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(manage.editNote, lang)}</p>
          <Link href={manageHref} className={`${quickSecondaryBtn} mt-3`}>
            {quickBusinessCopy("myBusinessEdit", lang)}
          </Link>
        </section>

        {/* Lifecycle. Rendered from the capability matrix + the listing's real current status, so
            a control only appears when it can genuinely execute the transition. */}
        <section className={quickCard}>
          <h2 className="text-base font-extrabold">
            ⏸️ {quickBusinessCopy("myBusinessPause", lang)} · {quickBusinessCopy("myBusinessEnd", lang)}
          </h2>

          {loadState === "loading" && (
            <p className="mt-1 text-sm text-[#5D4A25]/90">{t("Cargando tu anuncio…", "Loading your listing…")}</p>
          )}

          {loadState === "error" && (
            <>
              <p className="mt-1 text-sm text-[#5D4A25]/90">{loadError}</p>
              <Link href={manageHref} className={`${quickSecondaryBtn} mt-3`}>
                {t("Ir al panel", "Go to dashboard")}
              </Link>
            </>
          )}

          {loadState === "loaded" && listing && (
            <>
              <p className="mt-1 text-sm text-[#5D4A25]/90">
                {t("Estado actual", "Current status")}: <strong>{listing.status || "—"}</strong>
              </p>

              {actionableIntents.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actionableIntents.map((intent) => {
                    const cap = getLifecycleCapability(category, intent)!;
                    return (
                      <button
                        key={intent}
                        type="button"
                        disabled={busyIntent !== null}
                        onClick={() => void runLifecycleIntent(intent)}
                        className={`${quickSecondaryBtn} disabled:opacity-60`}
                      >
                        {busyIntent === intent
                          ? t("Aplicando…", "Applying…")
                          : lang === "en"
                            ? (cap.labelEn ?? intent)
                            : (cap.labelEs ?? intent)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#5D4A25]/90">
                  {t(
                    "No hay cambios disponibles para el estado actual de este anuncio.",
                    "No changes are available for this listing's current status.",
                  )}
                </p>
              )}

              {/* Truthful disclosure: intents this family's schema genuinely cannot express. */}
              {intents
                .filter((i) => getLifecycleCapability(category, i)?.state !== "supported")
                .map((i) => {
                  const cap = getLifecycleCapability(category, i)!;
                  const label = i === "pause" ? t("Pausar", "Pause") : i === "resume" ? t("Reactivar", "Reactivate") : t("Finalizar", "End");
                  return (
                    <p key={i} className="mt-2 text-xs text-[#5D4A25]/70">
                      {label}:{" "}
                      {cap.state === "merged_with_pause"
                        ? t(
                            "esta categoría usa una sola acción para retirar y finalizar.",
                            "this category uses a single action to unpublish and end.",
                          )
                        : t(
                            "no disponible en esta categoría todavía; usa el panel completo.",
                            "not available in this category yet; use the full dashboard.",
                          )}
                    </p>
                  );
                })}
            </>
          )}
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">💳 {quickBusinessCopy("myBusinessBilling", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(manage.billingNote, lang)}</p>
          <button
            type="button"
            disabled={billingLoading}
            onClick={() => void openBillingPortal(category)}
            className={`${quickSecondaryBtn} mt-3 disabled:opacity-60`}
          >
            {billingLoading ? t("Abriendo…", "Opening…") : quickBusinessCopy("myBusinessBilling", lang)}
          </button>
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">🙋 {quickBusinessCopy("myBusinessHelp", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{quickBusinessCopy("myBusinessHelpBody", lang)}</p>
          <Link href={withLang("/contact", routeLang)} className={`${quickSecondaryBtn} mt-3`}>
            {quickBusinessCopy("myBusinessHelp", lang)}
          </Link>
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">⬆️ {businessAccessCopy("upgradeCta", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{businessAccessCopy("upgradeReassurance", lang)}</p>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{businessAccessCopy("upgradeWhere", lang)}</p>
          <Link href={manageHref} className={`${quickSecondaryBtn} mt-3`}>
            {businessAccessCopy("upgradeCta", lang)}
          </Link>
        </section>
      </div>
    </QuickShell>
  );
}
