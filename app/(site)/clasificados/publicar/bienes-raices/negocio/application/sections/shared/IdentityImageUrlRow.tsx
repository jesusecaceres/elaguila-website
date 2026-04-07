"use client";

import { useRef } from "react";
import { readFileAsDataUrl } from "../../utils/readFileAsDataUrl";
import { BrField, brInputClass } from "./brFormPrimitives";

export function IdentityImageUrlRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (nextUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <BrField label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f || !f.type.startsWith("image/")) return;
              void (async () => {
                try {
                  onChange(await readFileAsDataUrl(f));
                } catch {
                  /* ignore */
                }
              })();
            }}
          />
          <button
            type="button"
            className="rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]"
            onClick={() => fileRef.current?.click()}
          >
            Subir imagen
          </button>
          <input
            className={brInputClass + " min-w-[200px] flex-1"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="O pega URL (https://…)"
          />
        </div>
        {value.trim() ? (
          <div className="mt-1 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-24 w-24 rounded-lg border border-[#E8DFD0] object-cover" />
            <button
              type="button"
              className="self-center text-xs font-semibold text-red-800"
              onClick={() => onChange("")}
            >
              Quitar imagen
            </button>
          </div>
        ) : null}
      </div>
    </BrField>
  );
}
