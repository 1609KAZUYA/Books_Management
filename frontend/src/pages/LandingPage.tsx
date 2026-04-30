import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditorialAtmosphere, Reveal, ScrollProgressBar } from '../components/Motion'
import { EDITORIAL, FONTS, shade } from '../styles/editorial'

const C = EDITORIAL
const SERIF = FONTS.serif
const SANS = FONTS.sans
const MONO = FONTS.mono

const baseStyle: CSSProperties = {
  fontFamily: SANS,
  WebkitFontSmoothing: 'antialiased',
  textRendering: 'optimizeLegibility',
  fontFeatureSettings: '"palt"',
  background: C.paper,
  color: C.ink,
  minHeight: '100vh',
}

const navLinkStyle: CSSProperties = {
  color: C.inkSoft,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'color 0.2s',
  borderBottom: '1px solid transparent',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const goLogin = () => navigate('/login')
  const goRegister = () => navigate('/register')
  const goBooks = () => navigate('/books')
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bm-modern-shell" style={{ ...baseStyle, background: undefined, position: 'relative', overflow: 'hidden' }}>
      <ScrollProgressBar />
      <EditorialAtmosphere />
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          background: C.paper,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top bar */}
        <header
          className="bm-glass-layer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 64px',
            border: 'none',
            borderRadius: 18,
            margin: '14px 18px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Books Memo
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: C.inkSoft,
                letterSpacing: '0.12em',
              }}
            >
              EST. 2026
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 22, fontSize: 14, color: C.inkSoft }}>
            {[
              { label: 'Features 機能', action: () => scrollToSection('features') },
              { label: 'How it works 使い方', action: () => scrollToSection('how-it-works') },
              { label: 'Log in ログイン', action: goLogin },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                style={{
                  ...navLinkStyle,
                  border: 'none',
                  background: 'transparent',
                  padding: '0 4px',
                  fontFamily: SANS,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.inkSoft)}
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={goRegister}
            onMouseEnter={() => setHovered('cta-top')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'cta-top' ? C.ink : C.accent,
              color: C.paper,
              minHeight: 44,
              padding: '11px 22px',
              borderRadius: 2,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.04em',
              border: 'none',
              cursor: 'pointer',
              fontFamily: SANS,
              transition: 'all 0.25s ease',
            }}
          >
            読書を動かす →
          </button>
        </header>

        {/* Hero */}
        <section style={{ padding: '88px 64px 96px', borderBottom: `1px solid ${C.line}` }}>
          <Reveal>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.18em',
                color: C.accent,
                marginBottom: 32,
              }}
            >
              VOL. 01 — TURN YOUR STACK INTO MOMENTUM
            </div>
          </Reveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: 80,
              alignItems: 'end',
            }}
          >
            <Reveal delay={80}>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: 92,
                  lineHeight: 0.96,
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  marginBottom: 36,
                  margin: '0 0 36px',
                }}
              >
                <span style={{ fontStyle: 'italic', fontWeight: 300 }}>積読</span>
                を、
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 300 }}>読みたい</span>
                に変える。
                <br />
                次の一冊が <span style={{ color: C.accent, fontStyle: 'italic' }}>見つかる。</span>
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: C.inkSoft,
                  maxWidth: 520,
                  marginBottom: 44,
                  lineHeight: 1.7,
                }}
              >
                Books Memoは、積んだままの本を「今日読みたい一冊」に変える読書ダッシュボード。
                進捗、カテゴリー、気になる本が明るく並び、開くたびに少し読み進めたくなります。
              </p>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={goRegister}
                  onMouseEnter={() => setHovered('cta-hero')}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: C.ink,
                    color: C.paper,
                    minHeight: 48,
                    padding: '16px 32px',
                    borderRadius: 2,
                    fontSize: 15,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: SANS,
                    transform: hovered === 'cta-hero' ? 'translateY(-1px)' : 'none',
                    boxShadow:
                      hovered === 'cta-hero'
                        ? '0 6px 20px rgba(42,32,26,0.25)'
                        : '0 2px 6px rgba(42,32,26,0.12)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  積読を減らしはじめる →
                </button>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    color: C.inkSoft,
                    letterSpacing: '0.05em',
                  }}
                >
                  Find your next read · Build reading momentum
                </span>
              </div>
            </Reveal>

            <Reveal delay={180} style={{ position: 'relative', height: 410 }}>
              <BookStack onViewAll={goBooks} />
            </Reveal>
          </div>
        </section>

        {/* Stats strip */}
        <section
          style={{
            padding: '64px 64px',
            borderBottom: `1px solid ${C.line}`,
            background: C.paperDeep,
          }}
        >
          <Reveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 16,
              }}
            >
            {(
              [
                ['247', '登録冊数', 'BOOKS LOGGED'],
                ['12', 'カテゴリー', 'CATEGORIES'],
                ['38', '今月の読了', 'FINISHED THIS MONTH'],
                ['∞', '可能性', 'POSSIBILITIES'],
              ] as const
            ).map(([n, jp, en], index) => (
              <div
                key={en}
                className={`bm-bento-stat bm-hover-sheen${index === 0 ? ' bm-bento-stat--wide' : ''}`}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: 64,
                    fontWeight: 300,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginBottom: 12,
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 14, color: C.ink, marginBottom: 4 }}>{jp}</div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: C.inkSoft,
                    letterSpacing: '0.14em',
                  }}
                >
                  {en}
                </div>
              </div>
            ))}
            </div>
          </Reveal>
        </section>

        {/* Feature 01 — Shelf */}
        <section id="features" style={{ padding: '120px 64px', borderBottom: `1px solid ${C.line}` }}>
          <Reveal>
            <FeatureRow
              number="01"
              eyebrow="THE SHELF"
              title="今日読む本が、すぐ決まる"
              subtitle="Make the next book obvious"
              body="登録した本を状態ごとに見える化。読みかけ、積読、読了が並ぶことで、どこから手をつければいいか迷わず選べます。"
              visual={<ShelfPreview />}
            />
          </Reveal>
        </section>

        {/* Feature 02 — Categories */}
        <section
          id="how-it-works"
          style={{
            padding: '120px 64px',
            borderBottom: `1px solid ${C.line}`,
            background: C.paperDeep,
          }}
        >
          <Reveal>
            <FeatureRow
              number="02"
              eyebrow="CATEGORIES"
              title="読みたい気分で、棚をひらく"
              subtitle="Organize by energy and mood"
              body="仕事、学び、物語、癒し。カテゴリーの色が気分の入口になり、忘れていた読みたい本を自然に思い出せます。"
              visual={<CategoryPreview />}
              flip
            />
          </Reveal>
        </section>

        {/* Feature 03 — Search */}
        <section style={{ padding: '120px 64px', borderBottom: `1px solid ${C.line}` }}>
          <Reveal>
            <FeatureRow
              number="03"
              eyebrow="DISCOVERY"
              title="また読みたい本に、すぐ会える"
              subtitle="Rediscover books at the right moment"
              body="タイトル・著者・ISBN・ステータスで素早く検索。過去に気になった一冊や、途中で止まっていた本へすぐ戻れます。"
              visual={<SearchPreview />}
            />
          </Reveal>
        </section>

        {/* Closing CTA */}
        <section
          style={{
            padding: '140px 64px 120px',
            textAlign: 'center',
            background: C.ink,
            color: C.paper,
          }}
        >
          <Reveal>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.2em',
                color: C.accent,
                marginBottom: 28,
              }}
            >
              ── BEGIN YOUR LIBRARY ──
            </div>
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 88,
                fontWeight: 300,
                lineHeight: 1.05,
                marginBottom: 28,
                letterSpacing: '-0.02em',
                margin: '0 0 28px',
              }}
            >
              今日の10ページが、
              <br />
              <span style={{ fontStyle: 'italic' }}>積読を読みたい本</span>に変える。
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'rgba(244,237,224,0.7)',
                marginBottom: 48,
                maxWidth: 580,
                margin: '0 auto 48px',
                lineHeight: 1.7,
              }}
            >
              読みたい本が見つかる、読みかけに戻れる、読了が増えていく。
              登録後すぐに、自分だけの読書ダッシュボードを作れます。
            </p>
          </Reveal>
          <button
            type="button"
            onClick={goRegister}
            onMouseEnter={() => setHovered('cta-end')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'cta-end' ? C.paper : C.accent,
              color: hovered === 'cta-end' ? C.ink : C.paper,
              padding: '20px 44px',
              minHeight: 56,
              borderRadius: 2,
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '0.03em',
              border: 'none',
              cursor: 'pointer',
              fontFamily: SANS,
              transition: 'all 0.3s ease',
            }}
          >
            読書ダッシュボードを作る  Start reading  →
          </button>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '40px 64px',
            background: C.ink,
            color: 'rgba(244,237,224,0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(244,237,224,0.1)',
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 14 }}>Books Memo · 2026</div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em' }}>
            READ · ORGANIZE · REFLECT
          </div>
        </footer>
      </div>
    </div>
  )
}

