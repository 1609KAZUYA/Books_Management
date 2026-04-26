import type { BookStatus } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'

const STATUS_COLORS: Record<BookStatus, string> = {
  WISHLIST: 'bg-purple-100 text-purple-800',
  PURCHASED: 'bg-blue-100 text-blue-800',
  READING: 'bg-green-100 text-green-800',
  FINISHED: 'bg-gray-100 text-gray-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  DROPPED: 'bg-red-100 text-red-800',
  TSUNDOKU: 'bg-orange-100 text-orange-800',
}

export default function BookStatusBadge({ status }: { status: BookStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
      {BOOK_STATUS_LABELS[status]}
    </span>
  )
}
