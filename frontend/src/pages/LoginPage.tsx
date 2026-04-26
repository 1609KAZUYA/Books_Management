import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submitLogin = async (credentials: { email: string; password: string }) => {
    setError('')
    setLoading(true)
    let response
    try {
      response = await apiLogin(credentials)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } }; message?: string })?.response?.status
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
      const detail = status ? `（HTTP ${status}）` : ''
      setError(`${msg ?? 'ログインAPIの呼び出しに失敗しました'}${detail}`)
      setLoading(false)
      return
    }

    try {
      login(response)
      navigate('/books')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setError(`ログインは成功しましたが、画面側の保存処理に失敗しました: ${msg ?? 'unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    submitLogin({ email, password })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Books Memo</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submitLogin({ email: 'demo@example.com', password: 'demo1234' })}
            className="w-full border border-gray-300 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            デモでログイン
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          デモ: demo@example.com / demo1234
        </p>
      </div>
    </div>
  )
}
