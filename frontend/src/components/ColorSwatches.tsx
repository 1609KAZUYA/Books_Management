import { CATEGORY_PALETTE } from '../styles/editorial'
import { categoryBackground } from '../utils/color'

const COLOR_OPTIONS = [...CATEGORY_PALETTE]

interface ColorSwatchesProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function ColorSwatches({ value, onChange, label = 'カラー' }: ColorSwatchesProps) {
  const normalizedValue = categoryBackground(value)
  const hasCurrentColor = COLOR_OPTIONS.some((color) => color.toLowerCase() === normalizedValue.toLowerCase())
  const colors = hasCurrentColor || !/^#[0-9a-fA-F]{6}$/.test(normalizedValue) ? COLOR_OPTIONS : [normalizedValue, ...COLOR_OPTIONS]

  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {colors.map((color) => {
        const selected = normalizedValue.toLowerCase() === color.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            aria-checked={selected}
            role="radio"
            title={color}
            onClick={() => onChange(color)}
            className={`h-7 w-7 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
              selected ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'border-gray-200 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}
