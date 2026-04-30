export const EDITORIAL = {
  paper: '#f7fbff',
  paperDeep: '#e7f0ff',
  paperSoft: '#ffffff',
  panel: '#ffffff',
  ink: '#182033',
  inkSoft: '#4f5f73',
  inkMuted: '#7b8798',
  line: 'rgba(24,32,51,0.14)',
  lineSoft: 'rgba(24,32,51,0.08)',
  accent: '#4f7ff7',
} as const

export const FONTS = {
  serif: "'Fraunces', 'Noto Serif JP', serif",
  sans: "'Inter', 'Noto Sans JP', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

export const STATUS_INK: Record<string, string> = {
  WISHLIST: '#9b72f2',
  PURCHASED: '#4f7ff7',
  READING: EDITORIAL.accent,
  FINISHED: '#2fbf7a',
  ON_HOLD: '#d99a2b',
  DROPPED: '#cf5d6f',
  TSUNDOKU: '#ff7a59',
}

export const CATEGORY_PALETTE = [
  '#4f7ff7',
  '#3b9df5',
  '#2aa7c9',
  '#25a6a1',
  '#28a979',
  '#63a64f',
  '#97a83e',
  '#c29a35',
  '#df8736',
  '#ff7a59',
  '#ef6b73',
  '#dc6c94',
  '#c870b6',
  '#aa72d9',
  '#8b78ea',
  '#687eea',
  '#5d8bb7',
  '#4b9aa6',
  '#46a88e',
  '#76a66a',
  '#a39d55',
  '#c08a58',
  '#d9786d',
  '#d16e89',
  '#b872a7',
  '#9277c5',
  '#6f82c9',
  '#5b91b8',
  '#5a9b9a',
  '#779c7b',
  '#9b8f6f',
  '#7e8a9a',
] as const

export const PALETTE_10 = CATEGORY_PALETTE

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

export function hashColor(seed: string, palette: readonly string[] = CATEGORY_PALETTE): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return palette[h % palette.length]
}
