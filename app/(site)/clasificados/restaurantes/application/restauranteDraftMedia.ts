import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { idbRestauranteClearNamespace, idbRestauranteGetDataUrl, idbRestaurantePutDataUrl } from "./restauranteDraftMediaIdb";

export const RT_IDB_PREFIX = "__LX_RT_IDB__";

function isDataUrl(s: string | undefined): s is string {
  return typeof s === "string" && s.startsWith("data:") && s.length > 80;
}

function refHero(): string {
  return `${RT_IDB_PREFIX}|hero`;
}
function refGallery(i: number): string {
  return `${RT_IDB_PREFIX}|g|${i}`;
}
function refVid(): string {
  return `${RT_IDB_PREFIX}|vid`;
}
function refFood(i: number): string {
  return `${RT_IDB_PREFIX}|food|${i}`;
}
function refInt(i: number): string {
  return `${RT_IDB_PREFIX}|int|${i}`;
}
function refExt(i: number): string {
  return `${RT_IDB_PREFIX}|ext|${i}`;
}
function refFd(i: number): string {
  return `${RT_IDB_PREFIX}|fd|${i}`;
}
function refMenu(): string {
  return `${RT_IDB_PREFIX}|menu`;
}
function refBro(): string {
  return `${RT_IDB_PREFIX}|bro`;
}

export function isRestauranteIdbRef(s: string | undefined): boolean {
  return typeof s === "string" && s.startsWith(RT_IDB_PREFIX);
}

function parseRef(s: string):
  | { k: "hero" }
  | { k: "vid" }
  | { k: "menu" }
  | { k: "bro" }
  | { k: "g"; i: number }
  | { k: "food" | "int" | "ext"; i: number }
  | { k: "fd"; i: number }
  | null {
  if (!s.startsWith(RT_IDB_PREFIX)) return null;
  const t = s.slice(RT_IDB_PREFIX.length);
  if (t === "|hero") return { k: "hero" };
  if (t === "|vid") return { k: "vid" };
  if (t === "|menu") return { k: "menu" };
  if (t === "|bro") return { k: "bro" };
  const g = /^\|g\|(\d+)$/.exec(t);
  if (g) return { k: "g", i: Number(g[1]) };
  const food = /^\|food\|(\d+)$/.exec(t);
  if (food) return { k: "food", i: Number(food[1]) };
  const int = /^\|int\|(\d+)$/.exec(t);
  if (int) return { k: "int", i: Number(int[1]) };
  const ext = /^\|ext\|(\d+)$/.exec(t);
  if (ext) return { k: "ext", i: Number(ext[1]) };
  const fd = /^\|fd\|(\d+)$/.exec(t);
  if (fd) return { k: "fd", i: Number(fd[1]) };
  return null;
}

export async function offloadRestauranteDraftMedia(namespace: string, d: RestauranteListingDraft): Promise<RestauranteListingDraft> {
  let heroImage = d.heroImage;
  if (isDataUrl(heroImage)) {
    await idbRestaurantePutDataUrl(namespace, "hero", undefined, heroImage);
    heroImage = refHero();
  }

  const galleryImages: string[] = [];
  for (let i = 0; i < (d.galleryImages ?? []).length; i++) {
    const u = d.galleryImages![i]!;
    if (isDataUrl(u)) {
      await idbRestaurantePutDataUrl(namespace, "g", String(i), u);
      galleryImages.push(refGallery(i));
    } else {
      galleryImages.push(u);
    }
  }

  let videoFile = d.videoFile;
  if (isDataUrl(videoFile)) {
    await idbRestaurantePutDataUrl(namespace, "vid", undefined, videoFile);
    videoFile = refVid();
  }

  const foodImages: string[] = [];
  for (let i = 0; i < (d.foodImages ?? []).length; i++) {
    const u = d.foodImages![i]!;
    if (isDataUrl(u)) {
      await idbRestaurantePutDataUrl(namespace, "food", String(i), u);
      foodImages.push(refFood(i));
    } else {
      foodImages.push(u);
    }
  }

  const interiorImages: string[] = [];
  for (let i = 0; i < (d.interiorImages ?? []).length; i++) {
    const u = d.interiorImages![i]!;
    if (isDataUrl(u)) {
      await idbRestaurantePutDataUrl(namespace, "int", String(i), u);
      interiorImages.push(refInt(i));
    } else {
      interiorImages.push(u);
    }
  }

  const exteriorImages: string[] = [];
  for (let i = 0; i < (d.exteriorImages ?? []).length; i++) {
    const u = d.exteriorImages![i]!;
    if (isDataUrl(u)) {
      await idbRestaurantePutDataUrl(namespace, "ext", String(i), u);
      exteriorImages.push(refExt(i));
    } else {
      exteriorImages.push(u);
    }
  }

  const featuredDishes = [...(d.featuredDishes ?? [])];
  for (let i = 0; i < featuredDishes.length; i++) {
    const row = featuredDishes[i]!;
    if (isDataUrl(row.image)) {
      await idbRestaurantePutDataUrl(namespace, "fd", String(i), row.image);
      featuredDishes[i] = { ...row, image: refFd(i) };
    }
  }

  let menuFile = d.menuFile;
  if (isDataUrl(menuFile)) {
    await idbRestaurantePutDataUrl(namespace, "menu", undefined, menuFile);
    menuFile = refMenu();
  }

  let brochureFile = d.brochureFile;
  if (isDataUrl(brochureFile)) {
    await idbRestaurantePutDataUrl(namespace, "bro", undefined, brochureFile);
    brochureFile = refBro();
  }

  return {
    ...d,
    heroImage,
    galleryImages,
    videoFile,
    foodImages,
    interiorImages,
    exteriorImages,
    featuredDishes,
    menuFile,
    brochureFile,
  };
}

