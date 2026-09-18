/**
 * Learning Center — code-based visual identity (Phase 1). Editorial vignettes are inline SVG
 * drawn with the Leonix palette (ivory field, burgundy/green figures, gold accents, charcoal
 * line). No photography, no image generation, no runtime dependency. Every vignette is
 * decorative (`aria-hidden`); the meaning is always carried by adjacent real text.
 */
import type { IconType } from "react-icons";
import {
  FiArrowRightCircle,
  FiBookOpen,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiDollarSign,
  FiEdit3,
  FiEye,
  FiFlag,
  FiGlobe,
  FiLayers,
  FiMessageCircle,
  FiShield,
  FiTool,
  FiTrendingUp,
  FiUnlock,
  FiUsers,
} from "react-icons/fi";
import type { LearningCheckpointKey, LearningJourneyKey } from "../learningCopy";

const INK = "#1E1810";
const BURGUNDY = "#7A1E2C";
const GREEN = "#2A4536";
const OLIVE = "#556B3E";
const GOLD = "#C9A84A";
const GOLD_LIGHT = "#F3D98A";
const IVORY = "#FFFDF7";
const CREAM = "#F3EBDC";

export const CHECKPOINT_GLYPHS: Record<LearningCheckpointKey, IconType> = {
  entender: FiEdit3,
  construir: FiLayers,
  preparar: FiCheckSquare,
  visible: FiEye,
  crecer: FiTrendingUp,
  proteger: FiShield,
  siguiente: FiFlag,
};

export const METHOD_GLYPHS: readonly IconType[] = [FiBookOpen, FiEye, FiTool, FiCheckCircle, FiArrowRightCircle];

/** Compact pathway method strip: learn → practice → use AI → verify → keep going. */
export const METHOD_STRIP_GLYPHS: readonly IconType[] = [FiBookOpen, FiTool, FiMessageCircle, FiCheckCircle, FiArrowRightCircle];

export const TRUST_GLYPHS: readonly IconType[] = [FiGlobe, FiTool, FiClock, FiUnlock];

export const CATEGORY_GLYPHS: Record<string, IconType> = {
  fundamentos_del_negocio: FiLayers,
  clientes_y_demanda: FiUsers,
  dinero_y_capacidad: FiDollarSign,
  visibilidad_y_publicidad: FiEye,
  comunicacion_y_reputacion: FiMessageCircle,
  proteccion_y_datos: FiShield,
};

export function categoryGlyph(categoryKey: string): IconType {
  return CATEGORY_GLYPHS[categoryKey] ?? FiBookOpen;
}

/* ------------------------------------------------------------------------------------------ */
/* Shared drawing helpers                                                                      */
/* ------------------------------------------------------------------------------------------ */

function Bulb({ x, y, s = 1, color = BURGUNDY }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -34 a26 26 0 0 1 14 48 v10 h-28 v-10 a26 26 0 0 1 14 -48z" fill={GOLD_LIGHT} stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-9 30 h18 M-7 38 h14" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M-6 -6 l6 12 l6 -12" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g stroke={GOLD} strokeWidth="3" strokeLinecap="round">
        <path d="M-40 -30 l8 6" />
        <path d="M40 -30 l-8 6" />
        <path d="M0 -50 v9" />
      </g>
    </g>
  );
}

function Storefront({ x, y, s = 1, color = GREEN, open = false }: { x: number; y: number; s?: number; color?: string; open?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-44" y="-8" width="88" height="56" fill={IVORY} stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-50 -8 h100 l-8 -22 h-84 z" fill={BURGUNDY} stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-50 -8 c8 12 16 12 24 0 c8 12 16 12 25 0 c8 12 16 12 25 0 c8 12 16 12 26 0" fill={IVORY} stroke={color} strokeWidth="3" />
      <rect x="-10" y="14" width="20" height="34" fill={color} />
      <rect x="-36" y="12" width="18" height="16" fill={GOLD_LIGHT} stroke={color} strokeWidth="2.5" />
      <rect x="18" y="12" width="18" height="16" fill={GOLD_LIGHT} stroke={color} strokeWidth="2.5" />
      {open ? <rect x="-14" y="-40" width="28" height="12" rx="2" fill={GOLD} stroke={color} strokeWidth="2" /> : null}
    </g>
  );
}

function GrowthBars({ x, y, s = 1, color = GREEN }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-42" y="14" width="18" height="30" rx="2" fill={CREAM} stroke={color} strokeWidth="3" />
      <rect x="-14" y="-2" width="18" height="46" rx="2" fill={GOLD_LIGHT} stroke={color} strokeWidth="3" />
      <rect x="14" y="-24" width="18" height="68" rx="2" fill={BURGUNDY} stroke={color} strokeWidth="3" />
      <path d="M-40 4 L-8 -14 L20 -36" fill="none" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 -38 h14 v14" fill="none" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function SketchLines({ x, y, color = INK }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
      <path d="M0 0 h54" />
      <path d="M0 12 h40" />
      <path d="M0 24 h48" />
    </g>
  );
}

