import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "August 2026 Page 6 English Proof QA | Leonix Media",
  description:
    "Temporary internal QA page for the August 2026 Page 6 English digital translation proof.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const QA_URL = "https://www.leonixmedia.com/magazine/qa/2026-august/page-6-english";
const OTHER_QA_URL = "https://www.leonixmedia.com/magazine/qa/2026-august/page-5-english";

const SPANISH_SRC = "/qa/magazine/2026-august/page-006/source-page-006-spanish.png";
const ENGLISH_PDF = "/qa/magazine/2026-august/page-006/deepl-page-006.en.pdf";

const DECISION_OPTIONS = [
  {
    label: "APPROVED_FOR_DIGITAL_PROOF",
    hint: "Visible English, layout usable, editorial copy readable — continue proof workflow.",
  },
  {
    label: "FIX_NEEDED",
    hint: "Translation works but needs polish (overflow, spacing, headline/body).",
  },
  {
    label: "REBUILD_SOURCE_NEEDED",
    hint: "Pivot to editable text-layer PDF before more proofs.",
  },
  {
    label: "COMPANION_LAYER_NEEDED",
    hint: "Keep visual; add HTML/companion translated text for accessibility.",
  },
] as const;

const QA_CHECKLIST = [
  "Did Spanish text become English?",
  "Is headline readable?",
  "Is body copy readable?",
  "Are business/community terms preserved?",
  "Is layout usable?",
  "No major overflow?",
  "No major crop?",
  "Are Leonix/brand terms preserved?",
  "Are QR/contact zones readable if present?",
  "Acceptable digital direction?",
] as const;

const DOCTRINE = [
  "Print = Spanish-only.",
  "Translated editions = digital-only.",
  "QR / Google Lens supports print readers.",
  "No public translated issue until proof + Chuy QA approval.",
] as const;

export default function Page6EnglishProofQaPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EE] px-4 py-10 text-[#1F241C] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-[#7A1E2C]/40 bg-[#7A1E2C]/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#7A1E2C] sm:text-sm">
          Internal QA only · Not final · Not public launch · Printed magazine remains
          Spanish-only · Digital translations require Chuy approval
        </div>

        <section className="mt-6 rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_20px_60px_-30px_rgba(31,36,28,0.28)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A6B1F]">
            August 2026 Magazine · Batch 2
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-5xl">
            Page 6 English Proof QA
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#556B3E]">
            Risk: MEDIUM — editorial/business community layout
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-base">
            Visual QA for the English DeepL digital translation proof. Compare the English proof PDF
            against the original Spanish master, then report one decision label to Coach.
          </p>
          <div className="mt-4 rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">QA URL</p>
            <p className="mt-1 break-all font-mono text-sm text-[#2A4536]">{QA_URL}</p>
          </div>
          <p className="mt-3 text-xs text-[#556B3E]">
            Also review Page 5:{" "}
            <a href={OTHER_QA_URL} className="font-semibold text-[#7A1E2C] underline underline-offset-4">
              {OTHER_QA_URL}
            </a>
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#C9A84A]/60 bg-[#FFFDF7] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
            Decision options — pick exactly one
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DECISION_OPTIONS.map((opt) => (
              <div
                key={opt.label}
                className="rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] px-4 py-3"
              >
                <p className="break-all font-mono text-sm font-bold text-[#2A4536]">{opt.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#3D3428]">{opt.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">
              Original Spanish Page 6 Master Sample
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#D6C7AD] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SPANISH_SRC}
                alt="Original Spanish Page 6 master sample"
                className="h-auto w-full"
              />
            </div>
            <a
              href={SPANISH_SRC}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-[#7A1E2C] underline underline-offset-4"
            >
              Open Spanish source image
            </a>
          </article>

          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">
              English DeepL Proof PDF
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#D6C7AD] bg-white">
              <object
                data={ENGLISH_PDF}
                type="application/pdf"
                className="h-[520px] w-full"
                aria-label="English DeepL proof PDF"
              >
                <iframe
                  src={ENGLISH_PDF}
                  title="English DeepL proof PDF"
                  className="h-[520px] w-full"
                />
              </object>
            </div>
            <a
              href={ENGLISH_PDF}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-[#7A1E2C] underline underline-offset-4"
            >
              Open English proof PDF
            </a>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] p-5 text-[#F8F4EA] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C9A84A]">
            Page 6 visual QA checklist
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {QA_CHECKLIST.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#F8F4EA]/15 bg-white/5 px-3 py-2 text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
            Digital doctrine reminder
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#3D3428]">
            {DOCTRINE.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[#C9A84A]">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-[#C9A84A]/60 bg-[#FFFDF7] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">Next step</p>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
            Chuy: review Page 5 and Page 6 together, then report{" "}
            <strong>one decision label per page</strong> back to Coach for gate{" "}
            <span className="font-mono">AUGUST-2026-BATCH2-PAGES5-6-CHUY-QA-DECISION1</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
