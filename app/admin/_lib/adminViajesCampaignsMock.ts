/** Seasonal / thematic merchandising groups — admin curation shell (no engine yet). */

export type AdminViajesCampaignRow = {
  id: string;
  titleEs: string;
  windowLabel: string;
  focus: string;
  affiliateSlots: number;
  businessSlots: number;
  editorialSlots: number;
  active: boolean;
};

export const ADMIN_VIAJES_CAMPAIGNS_MOCK: AdminViajesCampaignRow[] = [
  {
    id: "verano",
    titleEs: "Verano",
    windowLabel: "Jun–Aug (CR)",
    focus: "Beach + family bundles",
    affiliateSlots: 6,
    businessSlots: 4,
    editorialSlots: 2,
    active: true,
  },
  {
    id: "ultimo-minuto",
    titleEs: "Último minuto",
    windowLabel: "Rolling 21d",
    focus: "Urgency + SJO departures",
    affiliateSlots: 5,
    businessSlots: 3,
    editorialSlots: 1,
    active: true,
  },
  {
    id: "cruceros-mes",
    titleEs: "Cruceros del mes",
    windowLabel: "Apr 2026",
    focus: "Partner spotlight + collections",
    affiliateSlots: 4,
    businessSlots: 2,
    editorialSlots: 1,
    active: false,
  },
  {
    id: "escapadas-romanticas",
    titleEs: "Escapadas románticas",
    windowLabel: "Year-round",
    focus: "Couples + boutique stays",
    affiliateSlots: 4,
    businessSlots: 3,
    editorialSlots: 2,
    active: true,
  },
  {
    id: "viajes-familiares",
    titleEs: "Viajes familiares",
    windowLabel: "School breaks",
    focus: "Kid-friendly + transfers",
    affiliateSlots: 5,
    businessSlots: 4,
    editorialSlots: 2,
    active: true,
  },
  {
    id: "renta-autos",
    titleEs: "Renta de autos",
    windowLabel: "Partner feed TBD",
    focus: "Mobility add-on near SJO/LIR",
    affiliateSlots: 3,
    businessSlots: 1,
    editorialSlots: 0,
    active: false,
  },
  {
    id: "spring-break",
    titleEs: "Spring break",
    windowLabel: "Mar (US calendars)",
    focus: "Short-haul beach + groups",
    affiliateSlots: 4,
    businessSlots: 2,
    editorialSlots: 1,
    active: false,
  },
];
