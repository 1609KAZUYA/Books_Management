import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBook, searchExternalBooks } from '../api/books'
import { getCategories } from '../api/categories'
import { lookupIsbn } from '../api/isbn'
import { EDITORIAL, FONTS, STATUS_INK, shade } from '../styles/editorial'
import type {
  BookStatus,
  Category,
  ExternalBookSearchCandidate,
  ExternalBookSearchType,
  IsbnLookupCandidate,
} from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'
import { categoryBackground, readableTextColor } from '../utils/color'

type TabType = 'search' | 'isbn' | 'manual'

const STATUS_OPTIONS = Object.entries(BOOK_STATUS_LABELS) as [BookStatus, string][]
const SEARCH_TYPE_OPTIONS: { value: ExternalBookSearchType; label: string; hint: string }[] = [
  { value: 'KEYWORD', label: 'まとめて検索', hint: 'タイトル・著者・ISBN' },
  { value: 'TITLE', label: '書籍名', hint: '本のタイトル' },
  { value: 'AUTHOR', label: '作者', hint: '著者名' },
  { value: 'ISBN', label: 'ISBN', hint: '978...' },
]
const EXTERNAL_SEARCH_PAGE_SIZE = 12
const C = EDITORIAL

const pageStyle: CSSProperties = {
  padding: '48px 56px 88px',
  color: C.ink,
}

const fieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  background: 'rgba(255,255,255,0.84)',
  color: C.ink,
  padding: '0 14px',
  fontFamily: FONTS.sans,
  fontSize: 14,
  outline: 'none',
}

const textAreaStyle: CSSProperties = {
  ...fieldStyle,
  minHeight: 98,
  padding: 14,
  resize: 'vertical',
  lineHeight: 1.6,
}

export default function BookNewPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>('search')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  return (
    <div className="bm-modern-shell bm-book-new-page" style={pageStyle}>
      <header
        className="bm-dashboard-hero bm-glass-layer bm-book-new-hero"
        style={{
          padding: 28,
          marginBottom: 22,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 20,
          alignItems: 'end',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            type="button"
            onClick={() => navigate('/books')}
            className="bm-tactile"
            style={{
              border: `1px solid ${C.line}`,
              background: 'rgba(255,255,255,0.7)',
              color: C.inkSoft,
              borderRadius: 999,
              minHeight: 40,
              padding: '0 14px',
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            ← 本棚に戻る
          </button>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              letterSpacing: '0.16em',
              color: C.accent,
              marginBottom: 12,
            }}
          >
            ADD YOUR NEXT READ
          </div>
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: 58,
              lineHeight: 1,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            読みたい本を追加
          </h1>
          <p style={{ color: C.inkSoft, lineHeight: 1.7, maxWidth: 680, margin: '14px 0 0' }}>
            まず本を探して、読む状態を決めて、ワンクリックで本棚へ。積読を減らす最初の一歩をここから始めます。
          </p>
        </div>
        <div
          className="bm-book-new-steps"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 92px)',
            gap: 10,
          }}
        >
          <StepPill number="1" label="探す" accent={C.accent} />
          <StepPill number="2" label="決める" accent={STATUS_INK.TSUNDOKU} />
          <StepPill number="3" label="追加" accent={STATUS_INK.FINISHED} />
        </div>
      </header>

      <section className="bm-glass-layer" style={{ borderRadius: 22, padding: 18 }}>
        <div
          className="bm-book-new-tabs"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <TabButton
            active={tab === 'search'}
            title="書籍検索"
            hint="タイトル・著者から探す"
            onClick={() => setTab('search')}
          />
          <TabButton
            active={tab === 'isbn'}
            title="ISBN検索"
            hint="バーコードの番号で探す"
            onClick={() => setTab('isbn')}
          />
          <TabButton
            active={tab === 'manual'}
            title="手動入力"
            hint="見つからない本を登録"
            onClick={() => setTab('manual')}
          />
        </div>

        <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 18 }}>
          {tab === 'search' ? (
            <ExternalSearchTab categories={categories} onCreated={(id) => navigate(`/books/${id}`)} />
          ) : tab === 'isbn' ? (
            <IsbnTab categories={categories} onCreated={(id) => navigate(`/books/${id}`)} />
          ) : (
            <ManualTab categories={categories} onCreated={(id) => navigate(`/books/${id}`)} />
          )}
        </div>
      </section>
    </div>
  )
}

