import type {
  BrPrivadoGate12dSlice,
  BrPrivadoHoaFrequency,
  BrPrivadoTriBool,
  BrPetsAllowedChoice,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";

export type BrGate12dHoaPreviewFact = { label: string; value: string };

export type BrGate12dHoaFormSlice = Pick<
  BrPrivadoGate12dSlice,
  | "hasHoa"
  | "hoaFee"
  | "hoaFrequency"
  | "hoaIncludes"
  | "communityRules"
  | "petRules"
  | "rentalRestrictions"
  | "shortTermRentalAllowed"
  | "parkingRules"
>;

function trim(s: string): string {
  return s.trim();
}

function row(label: string, value: string): BrGate12dHoaPreviewFact | null {
  const v = value.trim();
  if (!v) return null;
  return { label, value: v };
}

export function brGate12dHoaFormSliceHasContent(g: BrGate12dHoaFormSlice): boolean {
  return Boolean(
    g.hasHoa ||
      trim(g.hoaFee) ||
      g.hoaFrequency ||
      trim(g.hoaIncludes) ||
      trim(g.communityRules) ||
      trim(g.petRules) ||
      trim(g.rentalRestrictions) ||
      g.shortTermRentalAllowed ||
      trim(g.parkingRules),
  );
}

function triBoolLabel(lang: "es" | "en", v: BrPrivadoTriBool): string | null {
  if (v === "yes") return lang === "es" ? "Sí" : "Yes";
  if (v === "no") return lang === "es" ? "No" : "No";
  if (v === "unknown") return lang === "es" ? "No indicado" : "Unknown";
  return null;
}

function hoaFreqLabel(lang: "es" | "en", f: BrPrivadoHoaFrequency): string | null {
  if (f === "monthly") return lang === "es" ? "Mensual" : "Monthly";
  if (f === "quarterly") return lang === "es" ? "Trimestral" : "Quarterly";
  if (f === "yearly") return lang === "es" ? "Anual" : "Yearly";
  if (f === "unknown") return lang === "es" ? "No indicada" : "Unknown";
  return null;
}

/** Preview / live-adjacent card from application `gate12d` HOA slice (human labels only). */
export function buildBrGate12dHoaPreviewCard(
  g: BrGate12dHoaFormSlice,
  opts: { lang: "es" | "en"; petsAllowed?: BrPetsAllowedChoice },
): { title: string; rows: BrGate12dHoaPreviewFact[] } | null {
  const lang = opts.lang;
  const rows: BrGate12dHoaPreviewFact[] = [];
  const L = (es: string, en: string) => (lang === "es" ? es : en);
  const pushRow = (label: string, value: string) => {
    const r = row(label, value);
    if (r) rows.push(r);
  };
  const hb = triBoolLabel(lang, g.hasHoa);
  if (hb) pushRow(L("¿Hay HOA?", "Is there an HOA?"), hb);
  if (trim(g.hoaFee)) pushRow(L("Cuota HOA", "HOA fee"), trim(g.hoaFee));
  const fq = hoaFreqLabel(lang, g.hoaFrequency);
  if (fq) pushRow(L("Frecuencia", "Frequency"), fq);
  if (trim(g.hoaIncludes)) pushRow(L("¿Qué incluye la cuota?", "What does the fee include?"), trim(g.hoaIncludes));
  if (trim(g.communityRules)) pushRow(L("Reglas de la comunidad", "Community rules"), trim(g.communityRules));
  const petText =
    trim(g.petRules) ||
    (opts.petsAllowed === "yes"
      ? L("Se permiten mascotas (política publicada).", "Pets allowed (published policy).")
      : opts.petsAllowed === "no"
        ? L("No se permiten mascotas (política publicada).", "Pets not allowed (published policy).")
        : "");
  if (petText) pushRow(L("Reglas sobre mascotas", "Pet rules"), petText);
  if (trim(g.rentalRestrictions)) pushRow(L("Restricciones de renta", "Rental restrictions"), trim(g.rentalRestrictions));
  const st = triBoolLabel(lang, g.shortTermRentalAllowed);
  if (st) pushRow(L("¿Se permiten rentas de corto plazo?", "Are short-term rentals allowed?"), st);
  if (trim(g.parkingRules)) pushRow(L("Reglas de estacionamiento", "Parking rules"), trim(g.parkingRules));
  if (!rows.length) return null;
  return { title: L("HOA y comunidad", "HOA and community"), rows };
}
