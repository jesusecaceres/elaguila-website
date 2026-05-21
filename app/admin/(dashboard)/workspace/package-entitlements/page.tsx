import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardBase,
  adminInputClass,
  adminPartialBadgeClass,
} from "@/app/admin/_components/adminTheme";
import {
  PACKAGE_ENTITLEMENT_CATEGORIES,
  PACKAGE_ENTITLEMENT_LISTING_SOURCES,
  PACKAGE_ENTITLEMENT_PLACEMENT_SCOPES,
  PACKAGE_ENTITLEMENT_TIERS,
  PREMIUM_INVENTORY_SOFT_CAP,
} from "@/app/admin/_lib/packageEntitlementConstants";
import {
  benefitLabels,
  effectiveEntitlementStatus,
  fetchRecentPackageEntitlements,
  formatEntitlementListingHeadline,
  formatEntitlementListingIdLine,
} from "@/app/admin/_lib/packageEntitlementData";
import { getPackageEntitlementBenefits } from "@/app/lib/listingPlans/packageEntitlements";
import { createPackageEntitlementAction, revokePackageEntitlementAction } from "./actions";

export const dynamic = "force-dynamic";

function defaultStartLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function defaultEndLocal(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })
      : iso;
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-950";
    case "scheduled":
      return "bg-sky-100 text-sky-950";
    case "expired":
      return "bg-stone-200 text-stone-800";
    case "revoked":
      return "bg-rose-100 text-rose-950";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

function alertFromSearch(sp: Record<string, string | undefined>) {
  if (sp.created === "1") {
    return { kind: "ok" as const, text: `Paquete creado. Código: ${sp.code ?? "—"}` };
  }
  if (sp.revoked === "1") return { kind: "ok" as const, text: "Paquete revocado (sin eliminar el registro)." };
  if (sp.error === "premium_cap") {
    return {
      kind: "warn" as const,
      text: `Inventario Premium suave alcanzado (~${sp.warn ?? PREMIUM_INVENTORY_SOFT_CAP}). Revisa entitlements activos antes de otorgar más Premium.`,
    };
  }
  if (sp.error === "duplicate_code") {
    return { kind: "err" as const, text: "El código de entitlement ya existe. Usa otro código o deja el campo vacío para generar uno." };
  }
  if (sp.error) {
    return { kind: "err" as const, text: `No se pudo completar la acción (${sp.error}${sp.detail ? `: ${sp.detail}` : ""}).` };
  }
  return null;
}

