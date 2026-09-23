"use client";

/**
 * Staff sales tool: category → product → existing or new → existing canonical application.
 * Leonix custody, draft business, and package stamps stay behind the scenes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { isQuickSalesCategory, type QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import {
  resolveStaffNavigationFromCustodyPost,
  resolveStaffOpenIntakeNavigation,
} from "@/app/lib/sales/staffServiciosGateway";
import { staffManualPaymentHref, type StaffBusinessPlan } from "@/app/lib/sales/staffBusinessProduct";
import {
  STAFF_LAUNCHER_GROUPS,
  STAFF_LAUNCHER_GROUP_LABEL,
  STAFF_MASTER_LAUNCHER_ITEMS,
  staffLauncherItem,
  staffLauncherProductPriceLabel,
  type StaffLauncherItem,
} from "@/app/lib/sales/staffMasterLauncher";

type BusinessRow = { id: string; name: string; city?: string | null };

type CustodyStatus = {
  category: QuickSalesCategory;
  businessId: string;
  listingId: string | null;
  listingSource: string;
  intakePath: string;
  saveEndpoint: string;
  assistedAction: string | null;
  packageKey?: string | null;
  plan?: StaffBusinessPlan | null;
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
  const [launcherId, setLauncherId] = useState(initialCategory ?? "");
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<BusinessRow[]>(initialBusiness ? [initialBusiness] : []);
  const [businessId, setBusinessId] = useState(initialBusiness?.id ?? "");
  const [clientMode, setClientMode] = useState<"new" | "existing">(initialBusiness ? "existing" : "new");
  const [reopenListingId, setReopenListingId] = useState(initialListingId ?? "");
  const [status, setStatus] = useState<CustodyStatus>(null);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [previewExpiresAt, setPreviewExpiresAt] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const item = staffLauncherItem(launcherId);
  const selectedProduct = useMemo(() => {
    if (!item) return null;
    return item.products.find((p) => p.id === productId) ?? item.products[0] ?? null;
  }, [item, productId]);

  useEffect(() => {
    if (!item) {
      setProductId("");
      return;
    }
    if (!item.products.some((p) => p.id === productId)) {
      setProductId(item.products[0]?.id ?? "");
    }
  }, [item, productId]);

  const plan: StaffBusinessPlan | null =
    selectedProduct?.plan === "quick" || selectedProduct?.plan === "full" ? selectedProduct.plan : null;

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
    const rows = (json.items ?? []).map((row) => ({
      id: String(row.id ?? ""),
      name: String(row.business_name ?? row.name ?? row.legal_name ?? "(sin nombre)"),
      city: (row.city as string | null) ?? null,
    }));
    setBusinesses(rows.filter((r) => r.id));
  }, [query]);

  const createAd = useCallback(async () => {
    if (!item) return;
    setBusy(true);
    setMessage(null);
    const { status: code, json } = await postJson("/api/admin/sales-preview/open-application", {
      launcherId: item.id,
      productId: selectedProduct?.id,
      plan,
      businessId: clientMode === "existing" ? businessId || undefined : undefined,
      newClient: clientMode === "new",
      listingId: reopenListingId.trim() || undefined,
    });
    if (code !== 200 || json.ok !== true) {
      setBusy(false);
      setMessage(`No se pudo abrir / Could not open (${code}): ${String(json.error ?? "unknown")}`);
      await refreshStatus();
      return;
    }
    if (typeof json.businessId === "string") setBusinessId(json.businessId);
    const href = typeof json.href === "string" ? json.href : typeof json.intakePath === "string" ? json.intakePath : "";
    if (
      item.mode === "assisted" &&
      item.hasQuickFull &&
      json.entryKind === "checkpoint" &&
      href.startsWith("/clasificados/publicar/")
    ) {
      window.location.assign(href);
      return;
    }
    if (item.mode === "assisted" && isQuickSalesCategory(item.assistedCategory)) {
      const nav = resolveStaffNavigationFromCustodyPost({
        ok: true,
        category: item.assistedCategory,
        intakePath: href,
      });
      if (!nav.allowed) {
        setBusy(false);
        setMessage("No se pudo abrir la aplicación. / Could not open the application.");
        await refreshStatus();
        return;
      }
      window.location.assign(nav.href);
      return;
    }
    if (!href) {
      setBusy(false);
      setMessage("Sin destino. / No destination.");
      return;
    }
    window.location.assign(href);
  }, [item, selectedProduct, plan, clientMode, businessId, reopenListingId, refreshStatus]);

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

  const openIntakeNav = resolveStaffOpenIntakeNavigation({
    selectedCategory: item?.assistedCategory && isQuickSalesCategory(item.assistedCategory) ? item.assistedCategory : "servicios",
    liveCustody: status ? { category: status.category, intakePath: status.intakePath } : null,
  });

  const absolutePreview = previewLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${previewLink}`
    : null;

  const canCreate = Boolean(item && selectedProduct && (clientMode === "new" || businessId));

  return (
    <div className="space-y-5 overflow-x-hidden text-sm text-[#2F2A1F]" data-staff-master-launcher>
      <p className="text-xs text-[#5D4A25]">Operador / Operator: {actorEmail}</p>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-1 font-bold">1. ¿Qué quieres crear? / What are you creating?</h2>
        <p className="mb-3 text-xs text-[#5D4A25]">Elige una categoría. / Choose a category.</p>
        {STAFF_LAUNCHER_GROUPS.map((group) => (
          <div key={group} className="mb-3" data-staff-launcher-group={group}>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
              {STAFF_LAUNCHER_GROUP_LABEL[group].es} / {STAFF_LAUNCHER_GROUP_LABEL[group].en}
            </h3>
            <div className="flex flex-wrap gap-2">
              {STAFF_MASTER_LAUNCHER_ITEMS.filter((row) => row.group === group).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  data-staff-launcher-item={row.id}
                  onClick={() => setLauncherId(row.id)}
                  aria-pressed={launcherId === row.id}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold ${
                    launcherId === row.id ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6] bg-white"
                  }`}
                >
                  {row.labelEs} / {row.labelEn}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {item ? (
        <section className="rounded-xl border border-[#E6DCC6] bg-white p-4" data-staff-product-step>
          <h2 className="mb-1 font-bold">2. ¿Qué producto? / Which product?</h2>
          {item.hasQuickFull ? (
            <div className="mt-2" data-staff-business-plan>
              <h3 className="mb-1 text-xs font-bold">Elige paquete / Choose package</h3>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Elige paquete / Choose package">
                {item.products.map((offer) => {
                  const selected = selectedProduct?.id === offer.id;
                  const price = staffLauncherProductPriceLabel(offer.packageKey);
                  return (
                    <button
                      key={offer.id}
                      type="button"
                      role="radio"
                      data-staff-plan={offer.plan}
                      onClick={() => setProductId(offer.id)}
                      aria-checked={selected}
                      className={`min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold ${
                        selected ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6] bg-white"
                      }`}
                    >
                      {selected ? "✓ " : "○ "}
                      {offer.labelEs} — {price}
                      {offer.plan === "quick" ? "/mes — Simple" : offer.plan === "full" ? "/mes — Full" : ""}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-semibold" data-staff-selected-package>
                Paquete seleccionado / Selected package: {selectedProduct?.labelEs}{" "}
                {staffLauncherProductPriceLabel(selectedProduct?.packageKey)}
              </p>
            </div>
          ) : item.products.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.products.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setProductId(offer.id)}
                  aria-pressed={selectedProduct?.id === offer.id}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold ${
                    selectedProduct?.id === offer.id ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6]"
                  }`}
                >
                  {offer.labelEs} / {offer.labelEn}
                  {offer.packageKey ? ` — ${staffLauncherProductPriceLabel(offer.packageKey)}` : ""}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5D4A25]" data-staff-single-product>
              {selectedProduct?.labelEs} / {selectedProduct?.labelEn}
              {selectedProduct?.packageKey ? ` — ${staffLauncherProductPriceLabel(selectedProduct.packageKey)}` : ""}
            </p>
          )}
        </section>
      ) : null}

      {item ? (
        <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
          <h2 className="mb-2 font-bold">3. ¿Cliente nuevo o existente? / New or existing client?</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setClientMode("new")}
              aria-pressed={clientMode === "new"}
              data-staff-client-mode="new"
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold ${
                clientMode === "new" ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6]"
              }`}
            >
              Cliente nuevo / New client
            </button>
            <button
              type="button"
              onClick={() => setClientMode("existing")}
              aria-pressed={clientMode === "existing"}
              data-staff-client-mode="existing"
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold ${
                clientMode === "existing" ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6]"
              }`}
            >
              Negocio existente / Existing business
            </button>
          </div>
          {clientMode === "new" ? (
            <p className="text-xs text-[#5D4A25]" data-staff-new-client>
              No hace falta un formulario de perfil. Los datos del anuncio crean el negocio. / No
              profile form is required. The application creates the business.
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar negocio / Search business"
                  className="min-h-[44px] flex-1 rounded-lg border border-[#E6DCC6] px-3 py-2"
                  aria-label="Buscar negocio / Search business"
                />
                <button type="button" onClick={() => void searchBusinesses()} className="min-h-[44px] rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold">
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
                        className={`min-h-[44px] w-full rounded-lg border px-3 py-2 text-left text-xs ${
                          businessId === b.id ? "border-[#B8860B] bg-[#FFF6E7]" : "border-[#E6DCC6]"
                        }`}
                      >
                        <span className="font-semibold">{b.name}</span>
                        {b.city ? <span className="text-[#5D4A25]"> · {b.city}</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">4. Crear anuncio / Create ad</h2>
        <button
          type="button"
          disabled={busy || !canCreate}
          onClick={() => void createAd()}
          data-servicios-staff-primary={item?.id === "servicios" ? "true" : undefined}
          data-staff-open-intake={item?.assistedCategory ?? item?.id}
          data-staff-open-requires-custody={item?.mode === "assisted" ? "true" : "false"}
          data-staff-plan={plan ?? undefined}
          data-quick-sales-create-business="inline-draft"
          className="min-h-[44px] rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          {item ? `Crear ${item.labelEs} / Create ${item.labelEn}` : "Elige una categoría / Choose a category"}
        </button>
        {!item ? (
          <p className="mt-2 text-xs text-[#8B4513]">Elige una categoría primero. / Choose a category first.</p>
        ) : clientMode === "existing" && !businessId ? (
          <p className="mt-2 text-xs text-[#8B4513]" data-staff-open-blocked="no_business">
            Busca y elige el negocio. / Search and select the business.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E6DCC6] bg-white p-4">
        <h2 className="mb-2 font-bold">Después de armar el anuncio / After the ad is built</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <p className="rounded-lg bg-[#FFFDF7] p-3 text-xs">
            <strong>Guardar para después / Save for later</strong>
            <span className="mt-1 block text-[#5D4A25]">El anuncio queda en borrador. / The ad stays a draft.</span>
          </p>
          <p className="rounded-lg bg-[#FFFDF7] p-3 text-xs">
            <strong>El cliente paga en línea / Client pays online</strong>
            <span className="mt-1 block text-[#5D4A25]">Comparte la vista previa y el pago. / Share preview and payment.</span>
          </p>
          <p className="rounded-lg bg-[#FFFDF7] p-3 text-xs">
            <strong>Pagó en oficina / Paid in office</strong>
            <span className="mt-1 block text-[#5D4A25]">Registra el pago y publica. / Record payment and publish.</span>
          </p>
        </div>
        <button
          type="button"
          disabled={busy || !status?.listingId}
          onClick={() => void issuePreview()}
          className="mt-3 min-h-[44px] rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Vista previa privada / Private preview
        </button>
        {absolutePreview ? (
          <div className="mt-3 space-y-2">
            <code className="block break-all rounded-lg bg-[#F6F1E4] p-2 text-[11px]">{absolutePreview}</code>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(absolutePreview)}
              className="min-h-[44px] rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold"
            >
              Copiar / Copy
            </button>
            {previewExpiresAt ? (
              <p className="text-xs text-[#5D4A25]">Expira / Expires: {new Date(previewExpiresAt).toLocaleString()}</p>
            ) : null}
          </div>
        ) : null}
        {status?.listingId ? (
          <a
            href={staffManualPaymentHref({
              listingId: status.listingId,
              packageKey: status.packageKey,
              category: status.category,
            })}
            data-staff-record-payment
            className="mt-2 inline-flex min-h-[44px] items-center rounded-lg border border-[#E6DCC6] px-3 py-2 text-xs font-semibold"
          >
            Registrar pago en oficina / Record office payment
          </a>
        ) : null}
        <button
          type="button"
          disabled={busy || !status?.listingId}
          onClick={() => void publishNow()}
          className="mt-2 min-h-[44px] rounded-lg border border-[#B8860B] px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Publicar ahora / Publish now
        </button>
        {status && status.listingId && !status.publishReady ? (
          <p className="mt-2 text-xs text-[#8B4513]">
            El pago aún no está confirmado. / Payment is not confirmed yet.
          </p>
        ) : null}
      </section>

      <details className="rounded-lg border border-[#E6DCC6] bg-[#FFFDF7] p-3 text-xs text-[#5D4A25]">
        <summary className="cursor-pointer font-semibold">Estado técnico / Staff status</summary>
        {status ? (
          <div className="mt-2 space-y-1">
            <p>Categoría: {status.category}</p>
            <p>Negocio: {status.businessId}</p>
            <p>Anuncio: {status.listingId ?? "—"}</p>
            <p>Producto: {status.plan ?? "—"} {status.packageKey ? `(${status.packageKey})` : ""}</p>
            <p>Pago: {status.paymentState}</p>
            {!openIntakeNav.allowed ? <p data-staff-open-blocked={openIntakeNav.reason}>Sin aplicación abierta.</p> : null}
          </div>
        ) : (
          <p className="mt-2">Sin custodia activa / No active custody</p>
        )}
        <input
          value={reopenListingId}
          onChange={(e) => setReopenListingId(e.target.value)}
          placeholder="Reabrir borrador / Reopen draft id"
          className="mt-2 min-h-[44px] w-full rounded-lg border border-[#E6DCC6] bg-white px-3 py-2 font-mono"
          aria-label="Reabrir borrador / Reopen draft id"
        />
      </details>

      {message ? <p className="rounded-lg bg-[#FFF6E7] p-3 text-xs">{message}</p> : null}
    </div>
  );
}

export function launcherLabel(item: StaffLauncherItem): string {
  return `${item.labelEs} / ${item.labelEn}`;
}
