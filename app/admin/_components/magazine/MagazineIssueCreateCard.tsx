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
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Crear / reemplazar número (upsert por año + mes)</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Año</label>
          <input name="year" className={adminInputClass} required value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Mes (slug)</label>
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
        <label className="text-xs font-semibold text-[#5C5346]">Estado</label>
        <select name="status" className={adminInputClass} defaultValue="draft">
          <option value="draft">Borrador (no público)</option>
          <option value="published">Publicado (hub + archivo)</option>
          <option value="archived">Archivado (sigue en archivo)</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">URL portada</label>
          <input ref={coverRef} name="cover_url" className={adminInputClass} placeholder="https://… o /magazine/…" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">URL PDF</label>
          <input ref={pdfRef} name="pdf_url" className={adminInputClass} placeholder="https://… o /magazine/…/magazine.pdf" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#5C5346]">Flipbook (opcional, por número)</label>
        <input name="flipbook_url" className={adminInputClass} placeholder="https://online.fliphtml5.com/…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Publicado en (ISO, opcional)</label>
          <input name="published_at" className={adminInputClass} placeholder="2026-02-01T12:00:00Z" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Orden en año (mayor = primero)</label>
          <input name="display_order" className={adminInputClass} type="number" defaultValue="0" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#5C5346]">Notas internas</label>
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

      <button type="submit" className={adminBtnPrimary}>
        Guardar número
      </button>
    </form>
  );
}