interface FeatureRowProps {
  number: string
  eyebrow: string
  title: string
  subtitle: string
  body: string
  visual: ReactNode
  flip?: boolean
}

function FeatureRow({ number, eyebrow, title, subtitle, body, visual, flip }: FeatureRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: flip ? '1fr 1.1fr' : '1.1fr 1fr',
        gap: 80,
        alignItems: 'center',
      }}
    >
      <div style={{ order: flip ? 2 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28 }}>
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 56,
              fontWeight: 300,
              color: C.accent,
              fontStyle: 'italic',
            }}
          >
            {number}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.18em',
              color: C.inkSoft,
            }}
          >
            {eyebrow}
          </span>
        </div>
        <h3
          style={{
            fontFamily: SERIF,
            fontSize: 42,
            fontWeight: 400,
            lineHeight: 1.15,
            marginBottom: 12,
            letterSpacing: '-0.015em',
            margin: '0 0 12px',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontStyle: 'italic',
            fontSize: 16,
            color: C.inkSoft,
            marginBottom: 24,
            fontFamily: SERIF,
          }}
        >
          — {subtitle}
        </p>
        <p style={{ fontSize: 17, color: C.inkSoft, maxWidth: 460, lineHeight: 1.7 }}>{body}</p>
      </div>
      <div style={{ order: flip ? 1 : 2 }}>{visual}</div>
    </div>
  )
}

