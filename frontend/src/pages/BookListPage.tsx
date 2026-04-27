import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchBooks } from '../api/books'
import { getCategories } from '../api/categories'
import type { BookListItem, BookStatus, Category, PaginationMeta } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'
import EditorialBookCover from '../components/EditorialBookCover'
import { EDITORIAL, FONTS, STATUS_INK, hashColor } from '../styles/editorial'

const SORT_OPTIONS = [
  { value: 'updatedAtDesc', label: '更新日順', en: 'Recent' },
  { value: 'createdAtDesc', label: '登録日順', en: 'Created' },
  { value: 'titleAsc', label: 'タイトル順', en: 'Title' },
  { value: 'ratingDesc', label: '評価順', en: 'Rating' },
  { value: 'publishedDateDesc', label: '出版日順', en: 'Published' },
] as const

const STATUS_FILTERS: {
  key: 'all' | BookStatus
  jp: string
  en: string
}[] = [
  { key: 'all', jp: 'すべて', en: 'All' },
  { key: 'FINISHED', jp: '読了', en: 'Read' },
  { key: 'READING', jp: '読書中', en: 'Reading' },
  { key: 'TSUNDOKU', jp: '積読', en: 'Stack' },
  { key: 'WISHLIST', jp: '欲しい', en: 'Wish' },
  { key: 'PURCHASED', jp: '購入済み', en: 'Bought' },
  { key: 'ON_HOLD', jp: '保留', en: 'Hold' },
  { key: 'DROPPED', jp: '中断', en: 'Dropped' },
]

interface BookShelfSummary {
  key: string
  label: string
  href: string
  colorHex?: string | null
  totalItems: number
  previewBooks: BookListItem[]
}

