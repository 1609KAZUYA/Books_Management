import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { EditorialAtmosphere, Reveal, ScrollProgressBar } from '../components/Motion'
import { EDITORIAL, FONTS, shade } from '../styles/editorial'

const C = EDITORIAL

// 新規登録画面です。
// ログイン画面と同じデザイン部品を使い、Books Memo全体の見た目を統一しています。

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

const errorStyle: CSSProperties = {
  margin: 0,
  color: '#a83a2a',
  fontSize: 13,
  lineHeight: 1.6,
  border: '1px solid rgba(168,58,42,0.22)',
  background: 'rgba(168,58,42,0.06)',
  padding: '10px 12px',
}

export default function RegisterPage() {
  // 入力欄の値をReactのstateとして管理します。
  // setDisplayName(...) のような関数を呼ぶと、画面が再描画されます。
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    // form送信時にページ全体が再読み込みされないよう止めます。
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      // フロント側でも確認用パスワードの一致をチェックし、無駄なAPI通信を避けます。
      setError('確認用パスワードが一致しません')
      return
    }

    setLoading(true)
    try {
      // apiRegister はバックエンドの /auth/register を呼ぶ関数です。
      const response = await apiRegister({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      })
      login(response)
      // 登録後はそのままログイン済みにして本棚画面へ移動します。
      navigate('/books')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const detail = status ? `（HTTP ${status}）` : ''
      setError(`${msg ?? 'ユーザー登録に失敗しました'}${detail}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...pageStyle, position: 'relative', overflow: 'hidden' }}>
      <ScrollProgressBar />
      <EditorialAtmosphere />
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 56px',
          borderBottom: `1px solid ${C.line}`,
          background: C.paper,
          position: 'relative',
          zIndex: 1,
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
          to="/login"
          style={{
            color: C.inkSoft,
            textDecoration: 'none',
            fontSize: 14,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          ログイン  Log in
        </Link>
      </header>

      <main
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '64px min(56px, 8vw) 80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 72,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal>
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
            ── BEGIN YOUR LIBRARY · FIRST SHELF ──
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
            本棚を、
            <br />
            <span style={{ fontStyle: 'italic', color: C.accent }}>つくる。</span>
          </h1>
          <p
            style={{
              maxWidth: 540,
              color: C.inkSoft,
              fontSize: 17,
              lineHeight: 1.8,
              margin: '0 0 42px',
            }}
          >
            読みたい本、積んでいる本、これから出会う一冊。
            まずは小さな本棚を作って、読書の記録を静かに積み重ねていきましょう。
          </p>
          <RegisterShelfPreview />
        </section>
        </Reveal>

        <Reveal delay={120}>
        <section
          className="bm-hover-sheen"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            padding: 32,
            boxShadow: '0 24px 60px -28px rgba(42,32,26,0.28)',
          }}
        >
          <div style={{ paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 500 }}>
              新規登録
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
              Create your reading shelf
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <div>
              <label style={labelStyle}>DISPLAY NAME</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={100}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
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
                minLength={12}
                maxLength={72}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>PASSWORD CONFIRM</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={12}
                maxLength={72}
                style={inputStyle}
              />
            </div>

            {error && <p style={errorStyle}>{error}</p>}

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
              {loading ? '登録中...' : '登録してはじめる'}
            </button>
          </form>

          <p style={{ fontSize: 14, color: C.inkSoft, margin: '18px 0 0', textAlign: 'center' }}>
            すでにアカウントをお持ちの方は{' '}
            <Link
              to="/login"
              style={{
                color: C.accent,
                textDecoration: 'none',
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              ログイン
            </Link>
          </p>
        </section>
        </Reveal>
      </main>
    </div>
  )
}

function RegisterShelfPreview() {
  // 登録までの流れを本の背表紙風に見せる装飾です。
  // 実際の登録処理とは関係しない、画面デザイン用の固定表示です。
  const steps = [
    { title: 'PROFILE', sub: 'Your name', color: '#3a5a4a', width: '72%' },
    { title: 'ACCOUNT', sub: 'Email and password', color: C.accent, width: '90%' },
    { title: 'SHELF', sub: 'Start tracking books', color: '#3a4a6a', width: '78%' },
  ]

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 540,
        borderTop: `1px solid ${C.line}`,
        paddingTop: 24,
      }}
    >
      {steps.map((step, index) => (
        <div
          key={step.title}
          className="bm-hover-sheen"
          style={{
            width: step.width,
            minHeight: 54,
            background: `linear-gradient(90deg, ${shade(step.color, -12)}, ${step.color})`,
            color: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            boxShadow: '0 8px 18px -12px rgba(42,32,26,0.45), inset 0 2px 0 rgba(255,255,255,0.08)',
            marginLeft: index % 2 === 0 ? 0 : 28,
            marginBottom: 6,
          }}
        >
          <span>
            <span style={{ display: 'block', fontFamily: FONTS.mono, fontSize: 10 }}>
              {step.title}
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: FONTS.serif,
                fontSize: 14,
                fontStyle: 'italic',
                opacity: 0.72,
                marginTop: 2,
              }}
            >
              {step.sub}
            </span>
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10 }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      ))}
      <div style={{ height: 5, width: '92%', background: C.ink, opacity: 0.28, marginTop: 2 }} />
    </div>
  )
}
