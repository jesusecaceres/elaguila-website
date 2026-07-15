import assert from "node:assert/strict";

const PREVIEW = "br-negocio-agente-residencial-preview-draft";
const RETURN = "br-negocio-agente-residencial-return-draft";
const FALLBACK = "br-negocio-agente-residencial-draft-ls-fallback";
const MEDIA = "br-agente-res-v1";

function keys(applicationInstanceId) {
  return {
    preview: `${PREVIEW}:${applicationInstanceId}`,
    return: `${RETURN}:${applicationInstanceId}`,
    inventory: `${FALLBACK}:${applicationInstanceId}`,
    media: `${MEDIA}:${applicationInstanceId}`,
  };
}

class SimulatedBienesStorage {
  constructor() {
    this.session = new Map();
    this.local = new Map();
    this.idb = new Map();
  }

  idbKey(namespace, segment, id = "") {
    return `br:${namespace}:${segment}${id ? `:${id}` : ""}`;
  }

  startApplication(applicationInstanceId) {
    const k = keys(applicationInstanceId);
    if (!this.session.has(k.preview)) this.session.set(k.preview, JSON.stringify({ state: null, clean: true }));
    return k;
  }

  save(applicationInstanceId, state) {
    const k = keys(applicationInstanceId);
    const compact = structuredClone(state);
    compact.parentPhotos = compact.parentPhotos.map((photo, index) => {
      this.idb.set(this.idbKey(k.media, "MAIN_PHOTO", String(index)), photo);
      return `__LX_BR_AGENTE_IDB__|MAIN_PHOTO|${index}`;
    });
    compact.children = compact.children.map((child) => ({
      ...child,
      photos: child.photos.map((photo, index) => {
        this.idb.set(this.idbKey(k.media, `CHILD_${child.id}_PHOTO`, String(index)), photo);
        return `__LX_BR_AGENTE_IDB__|CHILD_${child.id}_PHOTO|${index}`;
      }),
    }));
    this.session.set(k.preview, JSON.stringify(compact));
    this.session.set(k.return, JSON.stringify({ state: compact, savedAt: Date.now() }));
    this.local.set(k.inventory, JSON.stringify(compact.children.map((c) => c.id)));
  }

  load(applicationInstanceId) {
    const k = keys(applicationInstanceId);
    const raw = this.session.get(k.preview);
    assert.ok(raw, `missing preview draft for ${applicationInstanceId}`);
    const compact = JSON.parse(raw);
    if (compact.state === null && compact.clean) return compact;
    return {
      ...compact,
      parentPhotos: compact.parentPhotos.map((_, index) => this.idb.get(this.idbKey(k.media, "MAIN_PHOTO", String(index)))),
      children: compact.children.map((child) => ({
        ...child,
        photos: child.photos.map((_, index) => this.idb.get(this.idbKey(k.media, `CHILD_${child.id}_PHOTO`, String(index)))),
      })),
    };
  }

  preview(applicationInstanceId) {
    return this.load(applicationInstanceId);
  }

  returnToEdit(applicationInstanceId) {
    const k = keys(applicationInstanceId);
    assert.ok(this.session.get(k.return), `missing return draft for ${applicationInstanceId}`);
    return this.load(applicationInstanceId);
  }

  deleteChild(applicationInstanceId, childId) {
    const current = this.load(applicationInstanceId);
    this.save(applicationInstanceId, {
      ...current,
      children: current.children.filter((child) => child.id !== childId),
    });
    const namespace = keys(applicationInstanceId).media;
    for (const key of [...this.idb.keys()]) {
      if (key.startsWith(`br:${namespace}:CHILD_${childId}_`)) this.idb.delete(key);
    }
  }

  deleteApplication(applicationInstanceId) {
    const k = keys(applicationInstanceId);
    this.session.delete(k.preview);
    this.session.delete(k.return);
    this.local.delete(k.inventory);
    for (const key of [...this.idb.keys()]) {
      if (key.startsWith(`br:${k.media}:`)) this.idb.delete(key);
    }
  }
}

const storage = new SimulatedBienesStorage();
const appA = "br-agent-app-A";
const appB = "br-agent-app-B";

storage.startApplication(appA);
storage.save(appA, {
  title: "Application A parent",
  parentPhotos: ["data:image/a-parent-1", "data:image/a-parent-2"],
  children: [
    { id: "child-a-1", title: "A child one", photos: ["data:image/a-child-1"] },
    { id: "child-a-2", title: "A child two", photos: ["data:image/a-child-2"] },
  ],
});

const beforeB = storage.load(appA);
storage.startApplication(appB);
assert.deepEqual(storage.load(appA), beforeB, "creating B does not change A");
assert.deepEqual(storage.load(appB), { state: null, clean: true }, "B starts clean");

storage.save(appB, {
  title: "Application B parent",
  parentPhotos: ["data:image/b-parent-1"],
  children: [{ id: "child-b-1", title: "B child one", photos: ["data:image/b-child-1"] }],
});

assert.equal(storage.load(appA).title, "Application A parent", "refreshing A preserves parent");
assert.deepEqual(storage.load(appA).parentPhotos, ["data:image/a-parent-1", "data:image/a-parent-2"], "refreshing A preserves parent images");
assert.equal(storage.preview(appA).children.length, 2, "previewing A preserves children");
assert.deepEqual(storage.preview(appA).children.map((c) => c.photos[0]), ["data:image/a-child-1", "data:image/a-child-2"], "previewing A preserves child media");
assert.deepEqual(storage.returnToEdit(appA), storage.load(appA), "returning to A preserves scoped state");
assert.equal(storage.load(appB).title, "Application B parent", "refreshing B preserves only B state");
assert.notDeepEqual(storage.load(appA).parentPhotos, storage.load(appB).parentPhotos, "A and B parent media do not collide");

storage.deleteChild(appB, "child-b-1");
assert.equal(storage.load(appA).children.length, 2, "deleting B child does not affect A children");
assert.deepEqual(storage.load(appA).children.map((c) => c.photos[0]), ["data:image/a-child-1", "data:image/a-child-2"], "deleting B child does not affect A child media");

storage.deleteApplication(appB);
assert.deepEqual(storage.load(appA), beforeB, "deleting B does not delete A");
assert.ok([...storage.idb.keys()].every((key) => !key.includes(`${MEDIA}:${appB}`)), "B media namespace removed");
assert.ok([...storage.idb.keys()].some((key) => key.includes(`${MEDIA}:${appA}`)), "A media namespace remains");

console.log("smoke-bienes-cross-tab-draft-media-isolation-01: PASS");
