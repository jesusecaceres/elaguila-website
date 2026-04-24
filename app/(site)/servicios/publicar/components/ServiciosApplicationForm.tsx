"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { collectServiciosDraftFieldIssues } from "../lib/serviciosApplicationFieldValidation";
import { getServiciosPublishReadiness } from "../lib/serviciosApplicationPublishReadiness";
import { useServiciosApplicationDraftState } from "../hooks/useServiciosApplicationDraftState";
import { getPublicarCopy } from "../serviciosPublicarCopy";
import { serviciosCategories, isOtroServicio, type ServiciosCategoryOption } from "../serviciosCategories";
import type {
  ServiciosHeroBadgeKind,
  ServiciosLang,
  ServiciosQuickFactKind,
} from "../../types/serviciosBusinessProfile";
import type { ServiciosTrustItem } from "../../types/serviciosBusinessProfile";

const HERO_BADGE_KINDS: ServiciosHeroBadgeKind[] = [
  "verified",
  "licensed",
  "spanish",
  "insured",
  "background_check",
  "custom",
];

const QUICK_FACT_KINDS: ServiciosQuickFactKind[] = [
  "years_experience",
  "response_time",
  "free_estimate",
  "emergency",
  "mobile_service",
  "same_day",
  "bilingual",
  "licensed_insured",
  "custom",
];

const TRUST_ICONS: ServiciosTrustItem["icon"][] = ["shield", "shieldCheck", "star", "clock", "heart", "check"];

const AREA_KINDS: Array<"city" | "neighborhood" | "zip" | "region" | ""> = ["", "city", "neighborhood", "zip", "region"];

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function inputClass(issue?: boolean) {
  return [
    "w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none",
    "focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]",
    issue ? "border-amber-500 bg-amber-50/40" : "border-neutral-300 bg-white",
  ].join(" ");
}

function labelHint(issue?: string) {
  if (!issue) return null;
  return <p className="mt-1 text-xs text-amber-800">{issue}</p>;
}

