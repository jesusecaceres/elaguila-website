/**
 * Client Discovery & Project Blueprint Engine, Gate 5/10.2 — deterministic Markdown rendering of a
 * WebsiteProjectBlueprintPacket (MD <deterministic_generation>, §14 <blueprint_packet>). Pure
 * string building only: no OpenAI call, no randomness, no wall-clock read beyond the packet's own
 * frozen `generatedAt` — the SAME packet in always produces the SAME Markdown out.
 *
 * The low-level render primitives live in blueprintMarkdownHelpers.ts (re-exported below for
 * backward compatibility with existing importers) so the canonical category registry
 * (blueprintCategoryRegistry.ts) can share them without a circular module dependency.
 */
import type { BlueprintStatus, WebsiteProjectBlueprintPacket } from "./blueprintEngine";
import { blueprintStatusLabel, formatBilingual } from "./discoveryLabels";
import { WEBSITE_BLUEPRINT_CATEGORIES } from "./blueprintCategoryRegistry";
import { s, section } from "./blueprintMarkdownHelpers";

export * from "./blueprintMarkdownHelpers";

/**
 * Renders the full 47-category blueprint Markdown document (MD §14 <blueprint_packet>), one
 * numbered section per WEBSITE_BLUEPRINT_CATEGORIES entry, in MD-number order — the canonical
 * registry is the single source both this function and the durable test suite iterate, so a
 * category can never silently drop from one without the other catching it. Deterministic: given
 * the same packet, version, and status, this always returns byte-identical output.
 */
export function buildWebsiteProjectBlueprintMarkdown(packet: WebsiteProjectBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  const statusLabel = formatBilingual(blueprintStatusLabel(meta.status));
  const header = [
    "# LEONIX WEBSITE PROJECT BLUEPRINT / PLAN DEL PROYECTO DE SITIO WEB LEONIX",
    "",
    `**Versión / Version:** ${meta.version}`,
    `**Estado / Status:** ${statusLabel}`,
    `**Generado / Generated:** ${packet.generatedAt}`,
    `**Negocio / Business:** ${s(packet.businessDisplayName)}${packet.businessPublicName ? ` (${s(packet.businessPublicName)})` : ""}`,
    `**Título de trabajo / Working title:** ${s(packet.workingTitle)}`,
    `**Catálogo/Registro / Catalog/Registry:** ${packet.discoveryCatalogVersion} · ${packet.platformRegistryVersion}`,
    "",
    "> Este documento es el contrato de construcción — un constructor calificado debe poder ejecutar sin depender de la memoria oral. / This document is the build contract — a qualified builder should be able to execute without relying on oral history.",
    "",
  ].join("\n");

  const sections = WEBSITE_BLUEPRINT_CATEGORIES
    .slice()
    .sort((a, b) => a.mdNumber - b.mdNumber)
    .map((cat) => section(cat.mdNumber, cat.labelEs, cat.labelEn, cat.render(packet)));

  return `${header}\n${sections.filter((sec) => sec.length > 0).join("\n")}`.trim() + "\n";
}