export async function inlineRestauranteDraftMedia(namespace: string, d: RestauranteListingDraft): Promise<RestauranteListingDraft> {
  let heroImage = d.heroImage;
  if (parseRef(heroImage)?.k === "hero") {
    heroImage = (await idbRestauranteGetDataUrl(namespace, "hero", undefined)) ?? "";
  }

  const galleryImages: string[] = [];
  for (let i = 0; i < (d.galleryImages ?? []).length; i++) {
    const u = d.galleryImages![i]!;
    const pr = parseRef(u);
    if (pr?.k === "g") {
      const blob = await idbRestauranteGetDataUrl(namespace, "g", String(pr.i));
      galleryImages.push(blob ?? "");
    } else {
      galleryImages.push(u);
    }
  }

  let videoFile = d.videoFile;
  if (typeof videoFile === "string" && parseRef(videoFile)?.k === "vid") {
    videoFile = (await idbRestauranteGetDataUrl(namespace, "vid", undefined)) ?? undefined;
  }

  const foodImages: string[] = [];
  for (let i = 0; i < (d.foodImages ?? []).length; i++) {
    const u = d.foodImages![i]!;
    const pr = parseRef(u);
    if (pr?.k === "food") {
      const blob = await idbRestauranteGetDataUrl(namespace, "food", String(pr.i));
      foodImages.push(blob ?? "");
    } else {
      foodImages.push(u);
    }
  }

  const interiorImages: string[] = [];
  for (let i = 0; i < (d.interiorImages ?? []).length; i++) {
    const u = d.interiorImages![i]!;
    const pr = parseRef(u);
    if (pr?.k === "int") {
      const blob = await idbRestauranteGetDataUrl(namespace, "int", String(pr.i));
      interiorImages.push(blob ?? "");
    } else {
      interiorImages.push(u);
    }
  }

  const exteriorImages: string[] = [];
  for (let i = 0; i < (d.exteriorImages ?? []).length; i++) {
    const u = d.exteriorImages![i]!;
    const pr = parseRef(u);
    if (pr?.k === "ext") {
      const blob = await idbRestauranteGetDataUrl(namespace, "ext", String(pr.i));
      exteriorImages.push(blob ?? "");
    } else {
      exteriorImages.push(u);
    }
  }

  const featuredDishes = [...(d.featuredDishes ?? [])];
  for (let i = 0; i < featuredDishes.length; i++) {
    const row = featuredDishes[i]!;
    const pr = parseRef(row.image);
    if (pr?.k === "fd") {
      const blob = await idbRestauranteGetDataUrl(namespace, "fd", String(pr.i));
      if (blob) featuredDishes[i] = { ...row, image: blob };
    }
  }

  let menuFile = d.menuFile;
  if (typeof menuFile === "string" && parseRef(menuFile)?.k === "menu") {
    menuFile = (await idbRestauranteGetDataUrl(namespace, "menu", undefined)) ?? undefined;
  }

  let brochureFile = d.brochureFile;
  if (typeof brochureFile === "string" && parseRef(brochureFile)?.k === "bro") {
    brochureFile = (await idbRestauranteGetDataUrl(namespace, "bro", undefined)) ?? undefined;
  }

  return {
    ...d,
    heroImage,
    galleryImages,
    videoFile,
    foodImages,
    interiorImages,
    exteriorImages,
    featuredDishes,
    menuFile,
    brochureFile,
  };
}

export async function clearRestauranteDraftMediaNamespace(namespace: string): Promise<void> {
  await idbRestauranteClearNamespace(namespace);
}
