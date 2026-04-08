import Link from "next/link";
import { SITE_SECTION_KEYS, type SiteSectionKey } from "@/app/lib/siteSectionContent/sectionKeys";
import { adminCardBase } from "./adminTheme";

const KEYS_LINE = SITE_SECTION_KEYS.join(", ");

export function AdminSectionOwnershipCallout({
  sectionTitle,
  publicPath,
  sourceOfTruth,
  siteSectionKey = null,
  adminEditors,
  notYet,
}: {
  sectionTitle: string;
  publicPath: string;
  sourceOfTruth: string;
  /** When null, this section has no row in `site_section_content` yet. */
  siteSectionKey?: SiteSectionKey | null;
  adminEditors: { label: string; href: string }[];
  notYet: string[];
}) {
  return (
    <div className={`${adminCardBase} space-y-3 p-5`}>
      <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Ownership & architecture</h2>
      <dl className="grid gap-2 text-sm text-[#5C5346]">
        <div>
          <dt className="text-xs font-bold text-[#7A7164]">Public route</dt>
          <dd>
            <code className="rounded bg-[#FAF7F2] px-1.5 text-xs">{publicPath}</code>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[#7A7164]">Source of truth (today)</dt>
          <dd>{sourceOfTruth}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[#7A7164]">site_section_content key</dt>
          <dd>
            {siteSectionKey ? (
              <code className="rounded bg-[#FAF7F2] px-1.5 text-xs">{siteSectionKey}</code>
            ) : (
              <span>None — allowed keys today: {KEYS_LINE}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[#7A7164]">Where to edit in admin</dt>
          <dd>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {adminEditors.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="font-bold text-[#6B5B2E] underline">
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {notYet.length > 0 ? (
        <div className="rounded-xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-3 text-xs text-[#5C5346]">
          <p className="font-semibold text-[#1E1810]">Not wired yet (honest backlog)</p>
          <ul className="mt-2 list-inside list-decimal space-y-1">
            {notYet.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-[11px] text-[#9A9084]">
        Section: {sectionTitle} — aligns admin with the platform control-center map; no fake forms below this callout.
      </p>
    </div>
  );
}
