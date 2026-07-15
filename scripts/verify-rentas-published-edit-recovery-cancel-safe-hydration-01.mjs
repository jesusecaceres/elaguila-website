import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => readFileSync(p, "utf8");
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const files = {
  card: "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
  privForm: "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  negForm: "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx",
  privPreview: "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
  negPreview: "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
  ctx: "app/(site)/clasificados/publicar/rentas/shared/rentasListingEditContext.ts",
  workspace: "app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts",
  hydration: "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts",
  api: "app/api/clasificados/rentas/listing-edit/route.ts",
  publish: "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
  matrix: "docs/rentas-published-edit-field-matrix-01.md",
};

const src = Object.fromEntries(Object.entries(files).map(([k, p]) => [k, read(p)]));

assert(src.card.includes("returnTo: `/dashboard/mis-anuncios?cat=rentas&lang=${input.lang}`"), "dashboard edit href must include Rentas return context");
assert(src.ctx.includes('mode: "listing-edit"') && src.ctx.includes("rentas:listing-edit:${input.listingId}:${input.lane}"), "explicit listing edit context/workspace missing");
assert(src.workspace.includes("sessionStorage.setItem(key") && !src.workspace.includes("rentas-privado-draft-v1"), "edit workspace must not reuse normal draft keys");

for (const [name, form] of [["private", src.privForm], ["business", src.negForm]]) {
  assert(form.includes("parseRentasListingEditContext"), `${name} form must detect edit mode before normal draft`);
  assert(form.includes("hydrationStatus !== \"ready\""), `${name} form must block controls until hydration is ready`);
  assert(form.includes("saveRentasListingEditWorkspace"), `${name} form must save isolated edit workspace`);
  assert(form.includes("clearRentasListingEditWorkspace"), `${name} form must clear only isolated workspace on cancel`);
  assert(form.includes("beforeunload"), `${name} form must warn on dirty browser exit`);
  assert(form.includes("Guardar cambios") && form.includes("Save changes"), `${name} form must expose Save changes copy`);
  assert(form.includes("Cancelar edición") && form.includes("Cancel edit"), `${name} form must expose Cancel edit copy`);
  assert(form.includes("/api/clasificados/rentas/listing-edit"), `${name} form must use same-row update API`);
  assert(!/startRevenueCategoryCheckout|redirectToRevenueCategoryCheckout/.test(form), `${name} form must not open checkout during normal edit`);
}

for (const [name, preview] of [["private", src.privPreview], ["business", src.negPreview]]) {
  assert(preview.includes("loadRentasListingEditWorkspace"), `${name} preview must read listing-bound workspace`);
  assert(preview.includes("rentasListingEditPreviewParams"), `${name} preview must preserve edit identity on Volver a editar`);
  assert(preview.includes("Normal editing does not use checkout"), `${name} preview must block checkout in edit mode`);
  assert(preview.includes("Cancel edit") && preview.includes("Cancelar edición"), `${name} preview must expose cancel edit`);
  assert(preview.includes("clearRentasListingEditWorkspace"), `${name} preview cancel must clear only edit workspace`);
}

assert(src.api.includes(".eq(\"id\", listingId)") && src.api.includes(".eq(\"owner_id\", bearerUserId)"), "update API must update same owner row only");
assert(!/status:|is_published|published_at|expires_at/.test(src.api.split("const patch:")[1].split("};")[0]), "update patch must not mutate status/published/expiration fields");
assert(src.api.includes("mergeDetailPairs(existing.detail_pairs"), "update API must preserve unknown existing detail pairs");
assert(src.api.includes("rejectUnsafeMedia"), "update API must reject unsafe local/blob media");
assert(src.publish.includes("buildRentasPrivadoListingParams") && src.publish.includes("buildRentasNegocioListingParams"), "pure Rentas listing param builders missing");
assert(src.hydration.includes("mapOwnedRentasListingToPrivadoFormState") && src.hydration.includes("mapOwnedRentasListingToNegocioFormState"), "explicit reverse mappers missing");
assert(src.matrix.includes("status/public/lifecycle/payment/analytics") && src.matrix.includes("protected"), "field matrix must include protected system fields");

const diff = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const illegal = diff.filter((p) =>
  !p.startsWith("app/(site)/clasificados/publicar/rentas/") &&
  !p.startsWith("app/(site)/clasificados/rentas/") &&
  !p.startsWith("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts") &&
  !p.startsWith("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx") &&
  !p.startsWith("app/api/clasificados/rentas/") &&
  !p.startsWith("docs/rentas-") &&
  !p.startsWith("scripts/") &&
  p !== "package.json"
);
assert(illegal.length === 0, `unexpected non-Rentas files changed: ${illegal.join(", ")}`);

console.log("verify-rentas-published-edit-recovery-cancel-safe-hydration-01: ok");