function BookStack({ onViewAll }: { onViewAll: () => void }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const books = [
    { w: 246, h: 54, color: '#2fbf7a', label: 'FINISHED · 38' },
    { w: 268, h: 58, color: '#ff7a59', label: 'TSUNDOKU · 12' },
    { w: 232, h: 52, color: C.accent, label: 'NEXT READ · 3' },
  ]
  let y = 302
  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTilt({
          x: (e.clientX - rect.left - rect.width / 2) / rect.width,
          y: (e.clientY - rect.top - rect.height / 2) / rect.height,
        })
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        perspective: 900,
        transform: `rotateX(${tilt.y * -5}deg) rotateY(${tilt.x * 7}deg)`,
        transition: 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {books.map((b, i) => {
        y -= b.h + 6
        const rotate = `${i % 2 === 0 ? -0.4 : 0.4}deg`
        return (
          <div
            key={b.label}
            className="bm-float-book bm-hover-sheen"
            style={{
              position: 'absolute',
              left: '50%',
              '--book-rotate': rotate,
              '--book-drift-x': i % 2 === 0 ? '-3px' : '3px',
              transform: `translateX(-50%) rotate(${rotate})`,
              top: y,
              width: b.w,
              height: b.h,
              background: b.color,
              boxShadow:
                '0 6px 14px rgba(42,32,26,0.18), inset 0 -2px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.08)',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              color: 'rgba(255,255,255,0.75)',
              fontSize: 10,
              letterSpacing: '0.18em',
              fontFamily: MONO,
            } as CSSProperties}
          >
            {b.label}
          </div>
        )
      })}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: 306,
          height: 6,
          background: C.ink,
          opacity: 0.3,
        }}
      />
      <button
        type="button"
        onClick={onViewAll}
        className="bm-hover-sheen"
        style={{
          position: 'absolute',
          left: '50%',
          top: 336,
          transform: 'translateX(-50%)',
          minHeight: 48,
          minWidth: 178,
          padding: '0 22px',
          border: `1px solid ${C.ink}`,
          background: C.paperSoft,
          color: C.ink,
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 14px 30px -18px rgba(42,32,26,0.4)',
        }}
      >
        次の一冊を探す →
      </button>
    </div>
  )
}