function StepPill({ number, label, accent }: { number: string; label: string; accent: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.74)',
        border: `1px solid ${accent}35`,
        borderRadius: 18,
        padding: '14px 12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: accent,
          color: readableTextColor(accent),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.mono,
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {number}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
    </div>
  )
}

function TabButton({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bm-action-tile bm-tactile"
      style={
        {
          '--tile-accent': active ? C.accent : C.line,
          minHeight: 78,
          border: `1px solid ${active ? `${C.accent}55` : C.line}`,
          borderRadius: 16,
          background: active ? 'rgba(79,127,247,0.1)' : 'rgba(255,255,255,0.62)',
          color: active ? C.ink : C.inkSoft,
          textAlign: 'left',
          padding: '14px 16px 14px 20px',
          cursor: 'pointer',
          fontFamily: FONTS.sans,
        } as CSSProperties
      }
    >
      <span style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>{title}</span>
      <span style={{ display: 'block', fontSize: 12, marginTop: 5, color: C.inkMuted }}>
        {hint}
      </span>
    </button>
  )
}

function ExternalSearchTab({
  categories,
  onCreated,
}: {
  categories: Category[]
  onCreated: (id: number) => void
}) {
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
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [memo, setMemo] = useState('')
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
        categoryId: categoryId ? Number(categoryId) : null,
        memo: memo || null,
      })
      onCreated(book.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? '追加に失敗しました')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <form
        onSubmit={handleSearch}
        className="bm-glass-layer bm-book-new-search-form"
        style={{
          borderRadius: 18,
          padding: 18,
          display: 'grid',
          gridTemplateColumns: '170px minmax(220px, 1fr) 142px',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <FieldGroup label="探し方">
          <select value={type} onChange={(e) => setType(e.target.value as ExternalBookSearchType)} style={fieldStyle}>
            {SEARCH_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldGroup>
        <FieldGroup label="検索ワード">
          <input
            type="text"
            placeholder={SEARCH_TYPE_OPTIONS.find((option) => option.value === type)?.hint}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            style={fieldStyle}
          />
        </FieldGroup>
        <PrimaryButton type="submit" disabled={searching}>
          {searching ? '検索中...' : '検索する'}
        </PrimaryButton>
      </form>

      {searchError && <Alert tone="error">{searchError}</Alert>}

      <div
        className="bm-book-new-result-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: candidates.length > 0 || saveError ? 'minmax(0, 1fr) 330px' : '1fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          {candidates.length === 0 && !searching ? (
            <EmptyGuide />
          ) : (
            candidates.map((candidate, index) => {
              const fallbackIsbn = normalizeIsbnForRequest(searchedQuery || query)
              const displayIsbn13 = candidate.isbn13 ?? fallbackIsbn?.isbn13 ?? null
              const displayIsbn10 = candidate.isbn10 ?? fallbackIsbn?.isbn10 ?? null
              const key = `${displayIsbn13 ?? candidate.title}-${index}`
              return (
                <CandidateCard
                  key={key}
                  candidate={candidate}
                  isbn={displayIsbn13 ?? displayIsbn10 ?? null}
                  actionLabel={savingKey === key ? '追加中...' : 'この本を追加'}
                  disabled={savingKey !== ''}
                  onAction={() => handleRegister(candidate, key)}
                />
              )
            })
          )}
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
              <SecondaryButton type="button" onClick={handleLoadMore} disabled={loadingMore || searching}>
                {loadingMore ? '読み込み中...' : '次の結果を表示'}
              </SecondaryButton>
            </div>
          )}
        </div>

        {(candidates.length > 0 || saveError) && (
          <RegisterSettings
            title="追加するときの設定"
            description="候補カードの追加ボタンを押すと、この設定で本棚に入ります。"
            categories={categories}
            status={status}
            onStatusChange={setStatus}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            memo={memo}
            onMemoChange={setMemo}
            error={saveError}
          />
        )}
      </div>
    </div>
  )
}

