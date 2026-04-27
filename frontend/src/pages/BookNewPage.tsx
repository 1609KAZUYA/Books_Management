import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBook, searchExternalBooks } from '../api/books'
import { lookupIsbn } from '../api/isbn'
import { getTags } from '../api/tags'
import type {
  BookStatus,
  ExternalBookSearchCandidate,
  ExternalBookSearchType,
  IsbnLookupCandidate,
  Tag,
} from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'

type TabType = 'search' | 'isbn' | 'manual'

const STATUS_OPTIONS = Object.entries(BOOK_STATUS_LABELS) as [BookStatus, string][]
const SEARCH_TYPE_OPTIONS: { value: ExternalBookSearchType; label: string }[] = [
  { value: 'KEYWORD', label: 'すべて' },
  { value: 'TITLE', label: '書籍名' },
  { value: 'AUTHOR', label: '作者' },
  { value: 'ISBN', label: 'ISBN' },
]
const EXTERNAL_SEARCH_PAGE_SIZE = 12

export default function BookNewPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>('search')
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    getTags().then(setTags).catch(() => {})
  }, [])

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/books')} className="text-sm text-gray-500 hover:text-gray-900">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-gray-900">本を追加</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('search')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            書籍検索
          </button>
          <button
            onClick={() => setTab('isbn')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'isbn'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ISBNで検索
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            手動入力
          </button>
        </div>

        <div className="p-6">
          {tab === 'search' ? (
            <ExternalSearchTab tags={tags} onCreated={(id) => navigate(`/books/${id}`)} />
          ) : tab === 'isbn' ? (
            <IsbnTab tags={tags} onCreated={(id) => navigate(`/books/${id}`)} />
          ) : (
            <ManualTab tags={tags} onCreated={(id) => navigate(`/books/${id}`)} />
          )}
        </div>
      </div>
    </div>
  )
}

