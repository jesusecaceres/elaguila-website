import {
  HUMAN_CONNECTION_NAME_MAX,
  HUMAN_CONNECTION_NAME_MIN,
} from "./constants";

export function normalizeVisitorFirstName(raw: unknown): string | null {
  const name = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (name.length < HUMAN_CONNECTION_NAME_MIN || name.length > HUMAN_CONNECTION_NAME_MAX) return null;
  if (/[\u0000-\u001F\u007F]/.test(name)) return null;
  return name;
}
