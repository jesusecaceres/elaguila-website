import type { ReactNode } from "react";
import { ClasificadosHubCategoryCard } from "@/app/(site)/clasificados/_components/ClasificadosHubCategoryCard";
import type { SupportedLang } from "@/app/lib/language";

export type NegociosLocalesBusinessCardProps = {
  lang: SupportedLang;
  browseHref: string;
  advertiseHref: string;
  label: string;
  description: string;
  advertiseLabel: string;
  note?: string;
  priority?: boolean;
  accent?: "gold" | "burgundy" | "default";
  icon: ReactNode;
};

/** Business sector card — mirrors Clasificados hub card polish (Explorar + Anunciar). */
export function NegociosLocalesBusinessCard({
  lang,
  browseHref,
  advertiseHref,
  label,
  description,
  advertiseLabel,
  note,
  priority,
  accent = "default",
  icon,
}: NegociosLocalesBusinessCardProps) {
  return (
    <ClasificadosHubCategoryCard
      lang={lang}
      browseHref={browseHref}
      publishHref={advertiseHref}
      label={label}
      description={description}
      publishLabel={advertiseLabel}
      note={note}
      priority={priority}
      accent={accent}
      icon={icon}
    />
  );
}
