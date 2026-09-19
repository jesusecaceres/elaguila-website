import { redirect } from "next/navigation";
import { normalizeLang } from "@/app/lib/language";
import { LEARNING_ANCHORS, landingHref } from "../learningJourneys";

/**
 * Gate G1 — `/aprender/ruta` has no content of its own: the three doors live on the landing.
 * Without this file the bare segment would fall through to `/aprender/[categoryKey]` and 404.
 */
export default async function LearningPathwayIndexPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  redirect(landingHref(normalizeLang(Array.isArray(sp.lang) ? sp.lang[0] : sp.lang), LEARNING_ANCHORS.journeys));
}
