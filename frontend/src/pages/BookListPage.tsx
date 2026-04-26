import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchBooks } from '../api/books'
import { getTags } from '../api/tags'
import type { BookListItem, BookStatus, PaginationMeta, Tag } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'
import BookStatusBadge from '../components/BookStatusBadge'
import StarRating from '../components/StarRating'

const SORT_OPTIONS = [
  { value: 'updatedAtDesc', label: '更新日（新しい順）' },
  { value: 'createdAtDesc', label: '登録日（新しい順）' },
  { value: 'titleAsc', label: 'タイトル（昇順）' },
  { value: 'ratingDesc', label: '評価（高い順）' },
  { value: 'publishedDateDesc', label: '出版日（新しい順）' },
]

export default function BookListPage() {
  const [books, setBooks] = useState<BookListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [status, setStatus] = useState<BookStatus | ''>('')
  const [tagId, setTagId] = useState<number | ''>('')
  const [sort, setSort] = useState('updatedAtDesc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getTags().then(setTags).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    searchBooks({
      keyword: keyword || undefined,
      status: (status as BookStatus) || undefined,
      tagId: tagId ? Number(tagId) : undefined,
      sort,
      page,
      size: 20,
    })
      .then((data) => {
        setBooks(data.items)
        setMeta(data.meta)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [keyword, status, tagId, sort, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(inputKeyword)
    setPage(1)
  }

  const handleFilterChange = () => {
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">本棚</h1>
        <Link
          to="/books/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + 本を追加
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="タイトル・著者・ISBNで検索"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700"
          >
            検索
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as BookStatus | ''); handleFilterChange() }}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべてのステータス</option>
            {(Object.keys(BOOK_STATUS_LABELS) as BookStatus[]).map((s) => (
              <option key={s} value={s}>{BOOK_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={tagId}
            onChange={(e) => { setTagId(e.target.value ? Number(e.target.value) : ''); handleFilterChange() }}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべてのタグ</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); handleFilterChange() }}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          本が見つかりませんでした
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
          >
            前へ
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {page} / {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  )
}

function BookCard({ book }: { book: BookListItem }) {
  const bm = book.bookMaster
  return (
    <Link
      to={`/books/${book.id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex gap-3"
    >
      {bm.thumbnailUrl ? (
        <img src={bm.thumbnailUrl} alt={bm.title} className="w-14 h-20 object-cover rounded flex-shrink-0" />
      ) : (
        <div className="w-14 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400 text-xs">📚</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{bm.title}</p>
        {bm.authors.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{bm.authors.join(', ')}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1 items-center">
          <BookStatusBadge status={book.status} />
          {book.favoriteFlag && <span className="text-red-500 text-xs">♥</span>}
        </div>
        {book.rating && (
          <div className="mt-1">
            <StarRating rating={book.rating} readonly />
          </div>
        )}
        {book.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {book.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: tag.colorHex ?? '#e5e7eb', color: '#374151' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
