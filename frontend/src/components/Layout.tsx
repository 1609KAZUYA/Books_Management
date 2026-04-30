import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'
import { EDITORIAL, FONTS, shade } from '../styles/editorial'
import { EditorialAtmosphere, ScrollProgressBar } from './Motion'

const NAV_ITEMS: { to: string; jp: string; en: string }[] = [
  { to: '/books', jp: '本棚', en: 'Library' },
  { to: '/categories', jp: 'カテゴリー', en: 'Categories' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch {
      // ignore - we log out regardless
    }
    logout()
    navigate('/login')
  }

  return (
    <div
      className="bm-modern-shell"
      style={{
        minHeight: '100vh',
        color: EDITORIAL.ink,
        fontFamily: FONTS.sans,
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility',
        fontFeatureSettings: '"palt"',
        position: 'relative',
      }}
    >
      <ScrollProgressBar />
      <EditorialAtmosphere />
      <AppHeader user={user} onLogout={handleLogout} />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
      <footer
        style={{
          padding: '32px 56px',
          borderTop: `1px solid ${EDITORIAL.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: EDITORIAL.inkMuted,
          background: EDITORIAL.paper,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic' }}>Books Memo · 2026</div>
        <div style={{ fontFamily: FONTS.mono, letterSpacing: '0.14em' }}>
          READ · ORGANIZE · REFLECT
        </div>
      </footer>
    </div>
  )
}

interface AppHeaderProps {
  user: { displayName: string } | null
  onLogout: () => void
}

function AppHeader({ user, onLogout }: AppHeaderProps) {
  const [logoutHover, setLogoutHover] = useState(false)
  const initial = user?.displayName?.trim()?.[0]?.toUpperCase() ?? 'R'

  return (
    <header
      className="bm-glass-layer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 56px',
        border: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        margin: '14px 18px 0',
        borderRadius: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
        <Link
          to="/books"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            textDecoration: 'none',
            color: EDITORIAL.ink,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Books Memo
          </span>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: EDITORIAL.inkMuted,
              letterSpacing: '0.16em',
            }}
          >
            VOL.01
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <span style={navLinkStyle(isActive)}>
                  {item.jp}
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: isActive ? EDITORIAL.accent : EDITORIAL.inkMuted,
                      marginLeft: 6,
                    }}
                  >
                    {item.en}
                  </span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${EDITORIAL.accent}, ${shade(EDITORIAL.accent, -20)})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONTS.serif,
              fontSize: 14,
              fontWeight: 600,
              fontStyle: 'italic',
            }}
          >
            {initial}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, color: EDITORIAL.ink, fontWeight: 500 }}>
              {user?.displayName ?? 'Reader'}
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                color: EDITORIAL.inkMuted,
                letterSpacing: '0.1em',
              }}
            >
              READER
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            minHeight: 42,
            padding: '0 16px',
            background: 'transparent',
            border: `1px solid ${logoutHover ? EDITORIAL.ink : EDITORIAL.line}`,
            color: logoutHover ? EDITORIAL.ink : EDITORIAL.inkSoft,
            fontSize: 12,
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            fontFamily: FONTS.sans,
            transition: 'all 0.18s',
          }}
        >
          ログアウト
        </button>
      </div>
    </header>
  )
}

function navLinkStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    minHeight: 42,
    padding: '0 16px',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: active ? EDITORIAL.ink : EDITORIAL.inkSoft,
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontStyle: active ? 'normal' : 'italic',
    fontWeight: active ? 600 : 400,
    borderBottom: active
      ? `1.5px solid ${EDITORIAL.accent}`
      : '1.5px solid transparent',
    marginBottom: -1,
    cursor: 'pointer',
    transition: 'all 0.18s',
  }
}
