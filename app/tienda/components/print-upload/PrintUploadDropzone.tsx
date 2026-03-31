"use client";

import type { ChangeEvent } from "react";
import type { Lang } from "../../types/tienda";
import type { PrintUploadFile } from "../../product-configurators/print-upload/types";
import { PRINT_UPLOAD_INPUT_ACCEPT } from "../../product-configurators/print-upload/constants";
import { puPick, printUploadBuilderCopy } from "../../data/printUploadBuilderCopy";

export function PrintUploadDropzone(props: {
  lang: Lang;
  label: string;
  file: PrintUploadFile | null;
  disabled?: boolean;
  onFile: (file: File | null) => void;
}) {
  const { lang, label, file, disabled, onFile } = props;

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onFile(f);
    e.target.value = "";
  };

  return (
    <div className="rounded-2xl border border-dashed border-[rgba(201,168,74,0.35)] bg-[rgba(255,255,255,0.04)] p-4">
      <div className="text-sm font-semibold text-white">{label}</div>
      <label
        className={[
          "mt-3 flex flex-col items-center justify-center rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.2)] px-4 py-8 text-center",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[rgba(255,255,255,0.05)]",
        ].join(" ")}
      >
        <span className="text-sm text-[rgba(255,247,226,0.85)]">{puPick(printUploadBuilderCopy.dropPrompt, lang)}</span>
        <span className="mt-1 text-xs text-[rgba(255,255,255,0.55)]">{puPick(printUploadBuilderCopy.dropTypes, lang)}</span>
        <input type="file" accept={PRINT_UPLOAD_INPUT_ACCEPT} className="hidden" disabled={disabled} onChange={onChange} />
      </label>
      {file ? (
        <button
          type="button"
          onClick={() => onFile(null)}
          className="mt-2 text-xs font-medium text-[rgba(201,168,74,0.9)] hover:underline"
        >
          {puPick(printUploadBuilderCopy.clearFile, lang)}
        </button>
      ) : null}
    </div>
  );
}
