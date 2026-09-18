/**
 * Gate G2 / G4 — code-owned lesson visuals, keyed by `visualKey`. Same drawing language as
 * learningGlyphs.tsx (ivory field, burgundy/green figures, gold accents). A LessonPackage never
 * stores SVG or JSX: it names a visualKey and supplies the labels (content) — the drawing lives here.
 * Every SVG is aria-hidden; the package's `textAlternative` is rendered as real text next to it.
 */
import type { LessonVisualKey } from "@/app/lib/business/learning/lessonPackage/types";
import { Storefront } from "../learningGlyphs";

const BURGUNDY = "#7A1E2C";
const GREEN = "#2A4536";
const OLIVE = "#556B3E";
const GOLD = "#C9A84A";
const GOLD_LIGHT = "#F3D98A";
const IVORY = "#FFFDF7";
const CREAM = "#F3EBDC";
const INK = "#1E1810";

function People({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      {[-17, 0, 17].map((dx, i) => (
        <g key={dx} transform={`translate(${dx} ${i === 1 ? -5 : 0})`}>
          <circle cx="0" cy="-8" r="6.5" />
          <path d="M-9 14 a9 11 0 0 1 18 0 z" />
        </g>
      ))}
    </g>
  );
}

/** Business in the center, five possible customer groups around it, one emphasised ("you start here"). */
function CustomerFocusOrbit({ labels, className }: { labels: Record<string, string>; className?: string }) {
  const cx = 200;
  const cy = 170;
  const others: { key: string; x: number; y: number }[] = [
    { key: "groupB", x: 340, y: 122 },
    { key: "groupC", x: 296, y: 262 },
    { key: "groupD", x: 104, y: 262 },
    { key: "groupE", x: 60, y: 122 },
  ];
  return (
    <svg viewBox="-12 -4 424 328" className={className} aria-hidden focusable="false" role="presentation">
      {/* connectors */}
      {others.map((g) => (
        <line key={g.key} x1={cx} y1={cy} x2={g.x} y2={g.y} stroke={GOLD} strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" opacity="0.7" />
      ))}
      <line x1={cx} y1={cy} x2={cx} y2={70} stroke={GOLD} strokeWidth="4" strokeLinecap="round" />

      {/* other groups: present, welcome, but not the first conversation */}
      {others.map((g) => (
        <g key={g.key}>
          <circle cx={g.x} cy={g.y} r="31" fill={CREAM} />
          <People x={g.x} y={g.y} color={OLIVE} s={0.85} />
          <text x={g.x} y={g.y + 49} textAnchor="middle" fontSize="13" fontWeight="600" fill={INK} opacity="0.8">
            {labels[g.key]}
          </text>
        </g>
      ))}

      {/* emphasised group */}
      <circle cx={cx} cy={58} r="40" fill={GOLD_LIGHT} stroke={GOLD} strokeWidth="4" />
      <People x={cx} y={60} color={BURGUNDY} s={1.05} />
      <g>
        <rect x={cx - 62} y={0} width="124" height="20" rx="10" fill={BURGUNDY} />
        <text x={cx} y={14} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={IVORY} letterSpacing="0.6">
          {labels.focusTag}
        </text>
      </g>
      <rect x={cx + 46} y={49} width="150" height="22" rx="6" fill={IVORY} opacity="0.92" />
      <text x={cx + 52} y={65} fontSize="13.5" fontWeight="700" fill={BURGUNDY}>
        {labels.focus}
      </text>

      {/* the business */}
      <circle cx={cx} cy={cy} r="50" fill={IVORY} stroke={GREEN} strokeWidth="3" />
      <Storefront x={cx} y={cy - 14} s={0.55} open />
      <text x={cx} y={cy + 33} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={GREEN}>
        {labels.center}
      </text>
    </svg>
  );
}

function Person({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <circle cx="0" cy="-12" r="9" />
      <path d="M-13 18 a13 16 0 0 1 26 0 z" />
    </g>
  );
}

function Pill({ x, y, w, text, fill }: { x: number; y: number; w: number; text: string; fill: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height="20" rx="10" fill={fill} />
      <text x={x} y={y + 14} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={IVORY} letterSpacing="0.6">
        {text}
      </text>
    </g>
  );
}

/** A product waiting alone on a shelf vs. a person with a problem — the business starts with the person. */
function ProductVsProblem({ labels, className }: { labels: Record<string, string>; className?: string }) {
  return (
    <svg viewBox="0 0 400 310" className={className} aria-hidden focusable="false" role="presentation">
      {/* the product, alone */}
      <line x1="18" y1="212" x2="162" y2="212" stroke={OLIVE} strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <rect x="60" y="152" width="60" height="60" rx="6" fill={CREAM} stroke={OLIVE} strokeWidth="2.5" opacity="0.85" />
      <path d="M60 172 h60 M90 152 v20" stroke={OLIVE} strokeWidth="2" opacity="0.6" />
      <text x="90" y="240" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={INK} opacity="0.8">
        {labels.product}
      </text>
      <text x="90" y="258" textAnchor="middle" fontSize="11.5" fontStyle="italic" fill={INK} opacity="0.65">
        {labels.productNote}
      </text>

      <line x1="180" y1="70" x2="180" y2="270" stroke={GOLD} strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" opacity="0.7" />

      {/* the person, with a problem */}
      <rect x="186" y="22" width="210" height="42" rx="21" fill={IVORY} stroke={GREEN} strokeWidth="2.5" />
      <text x="291" y="48" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={GREEN}>
        {labels.problem}
      </text>
      <circle cx="288" cy="78" r="5.5" fill={IVORY} stroke={GREEN} strokeWidth="2" />
      <circle cx="292" cy="96" r="3.5" fill={IVORY} stroke={GREEN} strokeWidth="2" />
      <circle cx="295" cy="170" r="56" fill={GOLD_LIGHT} stroke={GOLD} strokeWidth="4" />
      <Person x={295} y={172} color={BURGUNDY} s={1.9} />
      <Pill x={295} y={232} w={124} text={labels.startTag} fill={BURGUNDY} />
      <text x="295" y="276" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={BURGUNDY}>
        {labels.person}
      </text>
    </svg>
  );
}

