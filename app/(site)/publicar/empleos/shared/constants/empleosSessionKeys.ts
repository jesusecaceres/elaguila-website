/** Session-scoped draft keys (tab lifetime). Survives refresh + preview round-trip; clears when tab closes. */
export const EMPLEOS_SESSION_KEYS = {
  quick: "leonix_empleos_quick_draft_v1",
  premium: "leonix_empleos_premium_draft_v1",
  feria: "leonix_empleos_feria_draft_v1",
} as const;
