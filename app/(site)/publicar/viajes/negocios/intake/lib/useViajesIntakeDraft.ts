"use client";

/**
 * Package 3 — local-first Community Opportunity Intake draft (mirrors `useViajesNegociosDraft`):
 * anonymous/unauthenticated users keep a LOCAL draft only; the server row is created at the
 * authenticated "Send information" save. After that save the local draft is cleared and the
 * returned stagedId is remembered so the mandatory-intake guard lets the owner into the full
 * application (and the "continue later" path can find the row again).
 */

import { useCallback, useEffect, useState } from "react";

import type { ViajesIntakeV1 } from "@/app/(site)/clasificados/viajes/lib/viajesIntakeTypes";
import { emptyViajesIntake } from "@/app/(site)/clasificados/viajes/lib/viajesIntakeTypes";

export const VIAJES_INTAKE_DRAFT_STORAGE_KEY = "viajes_intake_draft_v1";
export const VIAJES_INTAKE_STAGED_ID_STORAGE_KEY = "viajes_intake_staged_id_v1";

export function readStoredViajesIntakeStagedId(): string {
  try {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem(VIAJES_INTAKE_STAGED_ID_STORAGE_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function storeViajesIntakeStagedId(id: string): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(VIAJES_INTAKE_STAGED_ID_STORAGE_KEY, id);
  } catch {
    /* quota */
  }
}

/** Cleared after the full application submits — the next brand-new listing starts at the intake. */
export function clearStoredViajesIntakeStagedId(): void {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(VIAJES_INTAKE_STAGED_ID_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function mergeIntakeFromPartial(p: Partial<ViajesIntakeV1>): ViajesIntakeV1 {
  const base = emptyViajesIntake();
  return {
    ...base,
    ...p,
    schemaVersion: 1,
    communityBenefit: { ...base.communityBenefit, ...(p.communityBenefit ?? {}) },
  };
}

export function useViajesIntakeDraft() {
  const [intake, setIntake] = useState<ViajesIntakeV1>(() => emptyViajesIntake());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(VIAJES_INTAKE_DRAFT_STORAGE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as Partial<ViajesIntakeV1>;
        if (p && p.schemaVersion === 1) setIntake(mergeIntakeFromPartial(p));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(VIAJES_INTAKE_DRAFT_STORAGE_KEY, JSON.stringify(intake));
    } catch {
      /* quota */
    }
  }, [intake, hydrated]);

  const update = useCallback((patch: Partial<ViajesIntakeV1>) => {
    setIntake((d) => ({ ...d, ...patch }));
  }, []);

  const updateBenefit = useCallback((patch: Partial<ViajesIntakeV1["communityBenefit"]>) => {
    setIntake((d) => ({ ...d, communityBenefit: { ...d.communityBenefit, ...patch } }));
  }, []);

  const clearLocalDraft = useCallback(() => {
    setIntake(emptyViajesIntake());
    try {
      if (typeof window !== "undefined") localStorage.removeItem(VIAJES_INTAKE_DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { intake, update, updateBenefit, clearLocalDraft, hydrated };
}
