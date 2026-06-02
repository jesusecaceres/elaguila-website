"use client";

import { useRef, useState } from "react";
import { upsertMagazineIssueAction } from "@/app/admin/magazineIssuesActions";
import { adminBtnPrimary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { MagazineAssetUpload } from "./MagazineAssetUpload";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function MagazineIssueCreateCard() {
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [year, setYear] = useState("2026");
  const [monthSlug, setMonthSlug] = useState("february");

  return (
    <form action={upsertMagazineIssueAction} className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Create / replace issue (upsert by year + month)</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Year</label>
          <input name="year" className={adminInputClass} required value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Month (slug)</label>
          <select name="month_slug" className={adminInputClass} required value={monthSlug} onChange={(e) => setMonthSlug(e.target.value)}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Título ES</label>
          <input name="title_es" className={adminInputClass} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Título EN</label>
          <input name="title_en" className={adminInputClass} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#5C5346]">Status</label>
        <select name="status" className={adminInputClass} defaultValue="draft">
          <option value="draft">Draft (not public)</option>
          <option value="published">Published (hub + archive)</option>
          <option value="archived">Archived (still in archive)</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Cover URL</label>
          <input ref={coverRef} name="cover_url" className={adminInputClass} placeholder="https://… or /magazine/…" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">PDF URL</label>
          <input ref={pdfRef} name="pdf_url" className={adminInputClass} placeholder="https://… or /magazine/…/magazine.pdf" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#5C5346]">Flipbook (optional, per issue)</label>
        <input name="flipbook_url" className={adminInputClass} placeholder="https://online.fliphtml5.com/…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Published at (ISO, optional)</label>
          <input name="published_at" className={adminInputClass} placeholder="2026-02-01T12:00:00Z" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Order within year (higher = first)</label>
          <input name="display_order" className={adminInputClass} type="number" defaultValue="0" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#5C5346]">Internal notes</label>
        <textarea name="internal_notes" className={adminInputClass} rows={2} />
      </div>

      <MagazineAssetUpload
        year={year}
        monthSlug={monthSlug}
        onUploaded={(url, kind) => {
          if (kind === "cover" && coverRef.current) coverRef.current.value = url;
          if (kind === "pdf" && pdfRef.current) pdfRef.current.value = url;
        }}
      />

      <button
        type="submit"
        className={adminBtnPrimary}
        title="Create or replace issue by year+month in magazine_issues (upsert)"
      >
        Create or update issue
      </button>
    </form>
  );
}
