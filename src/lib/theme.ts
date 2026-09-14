import type { CSSProperties } from "react";
import type { ThemeContent } from "./types";

/** Presets surfaced as chips in /admin/theme — one click sets mode + accent. */
export const THEME_PRESETS = [
  { key: "midnight-blue", label: "Near-black · Electric blue", mode: "dark", accent: "#5B8CFF" },
  { key: "paper-ember", label: "Off-white · Burnt orange", mode: "light", accent: "#E4572E" },
  { key: "slate-emerald", label: "Slate · Emerald", mode: "light", accent: "#10B981" },
  { key: "graphite-gold", label: "Graphite · Gold", mode: "dark", accent: "#D4A24C" },
  { key: "ivory-ink", label: "Ivory · Ink (no color)", mode: "light", accent: "#1A1A1A" },
] as const;

export interface Palette {
  bg: string;
  bgSoft: string;
  fg: string;
  muted: string;
  line: string;
  card: string;
  accent: string;
  accentFg: string;
}

const BASE: Record<ThemeContent["mode"], Omit<Palette, "accent" | "accentFg">> = {
  dark: {
    bg: "#0B0B0D",
    bgSoft: "#101014",
    fg: "#F4F4F5",
    muted: "#8A8A93",
    line: "#232329",
    card: "#121216",
  },
  light: {
    bg: "#FAFAF7",
    bgSoft: "#F2F1EC",
    fg: "#16161A",
    muted: "#6E6E77",
    line: "#E4E2DA",
    card: "#FFFFFF",
  },
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return { r: 90, g: 140, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Relative luminance → pick black or white text on accent. */
export function readableOn(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.62 ? "#101014" : "#FFFFFF";
}

export function buildPalette(theme: ThemeContent): Palette {
  if (theme.template === "ai-studio") {
    return {
      bg: theme.heroStudio.backgroundStart,
      bgSoft: theme.heroStudio.backgroundEnd,
      fg: "#14213D",
      muted: "#526985",
      line: "#C9D9EC",
      card: "#F7FAFF",
      accent: theme.accent,
      accentFg: readableOn(theme.accent),
    };
  }
  return { ...BASE[theme.mode], accent: theme.accent, accentFg: readableOn(theme.accent) };
}

/** CSS custom properties applied on <html> by the root layout. */
export function themeVars(theme: ThemeContent): CSSProperties {
  const p = buildPalette(theme);
  return {
    "--bg": p.bg,
    "--bg-soft": p.bgSoft,
    "--fg": p.fg,
    "--muted": p.muted,
    "--line": p.line,
    "--card": p.card,
    "--accent": p.accent,
    "--accent-fg": p.accentFg,
    "--accent-soft": `${p.accent}${theme.mode === "dark" ? "26" : "1F"}`,
  } as CSSProperties;
}

export function normalizeHex(input: string, fallback = "#5B8CFF") {
  const v = input.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? (v.length === 4 ? expandShort(v) : v) : fallback;
}

function expandShort(v: string) {
  return "#" + v.slice(1).split("").map((c) => c + c).join("");
}