function Pencil({ x, y, rotate = -30, color = OLIVE }: { x: number; y: number; rotate?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-6" y="-34" width="12" height="52" fill={GOLD_LIGHT} stroke={color} strokeWidth="2.5" />
      <path d="M-6 18 l6 14 l6 -14 z" fill={IVORY} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="-6" y="-40" width="12" height="6" fill={BURGUNDY} stroke={color} strokeWidth="2.5" />
    </g>
  );
}

function Checklist({ x, y, color = GREEN }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="58" height="70" rx="4" fill={IVORY} stroke={color} strokeWidth="2.5" />
      {[14, 30, 46].map((cy, i) => (
        <g key={cy}>
          <rect x="8" y={cy - 5} width="10" height="10" rx="2" fill={i < 2 ? GOLD_LIGHT : IVORY} stroke={color} strokeWidth="2" />
          {i < 2 ? <path d={`M10 ${cy} l3 3 l5 -6`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : null}
          <path d={`M24 ${cy} h26`} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Hero roadmap vignette: IDEA → BUSINESS → GROWTH along a gold path                            */
/* ------------------------------------------------------------------------------------------ */

export function HeroRoadmapVignette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 300" className={className} aria-hidden focusable="false" role="presentation">
      <path d="M40 240 C 150 250, 190 130, 280 150 S 420 100, 520 60" fill="none" stroke={GOLD} strokeWidth="4" strokeDasharray="10 10" strokeLinecap="round" />
      <circle cx="40" cy="240" r="6" fill={GOLD} />
      <circle cx="280" cy="150" r="6" fill={GOLD} />
      <circle cx="520" cy="60" r="6" fill={GOLD} />

      <circle cx="105" cy="190" r="58" fill={CREAM} />
      <SketchLines x={60} y={225} />
      <Bulb x={105} y={175} s={1.05} />
      <Pencil x={150} y={215} />

      <circle cx="300" cy="120" r="66" fill={CREAM} />
      <Storefront x={300} y={112} s={1.1} open />

      <circle cx="470" cy="110" r="66" fill={CREAM} />
      <GrowthBars x={470} y={110} s={1.05} />
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Journey vignettes                                                                           */
/* ------------------------------------------------------------------------------------------ */

export function JourneyVignette({ journey, className }: { journey: LearningJourneyKey; className?: string }) {
  if (journey === "idea") {
    return (
      <svg viewBox="0 0 240 150" className={className} aria-hidden focusable="false" role="presentation">
        <rect x="0" y="0" width="240" height="150" rx="14" fill={CREAM} />
        <path d="M18 128 h204" stroke={GOLD} strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" />
        <SketchLines x={26} y={40} />
        <SketchLines x={26} y={84} color={BURGUNDY} />
        <Bulb x={140} y={78} s={1.15} />
        <Pencil x={205} y={92} rotate={28} />
      </svg>
    );
  }
  if (journey === "empezando") {
    return (
      <svg viewBox="0 0 240 150" className={className} aria-hidden focusable="false" role="presentation">
        <rect x="0" y="0" width="240" height="150" rx="14" fill={CREAM} />
        <path d="M18 128 h204" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
        <Storefront x={88} y={76} s={1.05} color={OLIVE} />
        <Checklist x={160} y={40} color={OLIVE} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden focusable="false" role="presentation">
      <rect x="0" y="0" width="240" height="150" rx="14" fill={CREAM} />
      <path d="M18 128 h204" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <Storefront x={78} y={80} s={1.0} open />
      <GrowthBars x={175} y={82} s={0.95} />
    </svg>
  );
}

export const JOURNEY_ACCENT: Record<LearningJourneyKey, { border: string; ink: string; chip: string; badge: string }> = {
  idea: { border: "border-[#7A1E2C]/35", ink: "text-[#7A1E2C]", chip: "bg-[#7A1E2C]/[0.08] text-[#7A1E2C]", badge: "bg-[#7A1E2C] text-[#F8F4EA]" },
  empezando: { border: "border-[#556B3E]/40", ink: "text-[#3F5230]", chip: "bg-[#556B3E]/[0.10] text-[#3F5230]", badge: "bg-[#556B3E] text-[#F8F4EA]" },
  negocio: { border: "border-[#2A4536]/40", ink: "text-[#2A4536]", chip: "bg-[#2A4536]/[0.08] text-[#2A4536]", badge: "bg-[#2A4536] text-[#F3D98A]" },
};

/* ------------------------------------------------------------------------------------------ */
/* Toolkit marks                                                                               */
/* ------------------------------------------------------------------------------------------ */

export function GlossaryMark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-2xl bg-[#2A4536] font-serif font-bold text-[#F3D98A] ${className ?? ""}`} aria-hidden>
      Aa
    </span>
  );
}

export function IdeaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" role="presentation">
      <rect x="0" y="0" width="100" height="100" rx="18" fill={CREAM} />
      <Bulb x={50} y={50} s={0.85} />
    </svg>
  );
}
