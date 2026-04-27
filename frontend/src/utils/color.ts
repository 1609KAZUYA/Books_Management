export function readableTextColor(backgroundColor?: string | null) {
  const rgb = parseHexColor(backgroundColor)
  if (!rgb) return '#374151'

  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? '#111827' : '#ffffff'
}

export function categoryBackground(colorHex?: string | null) {
  return colorHex ?? '#e5e7eb'
}

function parseHexColor(value?: string | null) {
  if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) return null
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}