export default async function AdminPackageEntitlementsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const spRaw = props.searchParams ? await props.searchParams : {};
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(spRaw)) {
    sp[k] = Array.isArray(v) ? v[0] : v;
  }
  const alert = alertFromSearch(sp);

  const { rows, unavailable, note } = await fetchRecentPackageEntitlements(40);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Monetización"
        title="Package Entitlements / Paquetes de Visibilidad"
        subtitle="Crea acceso Print-to-Digital con duración para un anuncio y categoría. Esto no es el CMS de cupones públicos (/cupones)."
        helperText="El código es un identificador interno de ops. Un cupón de descuento no otorga visibilidad sin un entitlement."
        rightSlot={
          <Link href="/admin/workspace/cupones" className={adminBtnSecondary}>
            CMS cupones →
          </Link>
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        <p className="font-bold">Importante</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>No cobra a clientes ni activa Stripe Checkout (conexión futura vía metadata).</li>
          <li>No publica ordenamiento en resultados hasta gates de categoría (p. ej. G2-Servicios).</li>
          <li>Premium (~8–10 inventario) usa módulos Destacados, no prioridad orgánica por defecto.</li>
          <li>Full-page otorga prioridad en resultados coincidentes después de filtros.</li>
          <li>
            Listing ID es opcional: genera el código antes de que exista el anuncio; un gate futuro conectará el código al listing.
          </li>
        </ul>
      </div>

      {alert ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            alert.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : alert.kind === "warn"
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
        >
          {alert.text}
        </div>
      ) : null}

      {unavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950`}>
          <p className="font-bold">Tabla no disponible</p>
          <p className="mt-1 text-xs">{note ?? "Aplica la migración listing_package_entitlements en Supabase."}</p>
        </div>
      ) : null}

      <form action={createPackageEntitlementAction} className={`${adminCardBase} space-y-4 p-4 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-[#1E1810]">Crear entitlement</h2>
          <span className={adminPartialBadgeClass}>Admin manual</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346]">
            Paquete / tier
            <select name="package_tier" required className={`${adminInputClass} mt-1`} defaultValue="half_page">
              {PACKAGE_ENTITLEMENT_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Categoría
            <select name="category" required className={`${adminInputClass} mt-1`} defaultValue="servicios">
              {PACKAGE_ENTITLEMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Listing source (tabla)
            <select name="listing_source" required className={`${adminInputClass} mt-1`} defaultValue="servicios_public_listings">
              {PACKAGE_ENTITLEMENT_LISTING_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Listing ID (opcional)
            <input
              name="listing_id"
              className={`${adminInputClass} mt-1 font-mono text-xs`}
              placeholder="Optional — attach after ad is created"
            />
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Leave blank when generating a code before the ad exists.
            </span>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Negocio (opcional)
            <input name="business_name" className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Cliente (opcional)
            <input name="customer_name" className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Inicio
            <input type="datetime-local" name="starts_at" required className={`${adminInputClass} mt-1`} defaultValue={defaultStartLocal()} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Fin
            <input type="datetime-local" name="ends_at" required className={`${adminInputClass} mt-1`} defaultValue={defaultEndLocal()} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Código entitlement (opcional)
            <input
              name="entitlement_code"
              className={`${adminInputClass} mt-1 font-mono text-xs uppercase`}
              placeholder="Vacío = generar LX-ENT-…"
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Código contrato (opcional)
            <input name="contract_code" className={`${adminInputClass} mt-1 font-mono text-xs`} />
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold text-[#5C5346]">Alcance de placement</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {PACKAGE_ENTITLEMENT_PLACEMENT_SCOPES.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-xs text-[#3D3428]">
                <input type="checkbox" name="placement_scope" value={s.value} defaultChecked={s.value !== "results"} />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-xs font-semibold text-[#5C5346]">
          Notas (opcional)
          <textarea name="notes" rows={2} className={`${adminInputClass} mt-1`} />
        </label>

        <details className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3 text-xs text-[#5C5346]">
          <summary className="cursor-pointer font-bold text-[#1E1810]">Vista previa de beneficios por tier</summary>
          <ul className="mt-2 space-y-1">
            {PACKAGE_ENTITLEMENT_TIERS.map((t) => {
              const def = getPackageEntitlementBenefits(t.value);
              return (
                <li key={t.value}>
                  <strong>{t.label}:</strong> {benefitLabels(def.benefits).join(", ") || "—"}
                  {def.eligibleForDestacadosModule ? " · Destacados" : ""}
                  {def.eligibleForResultsPriority ? " · Prioridad resultados" : ""}
                </li>
              );
            })}
          </ul>
        </details>

        <button type="submit" className={adminBtnPrimary} disabled={unavailable}>
          Crear package entitlement
        </button>
      </form>

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Entitlements recientes</h2>
        <p className="mt-1 text-xs text-[#7A7164]">Revocar deja el registro; no elimina la fila.</p>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-[#5C5346]/90">Sin entitlements todavía. Crea el primero arriba.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((row) => {
              const effective = effectiveEntitlementStatus(row);
              const labels = benefitLabels(row.benefits);
              return (
                <li
                  key={row.id}
                  className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-[#1E1810]">{row.entitlement_code ?? "—"}</p>
                      <p className="mt-0.5 font-semibold text-[#1E1810]">{formatEntitlementListingHeadline(row)}</p>
                      <p className="text-xs text-[#7A7164]">
                        {row.package_tier} · {row.category} · {row.listing_source}
                        {!row.listing_id ? (
                          <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-950">
                            Pending listing
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-[#5C5346]">{formatEntitlementListingIdLine(row.listing_id)}</p>
                      <p className="mt-1 text-xs text-[#5C5346]">
                        {fmt(row.starts_at)} → {fmt(row.ends_at)}
                      </p>
                      <p className="mt-1 text-xs text-[#5C5346]">
                        Beneficios: {labels.length ? labels.join(" · ") : "—"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(effective)}`}>
                      {effective}
                    </span>
                  </div>
                  {effective !== "revoked" ? (
                    <form action={revokePackageEntitlementAction} className="mt-3">
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className={`${adminBtnSecondary} text-xs`}>
                        Revocar
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link href="/admin" className={`${adminBtnSecondary} inline-flex`}>
        ← Dashboard
      </Link>
    </div>
  );
}
