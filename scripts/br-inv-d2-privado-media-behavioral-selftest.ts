/**
 * BR-INV-D2-FIX — behavioral proof (not a code-shape check) that BR Privado photos survive the
 * full upload/reorder/portada/remove/add + hard-refresh + Preview + Back-to-Edit + hard-refresh
 * cycle, injecting the same sessionStorage "written just before reload, unreadable for a window"
 * race the fix (`readDraftRawWithRetry`) targets. Repeats the full matrix 3 times per the required
 * behavioral-proof format.
 *
 * Run from repo root:
 *   npx tsx scripts/br-inv-d2-privado-media-behavioral-selftest.ts
 */
import "fake-indexeddb/auto";
import { strict as assert } from "node:assert";

class RacyStorage {
  private map = new Map<string, string>();
  private raceUntil = new Map<string, number>();
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  getItem(key: string): string | null {
    const until = this.raceUntil.get(key);
    if (until !== undefined && Date.now() < until) return null;
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
    this.raceUntil.delete(key);
  }
  clear(): void {
    this.map.clear();
    this.raceUntil.clear();
  }
  simulateRestoreRace(key: string, delayMs: number): void {
    this.raceUntil.set(key, Date.now() + delayMs);
  }
}

const racySession = new RacyStorage();
const racyLocal = new RacyStorage();
(globalThis as unknown as { window: unknown }).window = globalThis;
(globalThis as unknown as { sessionStorage: unknown }).sessionStorage = racySession;
(globalThis as unknown as { localStorage: unknown }).localStorage = racyLocal;

