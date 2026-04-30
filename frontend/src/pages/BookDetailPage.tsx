import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteBook, getBook, updateBook, updateStatus } from '../api/books'
import { getCategories } from '../api/categories'
import BookCoverImage from '../components/BookCoverImage'
import StarRating from '../components/StarRating'
import { EDITORIAL, FONTS, STATUS_INK } from '../styles/editorial'
import type { BookStatus, Category, UpdateBookRequest, UserBookDetail } from '../types/api'
import { BOOK_STATUS_LABELS } from '../types/api'
import { categoryBackground, readableTextColor } from '../utils/color'

const C = EDITORIAL
const STATUS_FLOW: BookStatus[] = ['WISHLIST', 'TSUNDOKU', 'READING', 'FINISHED']

const pageStyle: CSSProperties = {
  padding: '48px 56px 88px',
  color: C.ink,
}

const fieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  background: 'rgba(255,255,255,0.86)',
  color: C.ink,
  padding: '0 14px',
  fontFamily: FONTS.sans,
  fontSize: 14,
  outline: 'none',
}

const textAreaStyle: CSSProperties = {
  ...fieldStyle,
  minHeight: 118,
  padding: 14,
  resize: 'vertical',
  lineHeight: 1.6,
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<UserBookDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState<BookStatus | null>(null)
  const [error, setError] = useState('')

  const [editStatus, setEditStatus] = useState<BookStatus>('WISHLIST')
  const [editRating, setEditRating] = useState<number | null>(null)
  const [editFavorite, setEditFavorite] = useState(false)
  const [editMemo, setEditMemo] = useState('')
  const [editLocationNote, setEditLocationNote] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number | ''>('')
  const [editPurchaseDate, setEditPurchaseDate] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editFinishDate, setEditFinishDate] = useState('')

  useEffect(() => {
    Promise.all([getBook(Number(id)), getCategories()])
      .then(([bookData, categoryData]) => {
        setBook(bookData)
        setCategories(categoryData)
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
    setEditPurchaseDate(b.purchaseDate ?? '')
    setEditStartDate(b.startDate ?? '')
    setEditFinishDate(b.finishDate ?? '')
  }

  const cancelEdit = () => {
    if (!book) return
    resetForm(book)
    setEditing(false)
    setError('')
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
        purchaseDate: editPurchaseDate || null,
        startDate: editStartDate || null,
        finishDate: editFinishDate || null,
      }
      const updated = await updateBook(book.id, req)
      setBook(updated)
      resetForm(updated)
      setEditing(false)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatusChange = async (newStatus: BookStatus) => {
    if (!book || book.status === newStatus || statusSaving) return
    setStatusSaving(newStatus)
    setError('')
    try {
      const updated = await updateStatus(book.id, { status: newStatus })
      setBook(updated)
      resetForm(updated)
    } catch {
      setError('ステータスの更新に失敗しました')
    } finally {
      setStatusSaving(null)
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

  if (loading) {
    return (
      <div className="bm-modern-shell" style={{ ...pageStyle, minHeight: 420, display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `3px solid ${C.line}`,
            borderTopColor: C.accent,
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="bm-modern-shell" style={pageStyle}>
        <Alert>{error || '本が見つかりません'}</Alert>
      </div>
    )
  }

  const bm = book.bookMaster
  const categoryColor = categoryBackground(book.category?.colorHex ?? C.accent)

  return (
    <div className="bm-modern-shell bm-book-detail-page" style={pageStyle}>
      <header
        className="bm-dashboard-hero bm-glass-layer bm-book-detail-hero"
        style={{
          padding: 28,
          marginBottom: 22,
          display: 'grid',
          gridTemplateColumns: '116px minmax(0, 1fr) 260px',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <BookCoverImage
            book={bm}
            className="bm-detail-cover-img"
            placeholderClassName="bm-detail-cover-placeholder"
            placeholderTextClassName="bm-detail-cover-placeholder-text"
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/books')}
            className="bm-tactile"
            style={{
              minHeight: 40,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.72)',
              color: C.inkSoft,
              padding: '0 14px',
              cursor: 'pointer',
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            ← 本棚に戻る
          </button>
          <div
            style={{
              fontFamily: FONTS.mono,
              color: C.accent,
              fontSize: 11,
              letterSpacing: '0.16em',
              marginBottom: 10,
            }}
          >
            BOOK DETAIL · NEXT ACTION
          </div>
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: 44,
              lineHeight: 1.12,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {bm.title}
          </h1>
          {bm.subtitle && <p style={{ color: C.inkSoft, margin: '8px 0 0', fontSize: 15 }}>{bm.subtitle}</p>}
          {bm.authors.length > 0 && (
            <p style={{ color: C.inkSoft, margin: '12px 0 0', fontFamily: FONTS.serif, fontStyle: 'italic' }}>
              {bm.authors.join(', ')}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <MetaChip color={STATUS_INK[book.status]}>{BOOK_STATUS_LABELS[book.status]}</MetaChip>
            {book.category ? (
              <MetaChip color={categoryColor}>{book.category.name}</MetaChip>
            ) : (
              <MetaChip color={C.inkMuted}>未分類</MetaChip>
            )}
            {book.favoriteFlag && <MetaChip color={STATUS_INK.TSUNDOKU}>お気に入り</MetaChip>}
          </div>
        </div>

        <ActionPanel
          editing={editing}
          saving={saving}
          onEdit={() => setEditing(true)}
          onCancel={cancelEdit}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </header>

      {error && <Alert>{error}</Alert>}

      <main
        className="bm-book-detail-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <section style={{ display: 'grid', gap: 18 }}>
          <StatusQuickActions
            current={book.status}
            saving={statusSaving}
            disabled={editing}
            onChange={handleQuickStatusChange}
          />

          <InfoPanel title="読書メモ">
            {editing ? (
              <textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={5} style={textAreaStyle} />
            ) : (
              <ReadableText empty="まだメモはありません。読んだきっかけや気になった言葉を残せます。">
                {book.memo}
              </ReadableText>
            )}
          </InfoPanel>

          <InfoPanel title="本の情報">
            <div
              className="bm-book-detail-info-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              <InfoItem label="出版社" value={bm.publisher} />
              <InfoItem label="出版日" value={bm.publishedDate} />
              <InfoItem label="ISBN" value={bm.isbn13 ?? bm.isbn10} />
              <InfoItem label="保管場所">
                {editing ? (
                  <input
                    type="text"
                    value={editLocationNote}
                    onChange={(e) => setEditLocationNote(e.target.value)}
                    style={fieldStyle}
                  />
                ) : (
                  book.locationNote || '—'
                )}
              </InfoItem>
            </div>
          </InfoPanel>
        </section>

        <aside className="bm-glass-layer bm-book-detail-side" style={{ borderRadius: 22, padding: 18, position: 'sticky', top: 106 }}>
          <h2 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0 }}>この本の状態</h2>
          <p style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.6, margin: '6px 0 16px' }}>
            ここだけ見れば、次に何をすればいいか分かります。
          </p>

          <div style={{ display: 'grid', gap: 14 }}>
            <FieldGroup label="ステータス">
              {editing ? (
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as BookStatus)} style={fieldStyle}>
                  {(Object.keys(BOOK_STATUS_LABELS) as BookStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {BOOK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusDisplay status={book.status} />
              )}
            </FieldGroup>

            <FieldGroup label="評価">
              {editing ? <StarRating rating={editRating} onChange={setEditRating} /> : <StarRating rating={book.rating} readonly />}
            </FieldGroup>

            <FieldGroup label="お気に入り">
              {editing ? (
                <button
                  type="button"
                  onClick={() => setEditFavorite((value) => !value)}
                  className="bm-tactile"
                  style={{
                    minHeight: 48,
                    border: `1px solid ${editFavorite ? STATUS_INK.TSUNDOKU : C.line}`,
                    borderRadius: 14,
                    background: editFavorite ? `${STATUS_INK.TSUNDOKU}18` : 'rgba(255,255,255,0.76)',
                    color: editFavorite ? STATUS_INK.TSUNDOKU : C.inkSoft,
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  {editFavorite ? 'お気に入り中' : 'お気に入りにする'}
                </button>
              ) : (
                <div style={{ color: book.favoriteFlag ? STATUS_INK.TSUNDOKU : C.inkMuted }}>
                  {book.favoriteFlag ? 'お気に入り' : '未設定'}
                </div>
              )}
            </FieldGroup>

            <FieldGroup label="カテゴリー">
              {editing ? (
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : '')}
                  style={fieldStyle}
                >
                  <option value="">未分類</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              ) : book.category ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 34,
                    borderRadius: 999,
                    background: categoryColor,
                    color: readableTextColor(categoryColor),
                    padding: '0 12px',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {book.category.name}
                </span>
              ) : (
                <span style={{ color: C.inkMuted }}>未分類</span>
              )}
            </FieldGroup>

            <DateGrid
              editing={editing}
              purchaseDate={book.purchaseDate}
              startDate={book.startDate}
              finishDate={book.finishDate}
              editPurchaseDate={editPurchaseDate}
              editStartDate={editStartDate}
              editFinishDate={editFinishDate}
              setEditPurchaseDate={setEditPurchaseDate}
              setEditStartDate={setEditStartDate}
              setEditFinishDate={setEditFinishDate}
            />
          </div>
        </aside>
      </main>
    </div>
  )
}

function ActionPanel({
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  editing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gap: 10,
        alignSelf: 'center',
      }}
    >
      {editing ? (
        <>
          <PrimaryButton onClick={onSave} disabled={saving}>
            {saving ? '保存中...' : '変更を保存'}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel}>キャンセル</SecondaryButton>
        </>
      ) : (
        <>
          <PrimaryButton onClick={onEdit}>編集する</PrimaryButton>
          <DangerButton onClick={onDelete}>本棚から削除</DangerButton>
        </>
      )}
    </div>
  )
}

function StatusQuickActions({
  current,
  saving,
  disabled,
  onChange,
}: {
  current: BookStatus
  saving: BookStatus | null
  disabled: boolean
  onChange: (status: BookStatus) => void
}) {
  return (
    <section className="bm-glass-layer" style={{ borderRadius: 22, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 14, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, margin: 0 }}>次のアクション</h2>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.inkMuted, letterSpacing: '0.12em' }}>
          ONE TAP STATUS
        </span>
      </div>
      <div
        className="bm-book-status-actions"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {STATUS_FLOW.map((status) => {
          const active = status === current
          const color = STATUS_INK[status]
          return (
            <button
              key={status}
              type="button"
              onClick={() => onChange(status)}
              disabled={disabled || active || saving !== null}
              className="bm-action-tile bm-tactile"
              style={
                {
                  '--tile-accent': color,
                  minHeight: 82,
                  border: `1px solid ${active ? `${color}88` : C.line}`,
                  borderRadius: 18,
                  background: active ? `${color}18` : 'rgba(255,255,255,0.72)',
                  color: active ? color : C.ink,
                  cursor: disabled || active || saving !== null ? 'default' : 'pointer',
                  textAlign: 'left',
                  padding: '14px 16px 14px 20px',
                  opacity: disabled ? 0.55 : 1,
                } as CSSProperties
              }
            >
              <span style={{ display: 'block', fontSize: 15, fontWeight: 900 }}>
                {saving === status ? '更新中...' : BOOK_STATUS_LABELS[status]}
              </span>
              <span style={{ display: 'block', color: C.inkSoft, fontSize: 12, marginTop: 5 }}>
                {statusActionHint(status)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function statusActionHint(status: BookStatus) {
  switch (status) {
    case 'WISHLIST':
      return '気になる本'
    case 'TSUNDOKU':
      return 'あとで読む'
    case 'READING':
      return '読み始める'
    case 'FINISHED':
      return '読了にする'
    default:
      return ''
  }
}

function StatusDisplay({ status }: { status: BookStatus }) {
  const color = STATUS_INK[status]
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 40,
        borderRadius: 999,
        background: `${color}16`,
        color,
        padding: '0 12px',
        fontWeight: 900,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {BOOK_STATUS_LABELS[status]}
    </div>
  )
}

function DateGrid({
  editing,
  purchaseDate,
  startDate,
  finishDate,
  editPurchaseDate,
  editStartDate,
  editFinishDate,
  setEditPurchaseDate,
  setEditStartDate,
  setEditFinishDate,
}: {
  editing: boolean
  purchaseDate?: string | null
  startDate?: string | null
  finishDate?: string | null
  editPurchaseDate: string
  editStartDate: string
  editFinishDate: string
  setEditPurchaseDate: (value: string) => void
  setEditStartDate: (value: string) => void
  setEditFinishDate: (value: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <DateField label="購入日" value={purchaseDate} editValue={editPurchaseDate} editing={editing} onChange={setEditPurchaseDate} />
      <DateField label="読み始め" value={startDate} editValue={editStartDate} editing={editing} onChange={setEditStartDate} />
      <DateField label="読了日" value={finishDate} editValue={editFinishDate} editing={editing} onChange={setEditFinishDate} />
    </div>
  )
}

function DateField({
  label,
  value,
  editValue,
  editing,
  onChange,
}: {
  label: string
  value?: string | null
  editValue: string
  editing: boolean
  onChange: (value: string) => void
}) {
  return (
    <FieldGroup label={label}>
      {editing ? (
        <input type="date" value={editValue} onChange={(e) => onChange(e.target.value)} style={fieldStyle} />
      ) : (
        <span style={{ color: value ? C.ink : C.inkMuted }}>{value ?? '未設定'}</span>
      )}
    </FieldGroup>
  )
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bm-glass-layer" style={{ borderRadius: 22, padding: 20 }}>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, margin: '0 0 14px' }}>{title}</h2>
      {children}
    </section>
  )
}

function InfoItem({
  label,
  value,
  children,
}: {
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        border: `1px solid ${C.lineSoft}`,
        borderRadius: 16,
        padding: 14,
        background: 'rgba(255,255,255,0.58)',
        minHeight: 82,
      }}
    >
      <div style={{ fontFamily: FONTS.mono, color: C.inkMuted, fontSize: 10, letterSpacing: '0.12em', marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ color: value || children ? C.ink : C.inkMuted, lineHeight: 1.5 }}>
        {children ?? value ?? '—'}
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.inkMuted, letterSpacing: '0.12em' }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  )
}

function ReadableText({
  children,
  empty,
}: {
  children?: string | null
  empty: string
}) {
  return (
    <p
      style={{
        whiteSpace: 'pre-wrap',
        lineHeight: 1.8,
        color: children ? C.ink : C.inkMuted,
        margin: 0,
      }}
    >
      {children || empty}
    </p>
  )
}

function MetaChip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 32,
        borderRadius: 999,
        background: color,
        color: readableTextColor(color),
        padding: '0 12px',
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {children}
    </span>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="bm-tactile"
      style={{
        minHeight: 50,
        border: 'none',
        borderRadius: 999,
        background: disabled ? C.inkMuted : `linear-gradient(135deg, ${C.accent}, ${STATUS_INK.TSUNDOKU})`,
        color: '#fff',
        padding: '0 20px',
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 18px 34px -24px rgba(79,127,247,0.72)',
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bm-tactile"
      style={{
        minHeight: 48,
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.78)',
        color: C.ink,
        padding: '0 18px',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function DangerButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bm-tactile"
      style={{
        minHeight: 48,
        border: `1px solid ${STATUS_INK.DROPPED}44`,
        borderRadius: 999,
        background: `${STATUS_INK.DROPPED}10`,
        color: STATUS_INK.DROPPED,
        padding: '0 18px',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${STATUS_INK.DROPPED}33`,
        background: `${STATUS_INK.DROPPED}12`,
        color: STATUS_INK.DROPPED,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 13,
        lineHeight: 1.6,
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  )
}