function ShelfPreview() {
  const cats = [
    { name: 'ビジネス', en: 'Business', count: 24, color: '#4f7ff7' },
    { name: '小説', en: 'Fiction', count: 31, color: '#dc6c94' },
    { name: 'PC', en: 'Tech', count: 18, color: '#25a6a1' },
    { name: '哲学', en: 'Philosophy', count: 12, color: '#9b72f2' },
  ]
  return (
    <div
      className="bm-hover-sheen"
      style={{
        background: C.paper,
        padding: 28,
        border: `1px solid ${C.line}`,
        boxShadow:
          '0 24px 60px -20px rgba(42,32,26,0.25), 0 2px 6px rgba(42,32,26,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500 }}>本棚</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            color: C.inkSoft,
          }}
        >
          247 BOOKS
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {cats.map((c) => (
          <div key={c.en} style={{ border: `1px solid ${C.line}`, background: '#fff' }}>
            <div
              className="bm-hover-sheen"
              style={{
                background: c.color,
                color: '#fff',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500 }}>{c.name}</div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    opacity: 0.75,
                    letterSpacing: '0.1em',
                  }}
                >
                  {c.en.toUpperCase()} · {c.count}
                </div>
              </div>
              <span style={{ fontSize: 10 }}>↗</span>
            </div>
            <div style={{ padding: 12, display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  style={{
                    width: 36,
                    height: 50,
                    background: `linear-gradient(135deg, ${shade(c.color, 10)}, ${shade(c.color, -20)})`,
                    borderRadius: 1,
                    boxShadow:
                      'inset -2px 0 4px rgba(0,0,0,0.15), inset 2px 0 0 rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryPreview() {
  const cats = [
    { name: 'ビジネス', en: 'Business', color: '#4f7ff7', count: 24 },
    { name: '小説', en: 'Fiction', color: '#dc6c94', count: 31 },
    { name: 'PC', en: 'Tech', color: '#25a6a1', count: 18 },
    { name: '哲学', en: 'Philosophy', color: '#9b72f2', count: 12 },
    { name: 'デザイン', en: 'Design', color: '#ff7a59', count: 8 },
    { name: '歴史', en: 'History', color: '#2fbf7a', count: 9 },
  ]
  return (
    <div
      className="bm-hover-sheen"
      style={{
        background: C.paper,
        padding: 28,
        border: `1px solid ${C.line}`,
        boxShadow:
          '0 24px 60px -20px rgba(42,32,26,0.25), 0 2px 6px rgba(42,32,26,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500 }}>カテゴリー</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            color: C.inkSoft,
          }}
        >
          + NEW
        </span>
      </div>
      {cats.map((c, i) => (
        <div
          key={c.en}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 4px',
            borderBottom: i === cats.length - 1 ? 'none' : `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: c.color,
              }}
            />
            <span style={{ fontFamily: SERIF, fontSize: 16 }}>{c.name}</span>
            <span
              style={{
                fontStyle: 'italic',
                fontSize: 13,
                color: C.inkSoft,
                fontFamily: SERIF,
              }}
            >
              {c.en}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft }}>
              {c.count} books
            </span>
            <span style={{ fontSize: 12, color: C.inkSoft, letterSpacing: '0.04em' }}>
              編集 / 削除
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchPreview() {
  const rows = [
    {
      title: '嫌われる勇気',
      author: '岸見一郎 / 古賀史健',
      cat: 'ビジネス',
      col: '#4f7ff7',
      s: '読了',
    },
    {
      title: 'LPIC 1 教科書 + 問題集',
      author: '中島 能和',
      cat: 'PC',
      col: '#25a6a1',
      s: '読書中',
    },
    { title: '変な絵', author: '雨穴', cat: '小説', col: C.accent, s: '積読' },
  ]
  return (
    <div
      className="bm-hover-sheen"
      style={{
        background: C.paper,
        padding: 28,
        border: `1px solid ${C.line}`,
        boxShadow:
          '0 24px 60px -20px rgba(42,32,26,0.25), 0 2px 6px rgba(42,32,26,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: `1px solid ${C.ink}`,
          padding: '14px 18px',
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 14 }}>⌕</span>
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            color: C.ink,
            flex: 1,
            fontStyle: 'italic',
          }}
        >
          嫌われる勇気
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: C.inkSoft,
            letterSpacing: '0.1em',
          }}
        >
          ⌘K
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        {['すべてのステータス', 'すべてのカテゴリー', '更新日順'].map((f) => (
          <span
            key={f}
            style={{
              padding: '6px 12px',
              border: `1px solid ${C.line}`,
              fontSize: 11,
              color: C.inkSoft,
              fontFamily: MONO,
            }}
          >
            {f}  ⌄
          </span>
        ))}
      </div>
      {rows.map((b, i) => (
        <div
          key={b.title}
          style={{
            display: 'flex',
            gap: 16,
            padding: '14px 0',
            borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${C.line}`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 60,
              background: `linear-gradient(135deg, ${shade(b.col, 10)}, ${shade(b.col, -25)})`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{b.author}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  background: b.col,
                  color: '#fff',
                  fontFamily: MONO,
                  letterSpacing: '0.08em',
                }}
              >
                {b.cat}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  border: `1px solid ${C.line}`,
                  color: C.inkSoft,
                  fontFamily: MONO,
                  letterSpacing: '0.08em',
                }}
              >
                {b.s}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
