import type { Dispatch, SetStateAction } from "react";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";

export type Lang = "es" | "en";

export type EnVentaFreeSectionProps<S extends EnVentaFreeApplicationState = EnVentaFreeApplicationState> = {
  lang: Lang;
  state: S;
  setState: Dispatch<SetStateAction<S>>;
};
