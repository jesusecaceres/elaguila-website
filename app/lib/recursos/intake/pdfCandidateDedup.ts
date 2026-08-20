/**
 * Recursos Intake OS — Gate 4 within-document deduplication. A single PDF guide may repeat the
 * same organization across multiple page-batches (e.g. a table of contents entry plus a detail
 * page). Pure, deterministic, exact-signal only — same doctrine as
 * matchCandidateToExistingResource.ts: never guess-merge. Distinct programs from the same
 * organization (different programName + different contact info) are kept separate.
 */
import type { PdfOrganizationProposal } from "./pdfOrganizationAiAdapter";

function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function dedupKey(p: PdfOrganizationProposal): string {
  // Same organization AND same program (or both blank) is treated as a repeat, never distinct
  // programs under the same org — those are kept as separate candidates.
  return `${normalizeName(p.organizationName)}|${normalizeName(p.programName)}`;
}

export type DedupedProposal = PdfOrganizationProposal & { mergedFromPageCount: number };

/**
 * Merges exact-key repeats, unioning their sourcePages and preferring the first non-null value
 * for every field (later duplicate mentions rarely add more detail than the first, and this
 * avoids silently overwriting an already-good value with a sparser repeat).
 */
export function dedupeProposalsWithinJob(proposals: PdfOrganizationProposal[]): DedupedProposal[] {
  const byKey = new Map<string, DedupedProposal>();

  for (const p of proposals) {
    const key = dedupKey(p);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...p, mergedFromPageCount: 1 });
      continue;
    }
    const mergedPages = [...new Set([...existing.sourcePages, ...p.sourcePages])].sort((a, b) => a - b);
    const merged: DedupedProposal = { ...existing, sourcePages: mergedPages, mergedFromPageCount: existing.mergedFromPageCount + 1 };
    // Fill in any field the first occurrence left null, from this repeat, without overwriting a real value.
    for (const field of Object.keys(p) as (keyof PdfOrganizationProposal)[]) {
      const currentValue = merged[field];
      const isEmpty = currentValue === null || (Array.isArray(currentValue) && currentValue.length === 0);
      if (isEmpty && p[field] !== null) {
        (merged as Record<string, unknown>)[field] = p[field];
      }
    }
    byKey.set(key, merged);
  }

  return [...byKey.values()];
}
