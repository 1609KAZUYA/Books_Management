import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginResponse, MeResponse } from '../types/api'
import { getMe } from '../api/auth'
import { tokenStore } from '../api/tokenStore'

interface AuthContextType {
  user: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (response: LoginResponse) => void
  logout: () => void
}

// React Contextは、複数の画面で共有したい値を置く箱です。
// ここでは「ログイン中ユーザー」「ログイン済みかどうか」「login/logout関数」を共有します。
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 同じタブで画面を再読み込みしてもログイン状態を復元できるよう、
    // sessionStorageに保存済みのJWTトークンを確認します。
    const token = tokenStore.get()
    if (!token) {
      setIsLoading(false)
      return
    }
    // トークンがあれば /me API を呼び、現在のユーザー情報を取得します。
    // 失敗した場合はトークンが無効なので削除します。
    getMe()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = (response: LoginResponse) => {
    // ログインAPIのレスポンスに含まれるJWTを保存し、ユーザー情報をContextに保持します。
    tokenStore.set(response.accessToken)
    setUser(response.user)
  }

  const logout = () => {
    // JWTを消して、画面上も未ログイン状態に戻します。
    tokenStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  // 各画面から useAuth() と書くだけでログイン情報を取得できるようにする関数です。
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
