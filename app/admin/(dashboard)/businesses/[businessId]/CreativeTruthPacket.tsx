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
  "operatingModel",
  "businessStage",
] as const;

function CategoryBody({ category }: { category: SnapshotCategory }) {
  if (category.category === "identity") {
    return (
      <dl className="mt-1 space-y-1">
        {IDENTITY_KEYS.map((key) => {
          const raw = category.data[key];
          const value = raw == null ? "" : String(raw).trim();
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
    return <FactList facts={category.data.facts} />;
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
  approved_contacts_location: "Verified facts / contact",
  source_recommendation: "Recommendation context",
  ai_research_context: "Inferred research context",
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
