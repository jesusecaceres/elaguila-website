import type { TiendaFulfillmentPreference } from "@/app/tienda/types/orderHandoff";
import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";
import type { TiendaAssetRole, TiendaOrderAssetReference } from "@/app/tienda/types/tiendaStoredAssets";
import { escapeHtml } from "./escapeHtml";
import { TIENDA_ORDER_INBOX } from "./orderEmailConstants";

function staffRoleCaption(role: TiendaAssetRole, source: TiendaOrderSubmissionPayload["source"]): string {
  switch (role) {
    case "business-card-front":
      return "Business card — front: PNG visual export (reference only; not a final press-ready PDF)";
    case "business-card-back":
      return "Business card — back: PNG visual export (reference only; not a final press-ready PDF)";
    case "design-json-snapshot":
      return "Builder state JSON (structured snapshot for recovery/rebuild)";
    case "upload-front":
      return source === "print-upload"
        ? "Print upload — front: original customer file (durable)"
        : "Business cards — front artwork: original customer file (durable)";
    case "upload-back":
      return source === "print-upload"
        ? "Print upload — back: original customer file (durable)"
        : "Business cards — back artwork: original customer file (durable)";
    default: {
      const _x: never = role;
      return String(_x);
    }
  }
}

function formatDims(w: number | null, h: number | null): string {
  if (w != null && h != null && Number.isFinite(w) && Number.isFinite(h)) return `${w}×${h} px`;
  return "—";
}

function fulfillmentLines(f: TiendaFulfillmentPreference): { es: string; en: string } {
  switch (f) {
    case "local-pickup":
      return {
        es: "Recoger en ubicación Leonix",
        en: "Pick up at Leonix",
      };
    case "local-delivery-discuss":
      return {
        es: "Entrega local / coordinar con Leonix",
        en: "Local delivery / coordinate with Leonix",
      };
    case "shipping-discuss":
      return {
        es: "Envío — detalles a coordinar",
        en: "Shipping — details to coordinate",
      };
    default: {
      const _x: never = f;
      return { es: String(_x), en: String(_x) };
    }
  }
}

function textSection(title: string, lines: string[]): string {
  if (!lines.length) return "";
  return [`${title}`, ...lines.map((l) => `  • ${l}`)].join("\n");
}