async function main() {
  const {
    saveBienesRaicesPrivadoDraft,
    loadBienesRaicesPrivadoDraft,
    BR_PRIVADO_DRAFT_STORAGE_KEY,
    BR_PRIVADO_DRAFT_LS_FALLBACK_KEY,
  } = await import(
    "../app/(site)/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft"
  );
  const { createEmptyBienesRaicesPrivadoFormState, mergePartialBienesRaicesPrivadoState } = await import(
    "../app/(site)/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState"
  );

  function fakePhoto(tag: string): string {
    // > 80 chars so the offload store treats it as "heavy" and actually round-trips through IndexedDB.
    return `data:image/png;base64,${tag}-${"A".repeat(90)}`;
  }

  async function hardRefresh(raceKeyDelayMs: number) {
    racySession.simulateRestoreRace(BR_PRIVADO_DRAFT_STORAGE_KEY, raceKeyDelayMs);
    racyLocal.simulateRestoreRace(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY, raceKeyDelayMs);
  }

  type StepResult = { ok: boolean; photoTags: string[]; coverTag: string | null };

  function summarize(state: Awaited<ReturnType<typeof loadBienesRaicesPrivadoDraft>>): StepResult {
    if (!state) return { ok: false, photoTags: [], coverTag: null };
    const tags = state.media.photoDataUrls.map((u) => u.split(",")[1]?.split("-")[0] ?? "?");
    const cover = state.media.photoDataUrls[state.media.primaryImageIndex];
    return { ok: true, photoTags: tags, coverTag: cover ? cover.split(",")[1]?.split("-")[0] ?? null : null };
  }

  const runReports: string[] = [];
  const raceDelaysByCycle = [
    [90, 250, 800], // cycle 1: upload / preview / back-to-edit-refresh race windows
    [400, 1200, 2000], // cycle 2: deeper into the long-tail IDB-evidence retry window
    [50, 600, 3000], // cycle 3: mixed
  ];

  for (let cycle = 0; cycle < 3; cycle++) {
    const delays = raceDelaysByCycle[cycle]!;
    let state = mergePartialBienesRaicesPrivadoState({
      ...createEmptyBienesRaicesPrivadoFormState(),
      titulo: `BR Privado media cycle ${cycle + 1}`,
      precio: "300000",
    });

    // UPLOAD — add 3 photos.
    state = {
      ...state,
      media: { ...state.media, photoDataUrls: [fakePhoto("P1"), fakePhoto("P2"), fakePhoto("P3")], primaryImageIndex: 0 },
    };
    await saveBienesRaicesPrivadoDraft(state);
    const uploadOk = summarize(await loadBienesRaicesPrivadoDraft()).photoTags.join(",") === "P1,P2,P3";

    // REORDER — move P3 to the front: [P3, P1, P2].
    state = { ...state, media: { ...state.media, photoDataUrls: [fakePhoto("P3"), fakePhoto("P1"), fakePhoto("P2")] } };
    await saveBienesRaicesPrivadoDraft(state);
    const reorderOk = summarize(await loadBienesRaicesPrivadoDraft()).photoTags.join(",") === "P3,P1,P2";

    // PORTADA — set cover to index 1 (P1).
    state = { ...state, media: { ...state.media, primaryImageIndex: 1 } };
    await saveBienesRaicesPrivadoDraft(state);
    const portadaOk = summarize(await loadBienesRaicesPrivadoDraft()).coverTag === "P1";

    // REMOVE — drop P2, cover (P1) shifts from index 1 to index 1 still (array becomes [P3, P1]).
    state = {
      ...state,
      media: {
        ...state.media,
        photoDataUrls: state.media.photoDataUrls.filter((_, i) => i !== 2),
        primaryImageIndex: 1,
      },
    };
    await saveBienesRaicesPrivadoDraft(state);
    const afterRemove = summarize(await loadBienesRaicesPrivadoDraft());
    const removeOk = afterRemove.photoTags.join(",") === "P3,P1" && afterRemove.coverTag === "P1";

    // ADD — add a 4th photo (P4).
    state = { ...state, media: { ...state.media, photoDataUrls: [...state.media.photoDataUrls, fakePhoto("P4")] } };
    await saveBienesRaicesPrivadoDraft(state);
    const addOk = summarize(await loadBienesRaicesPrivadoDraft()).photoTags.join(",") === "P3,P1,P4";

    // REFRESH #1 — simulate hard reload with an injected sessionStorage/localStorage restore race.
    await hardRefresh(delays[0]!);
    const afterRefresh1 = summarize(await loadBienesRaicesPrivadoDraft());
    const refreshOrderOk = afterRefresh1.photoTags.join(",") === "P3,P1,P4";
    const refreshPortadaOk = afterRefresh1.coverTag === "P1";

    // PREVIEW — the preview route reads the same draft key; simulate its own load with a race too.
    await hardRefresh(delays[1]!);
    const previewState = await loadBienesRaicesPrivadoDraft();
    const previewOk = summarize(previewState).photoTags.join(",") === "P3,P1,P4";

    // BACK TO EDIT — re-enter the form; still the same draft key/load path.
    const backToEditState = await loadBienesRaicesPrivadoDraft();
    const backToEditOk = summarize(backToEditState).photoTags.join(",") === "P3,P1,P4";

    // SECOND REFRESH — hard reload again from the edit route.
    await hardRefresh(delays[2]!);
    const afterRefresh2 = summarize(await loadBienesRaicesPrivadoDraft());
    const secondRefreshOk = afterRefresh2.photoTags.join(",") === "P3,P1,P4" && afterRefresh2.coverTag === "P1";

    const cycleOk =
      uploadOk && reorderOk && portadaOk && removeOk && addOk && refreshOrderOk && refreshPortadaOk && previewOk && backToEditOk && secondRefreshOk;

    runReports.push(
      [
        `RUN ${cycle + 1}:`,
        `UPLOAD: ${uploadOk}`,
        `REORDER: ${reorderOk}`,
        `PORTADA: ${portadaOk}`,
        `REMOVE: ${removeOk}`,
        `ADD: ${addOk}`,
        `REFRESH COUNT: 2`,
        `REFRESH ORDER: ${refreshOrderOk}`,
        `REFRESH PORTADA: ${refreshPortadaOk}`,
        `PREVIEW: ${previewOk}`,
        `BACK TO EDIT: ${backToEditOk}`,
        `SECOND REFRESH: ${secondRefreshOk}`,
      ].join("\n"),
    );

    assert.ok(cycleOk, `Cycle ${cycle + 1} must pass every step of the media matrix`);
  }

  console.log(runReports.join("\n\n"));
  console.log("\nBLOCKER C: TRUE");
}

main().catch((e) => {
  console.error("\nBLOCKER C: FALSE");
  console.error(e);
  process.exit(1);
});
