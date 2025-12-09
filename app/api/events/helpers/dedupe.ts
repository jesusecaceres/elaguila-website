import { FinalEvent } from "./types";

export function mergeAndDedupe(events: FinalEvent[]): FinalEvent[] {
  const map = new Map<string, FinalEvent>();

  events.forEach((ev) => {
    const key = ev.url || ev.id;
    if (!map.has(key)) {
      map.set(key, ev);
    }
  });

  return Array.from(map.values());
}
