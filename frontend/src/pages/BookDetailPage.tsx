import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteBook, getBook, updateBook, updateStatus } from '../api/books'
import { getCategories } from '../api/categories'
import { getTags } from '../api/tags'
import type { BookStatus, Category, Tag, UpdateBookRequest, UserBookDetail } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'
import BookStatusBadge from '../components/BookStatusBadge'
import BookCoverImage from '../components/BookCoverImage'
import StarRating from '../components/StarRating'

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<UserBookDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Edit form state
  const [editStatus, setEditStatus] = useState<BookStatus>('WISHLIST')
  const [editRating, setEditRating] = useState<number | null>(null)
  const [editFavorite, setEditFavorite] = useState(false)
  const [editMemo, setEditMemo] = useState('')
  const [editLocationNote, setEditLocationNote] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number | ''>('')
  const [editTagIds, setEditTagIds] = useState<number[]>([])
  const [editPurchaseDate, setEditPurchaseDate] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editFinishDate, setEditFinishDate] = useState('')

  useEffect(() => {
    Promise.all([getBook(Number(id)), getCategories(), getTags()])
      .then(([bookData, categoryData, tagsData]) => {
        setBook(bookData)
        setCategories(categoryData)
        setTags(tagsData)
        resetForm(bookData)
      })
      .catch(() => setError('本の情報を読み込めませんでした'))
      .finally(() => setLoading(false))
  }, [id])

  const resetForm = (b: UserBookDetail) => {
    setEditStatus(b.status)
    setEditRating(b.rating ?? null)
    setEditFavorite(b.favoriteFlag)
    setEditMemo(b.memo ?? '')
    setEditLocationNote(b.locationNote ?? '')
    setEditCategoryId(b.category?.id ?? '')
    setEditTagIds(b.tags.map((t) => t.id))
    setEditPurchaseDate(b.purchaseDate ?? '')
    setEditStartDate(b.startDate ?? '')
    setEditFinishDate(b.finishDate ?? '')
  }

  const handleSave = async () => {
    if (!book) return
    setSaving(true)
    setError('')
    try {
      const req: UpdateBookRequest = {
        status: editStatus,
        rating: editRating,
        favoriteFlag: editFavorite,
        memo: editMemo || null,
        locationNote: editLocationNote || null,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
        tagIds: editTagIds,
        purchaseDate: editPurchaseDate || null,
        startDate: editStartDate || null,
        finishDate: editFinishDate || null,
      }
      const updated = await updateBook(book.id, req)
      setBook(updated)
      setEditing(false)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatusChange = async (newStatus: BookStatus) => {
    if (!book) return
    try {
      const updated = await updateStatus(book.id, { status: newStatus })
      setBook(updated)
      setEditStatus(updated.status)
      setEditStartDate(updated.startDate ?? '')
      setEditFinishDate(updated.finishDate ?? '')
    } catch {
      setError('ステータスの更新に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (!book || !window.confirm('この本を削除しますか？')) return
    try {
      await deleteBook(book.id)
      navigate('/books')
    } catch {
      setError('削除に失敗しました')
    }
  }

  const toggleTag = (tagId: number) => {
    setEditTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!book) {
    return <div className="text-center py-12 text-gray-500">{error || '本が見つかりません'}</div>
  }

  const bm = book.bookMaster

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/books')} className="text-sm text-gray-500 hover:text-gray-900">
          ← 本棚に戻る
        </button>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-50 border border-red-300 text-red-700 px-3 py-1.5 rounded-md text-sm hover:bg-red-100"
              >
                削除
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditing(false); resetForm(book) }}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Book master info */}
        <div className="flex gap-4 mb-6">
          <BookCoverImage
            book={bm}
            className="w-20 h-28 object-cover rounded flex-shrink-0"
            placeholderClassName="w-20 h-28 bg-gray-100 rounded flex items-center justify-center flex-shrink-0"
            placeholderTextClassName="text-gray-400 text-xs"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{bm.title}</h1>
            {bm.subtitle && <p className="text-sm text-gray-500 mt-0.5">{bm.subtitle}</p>}
            {bm.authors.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">{bm.authors.join(', ')}</p>
            )}
            {bm.publisher && <p className="text-xs text-gray-400 mt-0.5">{bm.publisher}</p>}
            {bm.publishedDate && <p className="text-xs text-gray-400">{bm.publishedDate}</p>}
            {(bm.isbn13 || bm.isbn10) && (
              <p className="text-xs text-gray-400 mt-0.5">
                ISBN: {bm.isbn13 ?? bm.isbn10}
              </p>
            )}
          </div>
        </div>

        <hr className="border-gray-100 mb-4" />

        {/* User info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ステータス</label>
            {editing ? (
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as BookStatus)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(BOOK_STATUS_LABELS) as BookStatus[]).map((s) => (
                  <option key={s} value={s}>{BOOK_STATUS_LABELS[s]}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <BookStatusBadge status={book.status} />
                <div className="flex gap-1">
                  {(Object.keys(BOOK_STATUS_LABELS) as BookStatus[])
                    .filter((s) => s !== book.status)
                    .slice(0, 3)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleQuickStatusChange(s)}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        {BOOK_STATUS_LABELS[s]}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">評価</label>
            {editing ? (
              <StarRating rating={editRating} onChange={setEditRating} />
            ) : (
              <StarRating rating={book.rating} readonly />
            )}
          </div>

          {/* Favorite */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">お気に入り</label>
            {editing ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFavorite}
                  onChange={(e) => setEditFavorite(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">お気に入り</span>
              </label>
            ) : (
              <span className="text-sm">{book.favoriteFlag ? '♥ お気に入り' : '—'}</span>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">カテゴリー</label>
            {editing ? (
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">未分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            ) : book.category ? (
              <span
                className="inline-block px-2 py-0.5 rounded text-xs text-gray-700"
                style={{ backgroundColor: book.category.colorHex ?? '#e5e7eb' }}
              >
                {book.category.name}
              </span>
            ) : (
              <span className="text-sm text-gray-400">未分類</span>
            )}
          </div>

          {/* Purchase date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">購入日</label>
            {editing ? (
              <input
                type="date"
                value={editPurchaseDate}
                onChange={(e) => setEditPurchaseDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-sm">{book.purchaseDate ?? '—'}</span>
            )}
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">読み始め</label>
            {editing ? (
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-sm">{book.startDate ?? '—'}</span>
            )}
          </div>

          {/* Finish date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">読了日</label>
            {editing ? (
              <input
                type="date"
                value={editFinishDate}
                onChange={(e) => setEditFinishDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-sm">{book.finishDate ?? '—'}</span>
            )}
          </div>

          {/* Tags */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">タグ</label>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: tag.colorHex ?? '#e5e7eb' }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <span className="text-sm text-gray-400">タグがありません（タグ管理から追加できます）</span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {book.tags.length > 0
                  ? book.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: tag.colorHex ?? '#e5e7eb' }}
                      >
                        {tag.name}
                      </span>
                    ))
                  : <span className="text-sm text-gray-400">—</span>}
              </div>
            )}
          </div>

          {/* Memo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">メモ</label>
            {editing ? (
              <textarea
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                rows={4}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{book.memo || '—'}</p>
            )}
          </div>

          {/* Location note */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">保管場所</label>
            {editing ? (
              <input
                type="text"
                value={editLocationNote}
                onChange={(e) => setEditLocationNote(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="text-sm">{book.locationNote || '—'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
