"use client";

import { useMemo, useState } from "react";
import type { PrayerPublicCard } from "@/app/lib/iglesias/prayerTypes";
import { getPrayerUiCopy } from "@/app/lib/iglesias/prayerCopy";
import { prayerCategoryLabel } from "@/app/lib/iglesias/prayerTaxonomy";

function formatWhen(iso: string, lang: "es" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function IglesiasPrayerCard({
  prayer,
  lang,
}: {
  prayer: PrayerPublicCard;
  lang: "es" | "en";
}) {
  const copy = useMemo(() => getPrayerUiCopy(lang), [lang]);
  const [count, setCount] = useState(prayer.acknowledgementCount);
  const [acked, setAcked] = useState(prayer.acknowledgedByViewer);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportDone, setReportDone] = useState(false);
  const [updateKind, setUpdateKind] = useState("UPDATE");
  const [updateBody, setUpdateBody] = useState("");
  const [updateDone, setUpdateDone] = useState(false);
  const category = prayerCategoryLabel(prayer.category, lang);

  async function pray() {
    if (acked) return;
    const res = await fetch(`/api/iglesias/prayers/${prayer.id}/acknowledge`, { method: "POST" });
    const json = (await res.json()) as { ok?: boolean; count?: number };
    if (res.ok && json.ok) {
      setAcked(true);
      if (typeof json.count === "number") setCount(json.count);
    }
  }

  async function sendReport() {
    const res = await fetch(`/api/iglesias/prayers/${prayer.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason }),
    });
    if (res.ok) {
      setReportDone(true);
      setReportOpen(false);
    }
  }

  async function sendUpdate() {
    const res = await fetch(`/api/iglesias/prayers/${prayer.id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: updateKind, body: updateBody }),
    });
    if (res.ok) setUpdateDone(true);
  }

  return (
    <article className="rounded-2xl border border-[#D6C7AD]/80 bg-[#FAF6EE] p-4 shadow-[0_10px_28px_-22px_rgba(31,36,28,0.4)] sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          {category ? (
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">{category}</p>
          ) : null}
          <h3 className="mt-1 font-serif text-lg font-bold text-[#1F241C]">{prayer.displayName}</h3>
          {prayer.city ? <p className="text-sm text-[#5C5346]">{prayer.city}</p> : null}
        </div>
        <time className="text-xs text-[#7A7164]" dateTime={prayer.createdAt}>
          {formatWhen(prayer.createdAt, lang)}
        </time>
      </header>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#3D3428]">{prayer.body}</p>
      {prayer.latestUpdate && prayer.latestUpdate.kind !== "CLOSE" ? (
        <p className="mt-3 border-t border-[#E8DFD0] pt-3 text-sm text-[#3D3428]">
          <span className="font-semibold">{copy.latestUpdate}: </span>
          {prayer.latestUpdate.body || prayer.latestUpdate.kind}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={pray}
          disabled={acked}
          aria-pressed={acked}
          className="inline-flex min-h-11 min-w-[9.5rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-4 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] disabled:bg-[#7A1E2C]"
        >
          {`🙏 ${acked ? copy.imPrayingDone : copy.imPraying} · ${count}`}
        </button>
        <button
          type="button"
          onClick={() => setReportOpen((v) => !v)}
          className="ml-auto text-xs font-semibold text-[#7A7164] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]"
        >
          {copy.report}
        </button>
      </div>

      {reportOpen ? (
        <div className="mt-3 rounded-xl border border-[#E8DFD0] bg-white p-3">
          <p className="text-sm font-semibold">{copy.reportTitle}</p>
          <label className="mt-2 block text-sm">
            <span className="sr-only">{copy.reportTitle}</span>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6C7AD] px-2 py-2 text-sm"
            >
              <option value="HATE_HARASSMENT">{copy.reportHate}</option>
              <option value="THREAT">{copy.reportThreat}</option>
              <option value="PRIVATE_INFORMATION">{copy.reportPii}</option>
              <option value="SPAM">{copy.reportSpam}</option>
              <option value="INAPPROPRIATE">{copy.reportInappropriate}</option>
              <option value="OTHER">{copy.reportOther}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={sendReport}
            className="mt-2 min-h-10 rounded-lg bg-[#1F241C] px-3 text-sm font-semibold text-white"
          >
            {copy.reportSubmit}
          </button>
        </div>
      ) : null}
      {reportDone ? <p className="mt-2 text-sm text-[#5C5346]">{copy.reportThanks}</p> : null}

      {prayer.owned ? (
        <div className="mt-4 border-t border-[#E8DFD0] pt-3">
          <label className="block text-sm font-semibold text-[#1F241C]">
            {copy.updateBodyLabel}
            <select
              value={updateKind}
              onChange={(e) => setUpdateKind(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#D6C7AD] px-2 py-2 text-sm font-normal"
            >
              <option value="STILL_NEEDS_PRAYER">{copy.updateStill}</option>
              <option value="UPDATE">{copy.updateNote}</option>
              <option value="GRATITUDE">{copy.updateThanks}</option>
              <option value="CLOSE">{copy.updateClose}</option>
            </select>
          </label>
          <textarea
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-[#D6C7AD] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={sendUpdate}
            className="mt-2 min-h-10 rounded-lg border border-[#7A1E2C] px-3 text-sm font-semibold text-[#7A1E2C]"
          >
            {copy.updateSubmit}
          </button>
          {updateDone ? <p className="mt-2 text-sm text-[#5C5346]">OK</p> : null}
        </div>
      ) : null}
    </article>
  );
}
