/**
 * Gate 12D-2: stable JSONB payload contract for Rentas + Bienes Raices listings.
 *
 * `detail_pairs` remains the human/fallback transport. These helpers keep optional
 * category-specific fields queryable in `listing_json`, `profile_json`, and `contact_json`.
 */

import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";
import {
  LEONIX_DP_BR_GATE12D_V1,
  parseBrGate12dV1,
  serializeBrGate12dV1Payload,
  type BrGate12dV1Payload,
} from "@/app/clasificados/lib/leonixBrGate12d";
import {
  LEONIX_DP_CONTACT_CHANNELS_V1,
  enrichContactChannelsFromBusinessMeta,
  parseLeonixContactChannelsV1FromDetailPairs,
  serializeLeonixContactChannelsV1Payload,
} from "@/app/clasificados/lib/leonixContactChannelsV1";
import {
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";

export type LeonixJsonRecord = Record<string, unknown>;

function trim(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function digitsOnly(v: unknown, max = 15): string {
  return trim(v).replace(/\D/g, "").slice(0, max);
}

function compact(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const t = value.trim();
    return t ? t : undefined;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const arr = value.map(compact).filter((x) => x !== undefined);
    return arr.length ? arr : undefined;
  }
  if (typeof value === "object") {
    const out: LeonixJsonRecord = {};
    for (const [k, v] of Object.entries(value as LeonixJsonRecord)) {
      const c = compact(v);
      if (c !== undefined) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

export function compactLeonixJsonRecord(record: LeonixJsonRecord): LeonixJsonRecord | null {
  const c = compact(record);
  return c && typeof c === "object" && !Array.isArray(c) ? (c as LeonixJsonRecord) : null;
}

export function parseLeonixJsonRecordColumn(raw: unknown): LeonixJsonRecord | null {
  if (!raw) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as LeonixJsonRecord;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as LeonixJsonRecord) : null;
  } catch {
    return null;
  }
}

function listingJsonBrGate12dPayload(listingJson: unknown): BrGate12dV1Payload | null {
  const rec = parseLeonixJsonRecordColumn(listingJson);
  const fromBr = rec?.br;
  if (!fromBr || typeof fromBr !== "object" || Array.isArray(fromBr)) return null;
  const gate = (fromBr as LeonixJsonRecord).gate12d;
  if (!gate || typeof gate !== "object" || Array.isArray(gate)) return null;
  const payload = gate as Partial<BrGate12dV1Payload>;
  return payload.v === 1 ? (payload as BrGate12dV1Payload) : null;
}

function contactChannelsPayload(contactJson: unknown): unknown {
  const rec = parseLeonixJsonRecordColumn(contactJson);
  const channels = rec?.channels;
  if (channels && typeof channels === "object" && !Array.isArray(channels)) return channels;
  return null;
}

function appendPairIfMissing(
  rows: Array<{ label: string; value: string }>,
  label: string,
  value: string | null,
): Array<{ label: string; value: string }> {
  if (!value?.trim()) return rows;
  if (rows.some((r) => r.label === label)) return rows;
  return [...rows, { label, value }];
}

export function normalizeLeonixDetailPairs(detailPairs: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(detailPairs)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: unknown; value?: unknown };
    const label = trim(o.label);
    const value = trim(o.value);
    if (label && value) out.push({ label, value });
  }
  return out;
}

/**
 * Public read fallback: newer rows can hydrate the existing live/card parsers from JSONB
 * even when `detail_pairs` did not receive the machine JSON row.
 */
export function augmentLeonixDetailPairsFromStructuredColumns(
  detailPairs: unknown,
  listingJson: unknown,
  contactJson: unknown,
): Array<{ label: string; value: string }> {
  let rows = normalizeLeonixDetailPairs(detailPairs);
  const g12 = listingJsonBrGate12dPayload(listingJson);
  if (g12) rows = appendPairIfMissing(rows, LEONIX_DP_BR_GATE12D_V1, serializeBrGate12dV1Payload(g12));

  const channels = contactChannelsPayload(contactJson);
  if (channels) {
    rows = appendPairIfMissing(rows, LEONIX_DP_CONTACT_CHANNELS_V1, JSON.stringify(channels));
  }
  return rows;
}

