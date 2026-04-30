import { CATEGORY_PALETTE } from '../styles/editorial'

const LEGACY_CATEGORY_COLORS: Record<string, string> = {
  '#ef4444': '#ef6b73',
  '#f97316': '#ff7a59',
  '#facc15': '#c29a35',
  '#22c55e': '#28a979',
  '#14b8a6': '#25a6a1',
  '#3b82f6': '#4f7ff7',
  '#2563eb': '#4f7ff7',
  '#8b5cf6': '#8b78ea',
  '#ec4899': '#dc6c94',
  '#a16207': '#c08a58',
  '#64748b': '#7e8a9a',
  '#000000': '#7e8a9a',
  '#c14a4a': '#ef6b73',
  '#d68a3a': '#df8736',
  '#d6c43a': '#c29a35',
  '#5aa56a': '#63a64f',
  '#3aa5a5': '#25a6a1',
  '#8a3a1f': '#d9786d',
  '#7a5ac2': '#8b78ea',
  '#c46aa5': '#c870b6',
  '#7a4a3a': '#9b8f6f',
  '#3a3a3a': '#7e8a9a',
  '#a8743a': '#df8736',
  '#3f6478': '#5d8bb7',
  '#426a86': '#5d8bb7',
  '#6b7d8f': '#6f82c9',
  '#5e7c73': '#5a9b9a',
  '#4f7a63': '#46a88e',
  '#607066': '#779c7b',
  '#6b7656': '#97a83e',
  '#7f6f4a': '#c29a35',
  '#8a6f43': '#c08a58',
  '#756654': '#c08a58',
  '#7a6259': '#9b8f6f',
  '#8a5f5d': '#d16e89',
  '#8a4d47': '#d9786d',
  '#6f5f8d': '#9277c5',
  '#7a6f8d': '#8b78ea',
  '#56606a': '#7e8a9a',
}

export function readableTextColor(backgroundColor?: string | null) {
  const rgb = parseHexColor(backgroundColor)
  if (!rgb) return '#374151'

  const luminance = relativeLuminance(rgb)
  const blackContrast = contrastRatio(luminance, 0)
  const whiteContrast = contrastRatio(luminance, 1)
  return blackContrast >= whiteContrast ? '#111827' : '#ffffff'
}

function relativeLuminance(rgb: number[]) {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: number, b: number) {
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

export function categoryBackground(colorHex?: string | null) {
  if (!colorHex) return CATEGORY_PALETTE[0]
  const normalized = colorHex.toLowerCase()
  return LEGACY_CATEGORY_COLORS[normalized] ?? colorHex
}

function parseHexColor(value?: string | null) {
  if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) return null
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}
