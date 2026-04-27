import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import BookListPage from './pages/BookListPage'
import BookDetailPage from './pages/BookDetailPage'
import BookNewPage from './pages/BookNewPage'
import TagManagePage from './pages/TagManagePage'
import CategoryManagePage from './pages/CategoryManagePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/books" replace />} />
            <Route path="books" element={<BookListPage />} />
            <Route path="books/new" element={<BookNewPage />} />
            <Route path="books/:id" element={<BookDetailPage />} />
            <Route path="categories" element={<CategoryManagePage />} />
            <Route path="tags" element={<TagManagePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
