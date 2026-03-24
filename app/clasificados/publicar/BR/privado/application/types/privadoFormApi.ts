import type { Dispatch, SetStateAction } from "react";
import type { LeonixBrPrivadoFormState } from "../schema/leonixBrPrivadoFormState";

export type PrivadoFormApi = {
  state: LeonixBrPrivadoFormState;
  setState: Dispatch<SetStateAction<LeonixBrPrivadoFormState>>;
};
