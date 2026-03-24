import type { Dispatch, SetStateAction } from "react";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";

export type Lang = "es" | "en";

export type EnVentaFreeSectionProps<S extends EnVentaFreeApplicationState = EnVentaFreeApplicationState> = {
  lang: Lang;
  state: S;
  setState: Dispatch<SetStateAction<S>>;
};

export type EnVentaPhotosSectionProps<S extends EnVentaFreeApplicationState = EnVentaFreeApplicationState> =
  EnVentaFreeSectionProps<S> & {
    maxPhotos: number;
    allowVideo?: boolean;
    /** Pro shell uses dark section chrome; Free stays light. */
    surface?: "light" | "dark";
  };
