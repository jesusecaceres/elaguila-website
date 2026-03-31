import type { TiendaFulfillmentPreference } from "@/app/tienda/types/orderHandoff";
import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";
import { escapeHtml } from "./escapeHtml";
import { TIENDA_ORDER_INBOX } from "./orderEmailConstants";

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

export function buildTiendaOrderEmailBodies(orderId: string, submittedAtIso: string, p: TiendaOrderSubmissionPayload): {
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
    productBlock = [
      "--- Business cards ---",
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
    "--- Assets (summary only; no file attachments in MVP) ---",
    "Leonix: reproduce from customer-approved session or request files using this reference.",
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
