"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ServiciosApplicationDraft } from "../../types/serviciosApplicationDraft";
import { readServiciosApplicationDraftFromBrowser, writeServiciosApplicationDraftToBrowser } from "../../lib/serviciosDraftStorage";
import { createEmptyServiciosApplicationDraft } from "../lib/createEmptyServiciosApplicationDraft";

const DEBOUNCE_MS = 450;

export function useServiciosApplicationDraftState(): {
  draft: ServiciosApplicationDraft;
  setDraft: Dispatch<SetStateAction<ServiciosApplicationDraft>>;
  hydrated: boolean;
  persistNow: () => void;
} {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<ServiciosApplicationDraft>(() => createEmptyServiciosApplicationDraft());

  useEffect(() => {
    const stored = readServiciosApplicationDraftFromBrowser();
    if (stored) setDraft(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      writeServiciosApplicationDraftToBrowser(draft);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [draft, hydrated]);

  const persistNow = useCallback(() => {
    writeServiciosApplicationDraftToBrowser(draft);
  }, [draft]);

  return { draft, setDraft, hydrated, persistNow };
}
