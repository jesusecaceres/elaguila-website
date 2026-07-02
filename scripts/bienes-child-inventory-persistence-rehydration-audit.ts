/**
 * BIENES_CHILD_INVENTORY_PERSISTENCE_REHYDRATION — mapping verifier.
 */
import {
  createEmptyBrNegocioAdditionalInventoryPropertyDraft,
  syncChildInventoryDraftMedia,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft";
import {
  buildChildInventoryEditorState,
  childInventoryDraftFromEditorState,
  mergeChildEditorSessionWithDraft,
  pickChildPropertySlice,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping";
import { createEmptyAgenteIndividualResidencialState } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function check(req: string, pass: boolean, evidence: string) {
  rows.push({ requirement: req, pass, evidence });
}

const photos = ["data:image/jpeg;base64,abc", "data:image/jpeg;base64,def"];
const id = "br-local-property-test-001";
const createdAt = "2026-01-01T00:00:00.000Z";

const flatOnly = syncChildInventoryDraftMedia({
  ...createEmptyBrNegocioAdditionalInventoryPropertyDraft(id),
  title: "Child A",
  photoUrls: photos,
  primaryPhotoIndex: 1,
  videoUrl: "https://youtu.be/a",
  tourUrl: "https://matterport.com/tour",
  brochureUrl: "https://example.com/brochure.pdf",
  createdAt,
  updatedAt: createdAt,
  propertyForm: null,
});
check(
  "photoUrls → propertyForm.fotosDataUrls",
  flatOnly.propertyForm?.fotosDataUrls?.length === 2,
  `photos=${flatOnly.propertyForm?.fotosDataUrls?.length ?? 0}`,
);
check(
  "primaryPhotoIndex roundtrip",
  flatOnly.primaryPhotoIndex === 1 && flatOnly.propertyForm?.fotoPortadaIndex === 1,
  `idx=${flatOnly.primaryPhotoIndex}`,
);

const formOnly = syncChildInventoryDraftMedia({
  ...createEmptyBrNegocioAdditionalInventoryPropertyDraft(id),
  title: "Child B",
  photoUrls: [],
  propertyForm: {
    fotosDataUrls: photos,
    fotoPortadaIndex: 0,
    videoUrls: ["https://youtu.be/b", "https://youtu.be/c"],
    tourUrl: "https://tour.example",
    brochureUrl: "https://doc.example",
  },
  createdAt,
  updatedAt: createdAt,
});
check(
  "propertyForm.fotosDataUrls → photoUrls",
  formOnly.photoUrls.length === 2,
  `photoUrls=${formOnly.photoUrls.length}`,
);
check(
  "videoUrls/videoUrl roundtrip",
  formOnly.videoUrl === "https://youtu.be/b" && (formOnly.propertyForm?.videoUrls?.length ?? 0) === 2,
  `videoUrl=${formOnly.videoUrl}`,
);

const hub = createEmptyAgenteIndividualResidencialState();
const editor = buildChildInventoryEditorState(hub, flatOnly, "es");
check(
  "buildChildInventoryEditorState restores photos",
  editor.fotosDataUrls.length === 2,
  `editorPhotos=${editor.fotosDataUrls.length}`,
);
check(
  "buildChildInventoryEditorState restores video/tour/brochure",
  editor.videoUrl === "https://youtu.be/a" &&
    editor.tourUrl === "https://matterport.com/tour" &&
    editor.brochureUrl === "https://example.com/brochure.pdf",
  "media urls",
);

const saved = childInventoryDraftFromEditorState(hub, editor, flatOnly, "es");
check("child ID stable on edit", saved.id === id, saved.id);
check("createdAt stable", saved.createdAt === createdAt, saved.createdAt);
check("updatedAt updates", saved.updatedAt !== createdAt, saved.updatedAt);

const emptySession = pickChildPropertySlice(createEmptyAgenteIndividualResidencialState());
const merged = mergeChildEditorSessionWithDraft(emptySession, flatOnly);
check(
  "empty session cannot wipe saved photos",
  merged.photoUrls.length === 2,
  `mergedPhotos=${merged.photoUrls.length}`,
);

const pass = rows.filter((r) => r.pass).length;
const fail = rows.length - pass;
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement} (${r.evidence})`);
}
console.log(`\n${pass}/${rows.length} PASS`);
if (fail > 0) process.exit(1);