export default function BookListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [books, setBooks] = useState<BookListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [shelves, setShelves] = useState<BookShelfSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingShelves, setLoadingShelves] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BookStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get('uncategorized') ? 'uncategorized' : searchParams.get('categoryId') ?? '',
  )
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('updatedAtDesc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoadingShelves(true)
    Promise.all([
      ...categories.map((category) =>
        searchBooks({ categoryId: category.id, size: 5, sort: 'updatedAtDesc' }).then((data) => ({
          key: `category:${category.id}`,
          label: category.name,
          href: `/books?categoryId=${category.id}`,
          colorHex: category.colorHex,
          totalItems: data.meta.totalItems,
          previewBooks: data.items,
        })),
      ),
      searchBooks({ uncategorized: true, size: 5, sort: 'updatedAtDesc' }).then((data) => ({
        key: 'uncategorized',
        label: '未分類',
        href: '/books?uncategorized=1',
        colorHex: '#8a7a6c',
        totalItems: data.meta.totalItems,
        previewBooks: data.items,
      })),
    ])
      .then((items) =>
        setShelves(items.filter((item) => item.totalItems > 0 || item.key !== 'uncategorized')),
      )
      .catch(() => setShelves([]))
      .finally(() => setLoadingShelves(false))
  }, [categories])

  useEffect(() => {
    const nextCategory = searchParams.get('uncategorized')
      ? 'uncategorized'
      : searchParams.get('categoryId') ?? ''
    setCategoryFilter(nextCategory)
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    searchBooks({
      keyword: keyword || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      categoryId:
        categoryFilter && categoryFilter !== 'uncategorized' ? Number(categoryFilter) : undefined,
      uncategorized: categoryFilter === 'uncategorized' ? true : undefined,
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
  }, [keyword, statusFilter, categoryFilter, sort, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(inputKeyword)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
    const next = new URLSearchParams(searchParams)
    next.delete('categoryId')
    next.delete('uncategorized')
    if (value === 'uncategorized') {
      next.set('uncategorized', '1')
    } else if (value) {
      next.set('categoryId', value)
    }
    setSearchParams(next, { replace: true })
  }

  const activeCategory =
    categoryFilter && categoryFilter !== 'uncategorized'
      ? categories.find((category) => category.id === Number(categoryFilter))
      : null
  const isFiltered =
    Boolean(keyword) || statusFilter !== 'all' || Boolean(categoryFilter) || page !== 1
  const showShelfOverview = !isFiltered

  // Stats from shelves data (cheap approximation; not a separate API call)
  const totalBooks = shelves.reduce((sum, s) => sum + s.totalItems, 0)
  const finishedCount = shelves
    .flatMap((s) => s.previewBooks)
    .filter((b) => b.status === 'FINISHED').length
  const readingCount = shelves
    .flatMap((s) => s.previewBooks)
    .filter((b) => b.status === 'READING').length
  const stackCount = shelves
    .flatMap((s) => s.previewBooks)
    .filter((b) => b.status === 'TSUNDOKU').length

  return (
    <div style={{ background: EDITORIAL.paper, color: EDITORIAL.ink }}>
      {/* Page header */}
      <section style={{ padding: '56px 56px 36px' }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: EDITORIAL.accent,
            letterSpacing: '0.2em',
            marginBottom: 20,
          }}
        >
          ── ISSUE {totalBooks || '—'} · YOUR LIBRARY ──
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 8,
            gap: 24,
          }}
        >
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: 88,
              fontWeight: 300,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              margin: 0,
            }}
          >
            {activeCategory
              ? activeCategory.name
              : categoryFilter === 'uncategorized'
                ? '未分類'
                : '本棚'}{' '}
            <span style={{ fontStyle: 'italic', color: EDITORIAL.accent, fontSize: 64 }}>
              {activeCategory
                ? 'On this shelf'
                : categoryFilter === 'uncategorized'
                  ? 'Uncategorized'
                  : 'The Shelf'}
            </span>
          </h1>
          <Link to="/books/new" style={{ textDecoration: 'none' }}>
            <PrimaryButton label="+ 本を追加  Add a book" />
          </Link>
        </div>
        {(activeCategory || categoryFilter === 'uncategorized') && (
          <div style={{ marginTop: 12 }}>
            <Link
              to="/books"
              style={{
                fontFamily: FONTS.serif,
                fontStyle: 'italic',
                fontSize: 14,
                color: EDITORIAL.inkSoft,
                textDecoration: 'none',
                borderBottom: `1px solid ${EDITORIAL.line}`,
              }}
              onClick={() => {
                setStatusFilter('all')
                setKeyword('')
                setInputKeyword('')
              }}
            >
              ← すべての本棚に戻る  Back to all shelves
            </Link>
          </div>
        )}
        <StatStrip
          total={totalBooks}
          finished={finishedCount}
          reading={readingCount}
          stack={stackCount}
        />
      </section>

      {/* Search & filters */}
      <section style={{ padding: '0 56px 36px' }}>
        <div
          style={{
            background: EDITORIAL.panel,
            border: `1px solid ${EDITORIAL.line}`,
            padding: 20,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderBottom: `1px solid ${EDITORIAL.ink}`,
              paddingBottom: 8,
            }}
          >
            <span style={{ fontSize: 18, color: EDITORIAL.inkSoft }}>⌕</span>
            <input
              type="text"
              value={inputKeyword}
              onChange={(e) => setInputKeyword(e.target.value)}
              placeholder="タイトル・著者・ISBNで検索  Title, author or ISBN"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 16,
                color: EDITORIAL.ink,
                fontFamily: FONTS.serif,
                fontStyle: inputKeyword ? 'normal' : 'italic',
              }}
            />
            <button
              type="submit"
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: EDITORIAL.inkMuted,
                letterSpacing: '0.1em',
                padding: '3px 10px',
                border: `1px solid ${EDITORIAL.line}`,
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              SEARCH
            </button>
          </form>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {STATUS_FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                jp={f.jp}
                en={f.en}
                active={statusFilter === f.key}
                dotColor={f.key === 'all' ? undefined : STATUS_INK[f.key]}
                onClick={() => {
                  setStatusFilter(f.key)
                  setPage(1)
                }}
              />
            ))}
            <span style={{ width: 1, background: EDITORIAL.line, margin: '0 4px' }} />
            <SelectChip
              value={categoryFilter}
              onChange={handleCategoryChange}
              options={[
                { value: '', label: 'すべて', en: 'All cat.' },
                { value: 'uncategorized', label: '未分類', en: 'None' },
                ...categories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                  en: '',
                })),
              ]}
            />
            <SelectChip
              value={sort}
              onChange={(v) => {
                setSort(v as (typeof SORT_OPTIONS)[number]['value'])
                setPage(1)
              }}
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label, en: o.en }))}
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ padding: '0 56px 80px' }}>
        {showShelfOverview ? (
          <ShelvesOverview
            shelves={shelves}
            categories={categories}
            loading={loadingShelves}
          />
        ) : loading ? (
          <Loader />
        ) : books.length === 0 ? (
          <EmptyState message="本が見つかりませんでした" en="No books found." />
        ) : (
          <FlatBookGrid books={books} categories={categories} />
        )}

        {!showShelfOverview && meta && meta.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        )}
      </section>
    </div>
  )
}

function StatStrip({
  total,
  finished,
  reading,
  stack,
}: {
  total: number
  finished: number
  reading: number
  stack: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        marginTop: 18,
        paddingTop: 18,
        borderTop: `1px solid ${EDITORIAL.line}`,
        flexWrap: 'wrap',
      }}
    >
      <Stat label="冊登録中" value={total} valueColor={EDITORIAL.ink} />
      <Divider />
      <Stat label="読了" value={finished} valueColor={STATUS_INK.FINISHED} italic />
      <Divider />
      <Stat label="読書中" value={reading} valueColor={STATUS_INK.READING} italic />
      <Divider />
      <Stat label="積読" value={stack} valueColor={STATUS_INK.TSUNDOKU} italic />
    </div>
  )
}

