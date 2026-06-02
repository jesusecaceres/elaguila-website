import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  collectServiciosLanguageLabelsFromProfile,
  formatServiciosHeroLanguageDisplay,
} from "../lib/serviciosLanguageChips";

type ServiciosLanguageChipRowProps = {
  profile: Parameters<typeof collectServiciosLanguageLabelsFromProfile>[0];
  lang: ServiciosLang;
  /** Hero cap (default 3 + overflow). Omit to show all labels. */
  maxVisible?: number;
  chipClassName: string;
  overflowClassName?: string;
  className?: string;
};

/** Shared language chip row — hero (capped) or profile (all labels). */
export function ServiciosLanguageChipRow({
  profile,
  lang,
  maxVisible,
  chipClassName,
  overflowClassName,
  className = "flex flex-wrap items-center gap-1.5",
}: ServiciosLanguageChipRowProps) {
  const labels = collectServiciosLanguageLabelsFromProfile(profile);
  if (labels.length === 0) return null;

  const display =
    maxVisible != null
      ? formatServiciosHeroLanguageDisplay(labels, lang, maxVisible)
      : { visible: labels, overflowLabel: null };

  const hiddenLabels = maxVisible != null ? labels.slice(maxVisible).join(", ") : "";

  return (
    <div className={className}>
      {display.visible.map((label) => (
        <span key={label} className={chipClassName}>
          {label}
        </span>
      ))}
      {display.overflowLabel ? (
        <span className={overflowClassName ?? chipClassName} title={hiddenLabels || undefined}>
          {display.overflowLabel}
        </span>
      ) : null}
    </div>
  );
}
