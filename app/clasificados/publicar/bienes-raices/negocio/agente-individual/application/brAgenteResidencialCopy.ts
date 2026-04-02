import type { BrAgenteResidencialLang } from "./brAgenteResidencialLang";
import { BR_COPY_ES } from "./brAgenteResidencialCopy.es";
import { BR_COPY_EN } from "./brAgenteResidencialCopy.en";

/** ES is the source of truth for shape; EN is asserted to match (`brAgenteResidencialCopy.en.ts`). */
export type BrAgenteResidencialCopy = typeof BR_COPY_ES;
export { BR_COPY_ES, BR_COPY_EN };

export function getBrAgenteResidencialCopy(lang: BrAgenteResidencialLang): BrAgenteResidencialCopy {
  return (lang === "en" ? BR_COPY_EN : BR_COPY_ES) as unknown as BrAgenteResidencialCopy;
}
