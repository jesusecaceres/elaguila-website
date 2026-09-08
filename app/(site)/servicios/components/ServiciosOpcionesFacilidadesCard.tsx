import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { SV } from "./serviciosDesignTokens";
import { ServiciosAmenityBadge } from "./ServiciosAmenityBadge";
import {
  SERVICIOS_AMENITY_GROUPS,
  SERVICIOS_AMENITY_OPTIONS,
  isServiciosAmenityOptionId,
  type ServiciosAmenityGroupId,
} from "../lib/serviciosAmenitiesCatalog";

export function ServiciosOpcionesFacilidadesCard({
  profile,
  lang,
  compact = false,
  embedded = false,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  compact?: boolean;
  embedded?: boolean;
}) {
  const std = profile.amenityOptionIds.filter((id): id is string => typeof id === "string");
  const customByGroup = profile.customAmenityOptionsByGroup ?? {};
  const knownGroupIds = new Set(SERVICIOS_AMENITY_GROUPS.filter((row) => row.id !== "other").map((r) => r.id));
  const groupedCustomKeys = new Set<string>();
  for (const gid of knownGroupIds) {
    for (const label of customByGroup[gid] ?? []) groupedCustomKeys.add(label.trim().toLowerCase());
  }
  // Legacy flat custom amenities not attributable to a specific group (older stored profiles).
  const looseCustom = (profile.customAmenityOptions ?? []).filter(
    (x) => typeof x === "string" && x.trim().length > 0 && !groupedCustomKeys.has(x.trim().toLowerCase()),
  );
  const anyGroupedCustom = Object.values(customByGroup).some((arr) => Array.isArray(arr) && arr.length > 0);
  if (std.length === 0 && looseCustom.length === 0 && !anyGroupedCustom) return null;

  const title = lang === "en" ? "Options & amenities" : "Opciones y facilidades";
  const subtitle =
    lang === "en"
      ? "Helpful details about how this business works."
      : "Detalles útiles sobre cómo trabaja este negocio.";

  const byGroup = new Map<ServiciosAmenityGroupId, string[]>();
  for (const id of std) {
    if (!isServiciosAmenityOptionId(id)) continue;
    const def = SERVICIOS_AMENITY_OPTIONS.find((o) => o.id === id);
    const gid = def?.groupId ?? "service";
    const cur = byGroup.get(gid) ?? [];
    cur.push(id);
    byGroup.set(gid, cur);
  }

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={
              embedded
                ? "text-sm font-semibold text-[color:var(--lx-text)]"
                : "text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
            }
          >
            {title}
          </h2>
          {!embedded ? <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{subtitle}</p> : null}
        </div>
      </div>

      <div className={`space-y-3 ${compact ? "mt-3" : "mt-4 md:mt-5 md:space-y-5"}`}>
        {SERVICIOS_AMENITY_GROUPS.filter((g) => g.id !== "other").map((g) => {
          const ids = byGroup.get(g.id as ServiciosAmenityGroupId) ?? [];
          const groupCustom = customByGroup[g.id] ?? [];
          if (ids.length === 0 && groupCustom.length === 0) return null;
          return (
            <div key={g.id}>
              <p className="text-sm font-semibold text-[color:var(--lx-text)]">{g.label[lang]}</p>
              <div className="mt-2 flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] md:flex-wrap md:overflow-visible">
                {ids.map((id) => (
                  <div
                    key={id}
                    className="shrink-0 rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
                    style={{ borderColor: SV.goldBorder }}
                  >
                    <ServiciosAmenityBadge lang={lang} standardId={id} />
                  </div>
                ))}
                {groupCustom.map((label, i) => (
                  <div
                    key={`amenity-custom-${g.id}-${i}-${label.slice(0, 24)}`}
                    className="shrink-0 rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
                    style={{ borderColor: SV.goldBorder }}
                  >
                    <ServiciosAmenityBadge lang={lang} customLabel={label} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {looseCustom.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              {lang === "en" ? "Other options" : "Otras opciones"}
            </p>
            <div className="mt-2 flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] md:flex-wrap md:overflow-visible">
              {looseCustom.map((label, i) => (
                <div
                  key={`amenity-custom-loose-${i}-${label.slice(0, 24)}`}
                  className="shrink-0 rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
                  style={{ borderColor: SV.goldBorder }}
                >
                  <ServiciosAmenityBadge lang={lang} customLabel={label} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) return <div data-servicios-amenities-embedded="1">{body}</div>;

  return (
    <section
      className={`rounded-2xl border shadow-sm ${compact ? "p-3 sm:p-4" : "p-3 sm:p-6 md:p-8"}`}
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      {body}
    </section>
  );
}

