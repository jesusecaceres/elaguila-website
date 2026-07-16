"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { trackListingSave } from "@/app/lib/clasificadosAnalytics";
import { copyToClipboard } from "@/app/components/cta";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import {
  LEONIX_DP_BR_LISTING_STATUS,
  LEONIX_DP_BR_SHOW_EXACT_ADDRESS,
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import { BrAgenteResidencialLocaleProvider } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/BrAgenteResidencialLocaleContext";
import { AgenteIndividualResidencialPreviewPage } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewPage";
import {
  createEmptyAgenteIndividualResidencialState,
  type AgenteIndividualResidencialFormState,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import type { BienesAdditionalBusinessLink } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { RelatedBrAgentProperties } from "@/app/clasificados/bienes-raices/components/RelatedBrAgentProperties";
import { fetchBrRelatedInventoryListingsForDetail } from "@/app/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser";
import type { BrNegocioListing } from "@/app/clasificados/bienes-raices/resultados/cards/listingTypes";

type Lang = "es" | "en";

export type BienesLiveListingLike = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  businessName?: string | null;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
  owner_id?: string | null;
  leonix_ad_id?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  zip?: string | null;
};

type ParentIdentityRow = {
  id: string;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
};

const PARENT_SELECT =
  "id, business_name, business_meta, contact_phone, contact_email, status, is_published, category, seller_type";

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pairValue(detailPairs: unknown, label: string): string {
  return readLeonixDetailPairValue(detailPairs, label) ?? "";
}

function humanPairValue(detailPairs: unknown, labels: string[]): string {
  for (const label of labels) {
    const value = pairValue(detailPairs, label);
    if (value && value !== "—") return value;
  }
  return "";
}

function numberString(raw: unknown): string {
  const s = trim(raw);
  if (!s || s === "—") return "";
  const match = s.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match?.[0] ?? "";
}

function splitBaths(raw: string): { baths: string; halfBaths: string } {
  const s = trim(raw);
  if (!s || s === "—") return { baths: "", halfBaths: "" };
  const half = s.match(/(\d+)\s*med/i)?.[1] ?? "";
  const first = s.replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0] ?? "";
  if (first.includes(".")) {
    const n = Number(first);
    if (Number.isFinite(n)) {
      const whole = Math.floor(n);
      return { baths: whole > 0 ? String(whole) : "", halfBaths: n - whole >= 0.5 ? "1" : "" };
    }
  }
  return { baths: first, halfBaths: half };
}

function normalizeUrl(raw: unknown): string {
  const s = trim(raw);
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return s;
}

function socialUrls(raw: unknown): string[] {
  return trim(raw)
    .split(/\r?\n/)
    .map(normalizeUrl)
    .filter(Boolean);
}

function parseBusinessExtraLinks(raw: unknown): BienesAdditionalBusinessLink[] {
  return parseJsonArray(raw)
    .map((item): BienesAdditionalBusinessLink | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const title = trim(obj.title);
      const url = normalizeUrl(obj.url);
      return url ? { title, url } : null;
    })
    .filter((item): item is BienesAdditionalBusinessLink => Boolean(item))
    .slice(0, 2);
}

function firstSocialFor(raw: unknown, token: string): string {
  return socialUrls(raw).find((url) => url.toLowerCase().includes(token)) ?? "";
}

function listingStatus(detailPairs: unknown): AgenteIndividualResidencialFormState["estadoAnuncio"] {
  const raw = pairValue(detailPairs, LEONIX_DP_BR_LISTING_STATUS).toLowerCase();
  if (raw === "bajo_contrato") return "bajo_contrato";
  if (raw === "vendido") return "vendido";
  if (raw === "pendiente") return "pendiente";
  return "disponible";
}

function subtypeFromPair(detailPairs: unknown): string {
  const raw = humanPairValue(detailPairs, ["Subtipo", "Tipo"]);
  if (!raw || raw === "—") return "";
  return raw
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) ?? "";
}

function splitCoAgent(raw: unknown): { name: string; title: string; phone: string; email: string } {
  const parts = trim(raw)
    .split("·")
    .map((part) => part.trim());
  return {
    name: parts[0] ?? "",
    title: parts[1] ?? "",
    phone: parts.find((part) => /\d{3}/.test(part)) ?? "",
    email: parts.find((part) => /@/.test(part)) ?? "",
  };
}

