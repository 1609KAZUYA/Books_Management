import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchBooks } from '../api/books'
import { getCategories } from '../api/categories'
import type { BookListItem, BookStatus, Category, PaginationMeta } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'
import EditorialBookCover from '../components/EditorialBookCover'
import { Reveal } from '../components/Motion'
import { EDITORIAL, FONTS, STATUS_INK, hashColor } from '../styles/editorial'
import { categoryBackground } from '../utils/color'

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

function isBookStatus(value: string | null): value is BookStatus {
  return STATUS_FILTERS.some((filter) => filter.key === value && filter.key !== 'all')
}

// 本棚一覧画面です。
//
// この画面では大きく3つのことをしています。
// 1. APIから本とカテゴリを取得する
// 2. 検索条件・絞り込み条件をstateで管理する
// 3. 取得した本を本棚風のUIとして表示する
//
// LaravelでいうControllerの処理はバックエンド側にあり、
// このファイルはBladeテンプレート + JavaScriptの画面制御に近い役割です。

interface BookShelfSummary {
  key: string
  label: string
  href: string
  colorHex?: string | null
  totalItems: number
  previewBooks: BookListItem[]
}

export default function BookListPage() {
  // URLの ?categoryId=1 のような検索条件を読み書きするためのHookです。
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status')

  // APIから取得した表示データを保存するstateです。
  const [books, setBooks] = useState<BookListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [shelves, setShelves] = useState<BookShelfSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingShelves, setLoadingShelves] = useState(false)

  // 画面上の検索条件を保存するstateです。
  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BookStatus>(
    isBookStatus(initialStatus) ? initialStatus : 'all',
  )
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get('uncategorized') ? 'uncategorized' : searchParams.get('categoryId') ?? '',
  )
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('updatedAtDesc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    // 画面を開いた直後にカテゴリ一覧を取得します。
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    // カテゴリごとの「本棚プレビュー」を作るため、各カテゴリの本を少しずつ取得します。
    setLoadingShelves(true)
    Promise.all([
      ...categories.map((category) =>
        searchBooks({ categoryId: category.id, size: 3, sort: 'updatedAtDesc' }).then((data) => ({
          key: `category:${category.id}`,
          label: category.name,
          href: `/books?categoryId=${category.id}`,
          colorHex: category.colorHex,
          totalItems: data.meta.totalItems,
          previewBooks: data.items,
        })),
      ),
      searchBooks({ uncategorized: true, size: 3, sort: 'updatedAtDesc' }).then((data) => ({
        key: 'uncategorized',
        label: '未分類',
        href: '/books?uncategorized=1',
        colorHex: '#756654',
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
    // URLの検索条件が変わったら、画面側のカテゴリ選択状態も合わせます。
    const nextCategory = searchParams.get('uncategorized')
      ? 'uncategorized'
      : searchParams.get('categoryId') ?? ''
    setCategoryFilter(nextCategory)
    const nextStatus = searchParams.get('status')
    setStatusFilter(isBookStatus(nextStatus) ? nextStatus : 'all')
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    // 検索キーワード・ステータス・カテゴリ・並び順・ページが変わるたびに本一覧を再取得します。
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
    // 検索フォーム送信時にキーワードを確定し、1ページ目へ戻します。
    e.preventDefault()
    setKeyword(inputKeyword)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    // カテゴリ選択を変更したら、URLのquery parameterにも反映します。
    // これにより、URL共有やブラウザ戻る操作でも状態が分かりやすくなります。
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
    <div className="bm-modern-shell" style={{ color: EDITORIAL.ink }}>
      {/* Page header */}
      <section style={{ padding: '48px 56px 24px' }}>
        <Reveal>
          <div
            className="bm-dashboard-hero bm-glass-layer bm-books-hero"
            style={{
              padding: 28,
              display: 'grid',
              gap: 24,
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: EDITORIAL.accent,
                  letterSpacing: '0.16em',
                  marginBottom: 14,
                }}
              >
                {totalBooks || '—'} BOOKS · FIND YOUR NEXT READ
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 24,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: 58,
                      fontWeight: 500,
                      letterSpacing: '-0.025em',
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {activeCategory
                      ? activeCategory.name
                      : categoryFilter === 'uncategorized'
                        ? '未分類の本'
                        : '次に読む本を見つける'}
                  </h1>
                  <p style={{ color: EDITORIAL.inkSoft, lineHeight: 1.7, maxWidth: 660, margin: '14px 0 0' }}>
                    積読、読みかけ、読了を一目で整理。今日読みたい一冊へすぐ戻れる本棚です。
                  </p>
                </div>
                <Link to="/books/new" style={{ textDecoration: 'none' }}>
                  <PrimaryButton label="+ 読みたい本を追加" />
                </Link>
              </div>
              {(activeCategory || categoryFilter === 'uncategorized') && (
                <div style={{ marginTop: 14 }}>
                  <Link
                    to="/books"
                    className="bm-tactile"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: 38,
                      color: EDITORIAL.inkSoft,
                      textDecoration: 'none',
                      border: `1px solid ${EDITORIAL.line}`,
                      borderRadius: 999,
                      padding: '0 14px',
                      background: 'rgba(255,255,255,0.68)',
                      fontSize: 13,
                    }}
                    onClick={() => {
                      setStatusFilter('all')
                      setKeyword('')
                      setInputKeyword('')
                    }}
                  >
                    ← すべての本棚に戻る
                  </Link>
                </div>
              )}
            </div>
            <LibraryPulse
              total={totalBooks}
              finished={finishedCount}
              reading={readingCount}
              stack={stackCount}
              categories={categories.length}
            />
          </div>
        </Reveal>
      </section>

      {/* Search & filters */}
      <section style={{ padding: '0 56px 36px' }}>
        <Reveal delay={80}>
        <div
          className="bm-glass-layer bm-hover-sheen"
          style={{
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr)',
            gap: 18,
            alignItems: 'stretch',
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderBottom: `1px solid ${EDITORIAL.ink}`,
              minHeight: 52,
              padding: '4px 0 8px',
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
                fontSize: 17,
                color: EDITORIAL.ink,
                fontFamily: FONTS.serif,
                fontStyle: inputKeyword ? 'normal' : 'italic',
              }}
            />
            <button
              type="submit"
              style={{
                fontFamily: FONTS.mono,
                minHeight: 42,
                fontSize: 11,
                color: EDITORIAL.ink,
                letterSpacing: '0.1em',
                padding: '0 16px',
                border: `1px solid ${EDITORIAL.ink}`,
                background: EDITORIAL.paperSoft,
                cursor: 'pointer',
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              SEARCH
            </button>
          </form>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
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
                  const next = new URLSearchParams(searchParams)
                  if (f.key === 'all') {
                    next.delete('status')
                  } else {
                    next.set('status', f.key)
                  }
                  setSearchParams(next, { replace: true })
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
        </Reveal>
      </section>

      {/* Body */}
      <section style={{ padding: '0 56px 80px' }}>
        <Reveal delay={120}>
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
        </Reveal>
      </section>
    </div>
  )
}

function LibraryPulse({
  total,
  finished,
  reading,
  stack,
  categories,
}: {
  total: number
  finished: number
  reading: number
  stack: number
  categories: number
}) {
  const completion = total > 0 ? Math.min(100, Math.round((finished / total) * 100)) : 0
  const focusLabel =
    reading > 0
      ? '読みかけに戻って、今日の10ページを進める'
      : stack > 0
        ? '積読から、今の気分に合う1冊を選ぶ'
        : '読みたい本を登録して、最初の棚を育てる'

  return (
    <div
      className="bm-dashboard-hero bm-glass-layer"
      style={{
        marginTop: 26,
        padding: 22,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
        gap: 14,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 22,
          borderRadius: 14,
          background: EDITORIAL.ink,
          color: EDITORIAL.paper,
          minHeight: 162,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: '0.16em',
              color: 'rgba(246,244,239,0.64)',
              marginBottom: 10,
            }}
          >
            READING MOMENTUM
          </div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 36, lineHeight: 1.1 }}>
            積読を、読みたい気持ちに変える
          </div>
          <div
            style={{
              color: 'rgba(246,244,239,0.72)',
              fontSize: 14,
              marginTop: 8,
              lineHeight: 1.55,
            }}
          >
            {focusLabel}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <QuickAction to="/books/new" label="読みたい本を追加" en="Add spark" accent={STATUS_INK.TSUNDOKU} />
          <QuickAction to="/books?status=TSUNDOKU" label="積読を見る" en="Pick one" accent={STATUS_INK.FINISHED} />
        </div>
      </div>
      <PulseMetric label="読みたい候補" en="Books" value={total} accent={EDITORIAL.accent} />
      <PulseMetric label="読了の達成感" en="Finished" value={`${completion}%`} accent={STATUS_INK.FINISHED} />
      <PulseMetric label="気分で選べる棚" en="Shelves" value={categories} accent={STATUS_INK.WISHLIST} />
    </div>
  )
}

function PulseMetric({
  label,
  en,
  value,
  accent,
}: {
  label: string
  en: string
  value: number | string
  accent: string
}) {
  return (
    <div
      className="bm-metric-card bm-action-tile"
      style={{
        '--tile-accent': accent,
        position: 'relative',
        zIndex: 1,
        padding: '20px 20px 18px 24px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.78)',
        border: `1px solid ${EDITORIAL.lineSoft}`,
        minHeight: 162,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      } as CSSProperties}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10,
          color: EDITORIAL.inkMuted,
          letterSpacing: '0.14em',
        }}
      >
        {en.toUpperCase()}
      </div>
      <div>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 46,
            color: accent,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: EDITORIAL.inkSoft }}>{label}</div>
      </div>
    </div>
  )
}

