import { EventInput, FinalEvent } from "./types";

export function normalizeEvent(ev: EventInput): FinalEvent {
  return {
    id: ev.id,
    title: ev.title?.trim() || "Evento",
    description: ev.description?.trim() || "",
    startDate: ev.startDate || null,
    endDate: ev.endDate || null,
    image: ev.image || "",
    url: ev.url || "",
    venue: ev.venue || "",
    city: ev.city || "",
    source: ev.source || "unknown",
  };
}