function Stat({
  label,
  value,
  valueColor,
  italic,
}: {
  label: string
  value: number
  valueColor: string
  italic?: boolean
}) {
  return (
    <span style={{ fontSize: 14, color: EDITORIAL.inkSoft }}>
      {label}{' '}
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: 22,
          color: valueColor,
          fontWeight: 500,
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {value}
      </span>
    </span>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 18, background: EDITORIAL.line }} />
}

function PrimaryButton({ label }: { label: string }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? EDITORIAL.ink : EDITORIAL.accent,
        color: EDITORIAL.paper,
        padding: '14px 26px',
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 2,
        border: 'none',
        fontFamily: FONTS.sans,
        cursor: 'pointer',
        transition: 'all 0.25s',
        letterSpacing: '0.04em',
        boxShadow: hover ? '0 6px 18px rgba(42,32,26,0.25)' : 'none',
        transform: hover ? 'translateY(-1px)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function FilterChip({
  jp,
  en,
  active,
  onClick,
  dotColor,
}: {
  jp: string
  en: string
  active: boolean
  onClick: () => void
  dotColor?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        background: active ? EDITORIAL.ink : 'transparent',
        color: active ? EDITORIAL.paper : EDITORIAL.inkSoft,
        border: `1px solid ${active ? EDITORIAL.ink : EDITORIAL.line}`,
        fontSize: 12,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.18s',
        fontFamily: FONTS.sans,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {dotColor && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
      )}
      {jp}
      {en && (
        <span
          style={{
            fontFamily: FONTS.serif,
            fontStyle: 'italic',
            opacity: 0.7,
            marginLeft: 2,
          }}
        >
          · {en}
        </span>
      )}
    </button>
  )
}

interface SelectChipOption {
  value: string
  label: string
  en?: string
}

function SelectChip({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectChipOption[]
}) {
  const wrapper: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 28px 7px 14px',
    borderRadius: 999,
    background: 'transparent',
    color: EDITORIAL.inkSoft,
    border: `1px solid ${EDITORIAL.line}`,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: FONTS.sans,
  }
  const selected = options.find((o) => o.value === value)
  return (
    <label style={wrapper}>
      <span>
        {selected?.label ?? options[0].label}
        {selected?.en && (
          <span
            style={{
              fontFamily: FONTS.serif,
              fontStyle: 'italic',
              opacity: 0.7,
              marginLeft: 4,
            }}
          >
            · {selected.en}
          </span>
        )}
      </span>
      <span
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 10,
          pointerEvents: 'none',
        }}
      >
        ▾
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          appearance: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ShelvesOverview({
  shelves,
  categories,
  loading,
}: {
  shelves: BookShelfSummary[]
  categories: Category[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div style={{ padding: 56, textAlign: 'center', color: EDITORIAL.inkMuted }}>
        <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic' }}>本棚を整えています…</span>
      </div>
    )
  }
  if (shelves.length === 0) {
    return (
      <EmptyState
        message="まだ本棚に本がありません"
        en="Your shelves are empty — add your first book."
      />
    )
  }

  return (
    <div>
      {shelves.map((shelf, si) => {
        const accent = shelf.colorHex ?? hashColor(shelf.label)
        const category = categories.find((c) => `category:${c.id}` === shelf.key)
        return (
          <ShelfSection
            key={shelf.key}
            index={si}
            shelf={shelf}
            accent={accent}
            categoryEn={category ? '' : 'Uncategorized'}
          />
        )
      })}
    </div>
  )
}

function ShelfSection({
  index,
  shelf,
  accent,
  categoryEn,
}: {
  index: number
  shelf: BookShelfSummary
  accent: string
  categoryEn: string
}) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingBottom: 14,
          marginBottom: 20,
          borderBottom: `2px solid ${accent}`,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 13,
              color: accent,
              letterSpacing: '0.18em',
            }}
          >
            No.{String(index + 1).padStart(2, '0')}
          </span>
          <h2
            style={{
              fontFamily: FONTS.serif,
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            {shelf.label}
          </h2>
          {categoryEn && (
            <span
              style={{
                fontFamily: FONTS.serif,
                fontSize: 18,
                fontStyle: 'italic',
                color: EDITORIAL.inkSoft,
              }}
            >
              {categoryEn}
            </span>
          )}
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: EDITORIAL.inkMuted,
              letterSpacing: '0.12em',
            }}
          >
            · {shelf.totalItems} BOOKS
          </span>
        </div>
        <Link
          to={shelf.href}
          style={{
            fontFamily: FONTS.serif,
            fontStyle: 'italic',
            fontSize: 14,
            color: accent,
            textDecoration: 'none',
            borderBottom: `1px solid ${accent}40`,
          }}
        >
          すべて見る  See all  →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 }}>
        {shelf.previewBooks.map((book) => (
          <BookCard key={book.id} book={book} shelfColor={accent} />
        ))}
        <AddBookCard accent={accent} />
      </div>
    </div>
  )
}

