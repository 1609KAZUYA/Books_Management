export const EDITORIAL = {
  paper: '#f4ede0',
  paperDeep: '#ebe2cf',
  paperSoft: '#faf5ea',
  panel: '#ffffff',
  ink: '#2a201a',
  inkSoft: '#5b4a3c',
  inkMuted: '#8a7a6c',
  line: 'rgba(42,32,26,0.16)',
  lineSoft: 'rgba(42,32,26,0.08)',
  accent: '#8a3a1f',
} as const

export const FONTS = {
  serif: "'Fraunces', 'Noto Serif JP', serif",
  sans: "'Inter', 'Noto Sans JP', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

export const STATUS_INK: Record<string, string> = {
  WISHLIST: '#7a5ac2',
  PURCHASED: '#3a5a8a',
  READING: EDITORIAL.accent,
  FINISHED: '#5a8a6a',
  ON_HOLD: '#a8743a',
  DROPPED: '#a83a2a',
  TSUNDOKU: '#a8743a',
}

export const PALETTE_10 = [
  '#c14a4a',
  '#d68a3a',
  '#d6c43a',
  '#5aa56a',
  '#3aa5a5',
  EDITORIAL.accent,
  '#7a5ac2',
  '#c46aa5',
  '#7a4a3a',
  '#3a3a3a',
] as const

export function shade(hex: string, pct: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const n = parseInt(hex.slice(1), 16)
  const adjust = (v: number) =>
    Math.max(0, Math.min(255, v + Math.round((255 * pct) / 100)))
  const r = adjust(n >> 16)
  const g = adjust((n >> 8) & 0xff)
  const b = adjust(n & 0xff)
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

export function hashColor(seed: string, palette: readonly string[] = PALETTE_10): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return palette[h % palette.length]
}
