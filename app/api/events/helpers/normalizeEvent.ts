import { getCounty } from "./cityMap";

const FALLBACK_IMAGE = "/fallback-event.jpg";

export function normalizeEvent(evt: any) {
  return {
    id: evt.id || crypto.randomUUID(),
    title: evt.title || "Untitled Event",
    description: evt.description || "",
    date: evt.date || "",
    time: evt.time || "",
    city: evt.city || "",
    county: getCounty(evt.city || ""),
    category: evt.category || "Community",
    image: evt.image || FALLBACK_IMAGE,
    sourceUrl: evt.sourceUrl || "",
  };
}
