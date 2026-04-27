import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import BookListPage from './pages/BookListPage'
import BookDetailPage from './pages/BookDetailPage'
import BookNewPage from './pages/BookNewPage'
import CategoryManagePage from './pages/CategoryManagePage'

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/books" replace />
  return <LandingPage />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
