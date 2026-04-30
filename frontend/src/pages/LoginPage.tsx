import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { EDITORIAL, FONTS, shade } from '../styles/editorial'

const C = EDITORIAL

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: C.paper,
  color: C.ink,
  fontFamily: FONTS.sans,
  WebkitFontSmoothing: 'antialiased',
  textRendering: 'optimizeLegibility',
}

const inputStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  borderBottom: `1px solid ${C.ink}`,
  background: 'transparent',
  color: C.ink,
  fontFamily: FONTS.serif,
  fontSize: 17,
  padding: '10px 0 12px',
  outline: 'none',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: FONTS.mono,
  fontSize: 11,
  letterSpacing: 0,
  color: C.inkMuted,
  marginBottom: 8,
}

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
    <div style={pageStyle}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 56px',
          borderBottom: `1px solid ${C.line}`,
          background: C.paper,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            color: C.ink,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 600 }}>
            Books Memo
          </span>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: C.inkSoft,
              letterSpacing: 0,
            }}
          >
            EST. 2026
          </span>
        </Link>
        <Link
          to="/register"
          style={{
            color: C.inkSoft,
            textDecoration: 'none',
            fontSize: 14,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          新規登録  Register
        </Link>
      </header>

      <main
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '72px min(56px, 8vw) 88px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 72,
          alignItems: 'center',
        }}
      >
        <section>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: C.accent,
              letterSpacing: 0,
              marginBottom: 26,
            }}
          >
            ── WELCOME BACK · YOUR LIBRARY ──
          </div>
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: 82,
              lineHeight: 1,
              fontWeight: 300,
              margin: '0 0 28px',
              letterSpacing: 0,
            }}
          >
            本棚に、
            <br />
            <span style={{ fontStyle: 'italic', color: C.accent }}>戻る。</span>
          </h1>
          <p
            style={{
              maxWidth: 520,
              color: C.inkSoft,
              fontSize: 17,
              lineHeight: 1.8,
              margin: '0 0 42px',
            }}
          >
            読みかけの本、積んである本、読み終えた本。
            Books Memo の静かな本棚へログインして、今日の一冊を整理できます。
          </p>
          <LoginShelfPreview />
        </section>

        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            padding: 32,
            boxShadow: '0 24px 60px -28px rgba(42,32,26,0.28)',
          }}
        >
          <div style={{ paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 500 }}>
              ログイン
            </div>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontStyle: 'italic',
                color: C.inkSoft,
                fontSize: 15,
                marginTop: 4,
              }}
            >
              Sign in to your shelf
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
            </div>
            {error && (
              <p
                style={{
                  margin: 0,
                  color: '#a83a2a',
                  fontSize: 13,
                  lineHeight: 1.6,
                  border: '1px solid rgba(168,58,42,0.22)',
                  background: 'rgba(168,58,42,0.06)',
                  padding: '10px 12px',
                }}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 2,
                background: loading ? C.inkMuted : C.ink,
                color: C.paper,
                padding: '14px 20px',
                fontFamily: FONTS.sans,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => submitLogin({ email: 'demo@example.com', password: 'demo1234' })}
              style={{
                width: '100%',
                border: `1px solid ${C.line}`,
                borderRadius: 2,
                background: 'transparent',
                color: C.inkSoft,
                padding: '13px 20px',
                fontFamily: FONTS.sans,
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              デモでログイン
            </button>
          </form>
          <p
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: C.inkMuted,
              letterSpacing: 0,
              margin: '18px 0 0',
              textAlign: 'center',
            }}
          >
            DEMO · demo@example.com / demo1234
          </p>
          <p style={{ fontSize: 14, color: C.inkSoft, margin: '18px 0 0', textAlign: 'center' }}>
            アカウントをお持ちでない方は{' '}
            <Link
              to="/register"
              style={{
                color: C.accent,
                textDecoration: 'none',
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              新規登録
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

function LoginShelfPreview() {
  const books = [
    { title: 'READING', color: C.accent, width: '74%' },
    { title: 'TSUNDOKU', color: '#a8743a', width: '88%' },
    { title: 'FINISHED', color: '#5a8a6a', width: '68%' },
  ]

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 520,
        borderTop: `1px solid ${C.line}`,
        paddingTop: 22,
      }}
    >
      {books.map((book, index) => (
        <div
          key={book.title}
          style={{
            width: book.width,
            height: 46 + index * 4,
            background: `linear-gradient(90deg, ${shade(book.color, -14)}, ${book.color})`,
            color: 'rgba(255,255,255,0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            fontFamily: FONTS.mono,
            fontSize: 10,
            letterSpacing: 0,
            boxShadow: '0 8px 18px -12px rgba(42,32,26,0.45), inset 0 2px 0 rgba(255,255,255,0.08)',
            marginLeft: index % 2 === 0 ? 0 : 26,
            marginBottom: 5,
          }}
        >
          <span>{book.title}</span>
          <span>{String(index + 1).padStart(2, '0')}</span>
        </div>
      ))}
      <div style={{ height: 5, width: '92%', background: C.ink, opacity: 0.28, marginTop: 2 }} />
    </div>
  )
}
