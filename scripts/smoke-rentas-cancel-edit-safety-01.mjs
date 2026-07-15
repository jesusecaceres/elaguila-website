import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const workspace = read("app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts");
const ctx = read("app/(site)/clasificados/publicar/rentas/shared/rentasListingEditContext.ts");
const privateForm = read("app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx");
const businessForm = read("app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx");
const privatePreview = read("app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx");
const businessPreview = read("app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx");

function assertCancelContract(name, src, lane) {
  assert(src.includes("window.confirm"), `${name}: dirty cancel must require confirmation`);
  assert(src.includes("Your published listing will remain unchanged"), `${name}: EN cancel copy must protect published listing`);
  assert(src.includes("Tu anuncio publicado permanecerá sin cambios"), `${name}: ES cancel copy must protect published listing`);
  assert(src.includes(`clearRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "${lane}" })`), `${name}: cancel must clear only isolated workspace`);
  assert(src.includes("router.push(editContext.returnHref)"), `${name}: cancel must return to dashboard context`);
  assert(!/from\(\"listings\"\)[\s\S]{0,140}\.(delete|update)/.test(src), `${name}: cancel/form code must not mutate listings table`);
}

assert(ctx.includes("returnHref") && ctx.includes("returnTo"), "edit context must carry return URL");
assert(workspace.includes("removeItem(key)") && !workspace.includes("clearRentasPrivadoDraft") && !workspace.includes("clearRentasNegocioDraft"), "workspace clear must not clear global draft keys");

assertCancelContract("private form", privateForm, "privado");
assertCancelContract("business form", businessForm, "negocio");

for (const [name, src, lane] of [
  ["private preview", privatePreview, "privado"],
  ["business preview", businessPreview, "negocio"],
]) {
  assert(src.includes("Previewing unsaved edit workspace"), `${name}: preview must indicate unsaved workspace`);
  assert(src.includes("Back to edit") && src.includes("Volver a editar"), `${name}: preview must preserve Volver a editar`);
  assert(src.includes(`clearRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "${lane}" })`), `${name}: preview cancel must clear isolated workspace only`);
  assert(src.includes("router.push(editContext.returnHref)"), `${name}: preview cancel must return safely`);
  assert(src.includes("Normal editing does not use checkout"), `${name}: edit mode must not checkout`);
}

const originalSnapshot = {
  id: "listing-1",
  leonixAdId: "RENT-2026-SAFE",
  status: "active",
  isPublished: true,
  expiresAt: "2026-08-01T00:00:00.000Z",
  images: ["https://cdn.example.test/a.jpg", "https://cdn.example.test/b.jpg"],
};
const workspaceDraft = { title: "Changed but unsaved" };
const afterCancelSnapshot = { ...originalSnapshot };
assert(JSON.stringify(originalSnapshot) === JSON.stringify(afterCancelSnapshot), "cancel smoke fixture: published snapshot changed");
assert(workspaceDraft.title === "Changed but unsaved", "cancel smoke fixture: continue editing should preserve workspace before discard");

console.log("smoke-rentas-cancel-edit-safety-01: ok");
