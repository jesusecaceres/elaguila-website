/**
 * Gate G4 — deterministic plain-text rendition of a LessonPackage, one language at a time.
 *
 * Why it exists: the database row is the publish-state truth, and its CHECK constraint requires a
 * non-empty `body_es` / `body_en` on every published lesson. A content batch therefore seeds each
 * new lesson's row with this rendition of the SAME package the page renders — one source, no second
 * hand-written copy to drift. It is also what search and any legacy reader see. Pure: no I/O.
 */
import type { LessonLang, LessonPackage } from "./types";

const HEADINGS: Record<LessonLang, Record<"outcomes" | "example" | "weak" | "strong" | "steps" | "activity" | "mistakes" | "instead" | "verify" | "proHelp" | "recap", string>> = {
  es: { outcomes: "Al terminar podrás", example: "Ejemplo ilustrativo", weak: "Débil", strong: "Fuerte", steps: "Pasos prácticos", activity: "Tu turno", mistakes: "Errores comunes", instead: "Mejor", verify: "Verifica", proHelp: "Cuándo buscar ayuda profesional", recap: "En resumen" },
  en: { outcomes: "By the end you will be able to", example: "Illustrative example", weak: "Weak", strong: "Strong", steps: "Practical steps", activity: "Your turn", mistakes: "Common mistakes", instead: "Instead", verify: "Verify", proHelp: "When to get professional help", recap: "In short" },
};

export function packageToPlainText(pkg: LessonPackage, lang: LessonLang): string {
  const h = HEADINGS[lang];
  const out: string[] = [];
  const numbered = (items: string[]) => items.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const bullets = (items: string[]) => items.map((t) => `- ${t}`).join("\n");

  for (const b of pkg.blocks) {
    if (b.journeys) continue; // journey-only blocks are not part of the neutral rendition
    switch (b.type) {
      case "hook":
        out.push(`${b.headline[lang]} ${b.support[lang]}`);
        break;
      case "outcomes":
        out.push(`${h.outcomes}:\n${bullets(b.items.map((i) => i[lang]))}`);
        break;
      case "explain":
        if (b.title) out.push(`${b.title[lang]}`);
        for (const c of b.chunks) out.push(c.heading ? `${c.heading[lang]}\n${c.body[lang]}` : c.body[lang]);
        if (b.pullQuote) out.push(b.pullQuote[lang]);
        break;
      case "visual_model":
        out.push(`${b.title[lang]}:\n${numbered(b.steps.map((s) => `${s.label[lang]}: ${s.note[lang]}`))}\n${b.caption[lang]}`);
        break;
      case "example": {
        const neutral = b.variants.find((v) => !v.journey) ?? b.variants[0];
        out.push(`${h.example} — ${b.business[lang]}:\n${neutral.story[lang]}\n${b.takeaway[lang]}`);
        break;
      }
      case "compare":
        out.push(`${b.title[lang]}:\n${h.weak}: ${b.weak.text[lang]} ${b.weak.why[lang]}\n${h.strong}: ${b.strong.text[lang]}`);
        break;
      case "steps":
        out.push(`${b.title ? b.title[lang] : h.steps}:\n${numbered(b.items.map((i) => i[lang]))}`);
        break;
      case "activity":
        out.push(`${h.activity} — ${b.title[lang]}:\n${b.intro[lang]}\n${numbered(b.fields.map((f) => f.label[lang]))}`);
        if (b.resultBridge) out.push(`${b.resultBridge.title[lang]}\n${b.resultBridge.lead[lang]}\n${bullets(b.resultBridge.points.map((p) => p[lang]))}`);
        break;
      case "mistakes":
        out.push(`${h.mistakes}:\n${bullets(b.items.map((m) => `${m.mistake[lang]} ${h.instead}: ${m.instead[lang]}`))}`);
        break;
      case "note":
        out.push(b.body[lang]);
        break;
      case "checklist":
        out.push(`${b.title[lang]}:\n${bullets(b.items.map((i) => i.text[lang]))}`);
        break;
      case "verify":
        out.push(`${h.verify} — ${b.title[lang]}:\n${b.statement[lang]}\n${numbered(b.steps.map((s) => s[lang]))}\n${b.doctrine[lang]}`);
        break;
      case "pro_help":
        out.push(`${h.proHelp}:\n${b.canTeach[lang]}\n${b.mustVerify[lang]}\n${bullets(b.questionsToBring.map((q) => q[lang]))}`);
        break;
      case "recap":
        out.push(`${h.recap}:\n${bullets(b.points.map((p) => p[lang]))}`);
        break;
      default:
        break; // ai_prompt, glossary, resource: referenced by key, rendered from their own registries
    }
  }
  return out.join("\n\n");
}
