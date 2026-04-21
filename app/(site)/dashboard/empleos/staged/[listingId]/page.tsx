"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { EmpleosCanonicalListing, EmpleosStagedPublicStatus } from "@/app/clasificados/empleos/lib/staged/empleosCanonicalListing";
import { empleosStagedListingUrls } from "@/app/clasificados/empleos/lib/staged/empleosCanonicalListing";
import { getEmpleosStagedOwnerId } from "@/app/clasificados/empleos/lib/staged/empleosStagedIdentity";
import { updateEmpleosStagedStatus } from "@/app/clasificados/empleos/lib/staged/empleosPublishService";
import { EMPLEOS_STAGED_REGISTRY_EVENT, getEmpleosCanonicalById } from "@/app/clasificados/empleos/lib/staged/empleosStagedStorage";

import { LeonixDashboardShell } from "../../../components/LeonixDashboardShell";

type Lang = "es" | "en";

const BTN =
  "inline-flex items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#1E1810] hover:bg-[#FAF7F2] disabled:opacity-40";

export default function EmpleosStagedManagePage() {
  const params = useParams();
  const listingId = String(params?.listingId ?? "");
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Gestionar vacante (demo)",
            notFound: "No encontramos este listado en la capa local de este navegador.",
            wrongOwner: "Este listado pertenece a otro perfil demo del navegador.",
            back: "Volver a mis Empleos (demo)",
            status: "Estado",
            lane: "Formato",
            urls: "Rutas",
            analytics: "Analíticas (demo)",
            views: "Vistas",
            clicks: "Clics",
            contacts: "Contactos",
            saves: "Guardados",
            actions: "Cambiar estado",
            publish: "Publicar",
            pause: "Pausar",
            archive: "Archivar",
            reject: "Rechazar (moderación)",
            draft: "Borrador",
          }
        : {
            title: "Manage listing (demo)",
            notFound: "We could not find this listing in this browser’s local layer.",
            wrongOwner: "This listing belongs to another demo profile in the browser.",
            back: "Back to my Jobs (demo)",
            status: "Status",
            lane: "Lane",
            urls: "URLs",
            analytics: "Analytics (demo)",
            views: "Views",
            clicks: "Clicks",
            contacts: "Contacts",
            saves: "Saves",
            actions: "Change status",
            publish: "Publish",
            pause: "Pause",
            archive: "Archive",
            reject: "Reject (moderation)",
            draft: "Draft",
          },
    [lang],
  );

  const [row, setRow] = useState<EmpleosCanonicalListing | null>(null);
  const [ownerOk, setOwnerOk] = useState(true);

  const refresh = useCallback(() => {
    const r = getEmpleosCanonicalById(listingId);
    setRow(r ?? null);
    if (r) setOwnerOk(r.ownerId === getEmpleosStagedOwnerId());
  }, [listingId]);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(EMPLEOS_STAGED_REGISTRY_EVENT, on);
    return () => window.removeEventListener(EMPLEOS_STAGED_REGISTRY_EVENT, on);
  }, [refresh]);

  const urls = row ? empleosStagedListingUrls(row.listingId, row.slug) : null;

  function applyStatus(next: EmpleosStagedPublicStatus) {
    if (!row) return;
    const updated = updateEmpleosStagedStatus(row.listingId, next);
    setRow(updated);
  }

  if (!row) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef="DEMO">
        <p className="text-[#5C5346]">{t.notFound}</p>
        <Link href={`/dashboard/empleos/staged?${q}`} className="mt-4 inline-block font-semibold text-[#2A2620] underline">
          {t.back}
        </Link>
      </LeonixDashboardShell>
    );
  }

  if (!ownerOk) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef="DEMO">
        <p className="text-[#5C5346]">{t.wrongOwner}</p>
        <Link href={`/dashboard/empleos/staged?${q}`} className="mt-4 inline-block font-semibold text-[#2A2620] underline">
          {t.back}
        </Link>
      </LeonixDashboardShell>
    );
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef="DEMO">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 text-sm text-[#5C5346]">{row.title}</p>
        <p className="text-xs text-[#7A7164]">{row.company}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{t.status}</h2>
          <p className="mt-2 text-lg font-bold capitalize text-[#1E1810]">{row.status}</p>
          <p className="mt-4 text-sm text-[#5C5346]">
            <span className="font-semibold">{t.lane}:</span> {row.lane}
          </p>
          <p className="mt-2 text-xs text-[#7A7164]">
            ID: <code className="rounded bg-[#F9F6F1] px-1">{row.listingId}</code>
          </p>
          <p className="mt-1 text-xs text-[#7A7164]">
            slug: <code className="rounded bg-[#F9F6F1] px-1">{row.slug}</code>
          </p>
          <p className="mt-2 text-xs text-[#7A7164]">
            {lang === "es" ? "Creado" : "Created"}: {row.createdAt} · {lang === "es" ? "Actualizado" : "Updated"}: {row.updatedAt}
          </p>
        </section>

        <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{t.analytics}</h2>
          <ul className="mt-3 space-y-1 text-sm text-[#5C5346]">
            <li>
              {t.views}: <strong>{row.analytics.views}</strong>
            </li>
            <li>
              {t.clicks}: <strong>{row.analytics.clicks}</strong>
            </li>
            <li>
              {t.contacts}: <strong>{row.analytics.contacts}</strong>
            </li>
            <li>
              {t.saves}: <strong>{row.analytics.saves}</strong>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-5 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{t.urls}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={appendLangToPath(urls!.anuncioUrl, lang)} className="font-semibold text-[#B8954A] underline">
                {urls!.anuncioUrl}
              </Link>
            </li>
            <li>
              <Link href={appendLangToPath(urls!.listaUrl, lang)} className="text-[#2A2620] underline">
                {urls!.listaUrl}
              </Link>
            </li>
            <li>
              <Link href={`/admin/workspace/clasificados/staged-empleos?${q}`} className="text-[#6B5B2E] underline">
                {urls!.adminUrl}
              </Link>
            </li>
            <li>
              <Link href={appendLangToPath(urls!.publishHubUrl, lang)} className="text-[#5C5346] underline">
                {urls!.publishHubUrl}
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-5 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{t.actions}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={BTN} onClick={() => applyStatus("published")}>
              {t.publish}
            </button>
            <button type="button" className={BTN} onClick={() => applyStatus("paused")}>
              {t.pause}
            </button>
            <button type="button" className={BTN} onClick={() => applyStatus("archived")}>
              {t.archive}
            </button>
            <button type="button" className={BTN} onClick={() => applyStatus("rejected")}>
              {t.reject}
            </button>
            <button type="button" className={BTN} onClick={() => applyStatus("draft")}>
              {t.draft}
            </button>
          </div>
        </section>
      </div>

      <Link href={`/dashboard/empleos/staged?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline">
        ← {t.back}
      </Link>
    </LeonixDashboardShell>
  );
}
