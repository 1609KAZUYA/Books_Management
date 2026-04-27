const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#a16207',
  '#64748b',
  '#000000',
]

interface ColorSwatchesProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function ColorSwatches({ value, onChange, label = 'カラー' }: ColorSwatchesProps) {
  const hasCurrentColor = COLOR_OPTIONS.some((color) => color.toLowerCase() === value.toLowerCase())
  const colors = hasCurrentColor || !/^#[0-9a-fA-F]{6}$/.test(value) ? COLOR_OPTIONS : [value, ...COLOR_OPTIONS]

  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {colors.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            aria-checked={selected}
            role="radio"
            title={color}
            onClick={() => onChange(color)}
            className={`h-7 w-7 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selected ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'border-gray-200 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}
