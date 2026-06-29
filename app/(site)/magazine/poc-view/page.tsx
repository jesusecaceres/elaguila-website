"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LANGUAGE_LABELS, resolveRouteLang, type SupportedLang } from "@/app/lib/language";

const PROOF_LANGS = ["es", "en", "vi", "pt", "ja", "pa"] as const satisfies readonly SupportedLang[];

const QA_CHECKLIST = [
  "Phone numbers unchanged",
  "Emails unchanged",
  "URLs unchanged",
  "QR codes scan",
  "Business names preserved",
  "Prices/coupon codes preserved",
  "Text does not overflow ad boundaries",
  "Brand marks not translated",
  "Visual layout acceptable",
  "QA-approved before public release",
] as const;

function proofLangFromSearch(raw: string | null): SupportedLang {
  const lang = resolveRouteLang(raw);
  return (PROOF_LANGS as readonly SupportedLang[]).includes(lang) ? lang : "en";
}

function MagazinePocViewContent() {
  const params = useSearchParams();
  const lang = proofLangFromSearch(params?.get("lang") ?? null);
  const magazineHref = `/magazine?lang=${lang}`;
  const readerHref = `/magazine/2026/june/read?lang=${lang}`;

  const proofTrack = useMemo(
    () => ({
      issueId: "2026-june",
      targetLang: lang,
      hasTranslatedVisual: false,
      qaApproved: false,
      fallbackReason:
        lang === "es"
          ? "Spanish is the current original visual edition."
          : "No QA-approved translated visual edition exists yet for this language.",
    }),
    [lang],
  );

  return (
    <main lang={lang} className="min-h-screen bg-[#FAF6EE] px-4 py-10 text-[#1F241C] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="text-[#7A1E2C] underline underline-offset-4" href={magazineHref}>
            Back to magazine
          </Link>
          <Link className="text-[#2A4536] underline underline-offset-4" href={readerHref}>
            Open readable companion
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_20px_60px_-30px_rgba(31,36,28,0.28)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A6B1F]">
            Internal proof only · Not public launch UI
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-5xl">
            Multilingual Visual Magazine Proof
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-base">
            This page models the future Leonix visual magazine flow without calling DeepL, Google, or
            serving fake translated assets. Selected proof language:{" "}
            <strong>{LANGUAGE_LABELS[lang]}</strong>.
          </p>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">1 · Source</p>
            <h2 className="mt-2 font-serif text-xl font-bold text-[#2A4536]">
              Original Spanish visual edition
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
              PDF, cover, and FlipHTML5 stay available as the confirmed Spanish visual edition.
            </p>
          </article>

          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">2 · Companion</p>
            <h2 className="mt-2 font-serif text-xl font-bold text-[#2A4536]">
              HTML readable companion
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
              The readable companion helps users understand the issue, but it is not a visual PDF translation.
            </p>
          </article>

          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">3 · Visual track</p>
            <h2 className="mt-2 font-serif text-xl font-bold text-[#2A4536]">
              Translated visual edition
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
              A translated visual edition appears here only after real assets exist and QA approves them.
            </p>
          </article>

          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">4 · QR bridge</p>
            <h2 className="mt-2 font-serif text-xl font-bold text-[#2A4536]">
              Print-to-digital helper
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
              QR readers can choose Lens/Translate help, companion text, or the original visual edition.
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#C9A84A]/50 bg-[#FFFDF7] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
                Honest fallback
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#2A4536]">
                {proofTrack.hasTranslatedVisual && proofTrack.qaApproved
                  ? "QA-approved translated visual track available"
                  : "Translated visual track not available yet"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
                {proofTrack.fallbackReason} This proof route does not claim a translated PDF,
                translated FlipHTML5 edition, or full visual magazine translation.
              </p>
            </div>
            <div className="rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] px-4 py-3 text-sm">
              <p>
                <strong>Issue:</strong> {proofTrack.issueId}
              </p>
              <p>
                <strong>QA approved:</strong> {proofTrack.qaApproved ? "yes" : "no"}
              </p>
              <p>
                <strong>Target:</strong> {proofTrack.targetLang}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] p-5 text-[#F8F4EA] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C9A84A]">
            Visual QA checklist
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {QA_CHECKLIST.map((item) => (
              <div key={item} className="rounded-xl border border-[#F8F4EA]/15 bg-white/5 px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function MagazinePocViewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#FAF6EE] text-[#3D3428]"
          aria-busy="true"
        />
      }
    >
      <MagazinePocViewContent />
    </Suspense>
  );
}
