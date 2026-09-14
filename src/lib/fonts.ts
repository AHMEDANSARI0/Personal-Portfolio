/** Max 2 families per site (brief §5). Keys map to /admin/theme chips. */
export interface FontPair {
  key: string;
  label: string;
  display: string;
  body: string;
  /** drop these into Google Fonts if you prefer webfonts over system stack */
  googleHref: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    key: "grotesk",
    label: "Space Grotesk + Inter",
    display: "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
  },
  {
    key: "system",
    label: "System — zero webfont cost",
    display:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    googleHref: "",
  },
  {
    key: "mono-editorial",
    label: "Mono display + System sans",
    display: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace",
    body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    googleHref: "",
  },
];

export function resolveFontPair(key: string): FontPair {
  return FONT_PAIRS.find((f) => f.key === key) || FONT_PAIRS[0];
}
