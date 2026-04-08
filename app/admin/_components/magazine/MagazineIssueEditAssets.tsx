"use client";

import { useRef } from "react";
import { adminInputClass } from "@/app/admin/_components/adminTheme";
import { MagazineAssetUpload } from "./MagazineAssetUpload";

type Props = {
  year: string;
  monthSlug: string;
  coverDefault: string;
  pdfDefault: string;
  flipbookDefault: string;
};

export function MagazineIssueEditAssets({ year, monthSlug, coverDefault, pdfDefault, flipbookDefault }: Props) {
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">URL portada</label>
          <input ref={coverRef} name="cover_url" className={adminInputClass} defaultValue={coverDefault} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">URL PDF</label>
          <input ref={pdfRef} name="pdf_url" className={adminInputClass} defaultValue={pdfDefault} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#5C5346]">Flipbook URL</label>
        <input name="flipbook_url" className={adminInputClass} defaultValue={flipbookDefault} />
      </div>
      <MagazineAssetUpload
        year={year}
        monthSlug={monthSlug}
        onUploaded={(url, kind) => {
          if (kind === "cover" && coverRef.current) coverRef.current.value = url;
          if (kind === "pdf" && pdfRef.current) pdfRef.current.value = url;
        }}
      />
    </>
  );
}