function buildPublishedState(input: {
  listing: BienesLiveListingLike;
  parentIdentity?: ParentIdentityRow | null;
  lang: Lang;
}): AgenteIndividualResidencialFormState {
  const { listing, parentIdentity } = input;
  const identityMeta = parseJsonObject(parentIdentity?.business_meta ?? listing.business_meta);
  const detailPairs = listing.detailPairs;
  const contract = parseLeonixListingContract(detailPairs);
  const facets = parseLeonixMachineFacetRead(detailPairs);
  const gate = parseJsonObject(pairValue(detailPairs, "Leonix:br_gate12d_v1"));
  const contact = parseJsonObject(pairValue(detailPairs, "Leonix:contact_channels_v1"));
  const base = createEmptyAgenteIndividualResidencialState();
  const photos = (listing.images ?? []).map(trim).filter(Boolean);
  const baths = splitBaths(humanPairValue(detailPairs, ["Baños", "Bathrooms"]));
  const metaSocial = identityMeta.negocioRedes;
  const website = normalizeUrl(identityMeta.negocioSitioWeb ?? contact.website);
  const email = trim(identityMeta.negocioEmail) || trim(parentIdentity?.contact_email) || trim(listing.contact_email);
  const phone = trim(identityMeta.negocioTelOficina) || trim(parentIdentity?.contact_phone) || trim(listing.contact_phone);
  const coAgent = splitCoAgent(identityMeta.negocioCoAgente);
  const broker = splitCoAgent(identityMeta.negocioSocioFinanciero);
  const rawPrice = listing.priceLabel[input.lang] || listing.priceLabel.es || listing.priceLabel.en;
  const category = contract.categoriaPropiedad ?? "residencial";
  const showExact = pairValue(detailPairs, LEONIX_DP_BR_SHOW_EXACT_ADDRESS).toLowerCase() === "true";

  return {
    ...base,
    sellerTipo: "agente_individual",
    categoriaPropiedad: category,
    titulo: listing.title[input.lang] || listing.title.es || listing.title.en,
    precio: numberString(rawPrice),
    ciudad: listing.city,
    areaCiudad: trim(gate.neighborhood),
    direccionLinea1: trim(gate.streetAddress),
    direccionEstado: pairValue(detailPairs, "Leonix:state"),
    direccionCodigoPostal: pairValue(detailPairs, "Leonix:postal_code") || trim(listing.zip),
    direccionPais: pairValue(detailPairs, "Leonix:country") || base.direccionPais,
    direccion: humanPairValue(detailPairs, ["Dirección", "Address"]),
    mostrarDireccionExacta: showExact,
    estadoAnuncio: listingStatus(detailPairs),
    tipoPropiedadCodigo: facets.resultsPropertyKind === "departamento" ? "condominio" : "casa",
    subtipoPropiedad: category === "residencial" ? subtypeFromPair(detailPairs) : "",
    comercialTipoCodigo: "oficina",
    comercialSubtipoPropiedad: category === "comercial" ? subtypeFromPair(detailPairs) : "",
    comercialUso: humanPairValue(detailPairs, ["Uso", "Commercial use"]),
    comercialOficinas: humanPairValue(detailPairs, ["Oficinas", "Office spaces"]),
    comercialNiveles: humanPairValue(detailPairs, ["Niveles", "Levels"]),
    terrenoTipoCodigo: "rancho",
    terrenoSubtipoPropiedad: category === "terreno_lote" ? subtypeFromPair(detailPairs) : "",
    terrenoUsoZonificacion: humanPairValue(detailPairs, ["Zonificación", "Zona", "Uso de suelo"]),
    terrenoServicios: humanPairValue(detailPairs, ["Servicios"]),
    terrenoTopografia: humanPairValue(detailPairs, ["Topografía"]),
    fotosDataUrls: photos,
    fotoPortadaIndex: 0,
    videoUrl: "",
    videoUrls: parseJsonArray(identityMeta.negocioExternalVideoUrls).map(normalizeUrl).filter(Boolean).slice(0, 4),
    tourUrl: normalizeUrl(gate.virtualTourUrl ?? contact.tourUrl),
    brochureUrl: normalizeUrl(gate.brochureUrl ?? contact.brochureUrl),
    recamaras: facets.bedroomsCount != null ? String(facets.bedroomsCount) : humanPairValue(detailPairs, ["Recámaras", "Habitaciones", "Bedrooms"]),
    banos: facets.bathroomsCount != null ? String(Math.floor(facets.bathroomsCount)) : baths.baths,
    mediosBanos: facets.bathroomsCount != null && facets.bathroomsCount % 1 >= 0.5 ? "1" : baths.halfBaths,
    tamanoInteriorSqft: numberString(humanPairValue(detailPairs, ["Pies cuadrados", "Superficie", "Sq ft", "Interior"])),
    tamanoLoteSqft: numberString(humanPairValue(detailPairs, ["Lote", "Tamaño del lote", "Lot"])),
    estacionamientos: facets.parkingSpots != null && facets.parkingSpots > 0 ? String(facets.parkingSpots) : "",
    descripcionPrincipal: stripLeonixPublishedDescriptionBody(listing.blurb[input.lang] || listing.blurb.es || listing.blurb.en),
    agenteFotoDataUrl: trim(identityMeta.negocioFotoAgenteUrl),
    agenteNombre: trim(identityMeta.negocioAgente),
    agenteTitulo: trim(identityMeta.negocioCargo),
    agenteLicencia: trim(identityMeta.negocioLicencia),
    agenteTelefonoPersonal: phone,
    agenteTelefonoOficina: phone,
    agenteWhatsapp: phone,
    agenteSitioWeb: website,
    correoPrincipal: email,
    marcaNombre: trim(identityMeta.negocioNombreCorreduria) || trim(parentIdentity?.business_name) || trim(listing.business_name),
    marcaLogoDataUrl: trim(identityMeta.negocioLogoUrl),
    marcaLicencia: trim(identityMeta.negocioLicencia),
    marcaSitioWeb: website,
    mostrarMarcaEnTarjeta: true,
    socialInstagram: firstSocialFor(metaSocial, "instagram"),
    socialFacebook: firstSocialFor(metaSocial, "facebook"),
    socialYoutube: firstSocialFor(metaSocial, "youtube"),
    socialTiktok: firstSocialFor(metaSocial, "tiktok"),
    socialX: firstSocialFor(metaSocial, "twitter") || firstSocialFor(metaSocial, "x.com"),
    googleBusinessUrl: normalizeUrl(identityMeta.negocioGoogleBusinessUrl),
    googleReviewsUrl: normalizeUrl(identityMeta.negocioGoogleReviewsUrl),
    yelpReviewsUrl: normalizeUrl(identityMeta.negocioYelpReviewsUrl),
    businessExtraUrls: parseBusinessExtraLinks(identityMeta.negocioBusinessExtraUrls),
    agenteAreaServicio: trim(identityMeta.negocioZonasServicio),
    agenteIdiomas: trim(identityMeta.negocioIdiomas),
    mostrarSegundoAgente: Boolean(coAgent.name),
    agente2Nombre: coAgent.name,
    agente2Titulo: coAgent.title,
    agente2TelefonoPersonal: coAgent.phone,
    agente2TelefonoOficina: coAgent.phone,
    agente2Whatsapp: coAgent.phone,
    agente2Correo: coAgent.email,
    mostrarBrokerAsesor: Boolean(broker.name),
    brokerNombre: broker.name,
    brokerTitulo: broker.title,
    brokerTelefonoPersonal: broker.phone,
    brokerTelefonoOficina: broker.phone,
    brokerWhatsapp: broker.phone,
    brokerEmail: broker.email,
    brokerSitioWeb: website,
    permitirSolicitarInformacion: true,
    permitirProgramarVisita: true,
    permitirLlamar: true,
    permitirWhatsApp: true,
    permitirVerSitioWeb: Boolean(website),
    permitirVerRedes: true,
    permitirVerListadoCompleto: true,
    permitirVerTour: Boolean(normalizeUrl(gate.virtualTourUrl ?? contact.tourUrl)),
    permitirVerFolleto: Boolean(normalizeUrl(gate.brochureUrl ?? contact.brochureUrl)),
    ctaNumeroLlamadas: phone,
    ctaNumeroWhatsapp: phone,
    ctaCorreoSolicitarInfo: email,
    ctaEnlaceProgramarVisita: email ? `mailto:${email}` : "",
    ctaEnlaceSitioWeb: website,
    ctaUrlListadoCompleto: website,
    ctaUrlTour: normalizeUrl(gate.virtualTourUrl ?? contact.tourUrl),
    ctaUrlFolleto: normalizeUrl(gate.brochureUrl ?? contact.brochureUrl),
    extraOpenHouse: Boolean(gate.openHouseEnabled),
    openHouseSlots: gate.openHouseEnabled
      ? [
          {
            fecha: trim(gate.openHouseDate),
            fechaFin: trim(gate.openHouseEndDate),
            inicio: trim(gate.openHouseStartTime),
            fin: trim(gate.openHouseEndTime),
            diasHorariosAdicionales: trim(gate.openHouseAdditionalDays),
            notas: trim(gate.openHouseNotes),
          },
        ]
      : [],
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: photos.length > 0,
    confirmCommunityRules: true,
    confirmPaymentAfterPreview: true,
  };
}