export function ServiciosApplicationForm({ lang }: { lang: ServiciosLang }) {
  const copy = getPublicarCopy(lang);
  const { draft, setDraft, hydrated, persistNow } = useServiciosApplicationDraftState();
  const [customServiceValue, setCustomServiceValue] = useState("");

  const issues = useMemo(() => collectServiciosDraftFieldIssues(draft, lang === "en" ? "en" : "es"), [draft, lang]);
  const readiness = useMemo(() => getServiciosPublishReadiness(draft), [draft]);

  const issueMsg = (path: string) => issues.find((i) => i.path === path)?.message;

  const openPreview = () => {
    persistNow();
    window.open(`/clasificados/publicar/servicios/preview?lang=${lang}`, "_blank", "noopener,noreferrer");
  };

  const handleCategoryChange = (value: string) => {
    setDraft((d) => ({ ...d, hero: { ...d.hero, primaryCategory: value } }));
    
    // Reset custom service value when changing category
    if (!isOtroServicio(value)) {
      setCustomServiceValue("");
    }
  };

  const handleCustomServiceChange = (value: string) => {
    setCustomServiceValue(value);
    // Update the category with the custom value
    setDraft((d) => ({ ...d, hero: { ...d.hero, primaryCategory: value } }));
  };

  const handleNoCategoryClick = () => {
    console.log("No veo mi categoría clicked - placeholder for help modal");
    // TODO: Open help modal or navigate to help page
  };

  const missingLabel = (key: string) => {
    const map: Record<string, string> = {
      businessName: copy.labels.businessName,
      slug: copy.labels.slug,
      category: copy.labels.categoryLine,
      contact: `${copy.labels.phone} / ${copy.labels.websiteUrl}`,
      about: copy.labels.aboutText,
      services: copy.sections.services,
    };
    return map[key] ?? key;
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-neutral-900">
      <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">{copy.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={
                lang === "es"
                  ? "/clasificados/publicar/servicios?lang=en"
                  : "/clasificados/publicar/servicios?lang=es"
              }
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {lang === "es" ? "English" : "Español"}
            </Link>
            <span className="text-xs text-neutral-500">{hydrated ? copy.saveHint : "…"}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start">
        <nav
          className="sticky top-4 z-10 flex shrink-0 flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm lg:w-56 lg:flex-col"
          aria-label="Sections"
        >
          {copy.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-md px-2 py-1.5 text-sm text-[#3B66AD] hover:bg-[#3B66AD]/10"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <main className="min-w-0 flex-1 space-y-10 pb-24">
          <Section id="section-identity" title={copy.sections.identity}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.businessName}</label>
                <input
                  className={inputClass(!!issueMsg("identity.businessName"))}
                  value={draft.identity.businessName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, identity: { ...d.identity, businessName: e.target.value } }))
                  }
                />
                {labelHint(issueMsg("identity.businessName"))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.slug}</label>
                <input
                  className={inputClass(!!issueMsg("identity.slug"))}
                  value={draft.identity.slug}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      identity: { ...d.identity, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") },
                    }))
                  }
                  placeholder="mi-negocio"
                />
                {labelHint(issueMsg("identity.slug"))}
              </div>
            </div>
          </Section>

          <Section id="section-hero" title={copy.sections.hero}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.primaryCategory}</label>
                <select
                  className={inputClass()}
                  value={draft.hero.primaryCategory ?? ""}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Selecciona una categoría</option>
                  {serviciosCategories.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {isOtroServicio(draft.hero.primaryCategory ?? "") && (
                <div>
                  <label className="block text-sm font-medium text-neutral-800">{copy.labels.describeService}</label>
                  <input
                    className={inputClass()}
                    value={customServiceValue}
                    onChange={(e) => handleCustomServiceChange(e.target.value)}
                    placeholder={copy.labels.describeServicePlaceholder}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 text-sm">
              <button
                type="button"
                onClick={handleNoCategoryClick}
                className="text-[#3B66AD] underline hover:text-[#2f5699]"
              >
                {copy.labels.noCategoryQuestion}
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-800">{copy.labels.categoryLine}</label>
              <p className="mb-1 text-xs text-neutral-500">{copy.labels.categoryLineHint}</p>
              <input
                className={inputClass()}
                value={draft.hero.categoryLine ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, categoryLine: e.target.value } }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.logoUrl}</label>
                <input
                  className={inputClass()}
                  value={draft.hero.logoUrl ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, logoUrl: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.logoAlt}</label>
                <input
                  className={inputClass()}
                  value={draft.hero.logoAlt ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, logoAlt: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.coverUrl}</label>
                <input
                  className={inputClass()}
                  value={draft.hero.coverImageUrl ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, coverImageUrl: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.coverAlt}</label>
                <input
                  className={inputClass()}
                  value={draft.hero.coverImageAlt ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, coverImageAlt: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.rating}</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  className={inputClass(!!issueMsg("hero.rating"))}
                  value={draft.hero.rating ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      hero: { ...d.hero, rating: v === "" ? undefined : Number(v) },
                    }));
                  }}
                />
                {labelHint(issueMsg("hero.rating"))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.reviewCount}</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputClass(!!issueMsg("hero.reviewCount"))}
                  value={draft.hero.reviewCount ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      hero: { ...d.hero, reviewCount: v === "" ? undefined : Math.floor(Number(v)) },
                    }));
                  }}
                />
                {labelHint(issueMsg("hero.reviewCount"))}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.locationSummary}</label>
                <input
                  className={inputClass()}
                  value={draft.hero.locationSummary ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, hero: { ...d.hero, locationSummary: e.target.value } }))}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-4">
              <p className="mb-3 text-sm font-medium text-neutral-800">Hero badges</p>
              <div className="space-y-3">
                {(draft.hero.badges ?? []).map((b, idx) => (
                  <div key={`badge-row-${idx}`} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                    <div className="min-w-[140px]">
                      <label className="text-xs text-neutral-600">{copy.labels.badgeKind}</label>
                      <select
                        className={inputClass()}
                        value={b.kind}
                        onChange={(e) => {
                          const kind = e.target.value as ServiciosHeroBadgeKind;
                          setDraft((d) => {
                            const badges = [...(d.hero.badges ?? [])];
                            badges[idx] = { ...badges[idx], kind };
                            return { ...d, hero: { ...d.hero, badges } };
                          });
                        }}
                      >
                        {HERO_BADGE_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-[180px] flex-1">
                      <label className="text-xs text-neutral-600">{copy.labels.badgeLabel}</label>
                      <input
                        className={inputClass()}
                        value={b.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          setDraft((d) => {
                            const badges = [...(d.hero.badges ?? [])];
                            badges[idx] = { ...badges[idx], label };
                            return { ...d, hero: { ...d.hero, badges } };
                          });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          hero: { ...d.hero, badges: (d.hero.badges ?? []).filter((_, i) => i !== idx) },
                        }))
                      }
                    >
                      {copy.labels.remove}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD] hover:bg-[#3B66AD]/10"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      hero: {
                        ...d.hero,
                        badges: [...(d.hero.badges ?? []), { kind: "verified", label: "" }],
                      },
                    }))
                  }
                >
                  + {copy.labels.addRow} ({copy.labels.badgeLabel})
                </button>
              </div>
            </div>
          </Section>

          <Section id="section-contact" title={copy.sections.contact}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.phone}</label>
                <input
                  className={inputClass(!!issueMsg("contact.phone"))}
                  value={draft.contact.phone ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, contact: { ...d.contact, phone: e.target.value } }))}
                />
                {labelHint(issueMsg("contact.phone"))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.websiteUrl}</label>
                <input
                  className={inputClass(!!issueMsg("contact.websiteUrl"))}
                  value={draft.contact.websiteUrl ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, websiteUrl: e.target.value } }))
                  }
                  placeholder="https://"
                />
                {labelHint(issueMsg("contact.websiteUrl"))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.websiteLabel}</label>
                <input
                  className={inputClass()}
                  value={draft.contact.websiteLabel ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, websiteLabel: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.primaryCta}</label>
                <input
                  className={inputClass()}
                  value={draft.contact.primaryCtaLabel ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, primaryCtaLabel: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.hoursOpenNow}</label>
                <input
                  className={inputClass()}
                  value={draft.contact.hoursOpenNowLabel ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, hoursOpenNowLabel: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.hoursToday}</label>
                <input
                  className={inputClass()}
                  value={draft.contact.hoursTodayLine ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, hoursTodayLine: e.target.value } }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.contact.messageEnabled === true}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, messageEnabled: e.target.checked } }))
                  }
                />
                {copy.labels.messageEnabled}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.contact.isFeatured === true}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, isFeatured: e.target.checked } }))
                  }
                />
                {copy.labels.isFeatured}
              </label>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.featuredLabel}</label>
                <input
                  className={inputClass()}
                  value={draft.contact.featuredLabel ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contact: { ...d.contact, featuredLabel: e.target.value } }))
                  }
                />
              </div>
            </div>
          </Section>

          <Section id="section-quick" title={copy.sections.quickFacts}>
            <div className="space-y-3">
              {(draft.quickFacts ?? []).map((f, idx) => (
                <div key={`qf-row-${idx}`} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="min-w-[160px]">
                    <label className="text-xs text-neutral-600">{copy.labels.qfKind}</label>
                    <select
                      className={inputClass()}
                      value={f.kind}
                      onChange={(e) => {
                        const kind = e.target.value as ServiciosQuickFactKind;
                        setDraft((d) => {
                          const q = [...(d.quickFacts ?? [])];
                          q[idx] = { ...q[idx], kind };
                          return { ...d, quickFacts: q };
                        });
                      }}
                    >
                      {QUICK_FACT_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <label className="text-xs text-neutral-600">{copy.labels.qfLabel}</label>
                    <input
                      className={inputClass()}
                      value={f.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setDraft((d) => {
                          const q = [...(d.quickFacts ?? [])];
                          q[idx] = { ...q[idx], label };
                          return { ...d, quickFacts: q };
                        });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        quickFacts: (d.quickFacts ?? []).filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    quickFacts: [...(d.quickFacts ?? []), { kind: "custom", label: "" }],
                  }))
                }
              >
                + {copy.labels.addRow}
              </button>
            </div>
          </Section>

          <Section id="section-about" title={copy.sections.about}>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.aboutText}</label>
                <textarea
                  rows={5}
                  className={inputClass()}
                  value={draft.about?.aboutText ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      about: { ...d.about, aboutText: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.specialtiesLine}</label>
                <input
                  className={inputClass()}
                  value={draft.about?.specialtiesLine ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      about: { ...d.about, specialtiesLine: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </Section>

          <Section id="section-services" title={copy.sections.services}>
            <div className="space-y-3">
              {(draft.services ?? []).map((s, idx) => (
                <div key={s.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="mb-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-neutral-600">{copy.labels.serviceTitle}</label>
                      <input
                        className={inputClass(!!issueMsg(`services[${idx}].title`))}
                        value={s.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.services ?? [])];
                            list[idx] = { ...list[idx], title };
                            return { ...d, services: list };
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-600">{copy.labels.serviceSecondary}</label>
                      <input
                        className={inputClass()}
                        value={s.secondaryLine ?? ""}
                        onChange={(e) => {
                          const secondaryLine = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.services ?? [])];
                            list[idx] = { ...list[idx], secondaryLine };
                            return { ...d, services: list };
                          });
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-neutral-600">{copy.labels.serviceImage}</label>
                      <input
                        className={inputClass(!!issueMsg(`services[${idx}].imageUrl`))}
                        value={s.imageUrl}
                        onChange={(e) => {
                          const imageUrl = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.services ?? [])];
                            list[idx] = { ...list[idx], imageUrl };
                            return { ...d, services: list };
                          });
                        }}
                      />
                      {labelHint(issueMsg(`services[${idx}].imageUrl`))}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-neutral-600">{copy.labels.serviceAlt}</label>
                      <input
                        className={inputClass()}
                        value={s.imageAlt ?? ""}
                        onChange={(e) => {
                          const imageAlt = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.services ?? [])];
                            list[idx] = { ...list[idx], imageAlt };
                            return { ...d, services: list };
                          });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-neutral-600 underline hover:text-neutral-900"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        services: (d.services ?? []).filter((x) => x.id !== s.id),
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    services: [...(d.services ?? []), { id: newId("svc"), title: "", imageUrl: "" }],
                  }))
                }
              >
                + {copy.labels.addRow}
              </button>
            </div>
          </Section>

          <Section id="section-gallery" title={copy.sections.gallery}>
            <div className="space-y-3">
              {(draft.gallery ?? []).map((g, idx) => (
                <div key={g.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 p-3">
                  <div className="min-w-[200px] flex-1">
                    <label className="text-xs text-neutral-600">{copy.labels.galleryUrl}</label>
                    <input
                      className={inputClass(!!issueMsg(`gallery[${idx}].url`))}
                      value={g.url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setDraft((d) => {
                          const list = [...(d.gallery ?? [])];
                          list[idx] = { ...list[idx], url };
                          return { ...d, gallery: list };
                        });
                      }}
                    />
                    {labelHint(issueMsg(`gallery[${idx}].url`))}
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <label className="text-xs text-neutral-600">{copy.labels.galleryAlt}</label>
                    <input
                      className={inputClass()}
                      value={g.alt ?? ""}
                      onChange={(e) => {
                        const alt = e.target.value;
                        setDraft((d) => {
                          const list = [...(d.gallery ?? [])];
                          list[idx] = { ...list[idx], alt };
                          return { ...d, gallery: list };
                        });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        gallery: (d.gallery ?? []).filter((x) => x.id !== g.id),
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    gallery: [...(d.gallery ?? []), { id: newId("gal"), url: "" }],
                  }))
                }
              >
                + {copy.labels.addRow}
              </button>
            </div>
          </Section>

          <Section id="section-trust" title={copy.sections.trust}>
            <div className="space-y-3">
              {(draft.trust ?? []).map((t, idx) => (
                <div key={t.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 p-3">
                  <div className="min-w-[120px]">
                    <label className="text-xs text-neutral-600">{copy.labels.trustIcon}</label>
                    <select
                      className={inputClass()}
                      value={t.icon}
                      onChange={(e) => {
                        const icon = e.target.value as ServiciosTrustItem["icon"];
                        setDraft((d) => {
                          const list = [...(d.trust ?? [])];
                          list[idx] = { ...list[idx], icon };
                          return { ...d, trust: list };
                        });
                      }}
                    >
                      {TRUST_ICONS.map((ic) => (
                        <option key={ic} value={ic}>
                          {ic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <label className="text-xs text-neutral-600">{copy.labels.trustLabel}</label>
                    <input
                      className={inputClass()}
                      value={t.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setDraft((d) => {
                          const list = [...(d.trust ?? [])];
                          list[idx] = { ...list[idx], label };
                          return { ...d, trust: list };
                        });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        trust: (d.trust ?? []).filter((x) => x.id !== t.id),
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    trust: [...(d.trust ?? []), { id: newId("tr"), label: "", icon: "shield" }],
                  }))
                }
              >
                + {copy.labels.addRow}
              </button>
            </div>
          </Section>

          <Section id="section-reviews" title={copy.sections.reviews}>
            <div className="space-y-3">
              {(draft.reviews ?? []).map((r, idx) => (
                <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-neutral-600">{copy.labels.reviewAuthor}</label>
                      <input
                        className={inputClass()}
                        value={r.authorName}
                        onChange={(e) => {
                          const authorName = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.reviews ?? [])];
                            list[idx] = { ...list[idx], authorName };
                            return { ...d, reviews: list };
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-600">{copy.labels.reviewRating}</label>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step="0.1"
                        className={inputClass()}
                        value={r.rating ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.reviews ?? [])];
                            list[idx] = { ...list[idx], rating: v === "" ? undefined : Number(v) };
                            return { ...d, reviews: list };
                          });
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-neutral-600">{copy.labels.reviewQuote}</label>
                      <textarea
                        rows={2}
                        className={inputClass()}
                        value={r.quote}
                        onChange={(e) => {
                          const quote = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.reviews ?? [])];
                            list[idx] = { ...list[idx], quote };
                            return { ...d, reviews: list };
                          });
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-neutral-600">{copy.labels.reviewAvatar}</label>
                      <input
                        className={inputClass()}
                        value={r.avatarUrl ?? ""}
                        onChange={(e) => {
                          const avatarUrl = e.target.value;
                          setDraft((d) => {
                            const list = [...(d.reviews ?? [])];
                            list[idx] = { ...list[idx], avatarUrl };
                            return { ...d, reviews: list };
                          });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs text-neutral-600 underline"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        reviews: (d.reviews ?? []).filter((x) => x.id !== r.id),
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    reviews: [...(d.reviews ?? []), { id: newId("rev"), authorName: "", quote: "" }],
                  }))
                }
              >
                + {copy.labels.addRow}
              </button>
            </div>
          </Section>

          <Section id="section-areas" title={copy.sections.areas}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-800">{copy.labels.mapImageUrl}</label>
              <input
                className={inputClass()}
                value={draft.serviceAreas?.mapImageUrl ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    serviceAreas: { ...d.serviceAreas, mapImageUrl: e.target.value, items: d.serviceAreas?.items ?? [] },
                  }))
                }
              />
            </div>
            <div className="space-y-3">
              {(draft.serviceAreas?.items ?? []).map((a, idx) => (
                <div key={a.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 p-3">
                  <div className="min-w-[160px] flex-1">
                    <label className="text-xs text-neutral-600">{copy.labels.areaLabel}</label>
                    <input
                      className={inputClass()}
                      value={a.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setDraft((d) => {
                          const items = [...(d.serviceAreas?.items ?? [])];
                          items[idx] = { ...items[idx], label };
                          return { ...d, serviceAreas: { ...d.serviceAreas, items } };
                        });
                      }}
                    />
                  </div>
                  <div className="min-w-[140px]">
                    <label className="text-xs text-neutral-600">{copy.labels.areaKind}</label>
                    <select
                      className={inputClass()}
                      value={a.kind ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const kind =
                          v === "" ? undefined : (v as "city" | "neighborhood" | "zip" | "region");
                        setDraft((d) => {
                          const items = [...(d.serviceAreas?.items ?? [])];
                          items[idx] = { ...items[idx], kind };
                          return { ...d, serviceAreas: { ...d.serviceAreas, items } };
                        });
                      }}
                    >
                      {AREA_KINDS.map((k) => (
                        <option key={k || "any"} value={k}>
                          {k || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        serviceAreas: {
                          ...d.serviceAreas,
                          items: (d.serviceAreas?.items ?? []).filter((x) => x.id !== a.id),
                        },
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-[#3B66AD]/50 bg-[#3B66AD]/5 px-3 py-2 text-sm text-[#3B66AD]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    serviceAreas: {
                      ...d.serviceAreas,
                      items: [...(d.serviceAreas?.items ?? []), { id: newId("area"), label: "" }],
                    },
                  }))
                }
              >
                + {copy.labels.addRow}
              </button>
            </div>
          </Section>

          <Section id="section-promo" title={copy.sections.promo}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.promoHeadline}</label>
                <input
                  className={inputClass()}
                  value={draft.promo?.headline ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      promo: {
                        id: d.promo?.id ?? newId("promo"),
                        headline: e.target.value,
                        footnote: d.promo?.footnote,
                        href: d.promo?.href,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.promoFootnote}</label>
                <input
                  className={inputClass()}
                  value={draft.promo?.footnote ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      promo: {
                        id: d.promo?.id ?? newId("promo"),
                        headline: d.promo?.headline ?? "",
                        footnote: e.target.value,
                        href: d.promo?.href,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">{copy.labels.promoHref}</label>
                <input
                  className={inputClass(!!issueMsg("promo.href"))}
                  value={draft.promo?.href ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      promo: {
                        id: d.promo?.id ?? newId("promo"),
                        headline: d.promo?.headline ?? "",
                        footnote: d.promo?.footnote,
                        href: e.target.value,
                      },
                    }))
                  }
                />
                {labelHint(issueMsg("promo.href"))}
              </div>
            </div>
          </Section>

          <Section id="section-review" title={copy.sections.review}>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900">{copy.publishReadiness}</h3>
              <p className="mt-2 text-sm text-neutral-600">
                {readiness.ready ? copy.readyToPublish : copy.notReady}
              </p>
              {!readiness.ready && (
                <ul className="mt-3 list-inside list-disc text-sm text-neutral-700">
                  {readiness.missing.map((m) => (
                    <li key={m}>
                      {copy.missing}: {missingLabel(m)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-neutral-500">{copy.previewOpen}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openPreview}
                  className="rounded-lg bg-[#3B66AD] px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-[#325a96]"
                >
                  {copy.previewCta}
                </button>
              </div>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">{title}</h2>
      {children}
    </section>
  );
}
