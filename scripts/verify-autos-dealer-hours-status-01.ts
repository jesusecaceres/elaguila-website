/**
 * Focused proof for `buildAutosDealerHoursStatus` (live open/closed for the Dealer Business Hub).
 * Run: npx tsx scripts/verify-autos-dealer-hours-status-01.ts
 */
import { buildAutosDealerHoursStatus } from "../app/(site)/clasificados/autos/negocios/lib/autosDealerHoursStatus";
import type { DealerHoursEntry } from "../app/(site)/clasificados/autos/negocios/types/autoDealerListing";

let failed = false;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS ${label}`);
  } else {
    failed = true;
    console.log(`FAIL ${label}${detail ? " — " + detail : ""}`);
  }
}

const CA_LOCATION = { state: "CA", country: "United States" };

const weekHours: DealerHoursEntry[] = [
  { day: "Lunes", open: "09:00", close: "18:00", closed: false },
  { day: "Martes", open: "09:00", close: "18:00", closed: false },
  { day: "Miércoles", open: "09:00", close: "18:00", closed: false },
  { day: "Jueves", open: "09:00", close: "18:00", closed: false },
  { day: "Viernes", open: "09:00", close: "20:00", closed: false },
  { day: "Sábado", open: "10:00", close: "16:00", closed: false },
  { day: "Domingo", open: "", close: "", closed: true },
];

// Tuesday 2026-09-15 is a Tuesday in Pacific time. Use noon Pacific (19:00 UTC) to avoid DST edge cases.
const tuesdayNoonPacific = new Date("2026-09-15T19:00:00Z");
const r1 = buildAutosDealerHoursStatus(weekHours, CA_LOCATION, "es", tuesdayNoonPacific);
check("regular open (mid-day Tuesday)", r1?.variant === "open" && r1.text.includes("Abierto hoy"), JSON.stringify(r1));

// 9pm Pacific on a Tuesday (weekday closes at 18:00) -> closed, opens tomorrow (Wednesday) 9am.
const tuesdayAfterClosePacific = new Date("2026-09-16T04:00:00Z"); // 21:00 Tue Pacific (PDT, UTC-7)
const r2 = buildAutosDealerHoursStatus(weekHours, CA_LOCATION, "es", tuesdayAfterClosePacific);
check(
  "after closing time -> closed, opens tomorrow",
  r2?.variant === "closed" && /abre mañana/.test(r2.text),
  JSON.stringify(r2),
);

// Sunday noon Pacific -> closed all day (Sunday closed), opens tomorrow (Monday) 9am.
const sundayNoonPacific = new Date("2026-09-13T19:00:00Z");
const r3 = buildAutosDealerHoursStatus(weekHours, CA_LOCATION, "es", sundayNoonPacific);
check(
  "closed day (Sunday) -> opens tomorrow",
  r3?.variant === "closed" && /abre mañana/.test(r3.text),
  JSON.stringify(r3),
);

// Before opening time on a business day -> closed, opens today.
const tuesdayEarlyMorningPacific = new Date("2026-09-15T13:00:00Z"); // 06:00 Tue Pacific
const r4 = buildAutosDealerHoursStatus(weekHours, CA_LOCATION, "es", tuesdayEarlyMorningPacific);
check(
  "before opening -> closed, opens today",
  r4?.variant === "closed" && /abre hoy/.test(r4.text),
  JSON.stringify(r4),
);

// Unresolvable timezone (non-US country) -> neutral status, no open/closed claim.
const r5 = buildAutosDealerHoursStatus(weekHours, { state: "CA", country: "Mexico" }, "es", tuesdayNoonPacific);
check(
  "unresolvable timezone -> neutral, no claim",
  r5?.variant === "neutral" && !/Abierto|Cerrado/.test(r5.text),
  JSON.stringify(r5),
);

// No hours at all -> null (nothing to show).
const r6 = buildAutosDealerHoursStatus(undefined, CA_LOCATION, "es", tuesdayNoonPacific);
check("no hours configured -> null", r6 === null, JSON.stringify(r6));

// English copy sanity.
const r7 = buildAutosDealerHoursStatus(weekHours, CA_LOCATION, "en", tuesdayNoonPacific);
check("english open copy", r7?.variant === "open" && r7.text.includes("Open today"), JSON.stringify(r7));

if (failed) {
  console.error("\nverify-autos-dealer-hours-status-01: FAILED");
  process.exit(1);
}
console.log("\nAutos Dealer live hours status verifier passed.");
