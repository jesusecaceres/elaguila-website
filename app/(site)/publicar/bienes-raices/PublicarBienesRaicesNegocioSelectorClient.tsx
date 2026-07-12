"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiArrowRight, FiBriefcase, FiHome, FiMapPin } from "react-icons/fi";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  BR_NEGOCIO_DEFAULT_CATEGORIA,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  normalizeBrAgenteResidencialLang,
  withBrAgenteResLangParam,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialLang";
import {
  BR_INVENTORY_CHILD_MODE_VALUE,
  BR_INVENTORY_CHILD_Q_DRAFT_ID,
  BR_INVENTORY_CHILD_Q_PROPIEDAD,
  buildBrInventoryChildCancelHref,
  buildBrInventoryChildReturnToParentHref,
  isBrInventoryChildMode,
  readBrInventoryChildContext,
  writeBrInventoryChildContext,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryChildContext";

const CARD =
  "flex w-full cursor-pointer flex-col rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 text-left shadow-[0_6px_24px_-12px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_10px_32px_-14px_rgba(42,36,22,0.14)] sm:p-5";

const CARD_ON = "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] ring-1 ring-[color:var(--lx-gold-border)]/40";

const PROP_OPTIONS: { id: BrNegocioCategoriaPropiedad; labelEs: string; labelEn: string; hintEs: string; hintEn: string }[] = [
  {
    id: "residencial",
    labelEs: "Residencial",
    labelEn: "Residential",
    hintEs: "Casas, condominios, townhomes.",
    hintEn: "Homes, condominiums, townhomes.",
  },
  {
    id: "comercial",
    labelEs: "Comercial",
    labelEn: "Commercial",
    hintEs: "Locales, oficinas, retail.",
    hintEn: "Storefronts, offices, retail.",
  },
  {
    id: "terreno_lote",
    labelEs: "Terreno / lote",
    labelEn: "Land / Lot",
    hintEs: "Parcelas y tierras.",
    hintEn: "Parcels and land.",
  },
];

export function PublicarBienesRaicesNegocioSelectorClient() {
  const searchParams = useSearchParams();
  const lang = useMemo(() => normalizeBrAgenteResidencialLang(searchParams?.get("lang")), [searchParams]);
  const inventoryChild = isBrInventoryChildMode(searchParams);

  const sessionCtx = useMemo(() => (inventoryChild ? readBrInventoryChildContext() : null), [inventoryChild]);

  const parentPropiedad =
    parseBrNegocioPropiedadParam(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD)) ??
    sessionCtx?.parentPropiedad ??
    BR_NEGOCIO_DEFAULT_CATEGORIA;

  const childDraftId =
    searchParams?.get(BR_INVENTORY_CHILD_Q_DRAFT_ID)?.trim() || sessionCtx?.childDraftId || "";

  const highlight =
    parseBrNegocioPropiedadParam(searchParams?.get(BR_INVENTORY_CHILD_Q_PROPIEDAD)) ??
    parentPropiedad;

  const [propiedad, setPropiedad] = useState<BrNegocioCategoriaPropiedad>(highlight);

  const inventoryContextValid = inventoryChild && Boolean(childDraftId);

  const continuarHref = useMemo(() => {
    if (inventoryContextValid) {
      return buildBrInventoryChildReturnToParentHref({
        childDraftId,
        parentPropiedad,
        childPropiedad: propiedad,
        lang,
        inventoryGroupId: sessionCtx?.inventoryGroupId ?? searchParams?.get("inventoryGroupId"),
      });
    }
    const qs = new URLSearchParams();
    qs.set(BR_NEGOCIO_Q_PROPIEDAD, propiedad);
    const path = `${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`;
    return withBrAgenteResLangParam(path, lang);
  }, [
    childDraftId,
    inventoryContextValid,
    lang,
    parentPropiedad,
    propiedad,
    searchParams,
    sessionCtx?.inventoryGroupId,
  ]);

  const cancelHref = useMemo(() => {
    if (!inventoryContextValid) return "/clasificados/publicar";
    return buildBrInventoryChildCancelHref({ parentPropiedad, lang });
  }, [inventoryContextValid, lang, parentPropiedad]);

  const publicarHubHref = "/clasificados/publicar";

  const onContinueClick = () => {
    if (!inventoryContextValid) return;
    writeBrInventoryChildContext({
      mode: BR_INVENTORY_CHILD_MODE_VALUE,
      childDraftId,
      parentPropiedad,
      childPropiedad: propiedad,
      inventoryGroupId: sessionCtx?.inventoryGroupId ?? searchParams?.get("inventoryGroupId")?.trim() ?? null,
      lang,
      savedAt: Date.now(),
    });
  };

  const title = inventoryChild
    ? lang === "en"
      ? "Add property to inventory"
      : "Agregar propiedad al inventario"
    : lang === "en"
      ? "Start listing"
      : "Empezar publicación";

  const subtitle = inventoryChild
    ? lang === "en"
      ? "Choose the property channel for this inventory property. Your main listing stays unchanged — Residential, Commercial, and Land can share the same inventory package."
      : "Elige el canal de esta propiedad del inventario. El anuncio principal no cambia — Residencial, Comercial y Terreno pueden compartir el mismo paquete."
    : lang === "en"
      ? "Publish as an agent or seller. Choose the property type; you will complete the listing in the next steps."
      : "Publicación como agente o vendedor. Elige el tipo de propiedad; podrás completar el anuncio en los pasos siguientes.";

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 pt-10 text-[color:var(--lx-text)] sm:pb-20 sm:pt-12"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-2xl px-4 sm:px-6">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link
            href={inventoryChild ? cancelHref : publicarHubHref}
            className="text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
          >
            {inventoryChild
              ? lang === "en"
                ? "← Back to inventory"
                : "← Volver al inventario"
              : lang === "en"
                ? "← Publish"
                : "← Publicar"}
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">
            {inventoryChild
              ? lang === "en"
                ? "Bienes Raíces · Inventory child"
                : "Bienes Raíces · Inventario hijo"
              : "Bienes Raíces · Negocio"}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">{subtitle}</p>
        </header>

        {inventoryChild && !inventoryContextValid ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
            {lang === "en"
              ? "Inventory context is missing or invalid. Return to your main listing and use Add property to inventory again."
              : "Falta el contexto de inventario o no es válido. Vuelve al anuncio principal y usa Agregar propiedad al inventario otra vez."}
            <div className="mt-3">
              <Link href={cancelHref} className="font-semibold underline">
                {lang === "en" ? "Return to parent application" : "Volver al anuncio principal"}
              </Link>
            </div>
          </div>
        ) : null}

        {!inventoryChild ? (
          <section className="mt-8 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
                <FiBriefcase className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
                  {lang === "en" ? "Publication" : "Publicación"}
                </p>
                <p className="mt-1 text-sm font-bold text-[color:var(--lx-text)]">
                  {lang === "en" ? "Agent / seller" : "Agente / vendedor"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
                  {lang === "en"
                    ? "One professional flow. You can add a second agent or support contact later in the form."
                    : "Un solo flujo profesional. Podrás añadir un segundo agente o contacto de apoyo más adelante en el formulario."}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
            {lang === "en" ? "Property type" : "Tipo de propiedad"}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PROP_OPTIONS.map((o) => {
              const on = propiedad === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPropiedad(o.id)}
                  className={`${CARD} ${on ? CARD_ON : ""}`}
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
                    {o.id === "terreno_lote" ? (
                      <FiMapPin className="h-5 w-5" aria-hidden />
                    ) : (
                      <FiHome className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <span className="mt-3 text-sm font-bold text-[color:var(--lx-text)]">
                    {lang === "en" ? o.labelEn : o.labelEs}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
                    {lang === "en" ? o.hintEn : o.hintEs}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {inventoryContextValid || !inventoryChild ? (
            <Link
              href={continuarHref}
              onClick={onContinueClick}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[color:var(--lx-gold)] px-6 text-sm font-bold text-[#1E1810] shadow-sm transition hover:brightness-95"
            >
              {inventoryChild
                ? lang === "en"
                  ? "Continue to property form"
                  : "Continuar al formulario"
                : lang === "en"
                  ? "Continue to form"
                  : "Continuar al formulario"}
              <FiArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : null}
          <p className="text-[11px] text-[color:var(--lx-muted)]">
            {inventoryChild
              ? lang === "en"
                ? "The main listing channel stays the same. Only this inventory property uses the channel you select."
                : "El canal del anuncio principal no cambia. Solo esta propiedad del inventario usa el canal que elijas."
              : lang === "en"
                ? "The chosen category is reflected in the form URL."
                : "La categoría elegida se refleja en la URL del formulario."}
          </p>
        </div>
      </div>
    </div>
  );
}
