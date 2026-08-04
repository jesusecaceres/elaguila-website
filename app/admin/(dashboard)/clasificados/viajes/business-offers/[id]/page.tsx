import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { buildViajesAdminDetailView } from "@/app/(site)/clasificados/viajes/lib/viajesAdminDetailView";
import { fetchViajesStagedRowById } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { requireAdminCookie } from "@/app/lib/supabase/server";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${adminCardBase} space-y-3 p-5`}>
      <h2 className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">{title}</h2>
      {children}
    </section>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
      <dt className="text-[#7A7164]">{k}</dt>
      <dd className="break-words text-[#1E1810]">{v || "—"}</dd>
    </div>
  );
}

function PillList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-xs text-[#7A7164]">—</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-2.5 py-0.5 text-xs text-[#3D3428]">
          {t}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminViajesStagedListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const row = await fetchViajesStagedRowById(id);
  if (!row) notFound();

  const d = buildViajesAdminDetailView(row);

  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · staged detail"
        title={d.basics.title || "Untitled offer"}
        subtitle="Structured staff review of a staged Viajes listing (V1/V2 normalized)."
        helperText={`UUID ${d.identity.id}`}
      />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/clasificados/viajes/business-offers" className="font-semibold text-[#6B5B2E] underline">
          ← Back to queue
        </Link>
        {d.identity.lifecycleStatus === "approved" && d.identity.isPublic ? (
          <Link
            href={`/clasificados/viajes/oferta/${encodeURIComponent(d.identity.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#6B5B2E] underline"
          >
            Public offer →
          </Link>
        ) : null}
      </div>

      <div className="space-y-4">
        <Section title="Identity">
          <dl className="space-y-2">
            <Kv k="Staged UUID" v={<code className="text-xs">{d.identity.id}</code>} />
            <Kv k="Slug" v={d.identity.slug} />
            <Kv k="Leonix Ad ID" v={d.identity.leonixAdId || "— (not assigned yet)"} />
            <Kv k="Lane" v={d.identity.lane} />
            <Kv k="Status" v={`${d.identity.lifecycleStatus}${d.identity.isPublic ? " · public" : ""}`} />
            <Kv k="Owner" v={d.identity.ownerUserId} />
            <Kv
              k="Submitter"
              v={[d.identity.submitterName, d.identity.submitterEmail].filter(Boolean).join(" · ") || "—"}
            />
            <Kv k="Submitted" v={d.identity.submittedAt} />
            <Kv k="Updated" v={d.identity.updatedAt} />
            <Kv k="Published" v={d.identity.publishedAt} />
            <Kv k="Lang" v={d.identity.lang} />
            <Kv k="Business profile" v={d.identity.businessProfileSlug} />
          </dl>
        </Section>

        <Section title="Basics">
          <dl className="space-y-2">
            <Kv k="Title" v={d.basics.title} />
            <Kv k="Destination" v={d.basics.destination} />
            <Kv k="Departure" v={d.basics.departure} />
            <Kv k="Offer kind" v={d.basics.offerKind} />
            <Kv k="Duration" v={d.basics.duration} />
            <Kv k="Pricing" v={d.basics.pricingLanguage} />
            <Kv k="Source lane" v={d.basics.sourceLane} />
            <Kv k="Disclosure" v={d.basics.sourceDisclosure} />
          </dl>
        </Section>

        <Section title="Media">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Hero</p>
              {d.media.heroUrl ? (
                <img src={d.media.heroUrl} alt={d.media.heroAlt} className="max-h-48 w-full rounded-xl object-cover" />
              ) : (
                <p className="text-xs text-[#7A7164]">No durable hero</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Results card</p>
              {d.media.resultsCardUrl ? (
                <img
                  src={d.media.resultsCardUrl}
                  alt={d.media.resultsCardAlt}
                  className="max-h-48 w-full rounded-xl object-cover"
                />
              ) : (
                <p className="text-xs text-[#7A7164]">No durable results-card image</p>
              )}
            </div>
          </div>
          {d.media.gallery.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {d.media.gallery.map((g) => (
                <figure key={g.url} className="overflow-hidden rounded-lg border border-[#E8DFD0]">
                  <img src={g.url} alt={g.alt} className="h-28 w-full object-cover" />
                  <figcaption className="px-1.5 py-1 text-[10px] text-[#7A7164]">
                    {g.role}
                    {g.alt ? ` · ${g.alt}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="Provider">
          <dl className="space-y-2">
            <Kv k="Name" v={d.provider.name} />
            <Kv k="Slug / id" v={d.provider.slug} />
            <Kv k="Profile route" v={d.provider.profileRoute} />
            <Kv k="Phone" v={d.provider.phone} />
            <Kv k="WhatsApp" v={d.provider.whatsapp} />
            <Kv k="Email" v={d.provider.email} />
            <Kv k="Website" v={d.provider.website} />
            <Kv k="Public location" v={d.provider.publicLocation} />
          </dl>
          <p className="text-[11px] text-[#7A7164]">No fabricated verification badges are shown.</p>
        </Section>

        <Section title="Travel content">
          <div className="space-y-3 text-sm text-[#3D3428]">
            <div>
              <p className="text-xs font-bold uppercase text-[#7A7164]">Story</p>
              <p className="mt-1 whitespace-pre-wrap">{d.travel.story || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Highlights</p>
              <PillList items={d.travel.highlights} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Inclusions</p>
              <PillList items={d.travel.inclusions} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Exclusions</p>
              <PillList items={d.travel.exclusions} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Itinerary</p>
              {d.travel.itinerary.length ? (
                <ol className="list-decimal space-y-2 pl-5">
                  {d.travel.itinerary.map((it, i) => (
                    <li key={`${it.title}-${i}`}>
                      <span className="font-semibold">{it.title || `Day ${i + 1}`}</span>
                      {it.body ? <p className="text-xs text-[#5C5346]">{it.body}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-[#7A7164]">—</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Modules</p>
              {d.travel.modules.length ? (
                <ul className="space-y-1.5">
                  {d.travel.modules.map((m, i) => (
                    <li key={`${m.kind}-${i}`} className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-[#A67C52]">{m.kind}</span>
                      <span className="ml-2 font-semibold">{m.title}</span>
                      {m.summary ? <p className="mt-0.5 text-[#5C5346]">{m.summary}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#7A7164]">—</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Policies</p>
              <PillList items={d.travel.policies} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Accessibility</p>
              <PillList items={d.travel.accessibility} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-[#7A7164]">Need to know</p>
              <PillList items={d.travel.needToKnow} />
            </div>
          </div>
        </Section>

        <Section title="Locations">
          <dl className="space-y-2">
            <Kv
              k="Destination"
              v={`${d.locations.destination.label || "—"} (${d.locations.destination.isPublic ? "public" : "not public"})`}
            />
            <Kv
              k="Departure"
              v={`${d.locations.departure.label || "—"} (${d.locations.departure.isPublic ? "public" : "not public"})`}
            />
            <Kv
              k="Provider office"
              v={`${d.locations.providerOffice.label || "—"} (${d.locations.providerOffice.isPublic ? "public" : "not public"})`}
            />
            {d.locations.privateExact ? (
              <Kv
                k="Private exact"
                v={
                  <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-900 ring-1 ring-rose-200">
                    PRIVATE / NOT PUBLIC — {d.locations.privateExact.label}
                  </span>
                }
              />
            ) : (
              <Kv k="Private exact" v="— (none stored)" />
            )}
          </dl>
        </Section>

        <details className={`${adminCardBase} p-5`}>
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#7A7164]">
            Sanitized raw payload (staff debug)
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[#1E1810] p-4 text-[11px] text-[#F5EFE3]">
            {JSON.stringify(d.rawSanitized, null, 2)}
          </pre>
        </details>
      </div>
    </>
  );
}
