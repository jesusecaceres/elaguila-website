import type { Metadata } from "next";
import { fetchRentasPublicListingsForBrowse } from "@/app/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse";
import { rentasPublicIncludeDemoPool } from "@/app/clasificados/rentas/lib/rentasPublicInventoryMode";
import { RentasResultsClient } from "./RentasResultsClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const metadata: Metadata = {
  title: "Rentas — Resultados | Leonix Clasificados",
  description: "Listados de rentas (cuadrícula en construcción; separado de vista previa de publicación).",
};

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ lang?: string }> };

/**
 * BR-INV-A-FIX — no `<Suspense>` boundary around the data fetch here. Wrapping this async work in
 * Suspense forced Next.js to stream the resolved results inside a hidden `<div hidden>` +
 * `<template>` pair, revealed client-side via React's `$RC(...)` boundary-reveal script. On a hard
 * load with a `lang` query param present, that reveal reliably never fires (confirmed live: the
 * `$RC` function exists and runs without throwing, but leaves the boundary permanently hidden;
 * manually re-invoking it after load has no effect either) — a React/Next streaming-runtime defect,
 * not an application bug, isolated across three passes of shared-shell bypass testing. Awaiting the
 * fetch directly in the page component removes the streaming boundary entirely: the response is one
 * synchronous SSR pass with real content in the initial HTML, no hidden-template reveal required.
 */
export default async function RentasResultsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const initialLiveListings = await fetchRentasPublicListingsForBrowse(lang);
  return (
    <RentasResultsClient initialLiveListings={initialLiveListings} includeDemoPool={rentasPublicIncludeDemoPool()} />
  );
}
