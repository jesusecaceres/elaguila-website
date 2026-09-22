"use client";

/**
 * The staff-facing half of the Quick assisted sale. Every button here calls a real, authenticated
 * server route; nothing on this screen decides anything by itself.
 *
 * In particular: this component never holds the authority for the row it is working on. It shows
 * whatever the server's custody status reports, and when it sends a listing id it is sending an
 * agreement, not an instruction — the server refuses a disagreement rather than following it.
 *
 * SERVICIOS doorway (slice 1): "Fill Quick Services" POSTs custody and only then same-tab
 * navigates to `/publicar/negocio-rapido/servicios`. There is no fail-open
 * `status?.intakePath ?? descriptor.intakePath`. No active custody ⇒ no public application.
 */
import { useCallback, useEffect, useState } from "react";
import { QUICK_SALES_CATEGORIES, QUICK_SALES_CATEGORY_MAP, type QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import {
  BEGIN_CLIENT_DRAFT_HREF,
  resolveStaffNavigationFromCustodyPost,
  resolveStaffOpenIntakeNavigation,
} from "@/app/lib/sales/staffServiciosGateway";

type BusinessRow = { id: string; name: string; city?: string | null };

type CustodyStatus = {
  category: QuickSalesCategory;
  businessId: string;
  listingId: string | null;
  listingSource: string;
  intakePath: string;
  saveEndpoint: string;
  assistedAction: string | null;
  expiresAtMs: number;
  paymentState: string;
  publishReady: boolean;
} | null;

async function postJson(url: string, body: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

/**
 * QUICK SALES ENTRY CONSOLIDATION — preselection arrives from the server page, which resolved it
 * with the admin client. It only seeds the operator's form: category, the named business, and
 * (when reopening) the draft id. It grants nothing — custody is still established by the server
 * route, which re-proves the business, the client and the row exactly as before.
 */
export function QuickSalesWorkspaceClient({
  actorEmail,
  initialCategory = null,
  initialBusiness = null,
  initialListingId = null,
}: {
  actorEmail: string;
  initialCategory?: QuickSalesCategory | null;
  initialBusiness?: BusinessRow | null;
  initialListingId?: string | null;
}) {
  const [category, setCategory] = useState<QuickSalesCategory>(initialCategory ?? "servicios");
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<BusinessRow[]>(initialBusiness ? [initialBusiness] : []);
  const [businessId, setBusinessId] = useState(initialBusiness?.id ?? "");
  const [clientUserId, setClientUserId] = useState("");
  const [reopenListingId, setReopenListingId] = useState(initialListingId ?? "");
  const [status, setStatus] = useState<CustodyStatus>(null);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [previewExpiresAt, setPreviewExpiresAt] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const descriptor = QUICK_SALES_CATEGORY_MAP[category];

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/admin/sales-preview/custody", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { context?: CustodyStatus };
    setStatus(json.context ?? null);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const searchBusinesses = useCallback(async () => {
    setMessage(null);
    const res = await fetch(`/api/admin/businesses?q=${encodeURIComponent(query)}&limit=20`, { cache: "no-store" });
    if (!res.ok) {
      setMessage("No se pudo buscar / Search failed");
      return;
    }
    const json = (await res.json()) as { items?: Record<string, unknown>[] };
    const rows = (json.items ?? []).map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.business_name ?? item.name ?? item.legal_name ?? "(sin nombre)"),
      city: (item.city as string | null) ?? null,
    }));
    setBusinesses(rows.filter((r) => r.id));
  }, [query]);

  const establishCustody = useCallback(
    async (listingId?: string) => {
      setBusy(true);
      setMessage(null);
      setPreviewLink(null);
      const { status: code, json } = await postJson("/api/admin/sales-preview/custody", {
        category,
        businessId,
        clientUserId: clientUserId || undefined,
        listingId: listingId || undefined,
      });
      setBusy(false);
      if (code !== 200 || json.ok !== true) {
        setMessage(`Rechazado / Refused (${code}): ${String(json.error ?? "unknown")}`);
        await refreshStatus();
        return;
      }
      setMessage("Custodia establecida / Custody established");
      await refreshStatus();
    },
    [category, businessId, clientUserId, refreshStatus],
  );

  const issuePreview = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const { status: code, json } = await postJson("/api/admin/sales-preview/preview-link", {});
    setBusy(false);
    if (code !== 200 || json.ok !== true) {
      setMessage(`Sin vista previa / No preview (${code}): ${String(json.error ?? "unknown")}`);
      return;
    }
    setPreviewLink(String(json.previewPath ?? ""));
    setPreviewExpiresAt(typeof json.expiresAtMs === "number" ? json.expiresAtMs : null);
  }, []);

  const publishNow = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const { status: code, json } = await postJson("/api/admin/sales-preview/publish", {});
    setBusy(false);
    if (code !== 200 || json.ok !== true) {
      setMessage(`No publicado / Not published (${code}): ${String(json.error ?? "unknown")}`);
      await refreshStatus();
      return;
    }
    setMessage(`Publicado / Published — ${String(json.listingId ?? "")}`);
    await refreshStatus();
  }, [refreshStatus]);

  /**
   * SERVICIOS primary action: mint server-issued Leonix custody, then SAME-TAB navigate into the
   * existing Quick application. Never uses a client-side intake fallback; never opens a new tab;
   * never navigates if the POST did not confirm custody.
   */
  const openServiciosWithCustody = useCallback(async () => {
    if (category !== "servicios" || !businessId) return;
    setBusy(true);
    setMessage(null);
    const { status: code, json } = await postJson("/api/admin/sales-preview/custody", {
      category,
      businessId,
      clientUserId: clientUserId || undefined,
      listingId: reopenListingId.trim() || undefined,
    });
    if (code !== 200 || json.ok !== true) {
      setBusy(false);
      setMessage(`Rechazado / Refused (${code}): ${String(json.error ?? "unknown")}`);
      await refreshStatus();
      return;
    }
    const nav = resolveStaffNavigationFromCustodyPost(json);
    if (!nav.allowed) {
      setBusy(false);
      setMessage("Sin custodia confirmada — no se abre la aplicación. / No confirmed custody — application stays closed.");
      await refreshStatus();
      return;
    }
    setMessage("Custodia establecida / Custody established");
    window.location.assign(nav.href);
  }, [category, businessId, clientUserId, reopenListingId, refreshStatus]);

  const openIntakeNav = resolveStaffOpenIntakeNavigation({
    selectedCategory: category,
    liveCustody: status ? { category: status.category, intakePath: status.intakePath } : null,
  });

  const absolutePreview = previewLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${previewLink}`
    : null;

  return (
    <div className="space-y-5 text-sm text-[#2F2A1F]">
      <p className="text-xs text-[#5D4A25]">Operador / Operator: {actorEmail}</p>
      {initialBusiness || initialCategory || initialListingId ? (
        <p className="rounded-lg border border-[#C9A84A]/60 bg-[#FFFDF7] p-3 text-xs text-[#5D4A25]" data-quick-sales-preselected>
          Preseleccionado desde el panel — confirma y establece la custodia abajo. / Preselected from the
          admin panel — confirm and establish custody below.
          {initialBusiness ? <span className="block font-semibold text-[#2F2A1F]">{initialBusiness.name}</span> : null}
          {initialListingId ? <span className="block">Reabrir borrador / Reopen draft: <span className="font-mono">{initialListingId}</span></span> : null}
        </p>
      ) : null}

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">1. Categoría / Category</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_SALES_CATEGORIES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                category === key ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6] bg-white"
              }`}
            >
              {QUICK_SALES_CATEGORY_MAP[key].labelEs} / {QUICK_SALES_CATEGORY_MAP[key].labelEn}
            </button>
          ))}
        </div>
        {descriptor.requiresClientUserId ? (
          <p className="mt-2 text-xs text-[#5D4A25]">
            Esta categoría guarda el anuncio en la cuenta del cliente, así que requiere su usuario. ·
            This category saves the ad into the customer&apos;s account, so it requires their user.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">2. Negocio del cliente / Customer business</h2>
        <p className="mb-2 text-xs text-[#5D4A25]">
          Elige un negocio existente, o crea el registro canónico primero. · Pick an existing
          business, or create the canonical record first.
        </p>
        <a
          href={BEGIN_CLIENT_DRAFT_HREF}
          className="mb-3 inline-block rounded-lg border border-[#E6DCC6] px-3 py-2 text-xs font-semibold"
          data-begin-client-draft
        >
          Negocio nuevo (registro canónico) / New business (canonical record)
        </a>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar negocio / Search business"
            className="flex-1 rounded-lg border border-[#E6DCC6] px-3 py-2"
          />
          <button type="button" onClick={() => void searchBusinesses()} className="rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold">
            Buscar / Search
          </button>
        </div>
        {businesses.length ? (
          <ul className="mt-3 max-h-56 space-y-1 overflow-auto">
            {businesses.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setBusinessId(b.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    businessId === b.id ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6]"
                  }`}
                >
                  <span className="font-semibold">{b.name}</span>
                  {b.city ? <span className="text-[#5D4A25]"> · {b.city}</span> : null}
                  <span className="block font-mono text-[10px] text-[#8B7355]">{b.id}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          value={clientUserId}
          onChange={(e) => setClientUserId(e.target.value)}
          placeholder={
            descriptor.requiresClientUserId
              ? "Usuario del cliente (requerido) / Customer user id (required)"
              : "Usuario del cliente (opcional) / Customer user id (optional)"
          }
          className="mt-3 w-full rounded-lg border border-[#E6DCC6] px-3 py-2 font-mono text-xs"
        />
      </section>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">3. Custodia asistida / Assisted custody</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !businessId}
            onClick={() => void establishCustody()}
            className="rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            Empezar anuncio nuevo / Start a new ad
          </button>
          <input
            value={reopenListingId}
            onChange={(e) => setReopenListingId(e.target.value)}
            placeholder="ID del borrador / Draft id"
            className="rounded-lg border border-[#E6DCC6] px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            disabled={busy || !businessId || !reopenListingId.trim()}
            onClick={() => void establishCustody(reopenListingId.trim())}
            className="rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            Reabrir el mismo borrador / Reopen the same draft
          </button>
        </div>
        {status ? (
          <div className="mt-3 rounded-lg bg-[#FFF6E7] p-3 text-xs">
            <p>
              Categoría / Category: <strong>{status.category}</strong>
            </p>
            <p>
              Negocio / Business: <span className="font-mono">{status.businessId}</span>
            </p>
            <p>
              Anuncio canónico / Canonical listing:{" "}
              <span className="font-mono">{status.listingId ?? "— (aún no guardado / not saved yet)"}</span>
            </p>
            <p>
              Pago / Payment: <strong>{status.paymentState}</strong>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-[#5D4A25]">Sin custodia activa / No active custody</p>
        )}
      </section>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">4. Armar el anuncio / Build the ad</h2>
        <p className="text-xs text-[#5D4A25]">
          Se usa la herramienta de la categoría — no hay un formulario aparte aquí. · The category&apos;s
          own tool is used — there is no separate form here.
        </p>
        {category === "servicios" ? (
          <button
            type="button"
            disabled={busy || !businessId}
            onClick={() => void openServiciosWithCustody()}
            data-servicios-staff-primary
            data-staff-open-intake="servicios"
            data-staff-open-requires-custody="true"
            className="mt-2 rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            Llenar Servicios Quick / Fill Quick Services
          </button>
        ) : openIntakeNav.allowed ? (
          <a
            href={openIntakeNav.href}
            data-staff-open-intake={category}
            data-staff-open-requires-custody="true"
            className="mt-2 inline-block rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold"
          >
            Abrir {descriptor.labelEs} / Open {descriptor.labelEn}
          </a>
        ) : (
          <button
            type="button"
            disabled
            data-staff-open-intake={category}
            data-staff-open-blocked={openIntakeNav.reason}
            data-staff-open-requires-custody="true"
            className="mt-2 rounded-lg border border-[#E6DCC6] px-3 py-2 text-xs font-semibold opacity-40"
          >
            Abrir {descriptor.labelEs} / Open {descriptor.labelEn}
          </button>
        )}
        {category === "servicios" && !businessId ? (
          <p className="mt-2 text-xs text-[#8B4513]" data-staff-open-blocked="no_business">
            Elige un negocio del cliente primero. / Select the client&apos;s business first.
          </p>
        ) : null}
        {category !== "servicios" && !openIntakeNav.allowed ? (
          <p className="mt-2 text-xs text-[#8B4513]" data-staff-open-blocked={openIntakeNav.reason}>
            Sin custodia activa — no se abre la aplicación pública. / No active custody — the public
            application stays closed.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">5. Vista previa privada / Private preview</h2>
        <button
          type="button"
          disabled={busy || !status?.listingId}
          onClick={() => void issuePreview()}
          className="rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Generar enlace / Generate link
        </button>
        {absolutePreview ? (
          <div className="mt-3 space-y-2">
            <code className="block break-all rounded-lg bg-[#F6F1E4] p-2 text-[11px]">{absolutePreview}</code>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(absolutePreview)}
              className="rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold"
            >
              Copiar / Copy
            </button>
            {previewExpiresAt ? (
              <p className="text-xs text-[#5D4A25]">
                Expira / Expires: {new Date(previewExpiresAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">6. Publicar / Publish</h2>
        <p className="text-xs text-[#5D4A25]">
          Solo después de un pago confirmado por el servidor. Se publica el MISMO anuncio que el
          cliente revisó. · Only after a payment the server itself confirmed. It publishes the SAME
          listing the customer reviewed.
        </p>
        <button
          type="button"
          disabled={busy || !status?.listingId}
          onClick={() => void publishNow()}
          className="mt-2 rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Publicar ahora / Publish now
        </button>
        {status && status.listingId && !status.publishReady ? (
          <p className="mt-2 text-xs text-[#8B4513]">
            El pago aún no está confirmado; publicar será rechazado. · Payment is not confirmed yet;
            publishing will be refused.
          </p>
        ) : null}
      </section>

      {message ? <p className="rounded-lg bg-[#FFF6E7] p-3 text-xs">{message}</p> : null}
    </div>
  );
}