function FlatBookGrid({
  books,
  categories,
}: {
  books: BookListItem[]
  categories: Category[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 }}>
      {books.map((book) => {
        const cat = book.category ?? categories.find((c) => c.id === book.category?.id)
        const shelfColor = cat?.colorHex ?? hashColor(book.bookMaster.title)
        return <BookCard key={book.id} book={book} shelfColor={shelfColor} />
      })}
    </div>
  )
}

function BookCard({ book, shelfColor }: { book: BookListItem; shelfColor: string }) {
  const [hover, setHover] = useState(false)
  const statusColor = STATUS_INK[book.status] ?? EDITORIAL.inkSoft
  return (
    <Link
      to={`/books/${book.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: EDITORIAL.panel,
        border: `1px solid ${EDITORIAL.line}`,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 14px 30px -10px rgba(42,32,26,0.25)' : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: EDITORIAL.ink,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <EditorialBookCover book={book.bookMaster} baseColor={shelfColor} />
      </div>
      <div
        style={{
          fontFamily: FONTS.serif,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.3,
          marginBottom: 4,
          color: EDITORIAL.ink,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {book.bookMaster.title}
      </div>
      {book.bookMaster.authors.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: EDITORIAL.inkSoft,
            fontStyle: 'italic',
            fontFamily: FONTS.serif,
            marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {book.bookMaster.authors.join(', ')}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            color: statusColor,
            fontFamily: FONTS.mono,
            letterSpacing: '0.08em',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: statusColor,
            }}
          />
          {BOOK_STATUS_LABELS[book.status].toUpperCase()}
        </span>
        {book.favoriteFlag && (
          <span style={{ color: EDITORIAL.accent, fontSize: 12 }}>♥</span>
        )}
        {typeof book.rating === 'number' && book.rating > 0 && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: EDITORIAL.inkMuted,
              marginLeft: 'auto',
              letterSpacing: '0.06em',
            }}
          >
            ★ {book.rating.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  )
}

function AddBookCard({ accent }: { accent: string }) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      to="/books/new"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: `1px dashed ${EDITORIAL.line}`,
        minHeight: 280,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
        color: hover ? accent : EDITORIAL.inkMuted,
        transition: 'all 0.2s',
        transform: hover ? 'translateY(-2px)' : 'none',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: 28, fontFamily: FONTS.serif, fontWeight: 300 }}>+</span>
      <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 14 }}>本を追加</span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.12em' }}>
        ADD A BOOK
      </span>
    </Link>
  )
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 32,
        paddingTop: 24,
        borderTop: `1px solid ${EDITORIAL.line}`,
      }}
    >
      <PageBtn disabled={page <= 1} onClick={onPrev}>
        ← 前へ
      </PageBtn>
      <span
        style={{
          fontFamily: FONTS.serif,
          fontStyle: 'italic',
          fontSize: 14,
          color: EDITORIAL.inkSoft,
        }}
      >
        Page <span style={{ fontWeight: 500, color: EDITORIAL.ink }}>{page}</span> of {totalPages}
      </span>
      <PageBtn disabled={page >= totalPages} onClick={onNext}>
        次へ →
      </PageBtn>
    </div>
  )
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 16px',
        background: 'transparent',
        border: `1px solid ${EDITORIAL.line}`,
        color: disabled ? EDITORIAL.inkMuted : EDITORIAL.ink,
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        borderRadius: 2,
        fontFamily: FONTS.sans,
      }}
    >
      {children}
    </button>
  )
}

function Loader() {
  return (
    <div style={{ padding: 56, textAlign: 'center' }}>
      <span
        style={{
          fontFamily: FONTS.serif,
          fontStyle: 'italic',
          color: EDITORIAL.inkSoft,
        }}
      >
        読み込み中…
      </span>
    </div>
  )
}

function EmptyState({ message, en }: { message: string; en: string }) {
  return (
    <div
      style={{
        padding: 80,
        textAlign: 'center',
        border: `1px dashed ${EDITORIAL.line}`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.serif,
          fontSize: 22,
          fontWeight: 500,
          color: EDITORIAL.ink,
          marginBottom: 8,
        }}
      >
        {message}
      </div>
      <div
        style={{
          fontFamily: FONTS.serif,
          fontStyle: 'italic',
          fontSize: 14,
          color: EDITORIAL.inkSoft,
        }}
      >
        {en}
      </div>
    </div>
  )
}