export function buildTiendaOrderEmailBodies(
  orderId: string,
  submittedAtIso: string,
  p: TiendaOrderSubmissionPayload,
  durableAssets: TiendaOrderAssetReference[]
): {
  subject: string;
  text: string;
  html: string;
} {
  const title = `[Tienda ${orderId}] ${p.productTitleEn} / ${p.productTitleEs}`;

  const specsEs = p.specLines.map((l) => l.es);
  const specsEn = p.specLines.map((l) => l.en);
  const fulfill = fulfillmentLines(p.fulfillment);

  const approvalEs = [p.approvalStatus.es, ...p.approvalDetails.map((d) => d.es)];
  const approvalEn = [p.approvalStatus.en, ...p.approvalDetails.map((d) => d.en)];

  const warningsEs = p.warnings.map((w) => w.es);
  const warningsEn = p.warnings.map((w) => w.en);

  const assetBlocks = p.assets.map((a) => {
    const lines = [`[${a.kind}] ${a.labelEs} / ${a.labelEn}`, ...a.metaLinesEs.map((m) => `  • ${m}`)];
    if (a.hadInlinePreviewHint) {
      lines.push("  • (Cliente tenía vista previa en navegador; sin adjunto en este correo)");
    }
    return lines.join("\n");
  });

  let productBlock = "";

  if (p.source === "business-cards" && p.businessCardExtra) {
    const x = p.businessCardExtra;
    const modeLine =
      x.creationMode === "upload-existing"
        ? "Creation mode / Modo: uploaded artwork (original files to Blob)"
        : "Creation mode / Modo: design online (builder + PNG reference exports)";
    const intakeLine =
      x.creationMode === "design-online" && x.designIntake
        ? `Design intake / Flujo: ${
            x.designIntake === "template"
              ? "template library"
              : x.designIntake === "leo"
                ? "LEO guided assistant"
                : "custom builder"
          }`
        : null;
    const templateLine =
      x.creationMode === "design-online" && x.templateSlug
        ? `Template / Plantilla: ${x.templateSlug}${x.templateTitleEn ? ` (${x.templateTitleEn})` : ""}`
        : null;
    const leoDetailLines: string[] =
      x.creationMode === "design-online" && x.designIntake === "leo"
        ? [
            ...(x.leoProfession ? [`LEO profession / Oficio: ${x.leoProfession}`] : []),
            ...(x.leoPreferredStyle ? [`LEO style / Estilo: ${x.leoPreferredStyle}`] : []),
            ...(x.leoEmphasis ? [`LEO emphasis / Énfasis: ${x.leoEmphasis}`] : []),
            ...(x.leoBackStyle ? [`LEO back / Reverso: ${x.leoBackStyle}`] : []),
            ...(x.leoColorsNote ? [`LEO colors / Colores: ${x.leoColorsNote}`] : []),
          ]
        : [];
    productBlock = [
      "--- Business cards ---",
      modeLine,
      ...(intakeLine ? [intakeLine] : []),
      ...(templateLine ? [templateLine] : []),
      ...(leoDetailLines.length ? ["", ...leoDetailLines] : []),
      `Sidedness / Lados: ${x.sidedness}`,
      "",
      "Front field summary / Resumen frente (ES):",
      ...x.frontFieldLinesEs.map((l) => `  • ${l}`),
      "",
      "Front field summary (EN):",
      ...x.frontFieldLinesEn.map((l) => `  • ${l}`),
      "",
      `Front logo visible: ${x.frontLogoVisible} | had data URL in session: ${x.frontLogoHasDataUrl}`,
      `Back logo visible: ${x.backLogoVisible} | had data URL in session: ${x.backLogoHasDataUrl}`,
      "",
      ...(x.uploadArtwork
        ? [
            "",
            "Upload artwork / Archivos subidos:",
            `  Front: ${x.uploadArtwork.front.name} | ${x.uploadArtwork.front.mime} | ${x.uploadArtwork.front.sizeBytes} B`,
            `  Back: ${
              x.uploadArtwork.back
                ? `${x.uploadArtwork.back.name} | ${x.uploadArtwork.back.mime} | ${x.uploadArtwork.back.sizeBytes} B`
                : "(none)"
            }`,
            "",
            "Upload validation snapshot (if any) / Validación al guardar:",
            ...(x.rawValidationSnapshot?.length
              ? x.rawValidationSnapshot.map((r) => `  [${r.severity}] ${r.messageEs} | ${r.messageEn}`)
              : ["  (none)"]),
          ]
        : []),
      "",
      "Back field summary (ES) / Reverso:",
      ...x.backFieldLinesEs.map((l) => `  • ${l}`),
      "",
      "Back field summary (EN):",
      ...x.backFieldLinesEn.map((l) => `  • ${l}`),
      "",
      "Approval flags:",
      `  spellingReviewed=${x.approval.spellingReviewed} layoutReviewed=${x.approval.layoutReviewed}`,
      `  printAsApproved=${x.approval.printAsApproved} noRedesignExpectation=${x.approval.noRedesignExpectation}`,
    ].join("\n");
  }

  if (p.source === "print-upload" && p.printUploadExtra) {
    const u = p.printUploadExtra;
    const fileBlock = (title: string, f: (typeof u)["front"]) =>
      [
        `${title}`,
        `  ${f.name} | ${f.mime} | ${f.sizeBytes} bytes`,
        `  px: ${f.widthPx ?? "—"} × ${f.heightPx ?? "—"} | session preview: ${f.sessionHadInlinePreview}`,
      ].join("\n");
    productBlock = [
      "--- Print upload ---",
      fileBlock("Front file", u.front),
      "",
      u.back ? fileBlock("Back file", u.back) : "Back file: (none)",
      "",
      "Raw validation snapshot (from configurator save):",
      ...(u.rawValidationSnapshot.length
        ? u.rawValidationSnapshot.map((r) => `  [${r.severity}] ${r.messageEs} | ${r.messageEn}`)
        : ["  (none)"]),
    ].join("\n");
  }

  const notes = p.customer.notes.trim();

  const durableLines = durableAssets
    .slice()
    .sort((a, b) => a.role.localeCompare(b.role))
    .map((a) => {
      const cap = staffRoleCaption(a.role, p.source);
      const dim = formatDims(a.widthPx, a.heightPx);
      return [
        `[${a.role}] ${cap}`,
        `  File: ${a.originalFilename}`,
        `  MIME: ${a.mimeType} | bytes: ${a.sizeBytes} | dims: ${dim}`,
        `  URL: ${a.publicUrl}`,
      ].join("\n");
    });

  const durableIntro =
    p.source === "business-cards"
      ? [
          "Business cards — durable assets include PNG screen exports + JSON snapshot.",
          "PNG exports are for staff visual reference; they are NOT claimed as final production PDF.",
        ]
      : [
          "Print upload — durable assets are the original uploaded files (bytes preserved in Blob).",
          "Use download URLs below for fulfillment.",
        ];

  const text = [
    `Tienda self-serve order (MVP email — no payment)`,
    `To / Para: ${TIENDA_ORDER_INBOX}`,
    ``,
    `Order reference: ${orderId}`,
    `Submitted at (server UTC): ${submittedAtIso}`,
    `Preferred UI language: ${p.preferredLang}`,
    ``,
    `--- Customer ---`,
    `Name: ${p.customer.fullName}`,
    `Business: ${p.customer.businessName || "—"}`,
    `Email: ${p.customer.email}`,
    `Phone: ${p.customer.phone}`,
    notes ? `Notes: ${notes}` : "Notes: —",
    ``,
    `Fulfillment preference / Entrega:`,
    `  ES: ${fulfill.es}`,
    `  EN: ${fulfill.en}`,
    ``,
    `--- Product ---`,
    `Source: ${p.source}`,
    `Product slug: ${p.productSlug}`,
    `Category: ${p.categorySlug}`,
    `Title EN: ${p.productTitleEn}`,
    `Title ES: ${p.productTitleEs}`,
    `Sidedness / modo: ${p.sidednessSummary.en} | ${p.sidednessSummary.es}`,
    `Builder last saved: ${p.builderSavedAt ?? "—"}`,
    ``,
    textSection("Specs (ES)", specsEs),
    "",
    textSection("Specs (EN)", specsEn),
    "",
    "--- Durable production assets (Blob URLs) ---",
    ...durableIntro.map((l) => l),
    ...durableLines,
    "",
    "--- Session asset summary (no attachments) ---",
    ...assetBlocks,
    "",
    textSection("Approval (ES)", approvalEs),
    "",
    textSection("Approval (EN)", approvalEn),
    "",
    textSection("Warnings / validation notes (ES)", warningsEs),
    "",
    textSection("Warnings / validation notes (EN)", warningsEn),
    "",
    productBlock,
    "",
    "--- End ---",
  ].join("\n");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:system-ui,Segoe UI,Roboto,sans-serif;line-height:1.5;color:#222;">
  <h1 style="font-size:18px;">Tienda order ${escapeHtml(orderId)}</h1>
  <p><strong>Submitted:</strong> ${escapeHtml(submittedAtIso)}</p>
  <h2>Customer</h2>
  <table cellpadding="6" style="border-collapse:collapse;">
    <tr><td><b>Name</b></td><td>${escapeHtml(p.customer.fullName)}</td></tr>
    <tr><td><b>Business</b></td><td>${escapeHtml(p.customer.businessName || "—")}</td></tr>
    <tr><td><b>Email</b></td><td>${escapeHtml(p.customer.email)}</td></tr>
    <tr><td><b>Phone</b></td><td>${escapeHtml(p.customer.phone)}</td></tr>
    <tr><td><b>Notes</b></td><td>${escapeHtml(notes || "—")}</td></tr>
  </table>
  <h2>Fulfillment</h2>
  <p>${escapeHtml(fulfill.en)}<br/><em>${escapeHtml(fulfill.es)}</em></p>
  <h2>Product</h2>
  <p><b>Source:</b> ${escapeHtml(p.source)}<br/>
  <b>Slug:</b> ${escapeHtml(p.productSlug)}<br/>
  <b>Category:</b> ${escapeHtml(p.categorySlug)}</p>
  <p><b>${escapeHtml(p.productTitleEn)}</b><br/><em>${escapeHtml(p.productTitleEs)}</em></p>
  <p><b>Sidedness:</b> ${escapeHtml(p.sidednessSummary.en)} / ${escapeHtml(p.sidednessSummary.es)}</p>
  <h2>Specs</h2>
  <ul>${p.specLines.map((l) => `<li>${escapeHtml(l.en)} — <em>${escapeHtml(l.es)}</em></li>`).join("")}</ul>
  <h2>Durable production assets</h2>
  <p>${escapeHtml(durableIntro.join(" "))}</p>
  <table cellpadding="6" style="border-collapse:collapse;width:100%;max-width:900px;">
    <thead><tr><th align="left">Role</th><th align="left">Staff note</th><th align="left">File</th><th align="left">MIME / size</th><th align="left">Dims</th><th align="left">URL</th></tr></thead>
    <tbody>${durableAssets
      .slice()
      .sort((a, b) => a.role.localeCompare(b.role))
      .map((a) => {
        const dim = formatDims(a.widthPx, a.heightPx);
        return `<tr>
          <td><code>${escapeHtml(a.role)}</code></td>
          <td style="max-width:220px;font-size:12px;">${escapeHtml(staffRoleCaption(a.role, p.source))}</td>
          <td>${escapeHtml(a.originalFilename)}</td>
          <td>${escapeHtml(a.mimeType)}<br/><small>${a.sizeBytes} B</small></td>
          <td>${escapeHtml(dim)}</td>
          <td><a href="${escapeHtml(a.publicUrl)}">download / view</a></td>
        </tr>`;
      })
      .join("")}</tbody>
  </table>
  <h2>Assets (summary — no attachments)</h2>
  ${p.assets
    .map(
      (a) =>
        `<div style="margin-bottom:12px;border:1px solid #ddd;padding:8px;"><div><b>${escapeHtml(a.labelEn)}</b> / <em>${escapeHtml(a.labelEs)}</em> <span style="opacity:.7">[${escapeHtml(a.kind)}]</span></div>
        <ul>${a.metaLinesEn.map((m, i) => `<li>${escapeHtml(m)} <em>${escapeHtml(a.metaLinesEs[i] ?? "")}</em></li>`).join("")}</ul>
        ${a.hadInlinePreviewHint ? "<p><small>Browser had inline preview; file not attached.</small></p>" : ""}
        </div>`
    )
    .join("")}
  <h2>Approval</h2>
  <p>${escapeHtml(p.approvalStatus.en)} / <em>${escapeHtml(p.approvalStatus.es)}</em></p>
  <ul>${p.approvalDetails.map((d) => `<li>${escapeHtml(d.en)} — <em>${escapeHtml(d.es)}</em></li>`).join("")}</ul>
  <h2>Warnings</h2>
  <ul>${p.warnings.map((w) => `<li>${escapeHtml(w.en)} — <em>${escapeHtml(w.es)}</em></li>`).join("") || "<li>None</li>"}</ul>
  <h2>Source-specific</h2>
  <pre style="white-space:pre-wrap;background:#f6f6f6;padding:12px;font-size:12px;">${escapeHtml(productBlock)}</pre>
  </body></html>`;

  return { subject: title, text, html };
}
