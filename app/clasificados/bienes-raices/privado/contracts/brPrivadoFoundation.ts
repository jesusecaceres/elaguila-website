/**
 * BR Privado foundation: branch identity and cross-surface contract notes.
 *
 * Every saved listing must remain traceable to:
 * - `ownerId` / account (publisher)
 * - `listingId` once persisted
 *
 * Wizard `details` for this lane use `bienesRaicesBranch === "privado"`.
 * Structured publish rows are built only in `privado/mapping/brPrivadoPublishStructuredPairs.ts`.
 */

export const BR_PRIVADO_BRANCH_VALUE = "privado" as const;
