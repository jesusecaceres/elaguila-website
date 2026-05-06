import type { ServiciosApplicationDraft } from "../types/serviciosApplicationDraft";
import {
  MAX_SERVICIOS_CERTIFICATIONS,
  SERVICIOS_CERTIFICATION_LABEL_MAX,
  normalizeCredentialDedupeKey,
} from "./serviciosCredentialsCatalog";

export type AddCertificationOutcome =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" };

export function evaluateAddCertificationLabel(params: {
  certifications: string[] | undefined;
  raw: string;
}): AddCertificationOutcome {
  const label = params.raw.trim().slice(0, SERVICIOS_CERTIFICATION_LABEL_MAX);
  if (!label) return { ok: false, reason: "blank" };

  const list = params.certifications ?? [];
  if (list.length >= MAX_SERVICIOS_CERTIFICATIONS) return { ok: false, reason: "cap" };

  const k = normalizeCredentialDedupeKey(label);
  if (list.some((x) => normalizeCredentialDedupeKey(x) === k)) return { ok: false, reason: "duplicate" };

  return { ok: true, label };
}

export function flushPendingCertificationOnDraft(draft: ServiciosApplicationDraft): ServiciosApplicationDraft {
  const cred = draft.credentials;
  const raw = cred?.pendingCertification?.trim() ?? "";
  if (!raw) return draft;
  const r = evaluateAddCertificationLabel({
    certifications: cred?.certifications,
    raw,
  });
  const nextCerts = [...(cred?.certifications ?? [])];
  if (r.ok) nextCerts.push(r.label);
  return {
    ...draft,
    credentials: {
      ...(cred ?? {}),
      certifications: r.ok ? nextCerts : cred?.certifications,
      pendingCertification: "",
    },
  };
}