function IsbnTab({
  categories,
  onCreated,
}: {
  categories: Category[]
  onCreated: (id: number) => void
}) {
  const [isbn, setIsbn] = useState('')
  const [searching, setSearching] = useState(false)
  const [candidate, setCandidate] = useState<IsbnLookupCandidate | null>(null)
  const [searchError, setSearchError] = useState('')
  const [status, setStatus] = useState<BookStatus>('WISHLIST')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [memo, setMemo] = useState('')
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
        categoryId: categoryId ? Number(categoryId) : null,
        memo: memo || null,
      })
      onCreated(book.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? '追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const displayIsbn = normalizeIsbnForRequest(isbn)
  const displayIsbn13 = candidate?.isbn13 ?? displayIsbn?.isbn13 ?? null
  const displayIsbn10 = candidate?.isbn10 ?? displayIsbn?.isbn10 ?? null

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <form
        onSubmit={handleSearch}
        className="bm-glass-layer bm-book-new-isbn-form"
        style={{
          borderRadius: 18,
          padding: 18,
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 1fr) 142px',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <FieldGroup label="ISBN">
          <input
            type="text"
            placeholder="ISBN-13 または ISBN-10"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            required
            style={fieldStyle}
          />
        </FieldGroup>
        <PrimaryButton type="submit" disabled={searching}>
          {searching ? '検索中...' : '検索する'}
        </PrimaryButton>
      </form>

      {searchError && <Alert tone="error">{searchError}</Alert>}

      <div
        className="bm-book-new-result-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: candidate ? 'minmax(0, 1fr) 330px' : '1fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {candidate ? (
          <CandidateCard
            candidate={candidate}
            isbn={displayIsbn13 ?? displayIsbn10 ?? null}
            actionLabel={saving ? '追加中...' : 'この本を追加'}
            disabled={saving}
            onAction={handleImport}
          />
        ) : (
          <EmptyGuide title="ISBNが分かる本は、ここが最短です" body="裏表紙やバーコード下の番号を入力すると、候補をすばやく表示できます。" />
        )}

        {candidate && (
          <RegisterSettings
            title="追加するときの設定"
            description="この本をどの状態で本棚に入れるか決めます。"
            categories={categories}
            status={status}
            onStatusChange={setStatus}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            memo={memo}
            onMemoChange={setMemo}
            error={saveError}
          />
        )}
      </div>
    </div>
  )
}

