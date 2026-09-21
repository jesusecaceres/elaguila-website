"use client";

/**
 * LEONIX IX REWARDS — customer credits panel.
 *
 * Every number here comes from the server (`GET /api/rewards/wallet`), which resolves the wallet
 * from the caller's bearer token. Nothing is computed in the browser, and there are no controls
 * that cannot perform their action: this panel is read-only by design, because credits are
 * applied at CHECKOUT, not from the dashboard. It says so rather than showing a dead "Redeem"
 * button.
 */
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type WalletView = {
  availableCents: number;
  pendingCents: number;
  reservedCents: number;
  lifetimeEarnedCents: number;
  lifetimeRedeemedCents: number;
  availableDisplay: string;
  pendingDisplay: string;
  lifetimeEarnedDisplay: string;
};

type ActivityRow = {
  id: string;
  type: string;
  label: string;
  amountCents: number;
  amountDisplay: string;
  createdAt: string;
  reason: string | null;
};

/** Entry types that REDUCE the customer's balance, shown with a minus and a muted tone. */
const DEBIT_TYPES = new Set(["redeem_commit", "refund_reversal", "chargeback_reversal", "expire"]);

export function LeonixCreditsPanel({ lang = "es" }: { lang?: "es" | "en" }) {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [state, setState] = useState<"loading" | "ready" | "signed_out" | "error">("loading");

  const t = useCallback((es: string, en: string) => (lang === "en" ? en : es), [lang]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!cancelled) setState("signed_out");
          return;
        }
        const res = await fetch(`/api/rewards/wallet?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as {
          ok: boolean;
          wallet: WalletView | null;
          activity?: ActivityRow[];
          explanation?: string;
        };
        if (cancelled) return;
        if (!json.ok) {
          setState("error");
          return;
        }
        setWallet(json.wallet);
        setActivity(json.activity ?? []);
        setExplanation(json.explanation ?? "");
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  if (state === "signed_out") return null;

  return (
    <section className="rounded-2xl border border-[#E7DCC6] bg-white p-4 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-extrabold text-[#2F2A1F]">
          ⭐ {t("Créditos Leonix", "Leonix Credits")}
        </h2>
        {state === "loading" && (
          <span className="text-xs text-[#7A7164]">{t("Cargando…", "Loading…")}</span>
        )}
      </header>

      {state === "error" && (
        <p className="mt-2 text-sm text-red-600">
          {t("No se pudieron cargar tus créditos.", "Could not load your credits.")}
        </p>
      )}

      {state === "ready" && wallet && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#FFF6E7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7164]">
                {t("Disponible", "Available")}
              </p>
              <p className="mt-1 text-xl font-extrabold text-[#2F2A1F]">{wallet.availableDisplay}</p>
            </div>
            <div className="rounded-xl bg-[#F6F3EC] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7164]">
                {t("Pendiente", "Pending")}
              </p>
              <p className="mt-1 text-xl font-extrabold text-[#5D4A25]">{wallet.pendingDisplay}</p>
            </div>
            <div className="rounded-xl bg-[#F6F3EC] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7164]">
                {t("Ganado en total", "Lifetime earned")}
              </p>
              <p className="mt-1 text-xl font-extrabold text-[#5D4A25]">{wallet.lifetimeEarnedDisplay}</p>
            </div>
          </div>

          {wallet.reservedCents > 0 && (
            <p className="mt-2 text-xs text-[#7A7164]">
              {t(
                "Parte de tu saldo está reservada para una compra en proceso.",
                "Part of your balance is held for a purchase in progress.",
              )}
            </p>
          )}

          {wallet.pendingCents > 0 && (
            <p className="mt-2 text-xs text-[#7A7164]">
              {t(
                "Los créditos pendientes estarán disponibles cuando el pago quede firme.",
                "Pending credits become available once the payment is final.",
              )}
            </p>
          )}

          {/* Honest about WHERE credits are used, instead of a dashboard button that cannot spend them. */}
          <p className="mt-3 rounded-xl bg-[#FFF6E7] p-3 text-xs text-[#5D4A25]">
            {t(
              "Puedes aplicar tus créditos al pagar: elige cuántos usar en la pantalla de pago, o en la oficina con nuestro equipo.",
              "You can apply your credits at checkout: choose how many to use on the payment screen, or in person with our team.",
            )}
          </p>

          {explanation && <p className="mt-2 text-xs text-[#7A7164]">{explanation}</p>}

          {activity.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-[#2F2A1F]">
                {t("Actividad reciente", "Recent activity")}
              </h3>
              <ul className="mt-2 divide-y divide-[#F0E9DA]">
                {activity.map((row) => {
                  const isDebit = DEBIT_TYPES.has(row.type);
                  return (
                    <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-[#2F2A1F]">{row.label}</p>
                        <p className="text-xs text-[#7A7164]">
                          {new Date(row.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "es-MX")}
                          {row.reason ? ` · ${row.reason}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-bold ${isDebit ? "text-[#7A7164]" : "text-green-700"}`}>
                        {isDebit ? "−" : "+"}
                        {row.amountDisplay.replace("-", "")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
