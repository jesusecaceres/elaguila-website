import type { SnapshotCategory, SnapshotEvidenceRef, SnapshotTruthStatus } from "@/app/lib/business/creativeStudio/types";

function truthLabel(status: string): { label: string; className: string } {
  switch (status as SnapshotTruthStatus) {
    case "KNOWN":
      return { label: "Verified", className: "bg-emerald-100 text-emerald-800" };
    case "UNAPPROVED_INFERENCE":
      return { label: "Inferred / draft", className: "bg-amber-100 text-amber-800" };
    case "UNKNOWN":
      return { label: "Missing", className: "bg-[#EDE6D6] text-[#7A7164]" };
    case "STALE":
    case "CONTRADICTED":
      return { label: "Caution", className: "bg-amber-100 text-amber-900" };
    default:
      return { label: status, className: "bg-[#EDE6D6] text-[#3D3428]" };
  }
}

function wrapValue(value: string): string {
  return value;
}

function stringEntries(data: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(data).flatMap(([key, value]) => {
    if (value == null || value === "") return [];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return [{ key, value: String(value) }];
    }
    return [];
  });
}

function FactList({ facts }: { facts: unknown }) {
  if (!Array.isArray(facts) || facts.length === 0) {
    return <p className="text-xs text-[#7A7164]">No verified facts are stored in this snapshot category.</p>;
  }
  return (
    <ul className="mt-1 space-y-1">
      {facts.map((fact, index) => {
        const row = fact as { fieldKey?: string; displayValue?: string; sourceClass?: string };
        return (
          <li key={`${row.fieldKey ?? "fact"}-${index}`} className="break-words text-xs text-[#3D3428]">
            <span className="font-semibold">{row.fieldKey ?? "fact"}:</span>{" "}
            <span className="break-all">{wrapValue(row.displayValue ?? "")}</span>
            {row.sourceClass ? <span className="mt-0.5 block text-[10px] text-[#7A7164]">Source: {row.sourceClass}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function EvidenceList({ refs }: { refs: readonly SnapshotEvidenceRef[] }) {
  if (refs.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 border-t border-[#E8DFD0] pt-2">
      {refs.map((ref, index) => (
        <li key={`${ref.factId ?? ref.evidenceId ?? "ref"}-${index}`} className="break-words text-[10px] text-[#7A7164]">
          Rights / source
          {ref.sourceClass ? `: ${ref.sourceClass}` : ""}
          {ref.approvalState ? ` · approval: ${ref.approvalState}` : " · approval: not stored"}
          {ref.factId ? ` · fact ${ref.factId}` : ""}
        </li>
      ))}
    </ul>
  );
}

const IDENTITY_KEYS = [
  "displayName",
  "normalizedName",
  "primaryLanguage",
  "broadBusinessType",
  "specificBusinessType",
  "operatingModel",
  "businessStage",
] as const;

function ItemList({ items, empty }: { items: unknown; empty: string }) {
  if (!Array.isArray(items) || items.length === 0) return <p className="text-xs text-[#7A7164]">{empty}</p>;
  return (
    <ul className="mt-1 space-y-1">
      {items.map((item, index) => (
        <li key={`item-${index}`} className="break-words text-xs text-[#3D3428]">{String(item)}</li>
      ))}
    </ul>
  );
}

function ContactList({ contacts }: { contacts: unknown }) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return <p className="text-xs text-[#7A7164]">No stored phone, email, WhatsApp, or website contact.</p>;
  }
  return (
    <ul className="mt-1 space-y-1">
      {contacts.map((item, index) => {
        const row = item as { contactType?: string; value?: string; isPrimary?: boolean; visibility?: string; isWhatsApp?: boolean };
        return (
          <li key={`${row.contactType ?? "contact"}-${index}`} className="break-all text-xs text-[#3D3428]">
            <span className="font-semibold">{row.contactType ?? "contact"}{row.isWhatsApp ? " / WhatsApp" : ""}:</span> {row.value ?? ""}
            <span className="mt-0.5 block text-[10px] text-[#7A7164]">
              {row.isPrimary ? "Primary · " : ""}{row.visibility ?? "visibility not stored"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ServiceAreaList({ areas }: { areas: unknown }) {
  if (!Array.isArray(areas) || areas.length === 0) {
    return <p className="mt-2 text-xs text-[#7A7164]">No stored address / service area.</p>;
  }
  return (
    <ul className="mt-2 space-y-1">
      {areas.map((item, index) => {
        const row = item as { areaKind?: string; rawText?: string; cityHint?: string; isPrimary?: boolean };
        return (
          <li key={`area-${index}`} className="break-words text-xs text-[#3D3428]">
            <span className="font-semibold">{row.areaKind ?? "area"}:</span> {row.rawText ?? ""}
            {row.cityHint ? <span className="block text-[10px] text-[#7A7164]">{row.cityHint}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function AssetList({ assets }: { assets: unknown }) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return <p className="text-xs text-[#7A7164]">No stored Creative Studio client assets.</p>;
  }
  return (
    <ul className="mt-1 space-y-2">
      {assets.map((item, index) => {
        const row = item as {
          id?: string;
          assetKind?: string;
          originalFilename?: string;
          rightsStatus?: string;
          rightsSource?: string;
          approvalState?: string;
          uploadedDoesNotMeanApproved?: boolean;
        };
        return (
          <li key={row.id ?? `asset-${index}`} className="break-words text-xs text-[#3D3428]">
            <p className="font-semibold">{row.assetKind ?? "asset"} · {row.originalFilename ?? row.id ?? "unnamed"}</p>
            <p className="text-[10px] text-[#7A7164]">
              Rights: {row.rightsStatus ?? "unknown"} · source: {row.rightsSource ?? "unknown"} · approval: {row.approvalState ?? "not stored"}
              {row.uploadedDoesNotMeanApproved ? " · uploaded is not approved" : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryBody({ category }: { category: SnapshotCategory }) {
  if (category.category === "identity") {
    return (
      <dl className="mt-1 space-y-1">
        {IDENTITY_KEYS.map((key) => {
          const raw = category.data[key];
          const value = Array.isArray(raw)
            ? raw.map((item) => String(item).trim()).filter(Boolean).join(", ")
            : raw == null ? "" : String(raw).trim();
          return (
            <div key={key}>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">{key}</dt>
              <dd className="break-words text-xs text-[#3D3428]">
                {value ? value : <span className="text-[#7A7164]">Missing</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  if (category.category === "approved_contacts_location") {
    return (
      <div>
        {Array.isArray(category.data.contacts) ? <ContactList contacts={category.data.contacts} /> : <FactList facts={category.data.facts} />}
        <ServiceAreaList areas={category.data.serviceAreas} />
      </div>
    );
  }

  if (category.category === "digital_destinations") {
    const website = typeof category.data.officialWebsite === "string" ? category.data.officialWebsite : "";
    const profiles = Array.isArray(category.data.socialProfiles) ? category.data.socialProfiles : [];
    const links = Array.isArray(category.data.destinationLinks) ? category.data.destinationLinks : [];
    return (
      <div className="space-y-2">
        <p className="break-all text-xs text-[#3D3428]">
          Official website: {website ? website : <span className="text-[#7A7164]">Missing</span>}
        </p>
        {profiles.length === 0 ? (
          <p className="text-xs text-[#7A7164]">No stored official social profiles.</p>
        ) : (
          <ul className="space-y-1">
            {profiles.map((item, index) => {
              const row = item as { platform?: string; handleOrUrl?: string };
              return (
                <li key={`profile-${index}`} className="break-all text-xs text-[#3D3428]">
                  {row.platform}: {row.handleOrUrl}
                </li>
              );
            })}
          </ul>
        )}
        {links.length === 0 ? (
          <p className="text-xs text-[#7A7164]">No stored booking / order links.</p>
        ) : (
          <ul className="space-y-1">
            {links.map((item, index) => {
              const row = item as { linkType?: string; displayUrl?: string };
              return (
                <li key={`link-${index}`} className="break-all text-xs text-[#3D3428]">
                  {row.linkType}: {row.displayUrl}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  if (category.category === "confirmed_facts" || category.category === "goals_customer_services") {
    return <FactList facts={category.data.facts} />;
  }

  if (category.category === "creative_assets") {
    return <AssetList assets={category.data.assets} />;
  }

  if (category.category === "source_opportunity") {
    return (
      <dl className="mt-1 space-y-1">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Title</dt>
          <dd className="break-words text-xs text-[#3D3428]">{String(category.data.titleEn ?? category.data.titleEs ?? "—")}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Type / state</dt>
          <dd className="text-xs text-[#3D3428]">{String(category.data.opportunityType ?? "—")} · {String(category.data.lifecycleState ?? "—")}</dd>
        </div>
        <p className="text-[10px] text-[#7A7164]">Linked opportunity context only. Not confirmed sponsorship.</p>
      </dl>
    );
  }

  if (category.category === "missing_important_information") {
    return <ItemList items={category.data.items} empty="No missing-information notes were stored in this snapshot." />;
  }

  if (category.category === "source_recommendation") {
    const rows = Array.isArray(category.data.recommendations) ? category.data.recommendations : [];
    if (rows.length === 0) return <p className="text-xs text-[#7A7164]">No recommendation context is stored in this snapshot.</p>;
    return (
      <ul className="mt-1 space-y-2">
        {rows.map((row, index) => {
          const rec = row as { id?: string; dimensionKey?: string; needEn?: string; needEs?: string };
          return (
            <li key={rec.id ?? `rec-${index}`} className="text-xs text-[#3D3428]">
              <p className="font-semibold">{rec.dimensionKey ?? "Recommendation"}</p>
              <p className="mt-0.5 break-words">{rec.needEn ?? rec.needEs ?? ""}</p>
            </li>
          );
        })}
      </ul>
    );
  }

  if (category.category === "ai_research_context") {
    return (
      <p className="mt-1 text-xs text-[#3D3428]">
        Stored AI research briefing count: {String(category.data.briefingCount ?? 0)}. Context only — not printable confirmed fact.
      </p>
    );
  }

  const entries = stringEntries(category.data);
  if (entries.length === 0) {
    return <p className="mt-1 text-xs text-[#7A7164]">This category has no simple stored fields to display.</p>;
  }
  return (
    <dl className="mt-1 space-y-1">
      {entries.map((entry) => (
        <div key={entry.key}>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">{entry.key}</dt>
          <dd className="break-all text-xs text-[#3D3428]">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const CATEGORY_TITLES: Record<string, string> = {
  identity: "Business",
  approved_contacts_location: "Contacts / location",
  digital_destinations: "Digital destinations",
  confirmed_facts: "Confirmed facts",
  goals_customer_services: "Goals / customer / services",
  creative_assets: "Creative assets",
  source_recommendation: "Recommendation context",
  source_opportunity: "Opportunity context",
  ai_research_context: "Inferred research context",
  missing_important_information: "Missing important information",
};

export function CreativeTruthPacket({
  snapshot,
  loadError,
}: {
  snapshot: {
    id: string;
    version: number;
    snapshotTimestamp: string;
    categories: readonly SnapshotCategory[];
  } | null;
  loadError?: boolean;
}) {
  if (loadError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-900">The Creative Truth Packet could not be loaded. The rest of the dashboard is still available.</p>
      </div>
    );
  }

  if (!snapshot) {
    return <p className="text-sm text-[#7A7164]">No verified creative input snapshot is available.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Creative Truth Packet</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Snapshot of verified/approved inputs used for this creative job. It is not live-mutating canonical business truth.
        </p>
        <p className="mt-1 text-[10px] text-[#7A7164]">
          Snapshot v{snapshot.version} · {new Date(snapshot.snapshotTimestamp).toLocaleString()}
        </p>
      </div>

      {snapshot.categories.length === 0 ? (
        <p className="text-sm text-[#7A7164]">No verified creative input snapshot is available.</p>
      ) : (
        snapshot.categories.map((category) => {
          const badge = truthLabel(category.truthStatus);
          return (
            <article key={`${category.category}-${category.snapshotTimestamp}`} className="rounded-lg border border-[#E8DFD0] bg-[#FFFDF7] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-[#1E1810]">{CATEGORY_TITLES[category.category] ?? category.category.replace(/_/g, " ")}</h4>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>{badge.label}</span>
              </div>
              <CategoryBody category={category} />
              <EvidenceList refs={category.evidenceRefs} />
            </article>
          );
        })
      )}

      <details className="rounded-lg border border-[#E8DFD0] bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-[#3D3428]">Developer snapshot JSON</summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px] text-[#7A7164]">
          {JSON.stringify(snapshot.categories, null, 2)}
        </pre>
      </details>
    </div>
  );
}
