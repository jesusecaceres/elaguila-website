import { isRegisteredOrderHandoff } from "@/app/tienda/order/orderHandoffRegistry";
import { assertTiendaOrderId } from "@/app/lib/tienda/tiendaBlobPrefix";
import type { TiendaAssetSummaryKind, TiendaFulfillmentPreference, TiendaOrderSource } from "@/app/tienda/types/orderHandoff";
import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";

const MAX_CHUNK = 4000;

function trimStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const FULFILLMENT: TiendaFulfillmentPreference[] = ["local-pickup", "local-delivery-discuss", "shipping-discuss"];

export function validateTiendaOrderPayload(body: unknown):
  | { ok: true; payload: TiendaOrderSubmissionPayload }
  | { ok: false; error: string; code: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body", code: "BAD_JSON" };
  }
  const b = body as Record<string, unknown>;
  if (b.v !== 2) {
    return { ok: false, error: "Unsupported payload version", code: "BAD_VERSION" };
  }

  const orderId = trimStr(b.orderId, 80);
  if (!orderId || !assertTiendaOrderId(orderId)) {
    return { ok: false, error: "Valid orderId is required (use /api/tienda/orders/prepare)", code: "BAD_ORDER_ID" };
  }

  const source = b.source as TiendaOrderSource;
  const productSlug = trimStr(b.productSlug, 200);
  if (!isRegisteredOrderHandoff(String(source), productSlug)) {
    return { ok: false, error: "Invalid source or product", code: "INVALID_PRODUCT" };
  }

  const customer = b.customer as Record<string, unknown> | undefined;
  if (!customer || typeof customer !== "object") {
    return { ok: false, error: "Missing customer", code: "MISSING_CUSTOMER" };
  }

  const fullName = trimStr(customer.fullName, 200);
  const email = trimStr(customer.email, 320);
  const phone = trimStr(customer.phone, 80);
  if (!fullName) {
    return { ok: false, error: "Full name is required", code: "VALIDATION" };
  }
  if (!email || !isEmail(email)) {
    return { ok: false, error: "Valid email is required", code: "VALIDATION" };
  }
  if (!phone || phone.length < 5) {
    return { ok: false, error: "Phone is required", code: "VALIDATION" };
  }

  const fulfillment = b.fulfillment as TiendaFulfillmentPreference;
  if (!FULFILLMENT.includes(fulfillment)) {
    return { ok: false, error: "Fulfillment preference is required", code: "VALIDATION" };
  }

  const parseLocalized = (x: unknown): { es: string; en: string }[] => {
    if (!Array.isArray(x)) return [];
    return x
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        return { es: trimStr(r.es, 500), en: trimStr(r.en, 500) };
      })
      .filter((v): v is { es: string; en: string } => v !== null && (!!v.es || !!v.en));
  };

  const parseAssets = (x: unknown): TiendaOrderSubmissionPayload["assets"] => {
    if (!Array.isArray(x)) return [];
    return x
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const kindRaw = r.kind;
        const kind: TiendaAssetSummaryKind | null =
          kindRaw === "image" || kindRaw === "pdf" || kindRaw === "design-side" ? kindRaw : null;
        if (!kind) return null;
        const metaEs = Array.isArray(r.metaLinesEs) ? r.metaLinesEs.map((m) => trimStr(m, 500)) : [];
        const metaEn = Array.isArray(r.metaLinesEn) ? r.metaLinesEn.map((m) => trimStr(m, 500)) : [];
        return {
          id: trimStr(r.id, 80),
          kind,
          labelEs: trimStr(r.labelEs, 300),
          labelEn: trimStr(r.labelEn, 300),
          metaLinesEs: metaEs,
          metaLinesEn: metaEn,
          hadInlinePreviewHint: r.hadInlinePreviewHint === true,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null && !!v.id);
  };

  const ss = b.sidednessSummary;
  const sidednessSummary =
    ss && typeof ss === "object"
      ? {
          es: trimStr((ss as Record<string, unknown>).es, 500),
          en: trimStr((ss as Record<string, unknown>).en, 500),
        }
      : { es: "", en: "" };

  const apSt = b.approvalStatus;
  const approvalStatus =
    apSt && typeof apSt === "object"
      ? {
          es: trimStr((apSt as Record<string, unknown>).es, 500),
          en: trimStr((apSt as Record<string, unknown>).en, 780),
        }
      : { es: "", en: "" };

  const payload: TiendaOrderSubmissionPayload = {
    v: 2,
    orderId,
    source,
    productSlug,
    productTitleEs: trimStr(b.productTitleEs, 300),
    productTitleEn: trimStr(b.productTitleEn, 300),
    categorySlug: trimStr(b.categorySlug, 120),
    specLines: parseLocalized(b.specLines),
    sidednessSummary,
    assets: parseAssets(b.assets),
    customer: {
      fullName,
      businessName: trimStr(customer.businessName, 200),
      email,
      phone,
      notes: trimStr(customer.notes, MAX_CHUNK),
    },
    fulfillment,
    approvalStatus,
    approvalDetails: parseLocalized(b.approvalDetails),
    warnings: parseLocalized(b.warnings),
    builderSavedAt: b.builderSavedAt == null ? null : trimStr(b.builderSavedAt, 80),
    preferredLang: b.preferredLang === "en" ? "en" : "es",
  };

  if (source === "business-cards") {
    const ex = b.businessCardExtra;
    if (!ex || typeof ex !== "object") {
      return { ok: false, error: "Missing business card details", code: "MISSING_EXTRA" };
    }
    const x = ex as Record<string, unknown>;
    const creationMode = x.creationMode === "upload-existing" ? "upload-existing" : "design-online";

    payload.businessCardExtra = {
      creationMode,
      sidedness: x.sidedness === "two-sided" ? "two-sided" : "one-sided",
      frontFieldLinesEs: Array.isArray(x.frontFieldLinesEs)
        ? x.frontFieldLinesEs.map((l) => trimStr(l, 500))
        : [],
      frontFieldLinesEn: Array.isArray(x.frontFieldLinesEn)
        ? x.frontFieldLinesEn.map((l) => trimStr(l, 500))
        : [],
      backFieldLinesEs: Array.isArray(x.backFieldLinesEs)
        ? x.backFieldLinesEs.map((l) => trimStr(l, 500))
        : [],
      backFieldLinesEn: Array.isArray(x.backFieldLinesEn)
        ? x.backFieldLinesEn.map((l) => trimStr(l, 500))
        : [],
      frontLogoVisible: x.frontLogoVisible === true,
      backLogoVisible: x.backLogoVisible === true,
      frontLogoHasDataUrl: x.frontLogoHasDataUrl === true,
      backLogoHasDataUrl: x.backLogoHasDataUrl === true,
      approval: {
        spellingReviewed: (x.approval as Record<string, unknown>)?.spellingReviewed === true,
        layoutReviewed: (x.approval as Record<string, unknown>)?.layoutReviewed === true,
        printAsApproved: (x.approval as Record<string, unknown>)?.printAsApproved === true,
        noRedesignExpectation: (x.approval as Record<string, unknown>)?.noRedesignExpectation === true,
      },
    };

    if (creationMode === "design-online") {
      const di = x.designIntake;
      if (di === "custom" || di === "template") {
        payload.businessCardExtra.designIntake = di;
      }
      const ts = trimStr(x.templateSlug, 120);
      if (ts) payload.businessCardExtra.templateSlug = ts;
      const tte = trimStr(x.templateTitleEs, 200);
      if (tte) payload.businessCardExtra.templateTitleEs = tte;
      const ttn = trimStr(x.templateTitleEn, 200);
      if (ttn) payload.businessCardExtra.templateTitleEn = ttn;
      if (typeof x.designOnlineExportPixelRatio === "number" && Number.isFinite(x.designOnlineExportPixelRatio)) {
        payload.businessCardExtra.designOnlineExportPixelRatio = x.designOnlineExportPixelRatio;
      }
    }

    if (creationMode === "upload-existing") {
      const ua = x.uploadArtwork as Record<string, unknown> | undefined;
      const uf = ua?.front as Record<string, unknown> | undefined;
      if (!ua || !uf) {
        return { ok: false, error: "Missing business card upload artwork meta", code: "MISSING_EXTRA" };
      }
      const backRaw = ua.back;
      payload.businessCardExtra.uploadArtwork = {
        front: {
          name: trimStr(uf.name, 500),
          mime: trimStr(uf.mime, 120),
          sizeBytes: typeof uf.sizeBytes === "number" && Number.isFinite(uf.sizeBytes) ? uf.sizeBytes : 0,
          widthPx: typeof uf.widthPx === "number" ? uf.widthPx : null,
          heightPx: typeof uf.heightPx === "number" ? uf.heightPx : null,
          sessionHadInlinePreview: uf.sessionHadInlinePreview === true,
        },
        back:
          backRaw && typeof backRaw === "object"
            ? {
                name: trimStr((backRaw as Record<string, unknown>).name, 500),
                mime: trimStr((backRaw as Record<string, unknown>).mime, 120),
                sizeBytes:
                  typeof (backRaw as Record<string, unknown>).sizeBytes === "number" &&
                  Number.isFinite((backRaw as Record<string, unknown>).sizeBytes as number)
                    ? ((backRaw as Record<string, unknown>).sizeBytes as number)
                    : 0,
                widthPx: typeof (backRaw as Record<string, unknown>).widthPx === "number" ? (backRaw as Record<string, unknown>).widthPx as number : null,
                heightPx: typeof (backRaw as Record<string, unknown>).heightPx === "number" ? (backRaw as Record<string, unknown>).heightPx as number : null,
                sessionHadInlinePreview: (backRaw as Record<string, unknown>).sessionHadInlinePreview === true,
              }
            : null,
      };
      const snap = x.rawValidationSnapshot;
      payload.businessCardExtra.rawValidationSnapshot = Array.isArray(snap)
        ? snap.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              severity: trimStr(r.severity, 40),
              messageEs: trimStr(r.messageEs, 500),
              messageEn: trimStr(r.messageEn, 500),
            };
          })
        : [];

      if (payload.businessCardExtra.sidedness === "two-sided" && !payload.businessCardExtra.uploadArtwork.back) {
        return { ok: false, error: "Two-sided upload requires back artwork meta", code: "MISSING_EXTRA" };
      }
    }
  }

  if (source === "print-upload") {
    const ex = b.printUploadExtra;
    if (!ex || typeof ex !== "object") {
      return { ok: false, error: "Missing print upload details", code: "MISSING_EXTRA" };
    }
    const u = ex as Record<string, unknown>;
    const front = u.front as Record<string, unknown> | undefined;
    if (!front) {
      return { ok: false, error: "Missing front file meta", code: "MISSING_EXTRA" };
    }
    const backRaw = u.back;
    payload.printUploadExtra = {
      front: {
        name: trimStr(front.name, 500),
        mime: trimStr(front.mime, 120),
        sizeBytes: typeof front.sizeBytes === "number" && Number.isFinite(front.sizeBytes) ? front.sizeBytes : 0,
        widthPx: typeof front.widthPx === "number" ? front.widthPx : null,
        heightPx: typeof front.heightPx === "number" ? front.heightPx : null,
        sessionHadInlinePreview: front.sessionHadInlinePreview === true,
      },
      back:
        backRaw && typeof backRaw === "object"
          ? {
              name: trimStr((backRaw as Record<string, unknown>).name, 500),
              mime: trimStr((backRaw as Record<string, unknown>).mime, 120),
              sizeBytes:
                typeof (backRaw as Record<string, unknown>).sizeBytes === "number" &&
                Number.isFinite((backRaw as Record<string, unknown>).sizeBytes as number)
                  ? ((backRaw as Record<string, unknown>).sizeBytes as number)
                  : 0,
              widthPx:
                typeof (backRaw as Record<string, unknown>).widthPx === "number"
                  ? ((backRaw as Record<string, unknown>).widthPx as number)
                  : null,
              heightPx:
                typeof (backRaw as Record<string, unknown>).heightPx === "number"
                  ? ((backRaw as Record<string, unknown>).heightPx as number)
                  : null,
              sessionHadInlinePreview: (backRaw as Record<string, unknown>).sessionHadInlinePreview === true,
            }
          : null,
      rawValidationSnapshot: Array.isArray(u.rawValidationSnapshot)
        ? u.rawValidationSnapshot
            .map((r) => {
              if (!r || typeof r !== "object") return null;
              const o = r as Record<string, unknown>;
              return {
                severity: trimStr(o.severity, 40),
                messageEs: trimStr(o.messageEs, 500),
                messageEn: trimStr(o.messageEn, 500),
              };
            })
            .filter((v): v is NonNullable<typeof v> => v !== null)
        : [],
    };
  }

  if (!payload.productTitleEn && !payload.productTitleEs) {
    return { ok: false, error: "Missing product title", code: "VALIDATION" };
  }

  return { ok: true, payload };
}
