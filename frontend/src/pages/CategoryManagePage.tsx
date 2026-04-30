import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../api/categories'
import type { Category } from '../types/api'
import { CATEGORY_PALETTE, EDITORIAL, FONTS, shade } from '../styles/editorial'
import { categoryBackground, readableTextColor } from '../utils/color'

const DEFAULT_CATEGORY_COLOR = CATEGORY_PALETTE[0]

export default function CategoryManagePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(DEFAULT_CATEGORY_COLOR)
  const [creating, setCreating] = useState(false)
  const [submitHover, setSubmitHover] = useState(false)
  const [paletteHover, setPaletteHover] = useState<number | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<string>(DEFAULT_CATEGORY_COLOR)

  const reload = () =>
    getCategories()
      .then(setCategories)
      .catch(() => setError('カテゴリーを読み込めませんでした'))
      .finally(() => setLoading(false))

  useEffect(() => {
    reload()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createCategory({ name: newName.trim(), colorHex: newColor })
      setNewName('')
      setNewColor(DEFAULT_CATEGORY_COLOR)
      await reload()
    } catch {
      setError('カテゴリーの追加に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(categoryBackground(category.colorHex ?? DEFAULT_CATEGORY_COLOR))
  }

  const handleUpdate = async (categoryId: number) => {
    setError('')
    try {
      await updateCategory(categoryId, { name: editName.trim(), colorHex: editColor })
      setEditingId(null)
      await reload()
    } catch {
      setError('カテゴリーの更新に失敗しました')
    }
  }

  const handleDelete = async (categoryId: number, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？このカテゴリーの本は未分類になります。`))
      return
    setError('')
    try {
      await deleteCategory(categoryId)
      await reload()
    } catch {
      setError('カテゴリーの削除に失敗しました')
    }
  }

  return (
    <div className="bm-modern-shell" style={{ color: EDITORIAL.ink }}>
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
          ── CATALOGUE · ORGANIZE BY COLOR ──
        </div>
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
          カテゴリー{' '}
          <span style={{ fontStyle: 'italic', color: EDITORIAL.accent, fontSize: 64 }}>
            Categories
          </span>
        </h1>
        <p
          style={{
            fontSize: 16,
            color: EDITORIAL.inkSoft,
            marginTop: 18,
            maxWidth: 580,
            fontFamily: FONTS.serif,
            fontStyle: 'italic',
            lineHeight: 1.7,
          }}
        >
          自由に作れるカテゴリーには、好きな色を添えて。背表紙のように並んだラベルが、本棚に小さなリズムを生みます。
        </p>
      </section>

      {error && (
        <div style={{ padding: '0 56px 16px' }}>
          <div
            style={{
              padding: '12px 16px',
              border: `1px solid ${shade('#a83a2a', 30)}`,
              background: '#faeae5',
              color: '#a83a2a',
              fontFamily: FONTS.serif,
              fontStyle: 'italic',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        </div>
      )}

      <section
        style={{
          padding: '0 56px 80px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr',
          gap: 40,
        }}
      >
        {/* Left: New category form */}
        <form
          onSubmit={handleCreate}
          className="bm-glass-layer"
          style={{
            padding: 28,
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 100,
            borderRadius: 18,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: EDITORIAL.accent,
              letterSpacing: '0.2em',
              marginBottom: 14,
            }}
          >
            ── NEW ENTRY ──
          </div>
          <h2
            style={{
              fontFamily: FONTS.serif,
              fontSize: 28,
              fontWeight: 500,
              marginBottom: 6,
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            新しいカテゴリー
          </h2>
          <p
            style={{
              fontSize: 13,
              color: EDITORIAL.inkSoft,
              fontStyle: 'italic',
              fontFamily: FONTS.serif,
              marginBottom: 24,
              marginTop: 6,
            }}
          >
            Add a new category
          </p>

          <label style={{ display: 'block', marginBottom: 22 }}>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: EDITORIAL.inkMuted,
                letterSpacing: '0.16em',
                marginBottom: 8,
              }}
            >
              名前 · NAME
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例：エッセイ"
              required
              maxLength={50}
              style={{
                width: '100%',
                padding: '10px 0',
                border: 'none',
                borderBottom: `1px solid ${EDITORIAL.ink}`,
                background: 'transparent',
                outline: 'none',
                fontFamily: FONTS.serif,
                fontSize: 18,
                color: EDITORIAL.ink,
                fontStyle: newName ? 'normal' : 'italic',
              }}
            />
          </label>

          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: EDITORIAL.inkMuted,
                letterSpacing: '0.16em',
                marginBottom: 12,
              }}
            >
              カラー · COLOR
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              {CATEGORY_PALETTE.map((c, i) => {
                const selected = newColor === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    onMouseEnter={() => setPaletteHover(i)}
                    onMouseLeave={() => setPaletteHover(null)}
                    aria-label={`カラー ${c}`}
                    style={{
                      width: '100%',
                      minWidth: 0,
                      aspectRatio: '1',
                      borderRadius: '50%',
                      background: c,
                      cursor: 'pointer',
                      border: selected
                        ? `2px solid ${EDITORIAL.ink}`
                        : '2px solid transparent',
                      outline: selected ? `2px solid ${c}40` : 'none',
                      outlineOffset: 3,
                      transform: paletteHover === i ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.18s',
                      padding: 0,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Live preview */}
          <div
            style={{
              marginBottom: 28,
              padding: 16,
              background: EDITORIAL.paperDeep,
              border: `1px solid ${EDITORIAL.lineSoft}`,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                color: EDITORIAL.inkMuted,
                letterSpacing: '0.14em',
                marginBottom: 10,
              }}
            >
              PREVIEW
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: newColor,
                }}
              />
              <span
                style={{
                  background: categoryBackground(newColor),
                  color: readableTextColor(categoryBackground(newColor)),
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 2,
                  fontFamily: FONTS.sans,
                }}
              >
                {newName || 'カテゴリー名'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            onMouseEnter={() => setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}
            style={{
              width: '100%',
              background: creating
                ? EDITORIAL.inkMuted
                : submitHover
                  ? EDITORIAL.ink
                  : EDITORIAL.accent,
              color: EDITORIAL.paper,
              padding: '14px 0',
              borderRadius: 2,
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: FONTS.sans,
              cursor: creating ? 'wait' : 'pointer',
              transition: 'all 0.25s',
              letterSpacing: '0.04em',
            }}
          >
            {creating ? '追加中…  Adding…' : '追加する  Add  →'}
          </button>
        </form>

        {/* Right: Existing categories */}
        <div>
          <div
            className="bm-glass-layer"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '18px 20px',
              marginBottom: 8,
              borderRadius: 18,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 32,
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  margin: 0,
                }}
              >
                カテゴリー一覧
              </h2>
              <span
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 18,
                  fontStyle: 'italic',
                  color: EDITORIAL.inkSoft,
                }}
              >
                Your catalogue
              </span>
            </div>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: EDITORIAL.inkMuted,
                letterSpacing: '0.14em',
              }}
            >
              {categories.length} CATEGORIES
            </span>
          </div>

          {/* Header row */}
          <div style={tableHeaderStyle}>
            <span>NO.</span>
            <span>NAME · 名前</span>
            <span>COLOR · 色</span>
            <span style={{ textAlign: 'right' }}>ACTIONS</span>
          </div>

          {loading ? (
            <div style={{ padding: 56, textAlign: 'center', color: EDITORIAL.inkMuted }}>
              <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic' }}>
                読み込み中…
              </span>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center', color: EDITORIAL.inkSoft }}>
              <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 16 }}>
                まだカテゴリーがありません。左のフォームから最初のカテゴリーを追加してください。
              </div>
            </div>
          ) : (
            categories.map((category, i) => {
              const isEditing = editingId === category.id
              return (
                <CategoryRow
                  key={category.id}
                  index={i}
                  category={category}
                  isEditing={isEditing}
                  editName={editName}
                  editColor={editColor}
                  onEditNameChange={setEditName}
                  onEditColorChange={setEditColor}
                  onSave={() => handleUpdate(category.id)}
                  onCancel={() => setEditingId(null)}
                  onStartEdit={() => startEdit(category)}
                  onDelete={() => handleDelete(category.id, category.name)}
                />
              )
            })
          )}

          <div
            style={{
              marginTop: 32,
              padding: '24px 28px',
              border: `1px solid ${EDITORIAL.line}`,
              background: EDITORIAL.paperDeep,
              display: 'flex',
              gap: 18,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: EDITORIAL.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTS.serif,
                fontStyle: 'italic',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              i
            </span>
            <div>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                色は、本棚の表情になります。
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: EDITORIAL.inkSoft,
                  fontStyle: 'italic',
                  fontFamily: FONTS.serif,
                }}
              >
                Colors become the personality of your shelves — choose ones that feel right.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

interface CategoryRowProps {
  index: number
  category: Category
  isEditing: boolean
  editName: string
  editColor: string
  onEditNameChange: (v: string) => void
  onEditColorChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  onStartEdit: () => void
  onDelete: () => void
}

function CategoryRow({
  index,
  category,
  isEditing,
  editName,
  editColor,
  onEditNameChange,
  onEditColorChange,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
}: CategoryRowProps) {
  const [hover, setHover] = useState(false)
  const color = categoryBackground(category.colorHex ?? DEFAULT_CATEGORY_COLOR)
  const textColor = readableTextColor(color)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1.2fr 1fr 140px',
        gap: 18,
        padding: '20px 4px',
        alignItems: 'center',
        borderBottom: `1px solid ${EDITORIAL.line}`,
        background: hover ? EDITORIAL.paperSoft : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: 22,
          fontWeight: 300,
          color: EDITORIAL.inkMuted,
          fontStyle: 'italic',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            style={{
              padding: '6px 10px',
              border: `1px solid ${EDITORIAL.ink}`,
              background: EDITORIAL.panel,
              outline: 'none',
              fontFamily: FONTS.serif,
              fontSize: 15,
              color: EDITORIAL.ink,
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onEditColorChange(c)}
                aria-label={`カラー ${c}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: c,
                  border:
                    categoryBackground(editColor) === c
                      ? `2px solid ${EDITORIAL.ink}`
                      : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: color,
            }}
          />
          <span
            style={{
              background: color,
              color: textColor,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 2,
              fontFamily: FONTS.sans,
            }}
          >
            {category.name}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 44,
            height: 18,
            background: color,
            border: `1px solid ${shade(color, -10)}`,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            width: 22,
            height: 18,
            background: shade(color, 16),
            border: `1px solid ${shade(color, 4)}`,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            width: 22,
            height: 18,
            background: shade(color, -12),
            border: `1px solid ${shade(color, -18)}`,
            display: 'inline-block',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'flex-end',
          opacity: hover || isEditing ? 1 : 0.5,
          transition: 'opacity 0.15s',
        }}
      >
        {isEditing ? (
          <>
            <IconBtn onClick={onSave}>保存</IconBtn>
            <IconBtn onClick={onCancel}>キャンセル</IconBtn>
          </>
        ) : (
          <>
            <IconBtn onClick={onStartEdit}>編集</IconBtn>
            <IconBtn onClick={onDelete} danger>
              削除
            </IconBtn>
          </>
        )}
      </div>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  const [hover, setHover] = useState(false)
  const baseColor = danger ? '#8a4d47' : EDITORIAL.inkSoft
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: 'none',
        color: baseColor,
        fontSize: 12,
        cursor: 'pointer',
        padding: '4px 8px',
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        borderBottom: hover ? `1px solid ${baseColor}` : '1px solid transparent',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

const tableHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 1.2fr 1fr 140px',
  gap: 18,
  padding: '12px 4px',
  fontFamily: FONTS.mono,
  fontSize: 10,
  color: EDITORIAL.inkMuted,
  letterSpacing: '0.16em',
  borderBottom: `1px solid ${EDITORIAL.line}`,
}
