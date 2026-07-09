import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "August 2026 Page 12 Portuguese Proof QA | Leonix Media",
  description:
    "Temporary internal QA page for the August 2026 Page 12 Portuguese PT-BR digital translation proof.",
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

const QA_URL = "https://www.leonixmedia.com/magazine/qa/2026-august/page-12-portuguese";
const OTHER_QA_URLS = [
  "https://www.leonixmedia.com/magazine/qa/2026-august/page-6-portuguese",
  "https://www.leonixmedia.com/magazine/qa/2026-august/page-3-portuguese",
] as const;

const SPANISH_SRC = "/qa/magazine/2026-august/page-012-pt/source-page-012-spanish.png";
const PORTUGUESE_PDF = "/qa/magazine/2026-august/page-012-pt/deepl-page-012.pt.pdf";

const DECISION_OPTIONS = [
  {
    label: "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES",
    hint: "Visible Portuguese, layout usable, movement/CTA acceptable — continue proof workflow with minor polish notes.",
  },
  {
    label: "FIX_NEEDED",
    hint: "Translation works but needs polish (overflow, spacing, CTA/contact zones).",
  },
  {
    label: "REBUILD_SOURCE_NEEDED",
    hint: "Pivot to editable text-layer PDF before more proofs.",
  },
  {
    label: "COMPANION_LAYER_NEEDED",
    hint: "Keep visual; add HTML/companion translated text for accessibility.",
  },
  {
    label: "HOLD_FOR_PORTUGUESE_REVIEWER",
    hint: "Defer decision until a Portuguese reviewer evaluates tone and terminology.",
  },
] as const;

const QA_CHECKLIST = [
  "Did Spanish text become Portuguese?",
  "Is movement/CTA language acceptable?",
  "Are QR/contact zones readable?",
  "Is brand tone preserved?",
  "Any crop/overflow?",
  "Acceptable digital direction?",
] as const;

const DOCTRINE = [
  "Print = Spanish-only.",
  "Translated editions = digital-only.",
  "Portuguese proof requires Chuy/reviewer approval before public use.",
  "No public translated issue until proof + Chuy/reviewer QA approval.",
] as const;

export default function Page12PortugueseProofQaPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EE] px-4 py-10 text-[#1F241C] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-[#7A1E2C]/40 bg-[#7A1E2C]/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#7A1E2C] sm:text-sm">
          Internal QA only · Portuguese proof · Not final · Not public launch · Printed magazine
          remains Spanish-only · Digital translations require Chuy/reviewer approval
        </div>

        <section className="mt-6 rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_20px_60px_-30px_rgba(31,36,28,0.28)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A6B1F]">
            August 2026 Magazine · Portuguese Batch 1
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-5xl">
            August 2026 Page 12 Portuguese Proof QA
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#556B3E]">
            Risk: HIGH — movement/back-cover style
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-base">
            Visual QA for the Portuguese PT-BR DeepL digital translation proof. Compare the
            Portuguese proof PDF against the original Spanish master, then report one decision label
            to Coach.
          </p>
          <div className="mt-4 rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">QA URL</p>
            <p className="mt-1 break-all font-mono text-sm text-[#2A4536]">{QA_URL}</p>
          </div>
          <div className="mt-3 text-xs text-[#556B3E]">
            Also review Portuguese Batch 1:
            <ul className="mt-1 space-y-1">
              {OTHER_QA_URLS.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    className="font-semibold text-[#7A1E2C] underline underline-offset-4"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
              Original Spanish Page 12 Master Sample
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#D6C7AD] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SPANISH_SRC}
                alt="Original Spanish Page 12 master sample"
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
              Portuguese PT-BR DeepL Proof PDF
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#D6C7AD] bg-white">
              <object
                data={PORTUGUESE_PDF}
                type="application/pdf"
                className="h-[520px] w-full"
                aria-label="Portuguese PT-BR DeepL proof PDF"
              >
                <iframe
                  src={PORTUGUESE_PDF}
                  title="Portuguese PT-BR DeepL proof PDF"
                  className="h-[520px] w-full"
                />
              </object>
            </div>
            <a
              href={PORTUGUESE_PDF}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-[#7A1E2C] underline underline-offset-4"
            >
              Open Portuguese proof PDF
            </a>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] p-5 text-[#F8F4EA] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C9A84A]">
            Page 12 Portuguese visual QA checklist
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
            Chuy/reviewer: after reviewing Pages 12, 6, and 3 together, report{" "}
            <strong>one decision label per page</strong> back to Coach for gate{" "}
            <span className="font-mono">AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION1</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
