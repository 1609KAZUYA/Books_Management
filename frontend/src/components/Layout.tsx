import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch {
      // ignore errors - we're logging out regardless
    }
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/books" className="font-bold text-blue-600 text-lg">
              Books Memo
            </Link>
            <NavLink
              to="/books"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              本棚
            </NavLink>
            <NavLink
              to="/tags"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              タグ
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              カテゴリー
            </NavLink>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.displayName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