function ExternalSearchTab({ tags, onCreated }: { tags: Tag[]; onCreated: (id: number) => void }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ExternalBookSearchType>('KEYWORD')
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [candidates, setCandidates] = useState<ExternalBookSearchCandidate[]>([])
  const [searchError, setSearchError] = useState('')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [searchedType, setSearchedType] = useState<ExternalBookSearchType>('KEYWORD')
  const [hasMore, setHasMore] = useState(false)
  const [nextStartIndex, setNextStartIndex] = useState(0)
  const [status, setStatus] = useState<BookStatus>('WISHLIST')
  const [memo, setMemo] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [savingKey, setSavingKey] = useState('')
  const [saveError, setSaveError] = useState('')
  const searchSeqRef = useRef(0)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    const currentSeq = searchSeqRef.current + 1
    searchSeqRef.current = currentSeq
    setSearchError('')
    setSaveError('')
    setCandidates([])
    setHasMore(false)
    setNextStartIndex(0)
    setSearchedQuery(trimmedQuery)
    setSearchedType(type)
    setSearching(true)
    try {
      const result = await searchExternalBooks(trimmedQuery, type, EXTERNAL_SEARCH_PAGE_SIZE, 0)
      if (currentSeq !== searchSeqRef.current) return
      setCandidates(result.candidates)
      setNextStartIndex(EXTERNAL_SEARCH_PAGE_SIZE)
      setHasMore(canLoadAnotherExternalSearchPage(type, result.candidates.length))
      if (result.candidates.length === 0) {
        setSearchError('条件に一致する本が見つかりませんでした')
      }
    } catch (err: unknown) {
      if (currentSeq !== searchSeqRef.current) return
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const detail = (err as { message?: string })?.message
      setSearchError(msg ?? (detail ? `検索に失敗しました: ${detail}` : '検索に失敗しました'))
    } finally {
      if (currentSeq === searchSeqRef.current) {
        setSearching(false)
      }
    }
  }

  const handleLoadMore = async () => {
    if (!searchedQuery || loadingMore || searching) return
    const currentSeq = searchSeqRef.current + 1
    searchSeqRef.current = currentSeq
    setSearchError('')
    setSaveError('')
    setLoadingMore(true)
    try {
      const result = await searchExternalBooks(
        searchedQuery,
        searchedType,
        EXTERNAL_SEARCH_PAGE_SIZE,
        nextStartIndex,
      )
      if (currentSeq !== searchSeqRef.current) return
      setCandidates((current) => mergeCandidates(current, result.candidates))
      setNextStartIndex((current) => current + EXTERNAL_SEARCH_PAGE_SIZE)
      setHasMore(canLoadAnotherExternalSearchPage(searchedType, result.candidates.length))
    } catch (err: unknown) {
      if (currentSeq !== searchSeqRef.current) return
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const detail = (err as { message?: string })?.message
      setSearchError(msg ?? (detail ? `追加検索に失敗しました: ${detail}` : '追加検索に失敗しました'))
    } finally {
      if (currentSeq === searchSeqRef.current) {
        setLoadingMore(false)
      }
    }
  }

  const handleRegister = async (candidate: ExternalBookSearchCandidate, key: string) => {
    setSavingKey(key)
    setSaveError('')
    const fallbackIsbn = normalizeIsbnForRequest(searchedQuery || query)
    const isbn13 = candidate.isbn13 ?? fallbackIsbn?.isbn13 ?? null
    const isbn10 = candidate.isbn10 ?? fallbackIsbn?.isbn10 ?? null
    try {
      const book = await createBook({
        title: candidate.title,
        subtitle: candidate.subtitle ?? null,
        authors: candidate.authors,
        publisher: candidate.publisher ?? null,
        publishedDate: candidate.publishedDate ?? null,
        description: candidate.description ?? null,
        thumbnailUrl: candidate.thumbnailUrl ?? null,
        isbn13,
        isbn10,
        status,
        memo: memo || null,
        tagIds,
      })
      onCreated(book.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? '登録に失敗しました')
    } finally {
      setSavingKey('')
    }
  }

  const toggleTag = (id: number) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ExternalBookSearchType)}
          className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SEARCH_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="書籍名、作者、ISBN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? '検索中...' : '検索'}
        </button>
      </form>

      {searchError && <p className="text-red-600 text-sm">{searchError}</p>}

      {(candidates.length > 0 || saveError) && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">タグ</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tagIds.includes(tag.id)}
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
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="space-y-3">
          {candidates.map((candidate, index) => {
            const fallbackIsbn = normalizeIsbnForRequest(searchedQuery || query)
            const displayIsbn13 = candidate.isbn13 ?? fallbackIsbn?.isbn13 ?? null
            const displayIsbn10 = candidate.isbn10 ?? fallbackIsbn?.isbn10 ?? null
            const displayThumbnailUrl = candidate.thumbnailUrl ?? null
            const key = `${displayIsbn13 ?? candidate.title}-${index}`
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex gap-3">
                  {displayThumbnailUrl && (
                    <img
                      src={displayThumbnailUrl}
                      alt={candidate.title}
                      className="w-16 h-24 object-cover rounded bg-gray-100"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{candidate.title}</p>
                    {candidate.subtitle && <p className="text-sm text-gray-500">{candidate.subtitle}</p>}
                    {candidate.authors.length > 0 && (
                      <p className="text-sm text-gray-600">{candidate.authors.join(', ')}</p>
                    )}
                    {candidate.publisher && <p className="text-xs text-gray-400">{candidate.publisher}</p>}
                    <p className="text-xs text-gray-400">ISBN: {displayIsbn13 ?? displayIsbn10 ?? 'なし'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRegister(candidate, key)}
                    disabled={savingKey !== ''}
                    className="self-start bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingKey === key ? '登録中...' : '追加'}
                  </button>
                </div>
              </div>
            )
          })}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || searching}
                className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? '読み込み中...' : '次の結果を表示'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function mergeCandidates(
  current: ExternalBookSearchCandidate[],
  incoming: ExternalBookSearchCandidate[],
) {
  const merged = new Map<string, ExternalBookSearchCandidate>()
  current.forEach((candidate) => merged.set(externalCandidateKey(candidate), candidate))
  incoming.forEach((candidate) => merged.set(externalCandidateKey(candidate), candidate))
  return [...merged.values()]
}

function externalCandidateKey(candidate: ExternalBookSearchCandidate) {
  if (candidate.isbn13) return `isbn13:${candidate.isbn13}`
  if (candidate.isbn10) return `isbn10:${candidate.isbn10}`
  return `title:${candidate.title.toLowerCase()}:${candidate.authors.join(',').toLowerCase()}`
}

function canLoadAnotherExternalSearchPage(type: ExternalBookSearchType, fetchedCount: number) {
  return type !== 'ISBN' && fetchedCount > 0
}

function IsbnTab({ tags, onCreated }: { tags: Tag[]; onCreated: (id: number) => void }) {
  const [isbn, setIsbn] = useState('')
  const [searching, setSearching] = useState(false)
  const [candidate, setCandidate] = useState<IsbnLookupCandidate | null>(null)
  const [searchError, setSearchError] = useState('')
  const [status, setStatus] = useState<BookStatus>('WISHLIST')
  const [memo, setMemo] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    setCandidate(null)
    setSearching(true)
    try {
      const result = await lookupIsbn(isbn.replace(/-/g, ''))
      if (result.candidates.length === 0) {
        setSearchError('この ISBN の本が見つかりませんでした')
      } else {
        setCandidate(result.candidates[0])
      }
    } catch {
      setSearchError('検索に失敗しました。ISBN を確認してください')
    } finally {
      setSearching(false)
    }
  }

  const handleImport = async () => {
    if (!candidate) return
    setSaving(true)
    setSaveError('')
    const fallbackIsbn = normalizeIsbnForRequest(isbn)
    const isbn13 = candidate.isbn13 ?? fallbackIsbn?.isbn13 ?? null
    const isbn10 = candidate.isbn10 ?? fallbackIsbn?.isbn10 ?? null
    try {
      const book = await createBook({
        title: candidate.title,
        subtitle: candidate.subtitle ?? null,
        authors: candidate.authors,
        publisher: candidate.publisher ?? null,
        publishedDate: candidate.publishedDate ?? null,
        description: candidate.description ?? null,
        thumbnailUrl: candidate.thumbnailUrl ?? null,
        isbn13,
        isbn10,
        status,
        memo: memo || null,
        tagIds,
      })
      onCreated(book.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (id: number) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const displayIsbn = normalizeIsbnForRequest(isbn)
  const displayIsbn13 = candidate?.isbn13 ?? displayIsbn?.isbn13 ?? null
  const displayIsbn10 = candidate?.isbn10 ?? displayIsbn?.isbn10 ?? null
  const displayThumbnailUrl = candidate?.thumbnailUrl ?? null

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="ISBN-13 または ISBN-10"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          required
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? '検索中...' : '検索'}
        </button>
      </form>

      {searchError && <p className="text-red-600 text-sm">{searchError}</p>}

      {candidate && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex gap-3">
            {displayThumbnailUrl && (
              <img
                src={displayThumbnailUrl}
                alt={candidate.title}
                className="w-16 h-24 object-cover rounded"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div>
              <p className="font-semibold text-gray-900">{candidate.title}</p>
              {candidate.subtitle && <p className="text-sm text-gray-500">{candidate.subtitle}</p>}
              {candidate.authors.length > 0 && (
                <p className="text-sm text-gray-600">{candidate.authors.join(', ')}</p>
              )}
              {candidate.publisher && <p className="text-xs text-gray-400">{candidate.publisher}</p>}
              <p className="text-xs text-gray-400">ISBN: {displayIsbn13 ?? displayIsbn10 ?? 'なし'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">タグ</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tagIds.includes(tag.id)}
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
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

          <button
            onClick={handleImport}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '登録中...' : '本棚に追加'}
          </button>
        </div>
      )}
    </div>
  )
}

function ManualTab({ tags, onCreated }: { tags: Tag[]; onCreated: (id: number) => void }) {
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedDate, setPublishedDate] = useState('')
  const [isbn13, setIsbn13] = useState('')
  const [status, setStatus] = useState<BookStatus>('WISHLIST')
  const [memo, setMemo] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const book = await createBook({
        title,
        authors: authors ? authors.split(',').map((a) => a.trim()).filter(Boolean) : [],
        publisher: publisher || null,
        publishedDate: publishedDate || null,
        isbn13: isbn13 || null,
        status,
        memo: memo || null,
        tagIds,
      })
      onCreated(book.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (id: number) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">著者（カンマ区切り）</label>
          <input
            type="text"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="著者A, 著者B"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">出版社</label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">出版日</label>
          <input
            type="date"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ISBN-13</label>
          <input
            type="text"
            value={isbn13}
            onChange={(e) => setIsbn13(e.target.value)}
            placeholder="9784XXXXXXXXX"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            ステータス <span className="text-red-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className="border border-gray-300 rounded-md px-2 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {tags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">タグ</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tagIds.includes(tag.id)}
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
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">メモ</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '登録中...' : '本棚に追加'}
      </button>
    </form>
  )
}

interface IsbnForRequest {
  isbn13: string | null
  isbn10: string | null
}

function normalizeIsbnForRequest(value: string): IsbnForRequest | null {
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase()
  if (/^\d{13}$/.test(cleaned)) {
    return { isbn13: cleaned, isbn10: null }
  }
  if (/^\d{9}[\dX]$/.test(cleaned)) {
    return { isbn13: isbn10To13(cleaned), isbn10: cleaned }
  }
  return null
}

function isbn10To13(isbn10: string) {
  const body = `978${isbn10.slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < body.length; i += 1) {
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return `${body}${checkDigit}`
}