function PublicChromeActions({
  listingId,
  lang,
  ownerId,
}: {
  listingId: string;
  lang: Lang;
  ownerId?: string | null;
}) {
  const [saved, setSaved] = useState(false);
  const [copyHint, setCopyHint] = useState("");

  const save = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      const here = `${window.location.pathname}${window.location.search || ""}`;
      window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      return;
    }
    if (saved) {
      await sb.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setSaved(false);
      void trackListingSave(listingId, false, { ownerUserId: ownerId ?? undefined });
    } else {
      await sb.from("saved_listings").insert({ user_id: user.id, listing_id: listingId });
      setSaved(true);
      void trackListingSave(listingId, true, { ownerUserId: ownerId ?? undefined });
    }
  }, [listingId, ownerId, saved]);

  const share = useCallback(async () => {
    const ok = await copyToClipboard(window.location.href);
    setCopyHint(ok ? (lang === "en" ? "Copied" : "Copiado") : "");
    window.setTimeout(() => setCopyHint(""), 1800);
  }, [lang]);

  return (
    <div className="flex min-w-0 items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={save}
        className="inline-flex min-h-9 items-center gap-1 rounded-full border bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5C4A28] transition hover:bg-[#FFF6E7]"
        style={{ borderColor: "rgba(201, 180, 106, 0.42)" }}
      >
        <FiHeart className={saved ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} aria-hidden />
        <span className="hidden sm:inline">{saved ? (lang === "en" ? "Saved" : "Guardado") : lang === "en" ? "Save" : "Guardar"}</span>
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-9 items-center gap-1 rounded-full border bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5C4A28] transition hover:bg-[#FFF6E7]"
        style={{ borderColor: "rgba(201, 180, 106, 0.42)" }}
      >
        <FiShare2 className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">{copyHint || (lang === "en" ? "Share" : "Compartir")}</span>
      </button>
    </div>
  );
}

