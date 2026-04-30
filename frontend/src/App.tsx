import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import BookListPage from './pages/BookListPage'
import BookDetailPage from './pages/BookDetailPage'
import BookNewPage from './pages/BookNewPage'
import CategoryManagePage from './pages/CategoryManagePage'

// App.tsx はフロントエンド全体の「ルーティング表」です。
// Laravelでいう routes/web.php に近く、URLごとに表示する画面を決めています。

function HomeRoute() {
  // useAuth() はログイン状態を取得するための独自Hookです。
  const { isAuthenticated, isLoading } = useAuth()
  // 読み込み中は一瞬だけ何も表示しないようにします。
  if (isLoading) return null
  // ログイン済みならトップページではなく本棚画面へ移動します。
  if (isAuthenticated) return <Navigate to="/books" replace />
  return <LandingPage />
}

function GuestRoute({ children }: { children: JSX.Element }) {
  // ログイン画面・登録画面は未ログインユーザー向けです。
  // 既にログイン済みなら /books へ移動します。
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/books" replace />
  return children
}

export default function App() {
  return (
    // AuthProviderで囲むことで、配下の全画面からログイン状態を参照できます。
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 誰でも見られる画面 */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* ProtectedRoute の内側は、ログインしていないと表示できません。 */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="books" element={<BookListPage />} />
            <Route path="books/new" element={<BookNewPage />} />
            <Route path="books/:id" element={<BookDetailPage />} />
            <Route path="categories" element={<CategoryManagePage />} />
          </Route>
          {/* 定義されていないURLはトップへ戻します。 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
