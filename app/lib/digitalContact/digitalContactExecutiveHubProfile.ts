import "server-only";

/**
 * Executive Hub — DB-first public profile read path (EXEC-HUB-02 Real Database Foundation).
 *
 * Deliberately kept OUT of `digitalContactRegistry.ts` and marked `server-only`: that
 * registry is imported by Human Connection / Virtual Front Desk client components and
 * synchronous server code that predate the Executive Hub database layer, and must never
 * transitively pull in Supabase admin/service-role access. Only Executive Contact /
 * Executive Hub server code (the public contact page and its API routes) should import
 * from this module.
 *
 * Read priority: 1) real Executive Hub record (`public.executives`, published only),
 * 2) legacy registry fallback. Guarantees /contact/chuy and /contact/isaias keep working
 * while they have not yet been recreated as real Executive Hub records.
 */
import { dbGetPublishedExecutiveProfile, dbListPublishedExecutiveSlugs } from "./digitalContactExecutivesDb";
import { getDigitalContactProfile, listDigitalContactSlugs } from "./digitalContactRegistry";
import type { DigitalContactProfile } from "./digitalContactTypes";

export async function getPublishedExecutiveContactProfile(slug: string): Promise<DigitalContactProfile | null> {
  const key = String(slug ?? "").trim().toLowerCase();
  const fromDb = await dbGetPublishedExecutiveProfile(key);
  if (fromDb) return fromDb;
  return getDigitalContactProfile(key);
}

export async function listPublishedExecutiveContactSlugs(): Promise<string[]> {
  const dbSlugs = await dbListPublishedExecutiveSlugs();
  return Array.from(new Set([...dbSlugs, ...listDigitalContactSlugs()]));
}