export function BienesRaicesNegocioLiveDetailShell({
  listing,
  lang,
}: {
  listing: BienesLiveListingLike;
  lang: Lang;
}) {
  const [parentIdentity, setParentIdentity] = useState<ParentIdentityRow | null>(null);
  const [portfolio, setPortfolio] = useState<BrNegocioListing[]>([]);
  const parentId = listing.br_inventory_parent_listing_id?.trim() || null;
  const groupId = listing.br_inventory_group_id?.trim() || listing.id;
  const isChild = listing.inventory_role === "inventory_property" && Boolean(parentId);

  useEffect(() => {
    let cancelled = false;
    if (!parentId) {
      setParentIdentity(null);
      return;
    }
    void (async () => {
      const sb = createSupabaseBrowserClient();
      const result = await listingsQueryWithSelectShrink<Record<string, unknown> | null>(PARENT_SELECT, async (cols) => {
        const res = await sb
          .from("listings")
          .select(cols)
          .eq("id", parentId)
          .eq("category", "bienes-raices")
          .eq("status", "active")
          .eq("is_published", true)
          .maybeSingle();
        return { data: (res.data as Record<string, unknown> | null) ?? null, error: res.error ? { message: res.error.message } : null };
      });
      if (!cancelled) setParentIdentity(result.data ? (result.data as ParentIdentityRow) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [parentId]);

  useEffect(() => {
    let cancelled = false;
    void fetchBrRelatedInventoryListingsForDetail({
      currentListingId: listing.id,
      ownerId: listing.owner_id,
      brInventoryGroupId: groupId,
      brInventoryParentListingId: listing.br_inventory_parent_listing_id,
      currentInventoryRole: listing.inventory_role,
      lang,
      limit: 4,
    }).then((rows) => {
      if (!cancelled) setPortfolio(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, lang, listing.br_inventory_parent_listing_id, listing.id, listing.inventory_role, listing.owner_id]);

  const data = useMemo(() => buildPublishedState({ listing, parentIdentity, lang }), [lang, listing, parentIdentity]);

  return (
    <BrAgenteResidencialLocaleProvider>
      <div className="bg-[#F9F6F1]">
        <AgenteIndividualResidencialPreviewPage
          data={data}
          publicChrome={{
            eyebrow: (
              <Link
                href={`/clasificados/bienes-raices/resultados?lang=${lang}`}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6E5418] underline-offset-4 hover:underline sm:text-xs"
              >
                {lang === "en" ? "Back to Real estate" : "Volver a Bienes Raíces"}
              </Link>
            ),
            meta: listing.leonix_ad_id ? `${listing.leonix_ad_id} · ${lang === "en" ? "Published listing" : "Anuncio publicado"}` : null,
            headerRight: <PublicChromeActions listingId={listing.id} lang={lang} ownerId={listing.owner_id} />,
          }}
        />
        {!isChild && portfolio.length ? (
          <div className="mx-auto max-w-[1140px] px-4 pb-16 sm:px-6 lg:px-7">
            <RelatedBrAgentProperties listings={portfolio} lang={lang} groupId={groupId} />
          </div>
        ) : null}
      </div>
    </BrAgenteResidencialLocaleProvider>
  );
}
