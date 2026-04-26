interface StarRatingProps {
  rating?: number | null
  onChange?: (value: number) => void
  readonly?: boolean
}

export default function StarRating({ rating, onChange, readonly = false }: StarRatingProps) {
  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

  if (readonly) {
    if (!rating) return <span className="text-gray-400 text-sm">未評価</span>
    return (
      <span className="text-yellow-400 text-sm">
        {'★'.repeat(Math.floor(rating))}
        {rating % 1 === 0.5 ? '½' : ''}
        <span className="text-gray-300">{'★'.repeat(5 - Math.ceil(rating))}</span>
        <span className="ml-1 text-gray-600 text-xs">{rating}</span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={rating ?? ''}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
        className="text-sm border border-gray-300 rounded px-2 py-1"
      >
        <option value="">未評価</option>
        {steps.map((v) => (
          <option key={v} value={v}>
            {'★'.repeat(Math.floor(v))}{v % 1 === 0.5 ? '½' : ''} ({v})
          </option>
        ))}
      </select>
    </div>
  )
}
