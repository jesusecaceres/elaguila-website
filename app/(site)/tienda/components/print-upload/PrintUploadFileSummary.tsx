"use client";

import type { Lang } from "../../types/tienda";
import type { PrintUploadDocument, PrintUploadFile, PrintUploadProductConfig } from "../../product-configurators/print-upload/types";
import { PRINT_UPLOAD_MIN_PPI_PROXY } from "../../product-configurators/print-upload/constants";
import { needsSeparateBackFile } from "../../product-configurators/print-upload/productConfigs";
import { puPick, printUploadBuilderCopy } from "../../data/printUploadBuilderCopy";

function fmtBytes(n: number, _lang: Lang) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function FileCard(props: { lang: Lang; title: string; file: PrintUploadFile | null }) {
  const { lang, title, file } = props;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-[color:rgba(61,52,40,0.55)]">{title}</div>
      {!file ? (
        <p className="mt-2 text-sm text-[color:rgba(61,52,40,0.55)]">
          {lang === "en" ? "No file yet." : "Sin archivo aún."}
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
          <div className="flex items-center justify-center rounded-lg bg-black/5 aspect-square overflow-hidden">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-3xl">📄</span>
            )}
          </div>
          <div className="text-sm text-[color:var(--lx-text)] space-y-1">
            <div>
              <span className="font-semibold">{file.name}</span>
            </div>
            <div className="text-[color:rgba(61,52,40,0.75)]">
              {file.mime} • {fmtBytes(file.sizeBytes, lang)}
            </div>
            {file.widthPx != null && file.heightPx != null ? (
              <div className="text-[color:rgba(61,52,40,0.75)]">
                {file.widthPx} × {file.heightPx} px
              </div>
            ) : file.mime === "application/pdf" ? (
              <div className="text-[color:rgba(61,52,40,0.65)]">
                {lang === "en" ? "Dimensions not read in-browser for PDF." : "Dimensiones no leídas en el navegador para PDF."}
              </div>
            ) : null}
            {file.widthPx != null && file.heightPx != null && file.mime !== "application/pdf" ? (
              <p className="text-[11px] text-[color:rgba(61,52,40,0.62)] mt-1">
                {lang === "en" ? "Aspect ratio (W÷H)" : "Proporción (an÷al)"}: {(file.widthPx / file.heightPx).toFixed(3)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export function PrintUploadFileSummary(props: {
  lang: Lang;
  doc: PrintUploadDocument;
  cfg: PrintUploadProductConfig;
}) {
  const { lang, doc, cfg } = props;
  const wantBack = needsSeparateBackFile(cfg, doc.specs);

  const size = cfg.sizes.find((s) => s.id === doc.specs.sizeId);
  const stock = cfg.stocks.find((s) => s.id === doc.specs.stockId);
  const sides = cfg.sides.find((s) => s.id === doc.specs.sidesId);
  const fold = cfg.folds?.find((s) => s.id === doc.specs.foldId);
  const mat = cfg.materials?.find((s) => s.id === doc.specs.materialId);
  const fin = cfg.finishes?.find((s) => s.id === doc.specs.finishId);
  const shape = cfg.shapes?.find((s) => s.id === doc.specs.shapeId);

  const label = (o: { labelEs: string; labelEn: string } | undefined) =>
    o ? (lang === "en" ? o.labelEn : o.labelEs) : "—";

  return (
    <section className="rounded-2xl border border-[rgba(201,180,106,0.28)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(251,247,239,0.94))] p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">
        {puPick(printUploadBuilderCopy.fileDetails, lang)}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        <FileCard lang={lang} title={puPick(printUploadBuilderCopy.uploadFront, lang)} file={doc.frontFile} />
        {wantBack ? (
          <FileCard lang={lang} title={puPick(printUploadBuilderCopy.uploadBack, lang)} file={doc.backFile} />
        ) : null}
      </div>
      <div className="rounded-xl border border-black/10 bg-white/80 p-4 text-sm text-[color:var(--lx-text)]">
        <div className="font-semibold mb-2">{puPick(printUploadBuilderCopy.specsSummary, lang)}</div>
        <ul className="space-y-1 text-[color:rgba(61,52,40,0.85)]">
          <li>
            {puPick(printUploadBuilderCopy.sidedness, lang)}: {label(sides)}
          </li>
          <li>
            {puPick(printUploadBuilderCopy.quantity, lang)}: {doc.specs.quantity}
          </li>
          <li>
            {puPick(printUploadBuilderCopy.size, lang)}: {label(size)}
          </li>
          <li>
            {puPick(printUploadBuilderCopy.stock, lang)}: {label(stock)}
          </li>
          {fold ? (
            <li>
              {puPick(printUploadBuilderCopy.fold, lang)}: {label(fold)}
            </li>
          ) : null}
          {mat ? (
            <li>
              {puPick(printUploadBuilderCopy.material, lang)}: {label(mat)}
            </li>
          ) : null}
          {fin ? (
            <li>
              {puPick(printUploadBuilderCopy.finish, lang)}: {label(fin)}
            </li>
          ) : null}
          {shape ? (
            <li>
              {puPick(printUploadBuilderCopy.shape, lang)}: {label(shape)}
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-xs text-[color:rgba(61,52,40,0.6)]">
          {lang === "en" ? cfg.specSimplificationNote.en : cfg.specSimplificationNote.es}
        </p>
        {size ? (
          <p className="mt-2 text-[11px] text-[color:rgba(61,52,40,0.65)] leading-relaxed">
            {lang === "en" ? "Trim reference" : "Referencia de corte"}: {size.widthIn} in × {size.heightIn} in —{" "}
            {lang === "en" ? "bitmap proxy target" : "objetivo proxy (imagen)"} ~
            {Math.round(size.widthIn * PRINT_UPLOAD_MIN_PPI_PROXY)}×{Math.round(size.heightIn * PRINT_UPLOAD_MIN_PPI_PROXY)}{" "}
            px. {puPick(printUploadBuilderCopy.bleedMarginsNote, lang)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
