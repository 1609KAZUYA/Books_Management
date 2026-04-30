import type { BookStatus } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'

const STATUS_COLORS: Record<BookStatus, string> = {
  WISHLIST: 'bg-violet-50 text-violet-800',
  PURCHASED: 'bg-sky-50 text-sky-800',
  READING: 'bg-teal-50 text-teal-800',
  FINISHED: 'bg-slate-100 text-slate-800',
  ON_HOLD: 'bg-stone-100 text-stone-800',
  DROPPED: 'bg-rose-50 text-rose-800',
  TSUNDOKU: 'bg-neutral-100 text-neutral-800',
}

export default function BookStatusBadge({ status }: { status: BookStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
      {BOOK_STATUS_LABELS[status]}
    </span>
  )
}