export function buildLeonixListingJsonPayload(args: {
  category: "bienes-raices" | "rentas";
  detailPairs: unknown;
  city: string;
  state?: string | null;
  zip?: string | null;
}): LeonixJsonRecord | null {
  const detailPairs = normalizeLeonixDetailPairs(args.detailPairs);
  const contract = parseLeonixListingContract(detailPairs);
  const machine = parseLeonixMachineFacetRead(detailPairs);
  const zip = digitsOnly(args.zip || machine.postalCode || "", 12);
  const base = {
    v: 1,
    category: args.category,
    contract: {
      branch: contract.branch,
      operation: contract.operation,
      propertyCategory: contract.categoriaPropiedad,
      lifecycle: contract.lifecycle,
    },
    location: {
      city: args.city,
      state: args.state,
      zip,
    },
    facets: machine,
  };

  if (args.category === "bienes-raices") {
    const brGate12d = parseBrGate12dV1(detailPairs);
    return compactLeonixJsonRecord({
      ...base,
      br: {
        gate12d: brGate12d,
        structuredAddress: brGate12d
          ? {
              streetAddress: brGate12d.streetAddress,
              unit: brGate12d.unit,
              city: args.city,
              state: brGate12d.state || args.state,
              zip: brGate12d.zip || zip,
              neighborhood: brGate12d.neighborhood,
            }
          : null,
      },
    });
  }

  const rx = parseRentasDetailMachineRead(detailPairs);
  return compactLeonixJsonRecord({
    ...base,
    rentas: {
      location: {
        city: args.city,
        state: args.state,
        zip,
        mapUrl: rx.mapUrl,
      },
      lease: {
        depositUsd: rx.depositUsdDigits,
        leaseTermCode: rx.leaseTermCode,
        leaseTermCustom: rx.leaseTermCustom,
        availabilityNote: rx.availabilityNote,
        leaseConditions: rx.leaseConditions,
      },
      rules: {
        servicesIncluded: rx.servicesIncluded,
        requirements: rx.requirements,
        petsCode: rx.petsCode,
        furnishedCode: rx.furnishedCode,
      },
      showing: {
        videoUrl: rx.videoUrl,
      },
      space: {
        rentalTypeCode: rx.rentalTypeCode,
        rentalTypeCustom: rx.rentalTypeCustom,
        roomBathKind: rx.roomBathKind,
        roomKitchenKind: rx.roomKitchenKind,
        roomMaxOccupants: rx.roomMaxOccupants,
        storageAccess24h: rx.storageAccess24h,
        storageSecurity: rx.storageSecurity,
      },
    },
  });
}

export function buildLeonixContactJsonPayload(args: {
  detailPairs: unknown;
  businessMetaJson?: string | null;
  contactPhoneDigits?: string | null;
  contactEmail?: string | null;
}): LeonixJsonRecord | null {
  const detailPairs = normalizeLeonixDetailPairs(args.detailPairs);
  const meta = parseBusinessMeta(args.businessMetaJson);
  const channels = enrichContactChannelsFromBusinessMeta(parseLeonixContactChannelsV1FromDetailPairs(detailPairs), meta);
  return compactLeonixJsonRecord({
    v: 1,
    phone: digitsOnly(args.contactPhoneDigits, 15),
    email: args.contactEmail,
    channels,
  });
}

export function buildLeonixProfileJsonPayload(args: {
  sellerType: "personal" | "business";
  businessName?: string | null;
  businessMetaJson?: string | null;
}): LeonixJsonRecord | null {
  return compactLeonixJsonRecord({
    v: 1,
    sellerType: args.sellerType,
    businessName: args.businessName,
    businessMeta: parseBusinessMeta(args.businessMetaJson),
  });
}