function ManualTab({
  categories,
  onCreated,
}: {
  categories: Category[]
  onCreated: (id: number) => void
}) {
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedDate, setPublishedDate] = useState('')
  const [isbn13, setIsbn13] = useState('')
  const [status, setStatus] = useState<BookStatus>('WISHLIST')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [memo, setMemo] = useState('')
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
        categoryId: categoryId ? Number(categoryId) : null,
        memo: memo || null,
      })
      onCreated(book.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
      <div
        className="bm-glass-layer bm-book-new-manual-grid"
        style={{
          borderRadius: 18,
          padding: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <FieldGroup label="タイトル" required style={{ gridColumn: '1 / -1' }}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={fieldStyle} />
        </FieldGroup>
        <FieldGroup label="著者">
          <input
            type="text"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="著者A, 著者B"
            style={fieldStyle}
          />
        </FieldGroup>
        <FieldGroup label="出版社">
          <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} style={fieldStyle} />
        </FieldGroup>
        <FieldGroup label="出版日">
          <input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} style={fieldStyle} />
        </FieldGroup>
        <FieldGroup label="ISBN-13">
          <input
            type="text"
            value={isbn13}
            onChange={(e) => setIsbn13(e.target.value)}
            placeholder="9784XXXXXXXXX"
            style={fieldStyle}
          />
        </FieldGroup>
        <StatusSelect value={status} onChange={setStatus} />
        <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        <FieldGroup label="メモ" style={{ gridColumn: '1 / -1' }}>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} style={textAreaStyle} />
        </FieldGroup>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div
        className="bm-glass-layer"
        style={{
          borderRadius: 18,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: C.inkSoft, fontSize: 13 }}>
          タイトルだけでも追加できます。あとから詳細を編集できます。
        </div>
        <PrimaryButton type="submit" disabled={saving} style={{ minWidth: 220 }}>
          {saving ? '追加中...' : '本棚に追加する'}
        </PrimaryButton>
      </div>
    </form>
  )
}

function RegisterSettings({
  title,
  description,
  categories,
  status,
  onStatusChange,
  categoryId,
  onCategoryChange,
  memo,
  onMemoChange,
  error,
}: {
  title: string
  description: string
  categories: Category[]
  status: BookStatus
  onStatusChange: (value: BookStatus) => void
  categoryId: number | ''
  onCategoryChange: (value: number | '') => void
  memo: string
  onMemoChange: (value: string) => void
  error: string
}) {
  return (
    <aside
      className="bm-glass-layer bm-book-new-settings"
      style={{
        borderRadius: 18,
        padding: 18,
        position: 'sticky',
        top: 106,
        display: 'grid',
        gap: 14,
      }}
    >
      <div>
        <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: 0 }}>{title}</h2>
        <p style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.6, margin: '6px 0 0' }}>
          {description}
        </p>
      </div>
      <StatusSelect value={status} onChange={onStatusChange} />
      <CategorySelect categories={categories} value={categoryId} onChange={onCategoryChange} />
      <FieldGroup label="メモ">
        <textarea value={memo} onChange={(e) => onMemoChange(e.target.value)} rows={4} style={textAreaStyle} />
      </FieldGroup>
      {error && <Alert tone="error">{error}</Alert>}
    </aside>
  )
}

