import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const goLogin = () => navigate('/login')
  const goRegister = () => navigate('/register')

  return (
    <div style={baseStyle}>
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          background: C.paper,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 64px',
            borderBottom: `1px solid ${C.line}`,
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
          <nav style={{ display: 'flex', gap: 36, fontSize: 14, color: C.inkSoft }}>
            {['Features 機能', 'How it works 使い方', 'Log in ログイン'].map(
              (t) => (
                <a
                  key={t}
                  style={navLinkStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.inkSoft)}
                  onClick={t.startsWith('Log') ? goLogin : undefined}
                >
                  {t}
                </a>
              ),
            )}
          </nav>
          <button
            type="button"
            onClick={goRegister}
            onMouseEnter={() => setHovered('cta-top')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'cta-top' ? C.ink : C.accent,
              color: C.paper,
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
            無料ではじめる →
          </button>
        </header>

        {/* Hero */}
        <section style={{ padding: '88px 64px 96px', borderBottom: `1px solid ${C.line}` }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.18em',
              color: C.accent,
              marginBottom: 32,
            }}
          >
            VOL. 01 — A QUIET PLACE FOR YOUR BOOKS
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: 80,
              alignItems: 'end',
            }}
          >
            <div>
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
                も、
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 300 }}>読</span>
                みかけも、
                <br />
                ぜんぶ <span style={{ color: C.accent, fontStyle: 'italic' }}>一望。</span>
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
                本と過ごす時間を、ひとつの本棚に。Books Memoは、読書家のための静かな書斎。
                読了した本も、まだ読みかけの一冊も、ジャンルごとに整理して心地よく見渡せます。
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
                  無料で本棚をつくる →
                </button>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    color: C.inkSoft,
                    letterSpacing: '0.05em',
                  }}
                >
                  Free forever · No card required
                </span>
              </div>
            </div>

            <div style={{ position: 'relative', height: 480 }}>
              <BookStack />
            </div>
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 64,
            }}
          >
            {(
              [
                ['247', '登録冊数', 'BOOKS LOGGED'],
                ['12', 'カテゴリー', 'CATEGORIES'],
                ['38', '今月の読了', 'FINISHED THIS MONTH'],
                ['∞', '可能性', 'POSSIBILITIES'],
              ] as const
            ).map(([n, jp, en]) => (
              <div key={en}>
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
        </section>

        {/* Feature 01 — Shelf */}
        <section style={{ padding: '120px 64px', borderBottom: `1px solid ${C.line}` }}>
          <FeatureRow
            number="01"
            eyebrow="THE SHELF"
            title="本棚 — 一目でわかる、自分だけの書庫"
            subtitle="Your library, at a glance"
            body="ビジネス、PC、小説——ジャンルごとに区切られた本棚で、所有している本が一望できます。表紙を眺めるだけで、次に読みたい一冊が自然と手に取れる。"
            visual={<ShelfPreview />}
          />
        </section>

        {/* Feature 02 — Categories */}
        <section
          style={{
            padding: '120px 64px',
            borderBottom: `1px solid ${C.line}`,
            background: C.paperDeep,
          }}
        >
          <FeatureRow
            number="02"
            eyebrow="CATEGORIES"
            title="カテゴリー管理 — 色で分ける、心で分ける"
            subtitle="Organize by feel, not just by topic"
            body="自由に作れるカテゴリーには、好きな色を添えて。背表紙のように並んだラベルが、本棚に小さなリズムを生みます。"
            visual={<CategoryPreview />}
            flip
          />
        </section>

        {/* Feature 03 — Search */}
        <section style={{ padding: '120px 64px', borderBottom: `1px solid ${C.line}` }}>
          <FeatureRow
            number="03"
            eyebrow="DISCOVERY"
            title="検索とフィルター — あの一冊が、すぐそこに"
            subtitle="Find any book in seconds"
            body="タイトル・著者・ISBNから、ステータスや更新日まで。膨大な蔵書の中から、いま読みたい本にすぐ辿り着けます。"
            visual={<SearchPreview />}
          />
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
            今日読んだ一冊が、
            <br />
            <span style={{ fontStyle: 'italic' }}>明日のあなたを</span>つくる。
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
            無料ではじめられます。クレジットカード不要で、登録後すぐに本棚を作成できます。
          </p>
          <button
            type="button"
            onClick={goRegister}
            onMouseEnter={() => setHovered('cta-end')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'cta-end' ? C.paper : C.accent,
              color: hovered === 'cta-end' ? C.ink : C.paper,
              padding: '20px 44px',
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
            無料ではじめる  Start free  →
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

function BookStack() {
  const books = [
    { w: 280, h: 56, color: '#3a4a5a', label: 'BUSINESS · 24' },
    { w: 300, h: 64, color: C.accent, label: 'NOVELS · 31' },
    { w: 264, h: 52, color: '#6b5d3f', label: 'TECH · 18' },
    { w: 320, h: 60, color: '#2a3a3a', label: 'PHILOSOPHY · 12' },
    { w: 290, h: 70, color: '#7a3a2a', label: 'HISTORY · 9' },
  ]
  let y = 420
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {books.map((b, i) => {
        y -= b.h + 4
        return (
          <div
            key={b.label}
            style={{
              position: 'absolute',
              left: '50%',
              transform: `translateX(-50%) rotate(${i % 2 === 0 ? -0.4 : 0.4}deg)`,
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
            }}
          >
            {b.label}
          </div>
        )
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 422,
          height: 6,
          background: C.ink,
          opacity: 0.3,
        }}
      />
    </div>
  )
}

function ShelfPreview() {
  const cats = [
    { name: 'ビジネス', en: 'Business', count: 24, color: '#3a5a4a' },
    { name: '小説', en: 'Fiction', count: 31, color: C.accent },
    { name: 'PC', en: 'Tech', count: 18, color: '#3a4a6a' },
    { name: '哲学', en: 'Philosophy', count: 12, color: '#5a4a3a' },
  ]
  return (
    <div
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
    { name: 'ビジネス', en: 'Business', color: '#3a5a4a', count: 24 },
    { name: '小説', en: 'Fiction', color: C.accent, count: 31 },
    { name: 'PC', en: 'Tech', color: '#3a4a6a', count: 18 },
    { name: '哲学', en: 'Philosophy', color: '#5a4a3a', count: 12 },
    { name: 'デザイン', en: 'Design', color: '#6a4a5a', count: 8 },
    { name: '歴史', en: 'History', color: '#7a4a2a', count: 9 },
  ]
  return (
    <div
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
      col: '#3a5a4a',
      s: '読了',
    },
    {
      title: 'LPIC 1 教科書 + 問題集',
      author: '中島 能和',
      cat: 'PC',
      col: '#3a4a6a',
      s: '読書中',
    },
    { title: '変な絵', author: '雨穴', cat: '小説', col: C.accent, s: '積読' },
  ]
  return (
    <div
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
