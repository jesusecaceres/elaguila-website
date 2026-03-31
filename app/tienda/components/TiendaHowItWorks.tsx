import type { Lang } from "../types/tienda";

function StepIcon(props: { kind: "choose" | "upload" | "deliver" }) {
  const common = "h-5 w-5 text-[rgba(255,247,226,0.86)]";
  if (props.kind === "choose") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common} fill="none">
        <path d="M7 7h10M7 12h10M7 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (props.kind === "upload") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common} fill="none">
        <path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 6.5 12 3l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={common} fill="none">
      <path d="M4 7h16v8H4V7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 15v4h10v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TiendaHowItWorks(props: {
  lang: Lang;
  steps: Array<{ title: string; body: string }>;
  note: string;
}) {
  const { steps, note } = props;
  const kinds: Array<"choose" | "upload" | "deliver"> = ["choose", "upload", "deliver"];

  return (
    <section className="rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 sm:p-10 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {steps.map((s, idx) => (
          <div key={idx} className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.18)] p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(201,168,74,0.28)] bg-[rgba(201,168,74,0.12)]">
                <StepIcon kind={kinds[idx] ?? "choose"} />
              </span>
              <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(255,247,226,0.72)]">
                {props.lang === "en" ? `Step ${idx + 1}` : `Paso ${idx + 1}`}
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.70)]">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[rgba(201,168,74,0.20)] bg-[rgba(201,168,74,0.08)] px-5 py-4 text-sm leading-relaxed text-[rgba(255,247,226,0.82)]">
        {note}
      </div>
    </section>
  );
}

