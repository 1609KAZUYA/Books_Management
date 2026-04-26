import { useEffect, useState } from 'react'
import { createTag, deleteTag, getTags, updateTag } from '../api/tags'
import type { Tag } from '../types/api'

export default function TagManagePage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New tag form
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [creating, setCreating] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const reload = () =>
    getTags()
      .then(setTags)
      .catch(() => setError('タグを読み込めませんでした'))
      .finally(() => setLoading(false))

  useEffect(() => { reload() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createTag({ name: newName, colorHex: newColor })
      setNewName('')
      setNewColor('#6366f1')
      reload()
    } catch {
      setError('タグの作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.colorHex ?? '#e5e7eb')
  }

  const handleUpdate = async (tagId: number) => {
    try {
      await updateTag(tagId, { name: editName, colorHex: editColor })
      setEditingId(null)
      reload()
    } catch {
      setError('タグの更新に失敗しました')
    }
  }

  const handleDelete = async (tagId: number, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteTag(tagId)
      reload()
    } catch {
      setError('タグの削除に失敗しました')
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">タグ管理</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">新しいタグを追加</h2>
        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">名前</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              maxLength={50}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">カラー</label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-12 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? '作成中...' : '追加'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">タグがありません</div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between px-4 py-3">
              {editingId === tag.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-7 w-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => handleUpdate(tag.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full inline-block border border-gray-200"
                      style={{ backgroundColor: tag.colorHex ?? '#e5e7eb' }}
                    />
                    <span
                      className="text-sm px-2 py-0.5 rounded"
                      style={{ backgroundColor: tag.colorHex ?? '#e5e7eb' }}
                    >
                      {tag.name}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(tag)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