function QuickAction({
  to,
  label,
  en,
  accent,
}: {
  to: string
  label: string
  en: string
  accent: string
}) {
  return (
    <Link
      to={to}
      className="bm-tactile"
      style={{
        minHeight: 42,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        borderRadius: 999,
        background: 'rgba(246,244,239,0.12)',
        border: '1px solid rgba(246,244,239,0.2)',
        color: EDITORIAL.paper,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 16px ${accent}cc`,
        }}
      />
      {label}
      <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', opacity: 0.68 }}>
        · {en}
      </span>
    </Link>
  )
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
        fontWeight: 800,
        borderRadius: 999,
        border: 'none',
        fontFamily: FONTS.sans,
        cursor: 'pointer',
        transition: 'all 0.25s',
        letterSpacing: 0,
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
        minHeight: 42,
        padding: '0 16px',
        borderRadius: 999,
        background: active ? EDITORIAL.ink : 'transparent',
        color: active ? EDITORIAL.paper : EDITORIAL.inkSoft,
        border: `1px solid ${active ? EDITORIAL.ink : EDITORIAL.line}`,
        fontSize: 13,
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
    minHeight: 42,
    padding: '0 34px 0 16px',
    borderRadius: 999,
    background: 'transparent',
    color: EDITORIAL.inkSoft,
    border: `1px solid ${EDITORIAL.line}`,
    fontSize: 13,
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
        const accent = categoryBackground(shelf.colorHex ?? hashColor(shelf.label))
        const category = categories.find((c) => `category:${c.id}` === shelf.key)
        return (
          <Reveal key={shelf.key} delay={Math.min(si * 70, 280)}>
            <ShelfSection
              index={si}
              shelf={shelf}
              accent={accent}
              categoryEn={category ? '' : 'Uncategorized'}
            />
          </Reveal>
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
          className="bm-hover-sheen"
          to={shelf.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            padding: '0 16px',
            fontFamily: FONTS.sans,
            fontSize: 13,
            fontWeight: 700,
            color: EDITORIAL.paper,
            background: accent,
            textDecoration: 'none',
            border: `1px solid ${accent}`,
            borderRadius: 2,
          }}
        >
          View all →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      {books.map((book) => {
        const cat = book.category ?? categories.find((c) => c.id === book.category?.id)
        const shelfColor = categoryBackground(cat?.colorHex ?? hashColor(book.bookMaster.title))
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
      className="bm-hover-sheen bm-tactile"
      to={`/books/${book.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: EDITORIAL.panel,
        border: `1px solid ${hover ? shelfColor : EDITORIAL.line}`,
        padding: 14,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 16px 34px -16px rgba(42,32,26,0.32)' : '0 4px 16px -16px rgba(42,32,26,0.3)',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '72px minmax(0, 1fr)',
        gap: 14,
        alignItems: 'start',
        textDecoration: 'none',
        color: EDITORIAL.ink,
        minHeight: 144,
      }}
    >
      <div style={{ width: 72 }}>
        <EditorialBookCover
          book={book.bookMaster}
          baseColor={shelfColor}
          width={72}
          height={108}
          aspectRatio="auto"
          showTitle={false}
        />
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 108 }}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.35,
            marginBottom: 5,
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
              fontSize: 12,
              color: EDITORIAL.inkSoft,
              fontStyle: 'italic',
              fontFamily: FONTS.serif,
              marginBottom: 12,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.bookMaster.authors.join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
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
                width: 6,
                height: 6,
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
      </div>
    </Link>
  )
}

function AddBookCard({ accent }: { accent: string }) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      className="bm-hover-sheen bm-tactile"
      to="/books/new"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: `1px dashed ${hover ? accent : EDITORIAL.line}`,
        minHeight: 144,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
        color: hover ? accent : EDITORIAL.inkSoft,
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
        minHeight: 44,
        padding: '0 18px',
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