function CandidateCard({
  candidate,
  isbn,
  actionLabel,
  disabled,
  onAction,
}: {
  candidate: ExternalBookSearchCandidate | IsbnLookupCandidate
  isbn: string | null
  actionLabel: string
  disabled: boolean
  onAction: () => void
}) {
  const thumbnailUrl = candidate.thumbnailUrl ?? null

  return (
    <article
      className="bm-glass-layer bm-hover-sheen bm-book-new-candidate"
      style={{
        borderRadius: 18,
        padding: 16,
        display: 'grid',
        gridTemplateColumns: '86px minmax(0, 1fr)',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <div
        style={{
          width: 86,
          minHeight: 128,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${shade(C.accent, 16)}, ${STATUS_INK.TSUNDOKU})`,
          boxShadow: '0 18px 34px -24px rgba(79,127,247,0.56)',
          overflow: 'hidden',
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={candidate.title}
            style={{ width: '100%', height: 128, objectFit: 'cover', display: 'block' }}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div
            style={{
              height: 128,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              textAlign: 'center',
              fontFamily: FONTS.serif,
              fontSize: 14,
              lineHeight: 1.35,
            }}
          >
            {candidate.title}
          </div>
        )}
      </div>
      <div style={{ minWidth: 0, display: 'grid', gap: 10 }}>
        <div>
          <h3
            style={{
              fontFamily: FONTS.serif,
              fontSize: 21,
              lineHeight: 1.3,
              margin: 0,
              color: C.ink,
            }}
          >
            {candidate.title}
          </h3>
          {candidate.subtitle && <p style={{ margin: '4px 0 0', color: C.inkSoft, fontSize: 13 }}>{candidate.subtitle}</p>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {candidate.authors.length > 0 && <InfoChip>{candidate.authors.join(', ')}</InfoChip>}
          {candidate.publisher && <InfoChip>{candidate.publisher}</InfoChip>}
          <InfoChip>ISBN: {isbn ?? 'なし'}</InfoChip>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <PrimaryButton type="button" onClick={onAction} disabled={disabled} style={{ minWidth: 156 }}>
            {actionLabel}
          </PrimaryButton>
        </div>
      </div>
    </article>
  )
}

function FieldGroup({
  label,
  required,
  children,
  style,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  style?: CSSProperties
}) {
  return (
    <label style={{ display: 'grid', gap: 7, ...style }}>
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 11,
          color: C.inkMuted,
          letterSpacing: '0.08em',
        }}
      >
        {label.toUpperCase()}
        {required && <span style={{ color: STATUS_INK.DROPPED }}> *</span>}
      </span>
      {children}
    </label>
  )
}

function StatusSelect({ value, onChange }: { value: BookStatus; onChange: (value: BookStatus) => void }) {
  return (
    <FieldGroup label="ステータス" required>
      <select value={value} onChange={(e) => onChange(e.target.value as BookStatus)} style={fieldStyle}>
        {STATUS_OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </FieldGroup>
  )
}

function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: number | ''
  onChange: (value: number | '') => void
}) {
  const selected = categories.find((category) => category.id === value)
  const selectedColor = categoryBackground(selected?.colorHex ?? C.accent)

  return (
    <FieldGroup label="カテゴリー">
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          style={{ ...fieldStyle, paddingLeft: 40 }}
        >
          <option value="">未分類</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: value ? selectedColor : C.inkMuted,
          }}
        />
      </div>
    </FieldGroup>
  )
}

function PrimaryButton({
  children,
  type,
  disabled,
  onClick,
  style,
}: {
  children: React.ReactNode
  type: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="bm-tactile"
      style={{
        minHeight: 48,
        border: 'none',
        borderRadius: 999,
        background: disabled ? C.inkMuted : `linear-gradient(135deg, ${C.accent}, ${STATUS_INK.TSUNDOKU})`,
        color: '#fff',
        padding: '0 20px',
        fontFamily: FONTS.sans,
        fontSize: 14,
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 18px 34px -24px rgba(79,127,247,0.72)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  type,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  type: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="bm-tactile"
      style={{
        minHeight: 46,
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.76)',
        color: C.ink,
        padding: '0 18px',
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function InfoChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 28,
        borderRadius: 999,
        background: 'rgba(79,127,247,0.08)',
        color: C.inkSoft,
        padding: '0 10px',
        fontSize: 12,
      }}
    >
      {children}
    </span>
  )
}

function Alert({ children, tone }: { children: React.ReactNode; tone: 'error' }) {
  const color = tone === 'error' ? STATUS_INK.DROPPED : C.accent
  return (
    <div
      style={{
        border: `1px solid ${color}33`,
        background: `${color}12`,
        color,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  )
}

function EmptyGuide({
  title = '本を検索すると、ここに候補が並びます',
  body = '候補カードごとに追加ボタンを揃えているので、見つけた本を迷わず本棚に入れられます。',
}: {
  title?: string
  body?: string
}) {
  return (
    <div
      className="bm-glass-layer bm-book-new-empty"
      style={{
        borderRadius: 18,
        padding: 28,
        minHeight: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            background: `linear-gradient(135deg, ${C.accent}, ${STATUS_INK.TSUNDOKU})`,
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.serif,
            fontSize: 28,
            marginBottom: 14,
          }}
        >
          +
        </div>
        <h2 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0 }}>{title}</h2>
        <p style={{ color: C.inkSoft, lineHeight: 1.7, maxWidth: 480, margin: '8px auto 0' }}>
          {body}
        </p>
      </div>
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
