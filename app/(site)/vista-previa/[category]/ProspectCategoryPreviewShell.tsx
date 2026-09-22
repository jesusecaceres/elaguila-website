"use client";

import { LeonixCommunityTrust } from "@/app/components/leonixCommunityTrust/LeonixCommunityTrust";
import { layoutQuickMedia, quickMediaGridClass } from "@/app/lib/sales/quickMediaLayout";
import type { ProspectLeonixPreviewVm } from "@/app/lib/sales/prospectPreviewDisplay";

const CONTACT_LABEL: Record<ProspectLeonixPreviewVm["contacts"][number]["kind"], { es: string; en: string }> = {
  phone: { es: "Teléfono", en: "Phone" },
  sms: { es: "SMS", en: "SMS" },
  whatsapp: { es: "WhatsApp", en: "WhatsApp" },
  email: { es: "Correo", en: "Email" },
  website: { es: "Sitio", en: "Website" },
};

/**
 * Leonix-style private prospect preview — ivory canvas, hero/support media, facts, contacts,
 * honest Community Trust zero-state. Not a JSON dump. Never grants edit or ownership.
 */
export function ProspectCategoryPreviewShell({
  vm,
  title,
  description,
  listingId,
  lang = "es",
}: {
  vm: ProspectLeonixPreviewVm;
  title: string;
  description: string | null;
  listingId: string;
  lang?: "es" | "en";
}) {
  const layout = layoutQuickMedia(vm.images.length);
  const imageCount = !("ok" in layout) ? layout.imageCount : null;

  return (
    <article
      data-prospect-leonix-preview="1"
      data-prospect-preview-json-dump="0"
      className="overflow-hidden rounded-[22px] border border-[#E8D9C4] bg-[#FFFCF7] shadow-[0_14px_46px_-30px_rgba(42,36,22,0.18)]"
    >
      {imageCount ? (
        <div className={`p-2 sm:p-3 ${quickMediaGridClass(imageCount)}`}>
          {vm.images.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className={
                imageCount === 1
                  ? "relative aspect-[16/10] overflow-hidden rounded-[18px] bg-[#F5F0E8]"
                  : "relative aspect-[4/3] overflow-hidden rounded-[16px] bg-[#F5F0E8]"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            </div>
          ))}
          {imageCount === 1 ? (
            <div
              data-prospect-preview-info-panel="1"
              className="rounded-[16px] border border-[#E8D9C4] bg-white px-4 py-3"
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A1E2C]">
                {lang === "en" ? "At a glance" : "De un vistazo"}
              </p>
              {vm.location ? <p className="mt-1 text-sm text-[#475569]">{vm.location}</p> : null}
              {vm.contacts.slice(0, 3).map((c) => (
                <p key={c.kind} className="mt-1 text-sm text-[#0f172a]">
                  <span className="text-[#64748b]">{CONTACT_LABEL[c.kind][lang]}: </span>
                  {c.value}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-4 pb-5 pt-3 sm:px-5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#1E1814] sm:text-[26px]">
          {title}
        </h1>
        {vm.location ? <p className="mt-1 text-sm font-medium text-[#6F6254]">{vm.location}</p> : null}

        {vm.facts.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" role="list">
            {vm.facts.map((fact) => (
              <li
                key={fact.key}
                className="inline-flex items-center rounded-full border border-[#E8D9C4] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E1814]"
              >
                {fact.value}
              </li>
            ))}
          </ul>
        ) : null}

        {description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-[#1E1814]/88">{description}</p>
        ) : null}

        {imageCount !== 1 && vm.contacts.length > 0 ? (
          <dl className="mt-4 grid gap-2 border-t border-[#E8D9C4] pt-3">
            {vm.contacts.map((c) => (
              <div key={c.kind} className="flex gap-2 text-sm">
                <dt className="w-24 shrink-0 text-[#64748b]">{CONTACT_LABEL[c.kind][lang]}</dt>
                <dd className="m-0 text-[#0f172a]">{c.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {vm.trustCategory ? (
          <div className="mt-4 border-t border-[#E8D9C4] pt-4" data-prospect-preview-community-trust="1">
            <LeonixCommunityTrust
              category={vm.trustCategory}
              targetId={listingId}
              lang={lang}
              surface="prospect_preview"
              preview
            />
          </div>
        ) : (
          <p className="mt-4 text-[11px] text-[#6F6254]" data-prospect-preview-community-trust="na">
            {lang === "en"
              ? "Leonix Community Trust does not apply to this private classified."
              : "Leonix Community Trust no aplica a este clasificado privado."}
          </p>
        )}
      </div>
    </article>
  );
}
