import type { Dispatch, SetStateAction } from "react";
import type { LeonixBrNegocioFormState } from "../schema/leonixBrNegocioFormState";

export type NegocioFormApi = {
  state: LeonixBrNegocioFormState;
  setState: Dispatch<SetStateAction<LeonixBrNegocioFormState>>;
};
