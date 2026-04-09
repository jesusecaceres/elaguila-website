"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import {
  ADMIN_AFFILIATE_PLACEMENT_LABELS,
  type AdminAffiliatePlacement,
} from "@/app/admin/_lib/adminViajesAffiliateTypes";
import type { AffiliateFormState } from "@/app/admin/_lib/adminViajesAffiliateFormTypes";

const PL_KEYS = Object.keys(ADMIN_AFFILIATE_PLACEMENT_LABELS) as AdminAffiliatePlacement[];

export function AdminViajesAffiliateOfferForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: AffiliateFormState;
}) {
  const [s, setS] = useState(initial);

  const derivedPlacements = useMemo(() => {
    const set = new Set(s.placements);
    if (s.homepageInclusion) set.add("homepage_featured");
    else set.delete("homepage_featured");
    if (s.topOffersInclusion) set.add("top_offers_week");
    else set.delete("top_offers_week");
    if (s.resultsEligible) set.add("results_eligible");
    else set.delete("results_eligible");
    return [...set];
  }, [s.placements, s.homepageInclusion, s.topOffersInclusion, s.resultsEligible]);

  function togglePlacement(key: AdminAffiliatePlacement) {
    setS((prev) => {
      const has = prev.placements.includes(key);
      const placements = has ? prev.placements.filter((p) => p !== key) : [...prev.placements, key];
      return { ...prev, placements };
    });
  }

  const field = (label: string, child: ReactNode) => (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</span>
      <div className="mt-1">{child}</div>
    </label>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className={`${adminCardBase} space-y-4 p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">Listing source</p>
        <p className="text-sm text-[#5C5346]">
          <strong>Lane:</strong> affiliate (partner-managed). Not a business self-serve listing. Public cards must keep the commercial-partner disclosure.
        </p>
        <input type="hidden" name="listingKind" value="affiliate" readOnly />
      </div>

      <div className={`${adminCardBase} grid gap-4 p-5 sm:grid-cols-2`}>
        <p className="sm:col-span-2 text-xs font-bold uppercase tracking-wide text-[#A67C52]">
          Offer content (maps to public card + detail)
        </p>
        {field(
          "Partner name",
          <input className={adminInputClass} value={s.partnerName} onChange={(e) => setS({ ...s, partnerName: e.target.value })} />
        )}
        {field(
          "Headline",
          <input className={adminInputClass} value={s.headline} onChange={(e) => setS({ ...s, headline: e.target.value })} />
        )}
        {field(
          "Destination",
          <input className={adminInputClass} value={s.destination} onChange={(e) => setS({ ...s, destination: e.target.value })} />
        )}
        {field(
          "Origin / departure context",
          <input
            className={adminInputClass}
            value={s.departureContext}
            onChange={(e) => setS({ ...s, departureContext: e.target.value })}
            placeholder="SFO · SJO"
          />
        )}
        {field(
          "Offer type",
          <input className={adminInputClass} value={s.offerType} onChange={(e) => setS({ ...s, offerType: e.target.value })} />
        )}
        {field(
          "Price from",
          <input className={adminInputClass} value={s.priceFrom} onChange={(e) => setS({ ...s, priceFrom: e.target.value })} />
        )}
        {field(
          "Duration",
          <input className={adminInputClass} value={s.duration} onChange={(e) => setS({ ...s, duration: e.target.value })} />
        )}
        {field(
          "Booking URL (partner)",
          <input className={adminInputClass} value={s.bookingUrl} onChange={(e) => setS({ ...s, bookingUrl: e.target.value })} />
        )}
        {field(
          "Hero image URL",
          <input className={adminInputClass} value={s.imageUrl} onChange={(e) => setS({ ...s, imageUrl: e.target.value })} />
        )}
        <div className="sm:col-span-2">
          {field(
            "Short description",
            <textarea
              className={`${adminInputClass} min-h-[88px]`}
              value={s.shortDescription}
              onChange={(e) => setS({ ...s, shortDescription: e.target.value })}
            />
          )}
        </div>
        {field(
          "Tags (comma-separated)",
          <input className={adminInputClass} value={s.tags} onChange={(e) => setS({ ...s, tags: e.target.value })} />
        )}
        {field(
          "Affiliate label (public)",
          <input className={adminInputClass} value={s.affiliateLabel} onChange={(e) => setS({ ...s, affiliateLabel: e.target.value })} />
        )}
        {field(
          "Expiry date (if known)",
          <input className={adminInputClass} type="date" value={s.expiryDate} onChange={(e) => setS({ ...s, expiryDate: e.target.value })} />
        )}
        {field(
          "Public slug (offer detail)",
          <input
            className={adminInputClass}
            value={s.publicSlug}
            onChange={(e) => setS({ ...s, publicSlug: e.target.value })}
            placeholder="cancun-resort-mar"
          />
        )}
      </div>

      <div className={`${adminCardBase} space-y-4 p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">Placements & merchandising</p>
        <p className="text-xs text-[#5C5346]">
          Structured flags for where this affiliate offer may surface on Viajes. Derived preview:{" "}
          <code className="rounded bg-[#F3EBDD] px-1 text-[11px]">{derivedPlacements.join(", ") || "—"}</code>
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#2C2416]">
            <input
              type="checkbox"
              checked={s.topOffersInclusion}
              onChange={(e) => setS({ ...s, topOffersInclusion: e.target.checked })}
            />
            Top ofertas de la semana
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#2C2416]">
            <input
              type="checkbox"
              checked={s.homepageInclusion}
              onChange={(e) => setS({ ...s, homepageInclusion: e.target.checked })}
            />
            Homepage featured rail
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#2C2416]">
            <input
              type="checkbox"
              checked={s.resultsEligible}
              onChange={(e) => setS({ ...s, resultsEligible: e.target.checked })}
            />
            Results page eligibility
          </label>
        </div>
        {field(
          "Seasonal campaign id (internal)",
          <input
            className={adminInputClass}
            value={s.seasonalCampaign}
            onChange={(e) => setS({ ...s, seasonalCampaign: e.target.value })}
            placeholder="verano-2026"
          />
        )}
        <div>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Additional placement tags</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PL_KEYS.map((key) => (
              <label key={key} className="flex cursor-pointer items-start gap-2 text-xs text-[#2C2416]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={s.placements.includes(key)}
                  onChange={() => togglePlacement(key)}
                />
                <span>{ADMIN_AFFILIATE_PLACEMENT_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className={`${adminCardBase} grid gap-4 p-5 sm:grid-cols-2`}>
        <p className="sm:col-span-2 text-xs font-bold uppercase tracking-wide text-[#A67C52]">
          Operations (admin-only)
        </p>
        {field(
          "Status",
          <select
            className={adminInputClass}
            value={s.status}
            onChange={(e) => setS({ ...s, status: e.target.value as AffiliateFormState["status"] })}
          >
            <option value="draft">draft</option>
            <option value="live">live</option>
            <option value="paused">paused</option>
            <option value="expired">expired</option>
          </select>
        )}
        {field(
          "Featured rank",
          <input className={adminInputClass} value={s.featuredRank} onChange={(e) => setS({ ...s, featuredRank: e.target.value })} />
        )}
        <label className="flex cursor-pointer items-center gap-2 sm:col-span-2 text-sm font-semibold">
          <input type="checkbox" checked={s.featured} onChange={(e) => setS({ ...s, featured: e.target.checked })} />
          Featured flag (merch priority)
        </label>
        <div className="sm:col-span-2">
          {field(
            "Internal notes",
            <textarea
              className={`${adminInputClass} min-h-[80px]`}
              value={s.internalNotes}
              onChange={(e) => setS({ ...s, internalNotes: e.target.value })}
              placeholder="Partner contact, contract id, pricing notes…"
            />
          )}
        </div>
      </div>

      <div className={`${adminCardBase} p-5 text-sm text-[#5C5346]`}>
        <p className="font-bold text-[#1E1810]">Public mapping (read-only preview)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>Headline, destination, price, duration → Viajes cards & offer detail hero.</li>
          <li>Booking URL → primary CTA outbound (not Leonix checkout).</li>
          <li>Affiliate label + lane → must match public “commercial partner” disclosure.</li>
          <li>Placements → homepage top offers, results filters, seasonal rails when wired.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={adminBtnSecondary} disabled>
          Save (no API yet)
        </button>
        <Link href="/admin/clasificados/viajes/affiliate-cards" className={adminBtnSecondary}>
          Back to list
        </Link>
        {mode === "edit" && s.publicSlug ? (
          <Link
            href={`/clasificados/viajes/oferta/${s.publicSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={adminBtnSecondary}
          >
            Preview public offer →
          </Link>
        ) : null}
      </div>
    </form>
  );
}