function Bubble({ x, y, w, text, stroke, tailLeft }: { x: number; y: number; w: number; text: string; stroke: string; tailLeft: boolean }) {
  const tx = tailLeft ? x + 18 : x + w - 18;
  return (
    <g>
      <path d={`M${tx - 7} ${y + 33} L${tailLeft ? tx - 12 : tx + 12} ${y + 46} L${tx + 7} ${y + 33} z`} fill={IVORY} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height="34" rx="17" fill={IVORY} stroke={stroke} strokeWidth="2" />
      <rect x={tx - 8} y={y + 29} width="16" height="4" fill={IVORY} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={INK}>
        {text}
      </text>
    </g>
  );
}

/** Two conversations: pitching (a polite yes) vs. asking (a real story). The second one is emphasised. */
function PitchVsAsk({ labels, className }: { labels: Record<string, string>; className?: string }) {
  const row = (top: number, q: string, a: string, strong: boolean) => (
    <g>
      <Bubble x={46} y={top + 30} w={250} text={q} stroke={strong ? BURGUNDY : OLIVE} tailLeft />
      <Bubble x={204} y={top + 84} w={160} text={a} stroke={strong ? GREEN : OLIVE} tailLeft={false} />
      <Person x={34} y={top + 104} color={strong ? BURGUNDY : OLIVE} s={1.15} />
      <Person x={368} y={top + 150} color={strong ? GREEN : OLIVE} s={1.15} />
    </g>
  );
  return (
    <svg viewBox="0 0 400 376" className={className} aria-hidden focusable="false" role="presentation">
      <g opacity="0.8">
        <Pill x={62} y={2} w={104} text={labels.pitchTag} fill={OLIVE} />
        {row(0, labels.pitch, labels.pitchReply, false)}
      </g>
      <rect x="4" y="188" width="392" height="184" rx="16" fill={GOLD_LIGHT} opacity="0.45" stroke={GOLD} strokeWidth="3" />
      <Pill x={70} y={196} w={112} text={labels.askTag} fill={BURGUNDY} />
      {row(194, labels.ask, labels.askReply, true)}
    </svg>
  );
}

/** The customer facing the paths that already exist today — and yours, which has to earn the choice. */
function AlternativesFork({ labels, className }: { labels: Record<string, string>; className?: string }) {
  const cx = 52;
  const cy = 160;
  const others: { key: string; y: number }[] = [
    { key: "pathA", y: 34 },
    { key: "pathB", y: 92 },
    { key: "pathC", y: 228 },
    { key: "pathD", y: 286 },
  ];
  return (
    <svg viewBox="0 0 400 320" className={className} aria-hidden focusable="false" role="presentation">
      {others.map((p) => (
        <g key={p.key}>
          <path d={`M${cx + 30} ${cy} C 130 ${cy}, 120 ${p.y}, 178 ${p.y}`} fill="none" stroke={OLIVE} strokeWidth="2.5" strokeDasharray="5 7" strokeLinecap="round" opacity="0.75" />
          <circle cx="190" cy={p.y} r="10" fill={CREAM} stroke={OLIVE} strokeWidth="2" />
          <text x="208" y={p.y + 4.5} fontSize="13" fontWeight="600" fill={INK} opacity="0.85">
            {labels[p.key]}
          </text>
        </g>
      ))}
      {/* your path */}
      <line x1={cx + 30} y1={cy} x2="172" y2={cy} stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
      <circle cx="192" cy={cy} r="17" fill={GOLD_LIGHT} stroke={GOLD} strokeWidth="4" />
      <text x="192" y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={BURGUNDY}>
        {labels.pathYou}
      </text>
      <Pill x={306} y={cy - 10} w={172} text={labels.youTag} fill={BURGUNDY} />
      {/* the customer */}
      <circle cx={cx} cy={cy} r="34" fill={IVORY} stroke={GREEN} strokeWidth="3" />
      <Person x={cx} y={cy + 2} color={GREEN} s={1.2} />
      <text x={cx} y={cy + 56} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GREEN}>
        {labels.customer}
      </text>
    </svg>
  );
}

export function LessonVisual({ visualKey, labels, className }: { visualKey: LessonVisualKey; labels: Record<string, string>; className?: string }) {
  switch (visualKey) {
    case "customer_focus_orbit":
      return <CustomerFocusOrbit labels={labels} className={className} />;
    case "product_vs_problem":
      return <ProductVsProblem labels={labels} className={className} />;
    case "pitch_vs_ask":
      return <PitchVsAsk labels={labels} className={className} />;
    case "alternatives_fork":
      return <AlternativesFork labels={labels} className={className} />;
    default:
      // "focus_progression" and future step models are drawn in HTML by the visual_model block.
      return null;
  }
}
