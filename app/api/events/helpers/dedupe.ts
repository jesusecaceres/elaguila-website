export function dedupe(events: any[]) {
  const seen = new Set();
  return events.filter((evt) => {
    const key = `${evt.title}-${evt.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
