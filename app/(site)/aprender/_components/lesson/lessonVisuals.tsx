/**
 * Gate G2 — code-owned lesson visuals, keyed by `visualKey`. Same drawing language as
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

export function LessonVisual({ visualKey, labels, className }: { visualKey: LessonVisualKey; labels: Record<string, string>; className?: string }) {
  switch (visualKey) {
    case "customer_focus_orbit":
      return <CustomerFocusOrbit labels={labels} className={className} />;
    default:
      // "focus_progression" and future step models are drawn in HTML by the visual_model block.
      return null;
  }
}
